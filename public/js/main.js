const pinyinVowelsRe = /[aeiouv]{1,2}/;

const pinyinVowelOrder = {
  a: 0,
  o: 1,
  e: 2,
  i: 3,
  u: 4,
  v: 5,
};

const pinyinReplacements = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  i: ["ī", "í", "ǐ", "ì"],
  v: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

const transformPinyin = (pinyin) => {
  const transformed = pinyin
    .trim()
    .split(" ")
    .map((syllable) => {
      const last_letter = syllable.charAt(syllable.length - 1);
      const tone =
        last_letter >= "0" && last_letter <= "9"
          ? parseInt(last_letter, 10)
          : 0;
      if (tone === 0) {
        return syllable;
      }

      toneless = syllable.slice(0, -1);

      if (tone === 5) {
        return toneless;
      }

      const m = toneless.match(pinyinVowelsRe);
      if (m === null) {
        // If it doesn't have vowels, bail.
        return syllable;
      }

      const vowels = m[0];
      let idx = 0;
      if (vowels.length === 1) {
        idx = m.index;
      } else if (vowels === "iu" || vowels === "ui") {
        // The final vowel.
        idx = m.index + 1;
      } else {
        // Use vowel precedence.
        let lowest = 6;
        let lowest_idx = 0;
        for (let i = 0; i < vowels.length; ++i) {
          const vo = pinyinVowelOrder[vowels[i]];
          if (vo < lowest) {
            lowest = vo;
            lowest_idx = i;
          }
        }
        idx = m.index + lowest_idx;
      }

      const replaced_char = toneless.charAt(idx);
      const replaced =
        toneless.substr(0, idx) +
        pinyinReplacements[replaced_char][tone - 1] +
        toneless.substr(idx + 1);

      return replaced;
    });
  return transformed.join(" ");
};

const isLocalhost = ["localhost", "127.0.0.1", ""].includes(
  window.location.hostname
);

const isIOS = () => {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

const randomInteger = (max) => {
  return Math.floor(Math.random() * max);
};

const updateStats = (elem, stats) => {
  let percent = 0.0;
  if (stats.attempted != 0) {
    percent = stats.correct / stats.attempted;
  }
  elem.innerHTML = `${stats.correct} / ${stats.attempted} (${(
    percent * 100
  ).toFixed(2)}%)`;
};

const audioPath = (filename) => {
  if (isLocalhost) {
    return `audio/${filename}`;
  } else {
    return `https://d25j8baqrvaujh.cloudfront.net/${filename}`;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const elements = {
    datatable: document.getElementById("datatable"),
    character: document.getElementById("character"),
    pinyin: document.getElementById("pinyin"),
    stats: document.getElementById("stats"),
    audio: document.getElementById("audiosource"),
    options: [
      document.getElementById("option_0"),
      document.getElementById("option_1"),
      document.getElementById("option_2"),
      document.getElementById("option_3"),
    ],
  };

  // If it's iOS, remove the use_hover class from body.
  if (isIOS()) {
    datatable.classList.remove("use_hover");
  }

  let stats = {
    correct: 0,
    attempted: 0,
  };

  let mode = 0;
  let flashcards = [];

  const ts = Math.floor(Date.now() / 1000);

  fetch(`data.json?ts=${ts}`)
    .then((response) => response.json())
    .then((jd) => {
      jd.forEach((element) => flashcards.push(element));

      updateStats(elements.stats, stats);

      let recent = [];
      const recent_max_size = Math.min(
        Math.max(Math.floor(flashcards.length / 2), 1),
        20
      );
      let recent_set = new Set();
      let recent_next_insert = 0;
      for (let i = 0; i < recent_max_size; ++i) {
        recent.push(null);
      }

      let right_answer_idx = 0;

      const next_card = () => {
        let card;
        let card_idx;
        let finished = false;
        if (recent[recent_next_insert] != null) {
          const n = recent[recent_next_insert];
          recent_set.delete(n);
          recent[recent_next_insert] = null;
        }

        while (!finished) {
          const idx = randomInteger(flashcards.length);
          if (recent_set.has(idx)) {
            continue;
          }
          card = flashcards[idx];
          recent[recent_next_insert] = idx;
          recent_next_insert = recent_next_insert + 1;
          recent_next_insert %= recent_max_size;
          card_idx = idx;
          recent_set.add(idx);
          finished = true;
        }

        let alternate_definitions = new Set();
        let alternate_idx = 0;
        finished = false;
        while (alternate_definitions.size < 3) {
          alternate_idx = randomInteger(flashcards.length);
          if (
            alternate_idx === card_idx ||
            alternate_definitions.has(alternate_idx)
          ) {
            continue;
          }
          alternate_definitions.add(alternate_idx);
        }

        elements.character.innerHTML = card.character;
        elements.pinyin.innerHTML = transformPinyin(card.pinyin);
        elements.audio.setAttribute("src", audioPath(card.audio));
        elements.audio.play();

        // This index is where the correct answer goes. The other indexes
        // get set with one of the alternate indexes.
        const alts = alternate_definitions.values();
        right_answer_idx = randomInteger(4);
        for (let i = 0; i < 4; ++i) {
          if (i === right_answer_idx) {
            elements.options[i].innerHTML = card.definition;
          } else {
            elements.options[i].innerHTML =
              flashcards[alts.next().value].definition;
          }
        }
      };

      const click_handler = (option_id) => {
        const h = (e) => {
          e.preventDefault();
          if (mode === 1) {
            return;
          }
          mode = 1;
          elements.datatable.classList.add("answer_mode");
          elements.options[right_answer_idx].classList.add("correct");
          stats.attempted += 1;
          const correct = option_id === right_answer_idx;
          if (correct) {
            stats.correct += 1;
          } else {
            elements.options[option_id].classList.add("incorrect");
          }
          updateStats(elements.stats, stats);
          setTimeout(
            () => {
              mode = 0;
              elements.datatable.classList.remove("answer_mode");
              elements.datatable.classList.add("normal_mode");
              elements.options[right_answer_idx].classList.remove("correct");
              elements.options[option_id].classList.remove("incorrect");
              next_card();
            },
            correct ? 750 : 1500
          );
        };
        return h;
      };

      const audio_click_handler = (e) => {
        e.preventDefault();
        if (mode === 0 && elements.audio.hasAttribute("src")) {
          elements.audio.play();
        }
      };

      [elements.character, elements.pinyin].forEach((elem) =>
        addEventListener("click", audio_click_handler)
      );

      elements.options.forEach((elem, i) =>
        elem.addEventListener("click", click_handler(i))
      );

      next_card();
    });
});
