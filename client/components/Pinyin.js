import React from "react";
import transformPinyin from "../utils/pinyin";

const Pinyin = (props) => {
  return (
    <div className="pinyin" onClick={props.audioClickHandler}>
      {transformPinyin(props.text)}
    </div>
  );
};

export default Pinyin;
