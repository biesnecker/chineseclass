import React from "react";
import ReactDOM from "react-dom";
import CEHeadword from "./components/CEHeadword";
import Character from "./components/Character";
import Pinyin from "./components/Pinyin";
import Stats from "./components/Stats";
import { isIOS, getAudioPath, randomInteger } from "./utils/helpers";

const updateStats = (elem, stats) => {
  ReactDOM.render(
    <Stats correct={stats.correct} attempted={stats.attempted} />,
    elem
  );
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

      const option_click_handler = (option_id) => {
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
        if (mode === 0) {
          audioRef.current.play();
        }
      };

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
            alternate_definitions.has(alternate_idx) ||
            recent_set.has(alternate_idx)
          ) {
            continue;
          }
          alternate_definitions.add(alternate_idx);
        }

        ReactDOM.render(
          <CEHeadword
            card={card}
            ref={audioRef}
            audioClickHandler={audio_click_handler}
          />,
          document.getElementById("headword")
        );
        audioRef.current.play();

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

      elements.options.forEach((elem, i) =>
        elem.addEventListener("click", option_click_handler(i))
      );

      next_card();
    });
});
