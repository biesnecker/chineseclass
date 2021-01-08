import React from "react";
import transformPinyin from "../utils/pinyin";

const Options = (props) => {
  const optdivs = props.choices.map((elem, idx) => {
    let optionText;
    if (props.direction === 0) {
      optionText = elem.definition;
    } else {
      optionText = `${elem.character} ${transformPinyin(elem.pinyin)}`;
    }
    if (props.mode === 0) {
      return (
        <div className="opt" key={idx} onClick={props.clickHandlerFactory(idx)}>
          {optionText}
        </div>
      );
    } else {
      let cn = "";
      if (idx === props.rightAnswer) {
        cn = "correct";
      } else if (
        props.rightAnswer !== props.chosenAnswer &&
        idx === props.chosenAnswer
      ) {
        cn = "incorrect";
      }
      return (
        <div
          className={`opt ${cn}`}
          key={idx}
          onClick={props.clickHandlerFactory(idx)}
        >
          {optionText}
        </div>
      );
    }
  });
  return <div>{optdivs}</div>;
};

export default Options;
