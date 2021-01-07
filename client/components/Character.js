import React from "react";

const Character = (props) => {
  return (
    <div className="character" onClick={props.audioClickHandler}>
      {props.text}
    </div>
  );
};

export default Character;
