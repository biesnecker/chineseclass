import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import { isIOS } from "./utils/helpers";

document.addEventListener("DOMContentLoaded", () => {
  let flashcards = [];

  const ts = Math.floor(Date.now() / 1000);

  fetch(`data.json?ts=${ts}`)
    .then((response) => response.json())
    .then((jd) => {
      jd.forEach((element) => flashcards.push(element));

      ReactDOM.render(
        <App cards={flashcards} useHover={!isIOS()} />,
        document.getElementById("container")
      );
    });
});
