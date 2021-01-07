import React from "react";

const CEOptions = (props) => {
  console.log(props.choices);
  const optdivs = props.choices.map((elem, idx) => {
    if (props.mode === 0) {
      return (
        <div className="opt" key={idx} onClick={props.clickHandlerFactory(idx)}>
          {elem.definition}
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
          {elem.definition}
        </div>
      );
    }
  });
  return <div>{optdivs}</div>;
};

export default CEOptions;
