// Features to be done:
// Next Piece system
// Line ~243: Print 'Paused' on Screen
// Line ~392: Set small pause when tetromino reach bottom line (settimeout)
// Line ~499: blink a row before disappear
// Line ~415: When game is over, pull a button to restart the game
// Line ~521: Improve Score, more lines grants more points
// Line ~352 || ~568 : bug when rotating next walls or above other pieces

let canvas;
let ctx;
let gBArrayHeight = 20; // Number of cells of gameboard height
let gBArrayWidth = 12; // Number of cells of gameboard width
let startX = 4; // Initial X position for Tetromino
let startY = 0; // Initial Y position for Tetromino
let score = 0; // Tracks the score
let level = 1; // Tracks current level
let winOrLose = "Playing";

// Music
myAudio = new Audio("tetrisTheme.mp3");
myAudio.volume = 0.05;
myAudio.loop = true;
myAudio.play();

// Level Up
let levelUp = 20;
let speed = 1; // set speed to 1
let timer; // set timer variable to clear interval

// Pause System
let isPaused = false;

// Used as a look up table where each value in the array contains the x & y position we can use to draw the box on the canvas
let coordinateArray = [...Array(gBArrayHeight)].map((e) =>
  Array(gBArrayWidth).fill(0)
);

let curTetromino = [
  [1, 0],
  [0, 1],
  [1, 1],
  [2, 1],
];

// Will hold all the Tetrominos
let tetrominos = [];

// The tetromino colors
let tetrominoColors = [
  "purple", // Tetromino T
  "cyan", // Tetromino I
  "blue", // Tetromino J
  "yellow", // Tetromino Square
  "orange", // Tetromino L
  "green", // Tetromino S
  "red", // Tetromino Z
];
// Holds current Tetromino color
let curTetrominoColor;

// Create gameboard array so we know where other squares are
let gameBoardArray = [...Array(20)].map((e) => Array(12).fill(0));

// Array for storing stopped shapes. It will hold colors when a shape stops and is added
let stoppedShapeArray = [...Array(20)].map((e) => Array(12).fill(0));

// Track the direction the player is moving the Tetromino tp stop trying to move through walls
let DIRECTION = {
  IDLE: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
};
let direction;

let KEYS = {
  LEFT: 37,
  RIGHT: 39,
  DOWN: 40,
  ROTATE: 38,
  PAUSE: 32,
};

class Coordinates {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// Execute SetupCanvas when page loads
document.addEventListener("DOMContentLoaded", SetupCanvas);

// Creates the array with square coordinates
// [0,0] is X: 11 Y: 9
// Tetromino square size is [23, 23]
function CreateCoordArray() {
  let xR = 0,
    yR = 19;
  let i = 0,
    j = 0;
  for (let y = 9; y <= 446; y += 23) {
    for (let x = 11; x <= 264; x += 23) {
      coordinateArray[i][j] = new Coordinates(x, y);
      i++;
    }
    j++;
    i = 0;
  }
}

function SetupCanvas() {
  canvas = document.getElementById("my-canvas");
  ctx = canvas.getContext("2d");
  canvas.width = 468;
  canvas.height = 478;

  // To change the size of elements on Screen
  //   ctx.scale(1, 1);

  // Draw Canvas background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw gameboard rectangle
  ctx.strokeStyle = "black";
  ctx.strokeRect(8, 8, 280, 462);

  tetrisLogo = new Image(161, 54);
  tetrisLogo.onload = DrawTetrisLogo;
  tetrisLogo.src = "tetrislogo.png";

  // Set font for score label text and draw
  ctx.fillStyle = "black";
  ctx.font = "21px Arial";

  // Draw level label text
  ctx.fillText("LEVEL", 300, 98);
  // Draw level rectangle
  ctx.strokeRect(300, 107, 161, 24);
  // Draw level number
  ctx.fillText(level.toString(), 310, 127);

  ctx.fillText("SCORE", 300, 162);
  // Draw score rectangle
  ctx.strokeRect(300, 171, 161, 24);
  // Draw score number
  ctx.fillText(score.toString(), 310, 190);

  // Draw next label text
  ctx.fillText("NEXT PIECE", 300, 223);
  // Draw playing condition
  // Insert the next piece logic
  // Draw playing condition rectangle
  ctx.strokeRect(300, 232, 161, 95);

  // Draw controls label text
  ctx.fillText("CONTROLS", 300, 357);

  // Draw controls rectangle
  ctx.strokeRect(300, 366, 161, 104);

  // Draw controls text
  ctx.font = "19px Arial";
  ctx.fillText(" \u2191  : Rotate", 310, 388);
  ctx.fillText("\u2190 : Move Left", 310, 413);
  ctx.fillText("\u2192 : Move Right", 310, 438);
  ctx.fillText("Space: Pause", 310, 463);

  // Handle keyboard presses
  document.addEventListener("keydown", HandleKeyPress);

  // Create the array of Tetromino arrays
  CreateTetrominos();
  // Generate random Tetromino
  CreateTetromino();

  // Create the rectangle lookup table
  CreateCoordArray();

  DrawTetromino();
}

function DrawTetrisLogo() {
  ctx.drawImage(tetrisLogo, 300, 8, 161, 54);
}

function DrawTetromino() {
  // Cycle through the x & y array for the tetromino looking for all the places a square would be drawn
  for (let i = 0; i < curTetromino.length; i++) {
    // Move the Tetromino x & y values to the tetromino shows in the middle of the gameboard
    let x = curTetromino[i][0] + startX;
    let y = curTetromino[i][1] + startY;

    // Put Tetromino shape in the gameboard array
    gameBoardArray[x][y] = 1;

    // Look for the x & y values in the lookup table
    let coorX = coordinateArray[x][y].x;
    let coorY = coordinateArray[x][y].y;

    // Draw a square at the x & y coordinates that the lookup
    // table provides
    ctx.fillStyle = curTetrominoColor;
    ctx.fillRect(coorX, coorY, 21, 21);
  }
}

// ----- Move & Delete Old Tetrimino -----
// Each time a key is pressed we change either the starting x or y value for where we want to draw the new Tetromino. We also delete the previously drawn shape and draw the new one
function HandleKeyPress(e) {
  if (winOrLose != "Game Over") {
    let key = e.keyCode;
    // a keycode (LEFT)
    if (key === KEYS.LEFT && !isPaused) {
      // Check if I'll hit the wall
      direction = DIRECTION.LEFT;
      if (!HittingTheWall() && !CheckForHorizontalCollision()) {
        DeleteTetromino();
        startX--;
        DrawTetromino();
      }

      // keycode (RIGHT)
    } else if (key === KEYS.RIGHT && !isPaused) {
      // Check if I'll hit the wall
      direction = DIRECTION.RIGHT;
      if (!HittingTheWall() && !CheckForHorizontalCollision()) {
        DeleteTetromino();
        startX++;
        DrawTetromino();
      }

      // keycode (DOWN)
    } else if (key === KEYS.DOWN && !isPaused) {
      MoveTetrominoDown();

      // keycode for rotation of Tetromino
    } else if (key === KEYS.ROTATE && !isPaused) {
      RotateTetromino();

      // keycode for pause
    } else if (key === KEYS.PAUSE) {
      isPaused = !isPaused;

      // The 'Paused' is not working properly, they don't disapear when pause is off
      // ctx.fillStyle = "black";
      // ctx.font = "24px Arial";
      // ctx.fillText("Paused", 95, 36);
    }
  }
}

function MoveTetrominoDown() {
  // Track that I want to move down
  direction = DIRECTION.DOWN;

  // Check for a vertical collision
  if (!CheckForVerticalCollison()) {
    DeleteTetromino();
    startY++;
    DrawTetromino();
  }
}

// Automatically calls for a Tetromino to fall every second

function setSpeed(speed) {
  timer = window.setInterval(() => {
    if (!isPaused) {
      if (winOrLose != "Game Over") {
        MoveTetrominoDown();
      }
    }
  }, 1000 / speed);
}

setSpeed(speed);

// Clears the previously drawn Tetromino when moving
function DeleteTetromino() {
  for (let i = 0; i < curTetromino.length; i++) {
    let x = curTetromino[i][0] + startX;
    let y = curTetromino[i][1] + startY;

    // Delete Tetromino square from the gameboard array
    gameBoardArray[x][y] = 0;

    // Draw white where colored squares used to be
    let coorX = coordinateArray[x][y].x;
    let coorY = coordinateArray[x][y].y;
    ctx.fillStyle = "white";
    ctx.fillRect(coorX, coorY, 21, 21);
  }
}

// Random Tetromino shapes
function CreateTetrominos() {
  // Push T
  tetrominos.push([
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ]);
  // Push I
  tetrominos.push([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
  // Push J
  tetrominos.push([
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ]);
  // Push Square
  tetrominos.push([
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]);
  // Push L
  tetrominos.push([
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ]);
  // Push S
  tetrominos.push([
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ]);
  // Push Z
  tetrominos.push([
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ]);
}

function CreateTetromino() {
  // Get a random tetromino index
  let randomTetromino = Math.floor(Math.random() * tetrominos.length);
  // Set the one to draw
  curTetromino = tetrominos[randomTetromino];
  // Get the color for it
  curTetrominoColor = tetrominoColors[randomTetromino];
}

// Check if the Tetromino hits the wall
// Cycle through the squares adding the upper left hand corner position to see if the value is <= to 0 or >= 11. If they are also moving in a direction that would be off the board stop movement

function HittingTheWall() {
  for (let i = 0; i < curTetromino.length; i++) {
    let newX = curTetromino[i][0] + startX;
    if (newX <= 0 && direction === DIRECTION.LEFT) {
      return true;
    } else if (newX >= 11 && direction === DIRECTION.RIGHT) {
      return true;
    }
  }
  return false;
}

// Check for vertical collison
function CheckForVerticalCollison() {
  // Make a copy of the tetromino to move a fake Tetromino and check for collisions before move the real Tetromino
  let tetrominoCopy = curTetromino;

  // Will change values based on collisions
  let collision = false;

  // Cycle through all Tetromino squares
  for (let i = 0; i < tetrominoCopy.length; i++) {
    // Get each square of the Tetromino and adjust the square position so it can check for collisions
    let square = tetrominoCopy[i];

    // Move into position based on the changing upper left hand corner of the entire Tetromino shape
    let x = square[0] + startX;
    let y = square[1] + startY;

    // If I'm moving down increment y to check for a collison
    if (direction === DIRECTION.DOWN) {
      y++;
    }

    // Check if I'm going to hit a previously set piece
    if (typeof stoppedShapeArray[x][y + 1] === "string") {
      // If so delete Tetromino
      DeleteTetromino();
      // Increment to put into place and draw
      startY++;
      DrawTetromino();
      collision = true;
      break;
    }
    if (y >= 20) {
      collision = true;
      break;
    }
  }

  if (collision) {
    // Check for game over and if so set game over text
    if (startY <= 2) {
      winOrLose = "Game Over";
      ctx.fillStyle = "black";
      ctx.font = "24px Arial";
      ctx.fillText("Game Over", 80, 36);
    } else {
      // Add stopped Tetromino to stopped shape array so it can check for future collisions
      for (let i = 0; i < tetrominoCopy.length; i++) {
        let square = tetrominoCopy[i];
        let x = square[0] + startX;
        let y = square[1] + startY;
        // Add the current Tetromino color
        stoppedShapeArray[x][y] = curTetrominoColor;
      }

      // Check for completed rows
      CheckForCompletedRows();

      CreateTetromino();

      // Create the next Tetromino and draw it and reset direction
      direction = DIRECTION.IDLE;
      startX = 4;
      startY = 0;
      DrawTetromino();
    }
  }
}

// Check for horizontal shape collision
function CheckForHorizontalCollision() {
  // Copy the Teromino so I can manipulate its x value and check if its new value would collide with a stopped Tetromino
  var tetrominoCopy = curTetromino;
  var collision = false;

  // Cycle through all Tetromino squares
  for (var i = 0; i < tetrominoCopy.length; i++) {
    // Get the square and move it into position using the upper left hand coordinates
    var square = tetrominoCopy[i];
    var x = square[0] + startX;
    var y = square[1] + startY;

    // Move Tetromino clone square into position based on direction moving
    if (direction == DIRECTION.LEFT) {
      x--;
    } else if (direction == DIRECTION.RIGHT) {
      x++;
    }

    // Get the potential stopped square that may exist
    var stoppedShapeVal = stoppedShapeArray[x][y];

    // If it is a string we know a stopped square is there
    if (typeof stoppedShapeVal === "string") {
      collision = true;
      break;
    }
  }

  return collision;
}

// Check for completed rows
function CheckForCompletedRows() {
  // Track how many rows to delete and where to start deleting
  let rowsToDelete = 0;
  let startOfDeletion = 0;

  // Check every row to see if it has been completed
  for (let y = 0; y < gBArrayHeight; y++) {
    let completed = true;
    // Cycle through x values
    for (let x = 0; x < gBArrayWidth; x++) {
      // Get values stored in the stopped block array
      let square = stoppedShapeArray[x][y];

      // Check if nothing is there
      if (square === 0 || typeof square === "undefined") {
        // If there is nothing there once then jump out because the row isn't completed
        completed = false;
        break;
      }
    }

    // If a row has been completed
    if (completed) {
      // Used to shift down the rows
      if (startOfDeletion === 0) startOfDeletion = y;
      rowsToDelete++;

      // Delete the line everywhere
      for (let i = 0; i < gBArrayWidth; i++) {
        // Update the arrays by deleting previous squares
        stoppedShapeArray[i][y] = 0;
        gameBoardArray[i][y] = 0;
        // Look for the x & y values in the lookup table
        let coorX = coordinateArray[i][y].x;
        let coorY = coordinateArray[i][y].y;
        // Draw the square as white
        ctx.fillStyle = "white";
        ctx.fillRect(coorX, coorY, 21, 21);
      }
    }
  }

  if (rowsToDelete > 0) {
    // score = lines * 20 - 10;
    score += 10;
    ctx.fillStyle = "white";
    // To fill the text box without superposition of the rectangle, need apply +2, +2, -5, -5 in the original StrokeRect
    ctx.fillRect(302, 173, 156, 19);
    ctx.fillStyle = "black";
    ctx.fillText(score.toString(), 310, 190);
    MoveAllRowsDown(rowsToDelete, startOfDeletion);
  }

  // Level Up, increasing speed/difficulty
  if (score >= 2 * level * levelUp) {
    speed += 0.75;
    level++;
    ctx.fillStyle = "white";
    // Fill old level rectangle
    ctx.fillRect(302, 109, 156, 19);
    // Fill old level
    ctx.fillStyle = "black";
    ctx.fillText(level.toString(), 310, 127);
    clearInterval(timer);
    setSpeed(speed);
  }
}

// Move rows down after a row has been deleted
function MoveAllRowsDown(rowsToDelete, startOfDeletion) {
  for (var i = startOfDeletion - 1; i >= 0; i--) {
    for (var x = 0; x < gBArrayWidth; x++) {
      var y2 = i + rowsToDelete;
      var square = stoppedShapeArray[x][i];
      var nextSquare = stoppedShapeArray[x][y2];

      if (typeof square === "string") {
        nextSquare = square;
        gameBoardArray[x][y2] = 1; // Put block into Gameboard array
        stoppedShapeArray[x][y2] = square; // Draw color into stopped

        // Look for the x & y values in the lookup table
        let coorX = coordinateArray[x][y2].x;
        let coorY = coordinateArray[x][y2].y;
        ctx.fillStyle = nextSquare;
        ctx.fillRect(coorX, coorY, 21, 21);

        square = 0;
        gameBoardArray[x][i] = 0; // Clear the spot in gameboard array
        stoppedShapeArray[x][i] = 0; // Clear the spot in SSA
        coorX = coordinateArray[x][i].x;
        coorY = coordinateArray[x][i].y;
        ctx.fillStyle = "white";
        ctx.fillRect(coorX, coorY, 21, 21);
      }
    }
  }
}

// Rotate the Tetromino
function RotateTetromino() {
  let newRotation = new Array();
  let tetrominoCopy = curTetromino;
  let curTetrominoBU;

  for (let i = 0; i < tetrominoCopy.length; i++) {
    // Here to handle a error with a backup Tetromino
    // We are cloning the array otherwise it would create a reference to the array that caused the error
    curTetrominoBU = [...curTetromino];

    // Find the new rotation by getting the x value of the last square of the Tetromino and then we orientate the others squares based on it [SLIDE]
    let x = tetrominoCopy[i][0];
    let y = tetrominoCopy[i][1];
    let newX = GetLastSquareX() - y;
    let newY = x;
    newRotation.push([newX, newY]);
  }
  DeleteTetromino();

  // Try to draw the new Tetromino rotation
  try {
    curTetromino = newRotation;
    DrawTetromino();
  } catch (e) {
    // If there is an error get the backup Tetromino and draw it instead
    if (e instanceof TypeError) {
      curTetromino = curTetrominoBU;
      DeleteTetromino();
      DrawTetromino();
    }
  }
}

// Gets the x value for the last square in the Tetromino so we can orientate all other squares using that as a boundary. This simulates rotating the Tetromino
function GetLastSquareX() {
  let lastX = 0;
  for (let i = 0; i < curTetromino.length; i++) {
    let square = curTetromino[i];
    if (square[0] > lastX) lastX = square[0];
  }
  return lastX;
}
