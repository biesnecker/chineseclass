import React from "react";
import Headword from "./Headword";
import Options from "./Options";
import Stats from "./Stats";
import { prngFromSeed } from "../utils/random";

const audioRef = React.createRef();

const initialStateFromCards = (initial) => {
  console.log("initialStateFromCards");
  const { cards, seed } = initial;
  const recent_max_size = Math.min(
    Math.max(Math.floor(cards.length / 2), 1),
    20
  );

  return handleNextCard(
    {
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
  // First enqueue the next card callback.
  const correct = state.rightAnswerIdx === payload.optionIdx;
  const reviewsAttempted = state.reviewsAttempted + 1;
  const reviewsCorrect = state.reviewsCorrect + (correct ? 1 : 0);
  setTimeout(
    () =>
      payload.dispatch({
        type: ActionType.NEXT_CARD,
        payload: { seed: payload.seed },
      }),
    correct ? 750 : 1500
  );
  return {
    ...state,
    mode: 1,
    chosenAnswerIdx: payload.optionIdx,
    reviewsAttempted: reviewsAttempted,
    reviewsCorrect: reviewsCorrect,
  };
};

const handleNextCard = (state, seed) => {
  const randomInteger = prngFromSeed(seed);
  let finished = false;
  let newRecentSet = new Set(state.recentSet);
  let newRecent = [...state.recent];
  let newRecentNextInsert = state.recentNextInsert;
  if (newRecent[newRecentNextInsert] != null) {
    const n = newRecent[newRecentNextInsert];
    newRecentSet.delete(n);
    newRecent[newRecentNextInsert] = null;
  }

  let newCurrentCard;
  let newCurrentCardIdx;

  while (!finished) {
    newCurrentCardIdx = randomInteger(state.cards.length);
    if (newRecentSet.has(newCurrentCardIdx)) {
      continue;
    }
    newCurrentCard = state.cards[newCurrentCardIdx];
    newRecent[newRecentNextInsert] = newCurrentCardIdx;
    newRecentNextInsert++;
    newRecentNextInsert %= newRecent.length;
    newRecentSet.add(newCurrentCardIdx);
    finished = true;
  }

  let alternate_definitions = new Set();
  let alternate_idx = 0;
  finished = false;
  while (alternate_definitions.size < 3) {
    alternate_idx = randomInteger(state.cards.length);
    if (
      alternate_idx === newCurrentCardIdx ||
      alternate_definitions.has(alternate_idx) ||
      newRecentSet.has(alternate_idx)
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
  console.log(newDirection);
  console.log(newRecent);

  return {
    ...state,
    recent: newRecent,
    recentNextInsert: newRecentNextInsert,
    recentSet: newRecentSet,
    currentCard: newCurrentCard,
    currentCardIdx: newCurrentCardIdx,
    rightAnswerIdx: newRightAnswerIdx,
    choices: newChoices,
    mode: 0,
    direction: newDirection,
  };
};

const stateReducer = (state, action) => {
  console.log("in state reducer: ", action);
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
