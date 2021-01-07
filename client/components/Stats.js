import React from "react";

const Stats = (props) => {
  let percent = 0.0;
  if (props.attempted != 0) {
    percent = props.correct / props.attempted;
  }
  return (
    <div id="stats">{`${props.correct} / ${props.attempted} (${(
      percent * 100
    ).toFixed(2)}%)`}</div>
  );
};

export default Stats;
