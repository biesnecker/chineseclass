import React from "react";
import Headword from "./Headword";
import Options from "./Options";
import Stats from "./Stats";
import { prngFromSeed } from "../utils/random";
import { setPopFront } from "../utils/sets";

const audioRef = React.createRef();

const initialStateFromCards = (initial) => {
  const { cards, seed } = initial;
  const recent_max_size = Math.min(
    Math.max(Math.floor(cards.length / 2), 1),
    12
  );

  return handleNextCard(
    {
      mode: 0,
      cards: cards,
      currentCard: null,
      currentCardIdx: 0,
      recent: new Set(),
      recentMaxSize: recent_max_size,
      missed: new Set(),
      choices: [],
      rightAnswerIdx: 0,
      chosenAnswerIdx: 0,
      reviewsCorrect: 0,
      reviewsAttempted: 0,
      direction: 0,
    },
    seed
  );
};

const ActionType = {
  NEXT_CARD: "NEXT_CARD",
  SUBMIT_ANSWER: "SUBMIT_ANSWER",
};

const handleSubmitAnswer = (state, payload) => {
  const { optionIdx, direction, dispatch, seed } = payload;
  // First enqueue the next card callback.
  const correct = state.rightAnswerIdx === optionIdx;
  const reviewsAttempted = state.reviewsAttempted + 1;
  const reviewsCorrect = state.reviewsCorrect + (correct ? 1 : 0);
  if (correct) {
    newMissed = state.missed;
  } else {
    newMissed = new Set(state.missed);
    newMissed.add(state.currentCardIdx);
  }
  if (direction === 0) {
    setTimeout(
      () =>
        dispatch({
          type: ActionType.NEXT_CARD,
          payload: { seed: seed },
        }),
      correct ? 750 : 1500
    );
  } else {
    // Need to attach a listener to the audioref that will trigger the next call
    // and then remove itself, then play the audio. :-/
    const onendedCallback = () => {
      audioRef.current.removeEventListener("ended", onendedCallback);
      setTimeout(
        () =>
          dispatch({
            type: ActionType.NEXT_CARD,
            payload: { seed: seed },
          }),
        correct ? 500 : 1250
      );
    };
    audioRef.current.addEventListener("ended", onendedCallback);
    audioRef.current.play();
  }
  return {
    ...state,
    mode: 1,
    missed: newMissed,
    chosenAnswerIdx: optionIdx,
    reviewsAttempted: reviewsAttempted,
    reviewsCorrect: reviewsCorrect,
  };
};

const getWeightedRandomCard = (rndF, nCards) => {
  const max = (nCards * (nCards + 1)) / 2;
  const idx = rndF(max);
  return Math.floor(0.5 * (1 + Math.sqrt(1 + 8 * idx))) - 1;
};

const handleNextCard = (state, seed) => {
  const randomInteger = prngFromSeed(seed);
  let finished = false;
  let newRecent = new Set(state.recent);
  let newMissed = new Set(state.missed);

  let popped;
  if (newRecent.size >= state.recentMaxSize) {
    popped = setPopFront(newRecent);
  }

  let newCurrentCard;
  let newCurrentCardIdx;

  if (newMissed.has(popped)) {
    // If the most recently popped card from the recent list was missed last
    // time, then that's our card. Otherwise do the normal selection.
    newCurrentCardIdx = popped;
    newMissed.delete(popped);
  } else {
    while (!finished) {
      newCurrentCardIdx = getWeightedRandomCard(
        randomInteger,
        state.cards.length
      );
      if (newRecent.has(newCurrentCardIdx)) {
        continue;
      }
      finished = true;
    }
  }
  newCurrentCard = state.cards[newCurrentCardIdx];
  newRecent.add(newCurrentCardIdx);
  console.log("Recent set: ", [...newRecent]);
  console.log("Missed set: ", [...newMissed]);

  let alternate_definitions = new Set();
  let alternate_idx = 0;
  finished = false;
  while (alternate_definitions.size < 3) {
    alternate_idx = randomInteger(state.cards.length);
    if (
      alternate_idx === newCurrentCardIdx ||
      alternate_definitions.has(alternate_idx) ||
      newRecent.has(alternate_idx)
    ) {
      continue;
    }
    alternate_definitions.add(alternate_idx);
  }

  // This index is where the correct answer goes. The other indexes
  // get set with one of the alternate indexes.
  const alts = alternate_definitions.values();
  const newRightAnswerIdx = randomInteger(4);
  let newChoices = [];
  for (let i = 0; i < 4; ++i) {
    if (i === newRightAnswerIdx) {
      newChoices.push(newCurrentCard);
    } else {
      newChoices.push(state.cards[alts.next().value]);
    }
  }

  const newDirection = randomInteger(2);

  return {
    ...state,
    recent: newRecent,
    missed: newMissed,
    currentCard: newCurrentCard,
    currentCardIdx: newCurrentCardIdx,
    rightAnswerIdx: newRightAnswerIdx,
    choices: newChoices,
    mode: 0,
    direction: newDirection,
  };
};

const stateReducer = (state, action) => {
  switch (action.type) {
    case ActionType.SUBMIT_ANSWER:
      return handleSubmitAnswer(state, action.payload);
    case ActionType.NEXT_CARD:
      return handleNextCard(state, action.payload.seed);
  }
  return state;
};

const App = (props) => {
  const [state, dispatch] = React.useReducer(
    stateReducer,
    {
      cards: props.cards,
      seed: props.seedGenerator(),
    },
    initialStateFromCards
  );

  const audioClickHandler = (e) => {
    e.preventDefault();
    if (state.mode === 0) {
      audioRef.current.play();
    }
  };

  const optionClickHandlerFactory = (idx) => (e) => {
    e.preventDefault();
    dispatch({
      type: ActionType.SUBMIT_ANSWER,
      payload: {
        optionIdx: idx,
        direction: state.direction,
        dispatch: dispatch,
        seed: props.seedGenerator(),
      },
    });
  };

  const modeClass = state.mode == 0 ? "normal_mode" : "answer_mode";
  const hoverClass = props.useHover ? "use_hover" : "";
  return (
    <div id="datatable" className={`${modeClass} ${hoverClass}`}>
      <Headword
        card={state.currentCard}
        ref={audioRef}
        direction={state.direction}
        audioClickHandler={audioClickHandler}
      />
      <Options
        choices={state.choices}
        mode={state.mode}
        rightAnswer={state.rightAnswerIdx}
        chosenAnswer={state.chosenAnswerIdx}
        direction={state.direction}
        clickHandlerFactory={optionClickHandlerFactory}
      />
      <Stats
        correct={state.reviewsCorrect}
        attempted={state.reviewsAttempted}
      />
    </div>
  );
};

export default App;
