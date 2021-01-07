import React from "react";

import Character from "./Character";
import Pinyin from "./Pinyin";
import { getAudioPath } from "../utils/helpers";

const renderCEHeadword = (props, ref) => {
  return (
    <div>
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
};

export default React.forwardRef(renderCEHeadword);
