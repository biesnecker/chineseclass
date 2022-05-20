import React, { useEffect } from "react";

import Character from "./Character";
import Pinyin from "./Pinyin";
import { getAudioPath } from "../utils/helpers";
import ReviewType from "../shared/ReviewType";

const renderHeadword = (props, ref) => {
  useEffect(() => {
    if (props.reviewType === ReviewType.CHINESE_TO_ENGLISH) {
      ref.current.play().catch((err) => console.log(err));
    }
  }, [props.card.character]);
  switch (props.reviewType) {
    case ReviewType.CHINESE_TO_ENGLISH:
      return (
        <div id="headword">
          <Character
            text={props.card.character}
            audioClickHandler={props.audioClickHandler}
          />
          <Pinyin
            text={props.card.pinyin}
            audioClickHandler={props.audioClickHandler}
          />
          <audio ref={ref} src={getAudioPath(props.card.audio)} />
        </div>
      );
      break;
    case ReviewType.ENGLISH_TO_CHINESE:
      return (
        <div id="headword">
          <div class="english_headword">{props.card.definition}</div>
          <audio ref={ref} src={getAudioPath(props.card.audio)} />
        </div>
      );
      break;
    default:
      throw new Error("Unknown review type: " + props.reviewType);
  }
};

export default React.forwardRef(renderHeadword);
