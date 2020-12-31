const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const csv = require('fast-csv');
const crypto = require('crypto');
const reduce = require('stream-reduce');

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

const polly = new AWS.Polly({ region: 'us-west-1' });

const output_path_base = path.resolve(__dirname, 'public', 'audio');

var already_seen = new Set();

const speech_request = (characters, pinyin, cb) => {
    const pinyin_parts = pinyin.split(" ");
    if (characters.length != pinyin_parts.length) {
        throw new Error(`${characters} and ${pinyin} are a different length`);
    }
    phonemes = ["<speak>"];
    for (var i = 0; i < characters.length; ++i) {
        phonemes.push(
            '<phoneme alphabet="x-amazon-pinyin"' +
            ` ph="${pinyin_parts[i]}">${characters[i]}</phoneme>`);
    }
    phonemes.push('</speak>')
    const params = {
        OutputFormat: "mp3",
        LanguageCode: "cmn-CN",
        VoiceId: "Zhiyu",
        TextType: "ssml",
        Text: phonemes.join(""),
    };

    polly.synthesizeSpeech(params, cb);
}

fs.createReadStream(path.resolve(__dirname, 'input.csv'))
    .pipe(csv.parse({ headers: false }))
    .transform((row, next) => {
        const row_text = row.join('|');
        if (already_seen.has(row_text)) {
            return next();
        }
        already_seen.add(row_text);

        const hash = crypto.createHash('sha1');
        hash.update(row[0]);
        hash.update(row[1]);
        const filename = hash.digest('hex') + '.mp3';
        const output_path = path.resolve(output_path_base, filename);

        fs.access(output_path, fs.F_OK, notFound => {
            if (notFound) {
                // Only make the speech request if the file doesn't exist.
                speech_request(row[0], row[1], (err, data) => {
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
    .pipe(fs.createWriteStream(path.resolve(__dirname, 'public', 'data.json')))
    .on('end', () => process.exit());