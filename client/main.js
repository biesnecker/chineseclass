import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import PromiseWorker from "./PromiseWorker";
import MessageType from "./shared/MessageType";
import { isIOS } from "./utils/helpers";
import { randomSeedGenerator } from "./utils/random";

import CardStateWorker from "./workers/cardstate";

const appName = "kids_chinese_flashcards";

document.addEventListener("DOMContentLoaded", async () => {
  const seed = randomSeedGenerator();

  const worker = new PromiseWorker(new CardStateWorker());

  const ts = Math.floor(Date.now() / 1000);
  const data = await fetch(`data.json?ts=${ts}`);
  const flashcards = await data.json();

  ReactDOM.render(
    <App
      cards={flashcards}
      useHover={!isIOS()}
      seedGenerator={seed}
      worker={worker}
      appName={appName}
    />,
    document.getElementById("container")
  );
});
