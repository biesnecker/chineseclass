import React from "react";
import ReactDOM from "react-dom";
import CEHeadword from "./components/CEHeadword";
import CEOptions from "./components/CEOptions";
import Stats from "./components/Stats";
import { isIOS, randomInteger } from "./utils/helpers";

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

      const audioRef = React.createRef();

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
      let chosen_answer_idx = 0;

      let choices = [];

      let card;
      let card_idx;

      const render = () => {
        const mode_class = mode == 0 ? "normal_mode" : "answer_mode";
        const hover_class = isIOS() ? "" : "use_hover";
        ReactDOM.render(
          <div id="datatable" className={`${mode_class} ${hover_class}`}>
            <CEHeadword
              card={card}
              ref={audioRef}
              audioClickHandler={audio_click_handler}
            />
            <CEOptions
              choices={choices}
              mode={mode}
              rightAnswer={right_answer_idx}
              chosenAnswer={chosen_answer_idx}
              clickHandlerFactory={option_click_handler}
            />
            <Stats correct={stats.correct} attempted={stats.attempted} />
          </div>,
          document.getElementById("container")
        );
      };

      const option_click_handler = (option_id) => {
        const h = (e) => {
          e.preventDefault();
          if (mode === 1) {
            return;
          }
          mode = 1;
          chosen_answer_idx = option_id;
          const correct = chosen_answer_idx === right_answer_idx;
          if (correct) {
            stats.correct += 1;
          }
          stats.attempted += 1;
          render();
          setTimeout(
            () => {
              mode = 0;
              next_card();
            },
            correct ? 750 : 1500
          );
        };
        return h;
      };

      const audio_click_handler = (e) => {
        e.preventDefault();
        if (mode === 0) {
          audioRef.current.play();
        }
      };

      const next_card = () => {
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
            alternate_definitions.has(alternate_idx) ||
            recent_set.has(alternate_idx)
          ) {
            continue;
          }
          alternate_definitions.add(alternate_idx);
        }

        // This index is where the correct answer goes. The other indexes
        // get set with one of the alternate indexes.
        const alts = alternate_definitions.values();
        choices = [];
        right_answer_idx = randomInteger(4);
        for (let i = 0; i < 4; ++i) {
          if (i === right_answer_idx) {
            choices.push(card);
          } else {
            choices.push(flashcards[alts.next().value]);
          }
        }

        render();
        audioRef.current.play();
      };

      next_card();
    });
});
