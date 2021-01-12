import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import PromiseWorker from "./PromiseWorker";
import MessageType from "./shared/MessageType";
import { isIOS } from "./utils/helpers";
import { randomSeedGenerator } from "./utils/random";

import CardStateWorker from "./workers/cardstate";

const appName = "kids_chinese_flashcards";

const cardTypes = 2;

document.addEventListener("DOMContentLoaded", async () => {
  const seed = randomSeedGenerator();

  const worker = new PromiseWorker(new CardStateWorker());

  const raw = await worker.sendMessage(MessageType.FETCH_ALL, { appName });
  const records = new Uint32Array(raw.data);
  let ridx = 0;

  const ts = Math.floor(Date.now() / 1000);
  const data = await fetch(`data.json?ts=${ts}`);
  const facts = await data.json();

  let cards = [];
  for (let i = 0; i < facts.length; ++i) {
    for (let j = 0; j < cardTypes; ++j) {
      if (
        ridx < records.length &&
        records[ridx] === i &&
        records[ridx + 1] === j
      ) {
        cards.push({
          factId: records[ridx],
          typeId: records[ridx + 1],
          difficulty: records[ridx + 2],
          lastReviewDate: records[ridx + 3],
        });
        ridx += 4;
      } else {
        cards.push({
          factId: i,
          typeId: j,
          difficulty: 200,
          lastReviewDate: 0,
        });
      }
    }
  }

  ReactDOM.render(
    <App
      cards={facts}
      useHover={!isIOS()}
      seedGenerator={seed}
      worker={worker}
      appName={appName}
    />,
    document.getElementById("container")
  );
});
