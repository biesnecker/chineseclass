export const isLocalhost = ["localhost", "127.0.0.1", ""].includes(
  window.location.hostname
);

export const isIOS = () => {
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

export const getAudioPath = (filename) => {
  if (isLocalhost) {
    return `audio/${filename}`;
  } else {
    return `https://d25j8baqrvaujh.cloudfront.net/${filename}`;
  }
};

export const randomInteger = (max) => {
  return Math.floor(Math.random() * max);
};
