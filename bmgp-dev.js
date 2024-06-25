// BOARD
var size = 13;

// GUI
const canvas = document.getElementById('gobang');
const ctx = canvas.getContext('2d');
const cell = canvas.width / (size+2);
function drawBoard(position) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  for (let i = 1; i < (size+2)-1; i++) {
    let x = i * cell + cell / 2;
    let y = i * cell + cell / 2;
    let offset = cell * 2 - cell / 2;
    ctx.moveTo(offset, y);
    ctx.lineTo(canvas.width - offset, y);
    ctx.moveTo(x, offset);
    ctx.lineTo(x, canvas.height - offset);
  };ctx.stroke();
  for (let row = 0; row < (size+2); row++) {
    for (let col = 0; col < (size+2); col++) {
      let square = moveToSquare(col, row);
      let board = "";
      if (position.moves % 2 == 0) board = position.board.split('x').join('O');
      else board = position.board.split('X').join('O').split('x').join('X');
      if (position.board[square] == " " || position.board[square] == "\n") continue;
      let color = board[square] == "X" ? "black" : "white";
      if (position.board[square] != ".") {
        ctx.beginPath();
        ctx.arc(col * cell + cell / 2, row * cell + cell / 2, cell / 2 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

// ENGINE
const contactRegexes = {};
const regexSources = {
  '.': '\\.',
  'x': 'x',
  'X': 'X'
};

for (let color in regexSources) {
  const regexPattern = regexSources[color];
  const contactRegexSources = [
    `#${regexPattern}`,                             // color at right
    `${regexPattern}#`,                             // color at left
    `#${'.'.repeat((size+2) - 1)}${regexPattern}`,  // color below
    `${regexPattern}${'.'.repeat((size+2) - 1)}#`   // color above
  ]; contactRegexes[color] = new RegExp(contactRegexSources.join('|'), 's');
}

function getNeighbors(square) { return [square-1, square+1, square-(size+2), square+(size+2)]; }
function setStone(board, square, stone) { return board.slice(0, square) + stone + board.slice(square + 1); }
function moveToSquare(x, y) { return y*(size+2)+ x; }

function Position(board, captures, moves, ko, komi) {
  return {
  "board": board,
  "captures": captures,
  "moves": moves,
  "ko": ko,
  "komi": komi
  }
}

function initBoard() {
  let empty = [...Array(size+2)].map((_, i) => i === 0 ?
      ' '.repeat(size + 1) : i === size + 1 ?
        ' '.repeat(size + 2) : ' ' +
        '.'.repeat(size)).join('\n');
  return Position(empty, [0, 0], 0, null, komi=7.5);
}

function isEyeish(board, square) {
  let eyecolor = null;
  let othercolor;
  const neighbors = getNeighbors(square);
  for (let neighbor of neighbors) {
    if (board[neighbor].trim() === "") continue;
    if (board[neighbor] === '.') return null;
    if (eyecolor === null) {
      eyecolor = board[neighbor];
      othercolor = eyecolor === eyecolor.toUpperCase() ? eyecolor.toLowerCase() : eyecolor.toUpperCase();
    } else if (board[neighbor] === othercolor) return null;
  }
  return eyecolor;
}

function floodfill(board, square) {
  let byteboard = new Uint8Array(board.split('').map(char => char.charCodeAt(0)));
  let color = byteboard[square];
  byteboard[square] = '#'.charCodeAt(0);
  let fringe = [square];
  while (fringe.length > 0) {
    square = fringe.pop();
    for (let neighbor of getNeighbors(square)) {
      if (byteboard[neighbor] == color) {
        byteboard[neighbor] = '#'.charCodeAt(0);
        fringe.push(neighbor);
      }
    }
  };return String.fromCharCode.apply(null, byteboard);
}

function contact(board, color) {
  const match = board.match(contactRegexes[color]);
  if (!match) return null;
  return match.index;
}

function makeMove(position, square) {
  if (position.board[square] != ".") return null;
  if (square == position.ko) return null;
  let inEnemyEye = (isEyeish(position.board, square) == 'x');
  let board = setStone(position.board, square, 'X');
  captureX = position.captures[0];
  singleCaptures = [];
  for (let neighbor of getNeighbors(square)) {
    if (board[neighbor] != "x") continue;
    floodfill_board = floodfill(board, neighbor)  // get a board with the adjecent group replaced by '#'
    console.log(floodfill_board);
    if (contact(floodfill_board, '.') != null) continue;
    capture_count = floodfill_board.split('#').length - 1;
    if (capture_count == 1) singleCaptures.push(neighbor);
    captureX += capture_count;
    board = floodfill_board.split("#").join(".");
  }
  let ko = (inEnemyEye && singleCaptures.length) ? singleCaptures[0] : null; 
  if (contact(floodfill(board, square), ".") == null) return null;
  board = board.split('').map(c => c == c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
  return Position(board, [position.captures[1], captureX], position.moves+1, ko, 7.5);
}

// MAIN
canvas.addEventListener('click', userInput);
function userInput(event) {
  let rect = canvas.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let col = Math.floor(mouseX / cell);
  let row = Math.floor(mouseY / cell);
  let isLegal = makeMove(position, moveToSquare(col, row))
  if (isLegal != null) position = isLegal;
  console.log(position);
  drawBoard(position);
  //setTimeout(function() { play(2); }, 10);
}

let position = initBoard();
drawBoard(position);
