const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const csv = require("fast-csv");
const crypto = require("crypto");
const reduce = require("stream-reduce");

const OPTIONS_START = 3;

class RowCollector extends stream.Transform {
  constructor(options) {
    super({
      objectMode: true,
      ...options,
    });
    this._acc = [];
  }

  _transform(chunk, encoding, callback) {
    this._acc.push(chunk);
    return callback();
  }

  _flush(callback) {
    callback(null, JSON.stringify(this._acc));
  }
}

const polly = new AWS.Polly({ region: "us-west-1" });

const output_path_base = path.resolve(__dirname, "public", "audio");

var already_seen = new Set();

const speechRequestPlain = (characters) => {
  return {
    OutputFormat: "mp3",
    LanguageCode: "cmn-CN",
    VoiceId: "Zhiyu",
    TextType: "text",
    Text: characters,
  };
};

const speechRequestSsml = (characters, pinyin) => {
  const pinyin_parts = pinyin.split(" ");
  if (characters.length != pinyin_parts.length) {
    throw new Error(`${characters} and ${pinyin} are a different length`);
  }
  phonemes = ["<speak>"];
  for (var i = 0; i < characters.length; ++i) {
    phonemes.push(
      '<phoneme alphabet="x-amazon-pinyin"' +
        ` ph="${pinyin_parts[i]}">${characters[i]}</phoneme>`
    );
  }
  phonemes.push("</speak>");
  return {
    OutputFormat: "mp3",
    LanguageCode: "cmn-CN",
    VoiceId: "Zhiyu",
    TextType: "ssml",
    Text: phonemes.join(""),
  };
};

const speechRequest = (characters, pinyin, options, cb) => {
  const params = options.use_ssml
    ? speechRequestSsml(characters, pinyin)
    : speechRequestPlain(characters);
  polly.synthesizeSpeech(params, cb);
};

const handleOptions = (opts) => {
  let use_ssml = false;
  opts.forEach((opt) => {
    if (opt === "use_ssml") {
      use_ssml = true;
    }
  });
  return {
    use_ssml,
  };
};

fs.createReadStream(path.resolve(__dirname, "input.csv"))
  .pipe(csv.parse({ headers: false }))
  .transform((row, next) => {
    if (row.length < 3) {
      throw new Error(`Invalid line: ${row}`);
    }
    const options = handleOptions(row.slice(OPTIONS_START));
    const row_text = [row[0], row[1]].join("|");
    if (already_seen.has(row_text)) {
      throw new Error(`Duplicate: ${row_text}`);
    }
    already_seen.add(row_text);

    const hash = crypto.createHash("sha1");
    hash.update(row[0]);
    hash.update(row[1]);
    const filename = hash.digest("hex") + ".mp3";
    const output_path = path.resolve(output_path_base, filename);

    fs.access(output_path, fs.F_OK, (notFound) => {
      if (notFound) {
        // Only make the speech request if the file doesn't exist.
        speechRequest(row[0], row[1], options, (err, data) => {
          if (err) throw err;
          const output_file = fs.createWriteStream(output_path);
          output_file.write(data.AudioStream);
        });
      }
    });

    next(null, {
      character: row[0],
      pinyin: row[1],
      definition: row[2],
      audio: filename,
    });
  })
  .pipe(new RowCollector())
  .pipe(fs.createWriteStream(path.resolve(__dirname, "public", "data.json")))
  .on("end", () => process.exit());
