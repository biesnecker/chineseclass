// Many thanks to https://github.com/bryc/code/blob/master/jshash/PRNGs.md
// for this code.

const xmur3 = (str) => {
  let i;
  let h;
  for (i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    (h = Math.imul(h ^ str.charCodeAt(i), 3432918353)),
      (h = (h << 13) | (h >>> 19));
  return () => {
    (h = Math.imul(h ^ (h >>> 16), 2246822507)),
      (h = Math.imul(h ^ (h >>> 13), 3266489909));
    return (h ^= h >>> 16) >>> 0;
  };
};

const randomIntegerInternal = (max) => {
  return Math.floor(Math.random() * max);
};

export const randomSeedGenerator = () => {
  let s = "";
  for (let i = 0; i < 20; ++i) {
    s += String.fromCharCode(32 + randomIntegerInternal(94));
  }
  return xmur3(s);
};

export const prngFromSeed = (seed) => {
  let a = seed | 0;
  return (max) => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max);
  };
};
