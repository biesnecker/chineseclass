import React from "react";
import Headword from "./Headword";
import Options from "./Options";
import Stats from "./Stats";
import { prngFromSeed } from "../utils/random";
import { setPopFront } from "../utils/sets";
import MessageType from "../shared/MessageType";
import ReviewType from "../shared/ReviewType";

const audioRef = React.createRef();

const initialStateFromCards = (initial) => {
  const { cards, seed, worker, appName } = initial;
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
      recentMissed: new Set(),
      recentCorrect: new Set(),
      choices: [],
      rightAnswerIdx: 0,
      chosenAnswerIdx: 0,
      reviewsCorrect: 0,
      reviewsAttempted: 0,
      reviewType: ReviewType.CHINESE_TO_ENGLISH,
      answerHandlerEnabled: true,
      worker: worker,
      appName: appName,
      startTime: new Date(),
    },
    seed
  );
};

const ActionType = {
  NEXT_CARD: "NEXT_CARD",
  SUBMIT_ANSWER: "SUBMIT_ANSWER",
};

const handleSubmitAnswer = (state, payload) => {
  const { optionIdx, reviewType, dispatch, seed } = payload;
  // First enqueue the next card callback.
  const correct = state.rightAnswerIdx === optionIdx;
  const reviewsAttempted = state.reviewsAttempted + 1;
  const reviewsCorrect = state.reviewsCorrect + (correct ? 1 : 0);
  let newRecentMissed;
  let newRecentCorrect;
  if (correct) {
    newRecentMissed = state.recentMissed;
    newRecentCorrect = new Set(state.recentCorrect);
    newRecentCorrect.add(state.currentCardIdx);
  } else {
    newRecentCorrect = state.recentCorrect;
    newRecentMissed = new Set(state.recentMissed);
    newRecentMissed.add(state.currentCardIdx);
  }
  let nextStepPromise;
  switch (reviewType) {
    case ReviewType.CHINESE_TO_ENGLISH: {
      nextStepPromise = new Promise((resolve, reject) =>
        setTimeout(() => resolve(true), correct ? 750 : 1500)
      );
      break;
    }
    case ReviewType.ENGLISH_TO_CHINESE: {
      nextStepPromise = new Promise((resolve, reject) => {
        const onendedCallback = () => {
          audioRef.current.removeEventListener("ended", onendedCallback);
          setTimeout(() => resolve(true), correct ? 500 : 1250);
        };
        audioRef.current.addEventListener("ended", onendedCallback);
        audioRef.current.play();
      });
      break;
    }
    default:
      throw new Error("Unknown review type: " + reviewType);
  }

  const updateStatePromise = state.worker.sendMessage(
    correct ? MessageType.UPDATE_ON_CORRECT : MessageType.UPDATE_ON_INCORRECT,
    {
      appName: state.appName,
      factId: state.currentCardIdx,
      reviewType: reviewType,
    }
  );
  Promise.all([nextStepPromise, updateStatePromise]).then(() => {
    dispatch({
      type: ActionType.NEXT_CARD,
      payload: { seed: seed },
    });
  });
  return {
    ...state,
    mode: 1,
    recentMissed: newRecentMissed,
    recentCorrect: newRecentCorrect,
    chosenAnswerIdx: optionIdx,
    reviewsAttempted: reviewsAttempted,
    reviewsCorrect: reviewsCorrect,
    answerHandlerEnabled: false,
  };
};

const getWeightedRandomCard = (rndF, nCards) => {
  const max = (nCards * (nCards + 1)) / 2;
  const idx = rndF(max);
  return Math.floor(0.5 * (1 + Math.sqrt(1 + 8 * idx))) - 1;
};

const definitionsTooSimilar = (
  cards,
  possibleNewAlternate,
  currentCard,
  existingAlternates
) => {
  const posDef = cards[possibleNewAlternate].definition;
  let alts = [...existingAlternates, currentCard];
  return alts.some((alt) => {
    const altDef = cards[alt].definition;
    if (posDef.localeCompare(altDef) === 0) {
      return true;
    } else {
      const lengthDiff = Math.abs(posDef.length - altDef.length);
      if (lengthDiff > 2) {
        return false;
      }
      const iMin = Math.min(posDef.length, altDef.length);
      const diffLimit = Math.max(1, Math.floor(iMin / 3));
      let count = 0;
      let idx = 0;
      while (idx < iMin && count < diffLimit) {
        if (posDef.charAt(idx) !== altDef.charAt(idx)) {
          ++count;
        }
        ++idx;
      }
      return count < diffLimit;
    }
  });
};

const handleNextCard = (state, seed) => {
  const randomInteger = prngFromSeed(seed);
  let finished = false;
  let newRecent = new Set(state.recent);
  let newRecentMissed = new Set(state.recentMissed);
  let newRecentCorrect = new Set(state.recentCorrect);

  let popped;
  if (newRecent.size >= state.recentMaxSize) {
    popped = setPopFront(newRecent);
  }

  let newCurrentCard;
  let newCurrentCardIdx;

  if (newRecentMissed.has(popped)) {
    // If the most recently popped card from the recent list was recentMissed last
    // time, then that's our card. Otherwise do the normal selection.
    newCurrentCardIdx = popped;
    newRecentMissed.delete(popped);
  } else {
    while (!finished) {
      newCurrentCardIdx = getWeightedRandomCard(
        randomInteger,
        state.cards.length
      );
      if (newRecent.has(newCurrentCardIdx)) {
        continue;
      }
      if (newRecentCorrect.has(newCurrentCardIdx)) {
        // Remove it from the recent correct but don't choose it.
        newRecentCorrect.delete(newCurrentCardIdx);
        continue;
      }
      finished = true;
    }
  }
  newCurrentCard = state.cards[newCurrentCardIdx];
  newRecent.add(newCurrentCardIdx);

  let alternate_definitions = new Set();
  let alternate_idx = 0;
  finished = false;
  while (alternate_definitions.size < 3) {
    alternate_idx = randomInteger(state.cards.length);
    if (
      alternate_idx === newCurrentCardIdx ||
      alternate_definitions.has(alternate_idx) ||
      newRecent.has(alternate_idx) ||
      definitionsTooSimilar(
        state.cards,
        alternate_idx,
        newCurrentCardIdx,
        alternate_definitions
      )
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

  const rnd = Math.floor(Math.random() * Object.keys(ReviewType).length);
  const newReviewType = ReviewType[Object.keys(ReviewType)[rnd]];

  return {
    ...state,
    recent: newRecent,
    recentMissed: newRecentMissed,
    recentCorrect: newRecentCorrect,
    currentCard: newCurrentCard,
    currentCardIdx: newCurrentCardIdx,
    rightAnswerIdx: newRightAnswerIdx,
    choices: newChoices,
    mode: 0,
    reviewType: newReviewType,
    answerHandlerEnabled: true,
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
      worker: props.worker,
      appName: props.appName,
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
    if (!state.answerHandlerEnabled) {
      return;
    }
    dispatch({
      type: ActionType.SUBMIT_ANSWER,
      payload: {
        optionIdx: idx,
        reviewType: state.reviewType,
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
        reviewType={state.reviewType}
        audioClickHandler={audioClickHandler}
      />
      <Options
        choices={state.choices}
        mode={state.mode}
        rightAnswer={state.rightAnswerIdx}
        chosenAnswer={state.chosenAnswerIdx}
        reviewType={state.reviewType}
        clickHandlerFactory={optionClickHandlerFactory}
      />
      <Stats
        correct={state.reviewsCorrect}
        attempted={state.reviewsAttempted}
        startTime={state.startTime}
      />
    </div>
  );
};

export default App;
