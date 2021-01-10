import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import { isIOS } from "./utils/helpers";
import { randomSeedGenerator } from "./utils/random";

import Worker from "./workers/cardstate";

document.addEventListener("DOMContentLoaded", () => {
  let flashcards = [];

  const ts = Math.floor(Date.now() / 1000);

  const seed = randomSeedGenerator();

  const worker = new Worker();
  worker.addEventListener("message", (e) =>
    console.log(`message from worker: ${e.data}`)
  );

  worker.postMessage("hello worker");

  fetch(`data.json?ts=${ts}`)
    .then((response) => response.json())
    .then((jd) => {
      jd.forEach((element) => flashcards.push(element));

      ReactDOM.render(
        <App cards={flashcards} useHover={!isIOS()} seedGenerator={seed} />,
        document.getElementById("container")
      );
    });
});
