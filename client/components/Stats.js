import React from "react";

const Stats = (props) => {
  let percent = 0.0;
  if (props.attempted != 0) {
    percent = props.correct / props.attempted;
  }
  const dateString = props.startTime.toLocaleDateString("en-US");
  const timeString = props.startTime.toLocaleTimeString("en-US");
  const timestamp = dateString + " " + timeString;
  return (
    <div id="stats">
      {`${props.correct} / ${props.attempted} (${(percent * 100).toFixed(2)}%)`}
      <br />
      <small>{timestamp}</small>
    </div>
  );
};

export default Stats;
