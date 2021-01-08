import React from "react";
import ReactDOM from "react-dom";
import CEHeadword from "./components/CEHeadword";
import CEOptions from "./components/CEOptions";
import Stats from "./components/Stats";
import { isIOS, randomInteger } from "./utils/helpers";

const initialStateFromCards = (cards) => {
  const recent_max_size = Math.min(
    Math.max(Math.floor(cards.length / 2), 1),
    20
  );

  return {
    mode: 0,
    cards: cards,
    currentCard: null,
    currentCardIdx: 0,
    recent: new Array(recent_max_size).fill(null),
    recentNextInsert: 0,
    recentSet: new Set(),
    choices: [],
    rightAnswerIdx: 0,
    chosenAnswerIdx: 0,
    reviewsCorrect: 0,
    reviewsAttempted: 0,
  };
};

document.addEventListener("DOMContentLoaded", () => {
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

      let state = initialStateFromCards(flashcards);

      const audioRef = React.createRef();

      const render = () => {
        const mode_class = state.mode == 0 ? "normal_mode" : "answer_mode";
        const hover_class = isIOS() ? "" : "use_hover";
        ReactDOM.render(
          <div id="datatable" className={`${mode_class} ${hover_class}`}>
            <CEHeadword
              card={state.currentCard}
              ref={audioRef}
              audioClickHandler={audio_click_handler}
            />
            <CEOptions
              choices={state.choices}
              mode={state.mode}
              rightAnswer={state.rightAnswerIdx}
              chosenAnswer={state.chosenAnswerIdx}
              clickHandlerFactory={option_click_handler}
            />
            <Stats
              correct={state.reviewsCorrect}
              attempted={state.reviewsAttempted}
            />
          </div>,
          document.getElementById("container")
        );
      };

      const option_click_handler = (option_id) => {
        const h = (e) => {
          e.preventDefault();
          if (state.mode === 1) {
            return;
          }
          state.mode = 1;
          state.chosenAnswerIdx = option_id;
          const correct = state.chosenAnswerIdx === state.rightAnswerIdx;
          if (correct) {
            state.reviewsCorrect += 1;
          }
          state.reviewsAttempted += 1;
          render();
          setTimeout(
            () => {
              state.mode = 0;
              next_card();
            },
            correct ? 750 : 1500
          );
        };
        return h;
      };

      const audio_click_handler = (e) => {
        e.preventDefault();
        if (state.mode === 0) {
          audioRef.current.play();
        }
      };

      const next_card = () => {
        let finished = false;
        if (state.recent[state.recentNextInsert] != null) {
          const n = state.recent[state.recentNextInsert];
          state.recentSet.delete(n);
          state.recent[state.recentNextInsert] = null;
        }

        while (!finished) {
          const idx = randomInteger(state.cards.length);
          if (state.recentSet.has(idx)) {
            continue;
          }
          state.currentCard = flashcards[idx];
          state.recent[state.recentNextInsert] = idx;
          state.recentNextInsert = state.recentNextInsert + 1;
          state.recentNextInsert %= state.recent.length;
          state.currentCardIdx = idx;
          state.recentSet.add(idx);
          finished = true;
        }

        let alternate_definitions = new Set();
        let alternate_idx = 0;
        finished = false;
        while (alternate_definitions.size < 3) {
          alternate_idx = randomInteger(flashcards.length);
          if (
            alternate_idx === state.currentCardIdx ||
            alternate_definitions.has(alternate_idx) ||
            state.recentSet.has(alternate_idx)
          ) {
            continue;
          }
          alternate_definitions.add(alternate_idx);
        }

        // This index is where the correct answer goes. The other indexes
        // get set with one of the alternate indexes.
        const alts = alternate_definitions.values();
        state.choices = [];
        state.rightAnswerIdx = randomInteger(4);
        for (let i = 0; i < 4; ++i) {
          if (i === state.rightAnswerIdx) {
            state.choices.push(state.currentCard);
          } else {
            state.choices.push(state.cards[alts.next().value]);
          }
        }

        render();
        audioRef.current.play();
      };

      next_card();
    });
});
