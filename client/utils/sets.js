export const setPopFront = (s) => {
  if (s.size === 0) {
    return;
  }
  const x = s.keys().next().value;
  s.delete(x);
  return x;
};

export const setDifference = (s1, s2) =>
  new Set([...s1].filter((elem) => !s2.has(elem)));
