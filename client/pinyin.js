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

      const toneless = syllable.slice(0, -1);

      if (tone < 1 || tone > 4) {
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

export default transformPinyin;
