import React, { useEffect } from "react";

import Character from "./Character";
import Pinyin from "./Pinyin";
import { getAudioPath } from "../utils/helpers";

const renderHeadword = (props, ref) => {
  useEffect(() => {
    if (props.direction === 0) {
      ref.current.play();
    }
  }, [props.card.character]);
  if (props.direction === 0) {
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
  } else {
    return (
      <div id="headword">
        <div class="english_headword">{props.card.definition}</div>
        <audio ref={ref} src={getAudioPath(props.card.audio)} />
      </div>
    );
  }
};

export default React.forwardRef(renderHeadword);
