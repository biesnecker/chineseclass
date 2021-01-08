import React from "react";
import CEHeadword from "./CEHeadword";
import CEOptions from "./CEOptions";
import Stats from "./Stats";
import { randomInteger } from "../utils/helpers";

const audioRef = React.createRef();

const initialStateFromCards = (cards) => {
  const recent_max_size = Math.min(
    Math.max(Math.floor(cards.length / 2), 1),
    20
  );

  return handleNextCard({
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
  });
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
    () => payload.dispatch({ type: ActionType.NEXT_CARD }),
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

const handleNextCard = (state) => {
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
  return {
    ...state,
    recent: newRecentSet,
    recentNextInsert: newRecentNextInsert,
    recentSet: newRecentSet,
    currentCard: newCurrentCard,
    currentCardIdx: newCurrentCardIdx,
    rightAnswerIdx: newRightAnswerIdx,
    choices: newChoices,
    mode: 0,
  };
};

const stateReducer = (state, action) => {
  switch (action.type) {
    case ActionType.SUBMIT_ANSWER:
      return handleSubmitAnswer(state, action.payload);
    case ActionType.NEXT_CARD:
      return handleNextCard(state);
  }
  return state;
};

const audioClickHandlerFactory = (audioRef, mode) => {
  return (e) => {
    e.preventDefault();
    if (mode === 0) {
      audioRef.current.play();
    }
  };
};

const optionClickHandlerFactory = (dispatch) => {
  return (idx) => (e) => {
    e.preventDefault();
    dispatch({
      type: ActionType.SUBMIT_ANSWER,
      payload: {
        optionIdx: idx,
        dispatch: dispatch,
      },
    });
  };
};

const App = (props) => {
  const [state, dispatch] = React.useReducer(
    stateReducer,
    initialStateFromCards(props.cards)
  );
  const modeClass = state.mode == 0 ? "normal_mode" : "answer_mode";
  const hoverClass = props.useHover ? "use_hover" : "";

  return (
    <div id="datatable" className={`${modeClass} ${hoverClass}`}>
      <CEHeadword
        card={state.currentCard}
        ref={audioRef}
        audioClickHandler={audioClickHandlerFactory(audioRef, state.mode)}
      />
      <CEOptions
        choices={state.choices}
        mode={state.mode}
        rightAnswer={state.rightAnswerIdx}
        chosenAnswer={state.chosenAnswerIdx}
        clickHandlerFactory={optionClickHandlerFactory(dispatch)}
      />
      <Stats
        correct={state.reviewsCorrect}
        attempted={state.reviewsAttempted}
      />
    </div>
  );
};

export default App;
