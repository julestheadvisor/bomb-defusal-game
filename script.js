const roleScreen = document.querySelector("#role-screen");
const defuserScreen = document.querySelector("#defuser-screen");
const manualScreen = document.querySelector("#manual-screen");
const defuserButton = document.querySelector("#defuser-button");
const manualButton = document.querySelector("#manual-button");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");
const timerLabel = document.querySelector("#timer-label");
const gameOverTitle = document.querySelector("#game-over-title");
const gameOverDescription = document.querySelector("#game-over-description");
const resultTime = document.querySelector("#result-time");
const resultStrikes = document.querySelector("#result-strikes");
const gameOverlay = document.querySelector(".game-overlay");
const strikeDisplay = document.querySelector("#strike-display");
const strikeSlots = document.querySelectorAll(".strike-slot");
const manualTitle = document.querySelector("#manual-title");
const manualBody = document.querySelector("#manual-body");
const manualPageCount = document.querySelector("#manual-page-count");
const manualArrowLeft = document.querySelector(".manual-arrow-left");
const manualArrowRight = document.querySelector(".manual-arrow-right");
const manualLeft = document.querySelector("#manual-left");
const manualRight = document.querySelector("#manual-right");
const wireList = document.querySelector("#wire-list");
const wiresStatus = document.querySelector("#wires-status");
const dotBoard = document.querySelector("#dot-board");
const dotLines = document.querySelector("#dot-lines");
const dotGrid = document.querySelector("#dot-grid");
const dotsStatus = document.querySelector("#dots-status");
const mazeGrid = document.querySelector("#maze-grid");
const mazeStatus = document.querySelector("#maze-status");
const mazeButtons = document.querySelectorAll(".maze-button");

const screens = [roleScreen, defuserScreen, manualScreen];
const timerDurationSeconds = 180;
const mazeMoveCooldownMs = 260;
const moduleColors = ["red", "yellow", "green", "blue", "purple", "black", "white"];
const colorValues = {
  red: "#d94738",
  yellow: "#f4d34f",
  green: "#34b36f",
  blue: "#3f7ee8",
  purple: "#8757d6",
  black: "#050505",
  white: "#f5f1e8"
};
const mazePresets = [
  {
    name: "Maze 1",
    red: 5,
    white: 15,
    walls: wallsFromSegments([
      { type: "vertical", line: 2, start: 0, end: 1 },
      { type: "horizontal", line: 1, start: 0, end: 1 },
      { type: "vertical", line: 3, start: 1, end: 2 },
      { type: "horizontal", line: 2, start: 0, end: 3 },
      { type: "horizontal", line: 3, start: 2, end: 4 },
      { type: "vertical", line: 1, start: 3, end: 4 }
    ])
  },
  {
    name: "Maze 2",
    red: 7,
    white: 0,
    walls: wallsFromSegments([
      { type: "vertical", line: 1, start: 0, end: 3 },
      { type: "horizontal", line: 1, start: 2, end: 3 },
      { type: "vertical", line: 3, start: 1, end: 2 },
      { type: "horizontal", line: 2, start: 1, end: 3 },
      { type: "horizontal", line: 3, start: 2, end: 3 },
      { type: "vertical", line: 2, start: 3, end: 4 }
    ])
  },
  {
    name: "Maze 3",
    red: 9,
    white: 3,
    walls: wallsFromSegments([
      { type: "vertical", line: 3, start: 0, end: 1 },
      { type: "horizontal", line: 1, start: 1, end: 2 },
      { type: "vertical", line: 1, start: 1, end: 3 },
      { type: "vertical", line: 2, start: 1, end: 2 },
      { type: "horizontal", line: 2, start: 2, end: 4 },
      { type: "horizontal", line: 3, start: 1, end: 3 }
    ])
  },
  {
    name: "Maze 4",
    red: 3,
    white: 12,
    walls: wallsFromSegments([
      { type: "horizontal", line: 1, start: 0, end: 1 },
      { type: "horizontal", line: 1, start: 2, end: 4 },
      { type: "vertical", line: 1, start: 1, end: 2 },
      { type: "vertical", line: 2, start: 1, end: 2 },
      { type: "vertical", line: 3, start: 2, end: 4 },
      { type: "horizontal", line: 3, start: 1, end: 3 }
    ])
  }
];

let remainingSeconds = timerDurationSeconds;
let timerId = null;
let manualPageIndex = 0;
let gameInitialized = false;
let strikeCount = 0;
let gameLost = false;
let gameWon = false;
let activeDot = null;
let previewLine = null;
let wireColors = [];
let correctWireIndices = [];
let dotColors = [];
let requiredDotConnections = {
  pairKeys: new Set(),
  fallbackAnyIndex: null
};
let madeDotConnections = new Set();
let currentMazePreset = null;
let lastMazeMoveAt = 0;
let mazeState = {
  red: 0,
  white: 0
};

const manualPages = [
  {
    title: "Bomb Defusal Manual",
    paragraphs: [
      "Use this manual to guide the defuser through each section. The defuser should describe what they see without looking at these instructions.",
      "Tap the right side of the screen to move forward. Tap the left side to go back."
    ]
  },
  {
    title: "Colored Wires",
    paragraphs: [
      "Read the rules from top to bottom. Use the first rule that applies, then ignore every rule below it."
    ],
    rules: [
      "If there is a black wire, cut a black wire.",
      "If there is more than one red wire, cut the third wire from the top.",
      "If there is a blue wire, cut the first yellow wire from the top.",
      "If there are no purple wires, cut a green wire.",
      "Otherwise, cut a white wire."
    ]
  },
  {
    title: "Connect the Dots",
    paragraphs: [
      "Apply every rule that is true. The section is complete only after all true rules have been fulfilled."
    ],
    rules: [
      "If there is a white dot, connect the third and fourth dots.",
      "If there is a green dot, connect the red and black dots.",
      "If the fourth dot is purple, connect it to the yellow dot.",
      "If the blue dot is even-numbered, connect the fourth dot and the second dot.",
      "If all of the above are untrue, connect the sixth dot to any other dot."
    ]
  },
  {
    title: "Maze Rules",
    paragraphs: [
      "The maze walls are invisible to the defuser. Match the light positions to one of the four diagrams, then guide the defuser around the walls.",
      "White circles show the white light. Red circles show the target red light."
    ],
    mazeList: true
  }
];

function showScreen(activeScreen) {
  screens.forEach((screen) => {
    screen.classList.toggle("screen-active", screen === activeScreen);
  });
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimer() {
  timerLabel.textContent = formatTime(remainingSeconds);
}

function wallKey(firstCell, secondCell) {
  return [firstCell, secondCell].sort((a, b) => a - b).join("-");
}

function wallsFromSegments(segments) {
  const walls = new Set();

  segments.forEach((segment) => {
    if (segment.type === "vertical") {
      for (let row = segment.start; row < segment.end; row += 1) {
        walls.add(wallKey(row * 4 + segment.line - 1, row * 4 + segment.line));
      }
    }

    if (segment.type === "horizontal") {
      for (let column = segment.start; column < segment.end; column += 1) {
        walls.add(wallKey((segment.line - 1) * 4 + column, segment.line * 4 + column));
      }
    }
  });

  return walls;
}

function startTimer() {
  if (gameLost || gameWon) {
    return;
  }

  startButton.disabled = true;
  startButton.textContent = "Started";
  gameOverlay.classList.add("game-active");

  timerId = window.setInterval(() => {
    remainingSeconds -= 1;
    updateTimer();

    if (remainingSeconds <= 0) {
      window.clearInterval(timerId);
      timerId = null;
      loseGame("time");
    }
  }, 1000);
}

function renderManualPage() {
  const page = manualPages[manualPageIndex];
  document.querySelector("#manual-page").classList.toggle("manual-maze-page", Boolean(page.mazeList));
  manualTitle.textContent = page.title;
  manualBody.innerHTML = "";

  page.paragraphs?.forEach((paragraph) => {
    const paragraphElement = document.createElement("p");
    paragraphElement.textContent = paragraph;
    manualBody.appendChild(paragraphElement);
  });

  if (page.rules) {
    const ruleList = document.createElement("ol");

    page.rules.forEach((rule) => {
      const ruleItem = document.createElement("li");
      ruleItem.textContent = rule;
      ruleList.appendChild(ruleItem);
    });

    manualBody.appendChild(ruleList);
  }

  if (page.mazeList) {
    manualBody.appendChild(createManualMazeList());
  }

  manualPageCount.textContent = `Page ${manualPageIndex + 1} of ${manualPages.length}`;
  manualLeft.disabled = manualPageIndex === 0;
  manualRight.disabled = manualPageIndex === manualPages.length - 1;
  manualArrowLeft.classList.toggle("visible", manualPageIndex > 0);
  manualArrowRight.classList.toggle("visible", manualPageIndex < manualPages.length - 1);
}

function createManualMazeList() {
  const list = document.createElement("div");
  list.className = "manual-maze-list";

  mazePresets.forEach((preset) => {
    const card = document.createElement("section");
    card.className = "manual-maze-card";

    const heading = document.createElement("h2");
    heading.textContent = preset.name;
    card.appendChild(heading);
    card.appendChild(createManualMaze(preset));
    list.appendChild(card);
  });

  return list;
}

function createManualMaze(preset) {
  const maze = document.createElement("div");
  maze.className = "manual-maze";

  for (let index = 0; index < 16; index += 1) {
    const cell = document.createElement("div");
    cell.className = "manual-maze-cell";

    if (index === preset.red) {
      cell.classList.add("red-light");
    }

    if (index === preset.white) {
      cell.classList.add("white-light");
    }

    maze.appendChild(cell);
  }

  maze.appendChild(createManualMazeWalls(preset));

  return maze;
}

function createManualMazeWalls(preset) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("manual-maze-walls");
  svg.setAttribute("viewBox", "0 0 4 4");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  preset.walls.forEach((key) => {
    const [firstCell, secondCell] = key.split("-").map(Number);
    const firstRow = Math.floor(firstCell / 4);
    const firstColumn = firstCell % 4;
    const secondRow = Math.floor(secondCell / 4);
    const secondColumn = secondCell % 4;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

    if (firstRow === secondRow) {
      const x = Math.max(firstColumn, secondColumn);
      line.setAttribute("x1", x);
      line.setAttribute("y1", firstRow);
      line.setAttribute("x2", x);
      line.setAttribute("y2", firstRow + 1);
    } else {
      const y = Math.max(firstRow, secondRow);
      line.setAttribute("x1", firstColumn);
      line.setAttribute("y1", y);
      line.setAttribute("x2", firstColumn + 1);
      line.setAttribute("y2", y);
    }

    svg.appendChild(line);
  });

  return svg;
}

function setModuleComplete(statusElement, isComplete) {
  statusElement.classList.toggle("complete", isComplete);
  statusElement.setAttribute(
    "aria-label",
    `${statusElement.id.replace("-status", "")} ${isComplete ? "complete" : "incomplete"}`
  );

  if (isComplete) {
    checkForWin();
  }
}

function isModuleComplete(statusElement) {
  return statusElement.classList.contains("complete");
}

function updateStrikeDisplay() {
  strikeSlots.forEach((slot, index) => {
    slot.classList.toggle("active", index < strikeCount);
    slot.textContent = index < strikeCount ? "X" : "";
  });
  strikeDisplay.setAttribute("aria-label", `${strikeCount} of ${strikeSlots.length} strikes`);
}

function recordStrike() {
  if (gameLost || gameWon) {
    return;
  }

  strikeCount = Math.min(strikeCount + 1, strikeSlots.length);
  updateStrikeDisplay();

  if (strikeCount >= strikeSlots.length) {
    loseGame("strikes");
  }
}

function loseGame(reason) {
  if (gameLost || gameWon) {
    return;
  }

  gameLost = true;
  gameOverTitle.textContent = reason === "time" ? "Time's Up" : "Game Over";
  gameOverDescription.textContent = reason === "time"
    ? "The timer reached zero. The bomb was not defused."
    : "Three strikes. The bomb was not defused.";
  defuserScreen.classList.add("game-lost");
  startButton.disabled = true;

  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }

  if (previewLine) {
    previewLine.remove();
    previewLine = null;
  }

  activeDot = null;
  disableGameControls();
}

function checkForWin() {
  if (gameLost || gameWon || !gameOverlay.classList.contains("game-active")) {
    return;
  }

  if (
    isModuleComplete(wiresStatus) &&
    isModuleComplete(dotsStatus) &&
    isModuleComplete(mazeStatus)
  ) {
    winGame();
  }
}

function winGame() {
  gameWon = true;
  gameOverTitle.textContent = "Bomb Defused";
  gameOverDescription.textContent = "All sections were completed successfully.";
  resultTime.textContent = formatTime(timerDurationSeconds - remainingSeconds);
  resultStrikes.textContent = `${strikeCount}/${strikeSlots.length}`;
  defuserScreen.classList.add("game-won");
  startButton.disabled = true;

  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }

  if (previewLine) {
    previewLine.remove();
    previewLine = null;
  }

  activeDot = null;
  disableGameControls();
}

function disableGameControls() {
  wireList.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  dotGrid.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  mazeButtons.forEach((button) => {
    button.disabled = true;
  });
}

function showWrongFeedback(...elements) {
  elements.forEach((element) => {
    element.classList.remove("wrong-feedback");
    void element.offsetWidth;
    element.classList.add("wrong-feedback");
  });
}

function showWhiteLightWrongFeedback() {
  const whiteCell = mazeGrid.querySelector(".white-light");

  if (whiteCell) {
    showWrongFeedback(whiteCell);
  }
}

function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function randomWireColors() {
  const pool = moduleColors.flatMap((color) => [color, color]);
  let colors = [];

  for (let attempt = 0; attempt < 200; attempt += 1) {
    colors = shuffle(pool).slice(0, 4);

    if (determineCorrectWireIndices(colors).length > 0) {
      return colors;
    }
  }

  return ["black", "red", "yellow", "green"];
}

function determineCorrectWireIndices(colors) {
  const blackIndices = findColorIndices(colors, "black");

  if (blackIndices.length > 0) {
    return blackIndices;
  }

  if (findColorIndices(colors, "red").length > 1) {
    return [2];
  }

  if (colors.includes("blue")) {
    return findColorIndices(colors, "yellow").slice(0, 1);
  }

  if (!colors.includes("purple")) {
    return findColorIndices(colors, "green");
  }

  return findColorIndices(colors, "white");
}

function findColorIndices(colors, color) {
  return colors.reduce((indices, currentColor, index) => {
    if (currentColor === color) {
      indices.push(index);
    }

    return indices;
  }, []);
}

function renderWires() {
  wireList.innerHTML = "";
  setModuleComplete(wiresStatus, false);
  wireColors = randomWireColors();
  correctWireIndices = determineCorrectWireIndices(wireColors);

  wireColors.forEach((color, index) => {
    const wireButton = document.createElement("button");
    wireButton.className = "wire-row";
    wireButton.type = "button";
    wireButton.dataset.wireColor = color;
    wireButton.setAttribute("aria-label", `Cut wire ${index + 1}, ${color}`);
    wireButton.innerHTML = `
      <span class="wire-number">${index + 1}</span>
      <span class="wire-cable"></span>
    `;
    wireButton.querySelector(".wire-cable").style.setProperty("--wire-color", colorValues[color]);
    wireButton.addEventListener("click", () => {
      if (gameLost || isModuleComplete(wiresStatus)) {
        return;
      }

      if (correctWireIndices.includes(index)) {
        wireButton.classList.add("wire-cut");
        wireButton.disabled = true;
        setModuleComplete(wiresStatus, true);
        wireList.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
      } else {
        showWrongFeedback(wireButton);
        recordStrike();
      }
    });
    wireList.appendChild(wireButton);
  });
}

function renderDots() {
  dotGrid.innerHTML = "";
  dotLines.innerHTML = "";
  madeDotConnections = new Set();
  setModuleComplete(dotsStatus, false);
  dotColors = randomDotColors();
  requiredDotConnections = determineRequiredDotConnections(dotColors);

  dotColors.forEach((color, index) => {
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.dataset.dotIndex = index;
    dot.dataset.dotColor = color;
    dot.textContent = index + 1;
    dot.style.setProperty("--dot-color", colorValues[color]);
    dot.setAttribute("aria-label", `Dot ${index + 1}, ${color}`);
    dot.addEventListener("pointerdown", startDotConnection);
    dotGrid.appendChild(dot);
  });
}

function randomDotColors() {
  let colors = [];

  for (let attempt = 0; attempt < 200; attempt += 1) {
    colors = shuffle(moduleColors).slice(0, 6);

    if (determineRequiredDotConnections(colors) !== null) {
      return colors;
    }
  }

  return ["white", "red", "blue", "purple", "yellow", "black"];
}

function determineRequiredDotConnections(colors) {
  const pairKeys = new Set();

  if (colors.includes("white")) {
    pairKeys.add(connectionKey(2, 3));
  }

  if (colors.includes("green")) {
    const redIndex = colors.indexOf("red");
    const blackIndex = colors.indexOf("black");

    if (redIndex === -1 || blackIndex === -1) {
      return null;
    }

    pairKeys.add(connectionKey(redIndex, blackIndex));
  }

  if (colors[3] === "purple") {
    const yellowIndex = colors.indexOf("yellow");

    if (yellowIndex === -1) {
      return null;
    }

    pairKeys.add(connectionKey(3, yellowIndex));
  }

  const blueIndex = colors.indexOf("blue");

  if (blueIndex !== -1 && (blueIndex + 1) % 2 === 0) {
    pairKeys.add(connectionKey(3, 1));
  }

  return {
    pairKeys,
    fallbackAnyIndex: pairKeys.size === 0 ? 5 : null
  };
}

function connectionKey(firstIndex, secondIndex) {
  return [firstIndex, secondIndex].sort((a, b) => a - b).join("-");
}

function dotCenter(dot) {
  const boardRect = dotBoard.getBoundingClientRect();
  const dotRect = dot.getBoundingClientRect();

  return {
    x: dotRect.left + dotRect.width / 2 - boardRect.left,
    y: dotRect.top + dotRect.height / 2 - boardRect.top
  };
}

function setLinePosition(line, start, end) {
  line.setAttribute("x1", start.x);
  line.setAttribute("y1", start.y);
  line.setAttribute("x2", end.x);
  line.setAttribute("y2", end.y);
}

function makeSvgLine(className) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("class", className);
  dotLines.appendChild(line);
  return line;
}

function startDotConnection(event) {
  if (gameLost || gameWon || isModuleComplete(dotsStatus)) {
    return;
  }

  activeDot = event.currentTarget;
  const start = dotCenter(activeDot);
  previewLine = makeSvgLine("dot-line preview");
  setLinePosition(previewLine, start, start);
  activeDot.setPointerCapture(event.pointerId);
}

function moveDotConnection(event) {
  if (!activeDot || !previewLine) {
    return;
  }

  const boardRect = dotBoard.getBoundingClientRect();
  setLinePosition(previewLine, dotCenter(activeDot), {
    x: event.clientX - boardRect.left,
    y: event.clientY - boardRect.top
  });
}

function finishDotConnection(event) {
  if (!activeDot || !previewLine) {
    return;
  }

  previewLine.remove();
  previewLine = null;

  const endDot = document.elementFromPoint(event.clientX, event.clientY)?.closest(".dot");

  if (endDot && endDot !== activeDot) {
    const pairKey = connectionKey(Number(activeDot.dataset.dotIndex), Number(endDot.dataset.dotIndex));
    const isCorrectConnection = isValidDotConnection(pairKey);

    if (isCorrectConnection) {
      const finalLine = makeSvgLine("dot-line");
      setLinePosition(finalLine, dotCenter(activeDot), dotCenter(endDot));
      madeDotConnections.add(pairKey);
      setModuleComplete(dotsStatus, areRequiredDotsConnected());

      if (isModuleComplete(dotsStatus)) {
        dotGrid.querySelectorAll("button").forEach((button) => {
          button.disabled = true;
        });
      }
    } else {
      showWrongFeedback(activeDot, endDot);
      recordStrike();
    }
  }

  activeDot = null;
}

function isValidDotConnection(pairKey) {
  if (requiredDotConnections.pairKeys.has(pairKey)) {
    return true;
  }

  if (requiredDotConnections.fallbackAnyIndex !== null) {
    return pairKey.split("-").map(Number).includes(requiredDotConnections.fallbackAnyIndex);
  }

  return false;
}

function areRequiredDotsConnected() {
  for (const pairKey of requiredDotConnections.pairKeys) {
    if (!madeDotConnections.has(pairKey)) {
      return false;
    }
  }

  if (requiredDotConnections.fallbackAnyIndex !== null) {
    return [...madeDotConnections].some((pairKey) => {
      return pairKey.split("-").map(Number).includes(requiredDotConnections.fallbackAnyIndex);
    });
  }

  return true;
}

function renderMaze() {
  const preset = mazePresets[Math.floor(Math.random() * mazePresets.length)];
  currentMazePreset = preset;
  mazeState = {
    red: preset.red,
    white: preset.white
  };
  setModuleComplete(mazeStatus, false);
  mazeButtons.forEach((button) => {
    button.disabled = false;
  });
  updateMazeGrid();
}

function updateMazeGrid() {
  mazeGrid.innerHTML = "";

  for (let index = 0; index < 16; index += 1) {
    const cell = document.createElement("div");
    cell.className = "maze-cell";

    if (index === mazeState.red) {
      cell.classList.add("red-light");
    }

    if (index === mazeState.white) {
      cell.classList.add("white-light");
    }

    mazeGrid.appendChild(cell);
  }

  setModuleComplete(mazeStatus, mazeState.white === mazeState.red);

  if (isModuleComplete(mazeStatus)) {
    mazeButtons.forEach((button) => {
      button.disabled = true;
    });
  }
}

function moveMazeLight(direction) {
  if (gameLost || gameWon || isModuleComplete(mazeStatus)) {
    return;
  }

  const now = Date.now();

  if (now - lastMazeMoveAt < mazeMoveCooldownMs) {
    return;
  }

  lastMazeMoveAt = now;

  const row = Math.floor(mazeState.white / 4);
  const column = mazeState.white % 4;
  let nextRow = row;
  let nextColumn = column;

  if (direction === "up") {
    nextRow -= 1;
  } else if (direction === "down") {
    nextRow += 1;
  } else if (direction === "left") {
    nextColumn -= 1;
  } else if (direction === "right") {
    nextColumn += 1;
  }

  if (nextRow < 0 || nextRow > 3 || nextColumn < 0 || nextColumn > 3) {
    showWhiteLightWrongFeedback();
    recordStrike();
    return;
  }

  const nextCell = nextRow * 4 + nextColumn;

  if (currentMazePreset.walls.has(wallKey(mazeState.white, nextCell))) {
    showWhiteLightWrongFeedback();
    recordStrike();
    return;
  }

  mazeState.white = nextCell;
  updateMazeGrid();
}

function initializeGame() {
  strikeCount = 0;
  gameLost = false;
  gameWon = false;
  lastMazeMoveAt = 0;
  defuserScreen.classList.remove("game-lost", "game-won");
  resultTime.textContent = "00:00";
  resultStrikes.textContent = `0/${strikeSlots.length}`;
  updateStrikeDisplay();
  renderWires();
  renderDots();
  renderMaze();
  gameInitialized = true;
}

function resetGame() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }

  remainingSeconds = timerDurationSeconds;
  startButton.disabled = false;
  startButton.textContent = "Start";
  gameOverlay.classList.remove("game-active");
  initializeGame();
  updateTimer();
}

defuserButton.addEventListener("click", () => {
  if (!gameInitialized) {
    initializeGame();
  }

  showScreen(defuserScreen);
  updateTimer();
});

manualButton.addEventListener("click", () => {
  manualPageIndex = 0;
  renderManualPage();
  showScreen(manualScreen);
});

startButton.addEventListener("click", () => {
  if (timerId === null) {
    startTimer();
  }
});

restartButton.addEventListener("click", resetGame);

manualLeft.addEventListener("click", () => {
  if (manualPageIndex > 0) {
    manualPageIndex -= 1;
    renderManualPage();
  }
});

manualRight.addEventListener("click", () => {
  if (manualPageIndex < manualPages.length - 1) {
    manualPageIndex += 1;
    renderManualPage();
  }
});

dotBoard.addEventListener("pointermove", moveDotConnection);
dotBoard.addEventListener("pointerup", finishDotConnection);
dotBoard.addEventListener("pointercancel", finishDotConnection);

mazeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    moveMazeLight(button.dataset.direction);
  });
});

updateTimer();
renderManualPage();
