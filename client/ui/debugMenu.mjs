export default (game) => {
  const sheet = document.createElement("style");
  sheet.innerHTML = `
.DEBUG_Container {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 2;
}
.DEBUG_Container.show {
    width: 100%;
    height: 100%;
    overflow: scroll;
}
.DEBUG_ToggleBtn {
    border: none;
    background: rgba(255, 255, 255, 0.7);
    margin: 10px;
    padding: 10px;
    position: absolute;
    bottom: 0;
}
.DEBUG_Content {
    background: rgba(255, 255, 255, 0.6);
    display: none;
    padding: 10px;
}
.DEBUG_Container.show .DEBUG_Content {
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
}
.DEBUG_Container button {
    margin: 10px;
}
`;
  document.body.appendChild(sheet);

  const DEBUGContainer = document.createElement("div");
  DEBUGContainer.classList.add("DEBUG_Container");

  const DEBUGToggleBtn = document.createElement("button");
  DEBUGToggleBtn.classList.add("DEBUG_ToggleBtn");
  DEBUGToggleBtn.innerText = "debug";

  const DEBUGContent = document.createElement("div");
  DEBUGContent.classList.add("DEBUG_Content");

  const DEBUGFieldset = document.createElement("fieldset");
  const DEBUGFieldsetLegend = document.createElement("legend");
  DEBUGFieldsetLegend.innerText = "debug settings";

  const DEBUGHitAreaLabel = document.createElement("label");
  DEBUGHitAreaLabel.innerText = "Show hit area of objects";
  const DEBUGHitAreaCheckbox = document.createElement("input");
  DEBUGHitAreaCheckbox.type = "checkbox";
  DEBUGHitAreaLabel.appendChild(DEBUGHitAreaCheckbox);

  document.body.appendChild(DEBUGContainer);
  DEBUGContainer.appendChild(DEBUGToggleBtn);
  DEBUGContainer.appendChild(DEBUGContent);

  DEBUGContent.appendChild(DEBUGFieldset);
  DEBUGFieldset.appendChild(DEBUGFieldsetLegend);

  DEBUGFieldset.appendChild(DEBUGHitAreaLabel);

  DEBUGToggleBtn.onclick = () => {
    DEBUGContainer.classList.toggle("show");
  };

  DEBUGHitAreaCheckbox.onchange = () => {
    game.input._list.forEach((obj) => { // eslint-disable-line
      if (DEBUGHitAreaCheckbox.checked) {
        game.input.enableDebug(obj);
      } else {
        game.input.removeDebug(obj);
      }
    });
  };
};
