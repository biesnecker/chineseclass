import React from "react";
import transformPinyin from "../utils/pinyin";
import ReviewType from "../shared/ReviewType";

const Options = (props) => {
  const optdivs = props.choices.map((elem, idx) => {
    let optionText;
    switch (props.reviewType) {
      case ReviewType.CHINESE_TO_ENGLISH:
        optionText = elem.definition;
        break;
      case ReviewType.ENGLISH_TO_CHINESE:
        optionText = `${elem.character} ${transformPinyin(elem.pinyin)}`;
        break;
      default:
        throw new Error("Unknown review type: " + props.reviewType);
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
