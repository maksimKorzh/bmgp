// Init board canvas
const canvas = document.getElementById('gobang');
const ctx = canvas.getContext('2d');
canvas.addEventListener('click', userInput);

// Game state
const EMPTY = 0
const BLACK = 1
const WHITE = 2
const MARKER = 4
const OFFBOARD = 7
const LIBERTY = 8

var board = [];
var size = 15;
var side = BLACK;
var liberties = [];
var block = [];
var points_side = [];
var points_count = [];
var ko = EMPTY;
var bestMove = EMPTY;
var cell = canvas.width / size;

// Change board size
var selectSize = document.getElementById("size");
selectSize.addEventListener("change", function() {
  size = parseInt(selectSize.value);
  cell = canvas.width / size;
  initBoard();
  drawBoard();
  side = BLACK;
  ko = EMPTY;
});

function userInput(event) {
  let rect = canvas.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let col = Math.floor(mouseX / cell);
  let row = Math.floor(mouseY / cell);
  let sq = row * size + col;
  if (board[sq]) return;
  if (!setStone(sq, side, true)) return;
  drawBoard();
  setTimeout(function() { play(4); }, 10);
}

// Init board
function initBoard() {
  for (let sq = 0; sq < size ** 2; sq++) {
    switch (true) {
      case (sq < size):
      case (sq >= (size ** 2 - size)):
      case (!(sq % size)):
        board[sq] = OFFBOARD;
        board[sq-1] = OFFBOARD;
        break;
      default: board[sq] = 0;
    }
  }
}

// Print position to console
function printPosition() {
  let position = "";
  for (let sq = 0; sq < size ** 2; sq++) {
    position += (!(sq % size)) ? "\n" : "";
    position += board[sq] + " ";
  };console.log(position);
  console.log("Side to move: " + (side == 1 ? "black" : "white"));
}

// Print score
function updateScore() {
  let pts = score();
  let element = document.getElementById("score");
  element.innerHTML = "Black " + pts[BLACK] + ", White " + pts[WHITE] + ", Empty " + pts[EMPTY];
}

// Print board
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  for (let i = 1; i < size-1; i++) {
    const x = i * cell + cell / 2;
    const y = i * cell + cell / 2;
    let offset = cell * 2 - cell / 2;
    ctx.moveTo(offset, y);
    ctx.lineTo(canvas.width - offset, y);
    ctx.moveTo(x, offset);
    ctx.lineTo(x, canvas.height - offset);
  };ctx.stroke();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let sq = row * size + col;
      if (board[sq] == 7) continue;
      let color = board[sq] == 1 ? "black" : "white";
      if (board[sq]) {
        ctx.beginPath();
        ctx.arc(col * cell + cell / 2, row * cell + cell / 2, cell / 2 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
      }
      if (sq == bestMove) {
        let color = board[sq] == 1 ? "white" : "black";
        ctx.beginPath();
        ctx.arc(col * cell+(cell/4)*2, row * cell +(cell/4)*2, cell / 4 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

// Put stone on board
function setStone(sq, color, user) {
  if (board[sq] != EMPTY) {
    if (user) alert("Illegal move!");
    return false;
  } else if (sq == ko) {
    if (user) alert("Ko!");
    return false;
  } let old_ko = ko;
  ko = EMPTY;
  board[sq] = color;
  captures(3 - color);
  count(sq, color);
  let suicide = liberties.length ? false : true; 
  restoreBoard();
  if (suicide) {
    board[sq] = EMPTY;
    ko = old_ko;
    if (user) alert("Suicide move!");
    return false;
  } side = 3 - side;
  bestMove = sq;
  return true;
}

// Handle captures
function captures(color) {
  for (let sq = 0; sq < size ** 2; sq++) {
    let stone = board[sq];
    if (stone == OFFBOARD) continue;
    if (stone & color) {
      count(sq, color);
      if (liberties.length == 0) clearBlock();
      restoreBoard()
    }
  }
}

// Count liberties, save stone group coords
function count(sq, color) {
  stone = board[sq];
  if (stone == OFFBOARD) return;
  if (stone && (stone & color) && (stone & MARKER) == 0) {
    block.push(sq);
    board[sq] |= MARKER;
    count(sq - size, color);
    count(sq - 1, color);
    count(sq + size, color);
    count(sq + 1, color);
  } else if (stone == EMPTY) {
    board[sq] |= LIBERTY;
    liberties.push(sq);
  }
}

// Restore the board after counting stones
function restoreBoard() {
  clearGroups();
  for (let sq = 0; sq < size ** 2; sq++) {
    if (board[sq] != OFFBOARD) board[sq] &= 3;
  }
}

// Remove captured stones
function clearBlock() {
  if (block.length == 1) {
    let count = 0;
    for (let sq of [size+1, size-1, -size+1, -size-1]) {
      if (board[block[0] + sq] == EMPTY) count += 1;
    };if (count) ko = block[0];
  };for (let i = 0; i < block.length; i++)
    board[block[i]] = EMPTY;
}

// Clear groups
function clearGroups() {
  block = [];
  liberties = [];
  points_side = [];
}

// Count territory
function territory(sq) {
  stone = board[sq];
  if (stone == OFFBOARD) return OFFBOARD;
  if (stone == EMPTY) {
    block.push(sq);
    points_count.push(sq);
    board[sq] |= MARKER;
    territory(sq - size);
    territory(sq - 1);
    territory(sq + size);
    territory(sq + 1);
  } else if (stone != MARKER) {
    points_side.push(stone);
  } if (!points_side.length) return [EMPTY, points_count.length];
  else if (points_side.every((element) => element == points_side[0]))
    return [points_side[0], points_count.length];
  else return [EMPTY, points_count.length];
}

// Calculate score for sides
function score() {
  let scorePosition = [0, 0, 0];
  for (let sq = 0; sq < size ** 2; sq++) {
    if (board[sq]) continue;
    let result = territory(sq);
    scorePosition[result[0]] += result[1];
    points_side = [];
    points_count = [];
  } restoreBoard();
  let prisoners = evaluate();
  if (prisoners > 0) scorePosition[BLACK] += prisoners;
  else if (prisoners < 0) scorePosition[WHITE] += Math.abs(prisoners);
  scorePosition[WHITE] += 7.5;
  return scorePosition;
}

// Evaluate position
function evaluate() {
  let eval = 0;
  let blackStones = 0;
  let whiteStones = 0;
  let blackLiberties = 0;
  let whiteLiberties = 0;
  for (let sq = 0; sq < size ** 2; sq++) {
    if (!board[sq] || board[sq] == OFFBOARD) continue;
    if (board[sq] == BLACK) blackStones += 1;//+ board.length / 2 * 5;
    if (board[sq] == WHITE) whiteStones += 1;//+ board.length / 2 * 5;
  } eval += (blackStones - whiteStones);
  return (side == BLACK) ? eval : -eval;
}

// Find biggest group to capture
function isAtari() {
  let bestAtari = [-1, -1];
  for (let sq = 0; sq < size ** 2; sq++) {
    count(sq, board[sq]);
    if (liberties.length == 1) {
      if (board[sq]-MARKER == 3-side && block.length > bestAtari[1])
        bestAtari = [liberties[0], block.length];
    };restoreBoard();
  };return bestAtari[0];
}

// Find fighting moves
function getUrgentMoves() {
  let urgent = [];
  for (let sq = 0; sq < size ** 2; sq++) {
    count(sq, board[sq]);
    if (liberties.length < 3) {
      if (board[sq]-MARKER == BLACK) for (let sq of liberties) urgent.push(sq);
      if (board[sq]-MARKER == WHITE) for (let sq of liberties) urgent.push(sq);
    };restoreBoard();
  };return urgent;
}

// Find best move
function search(depth) {
  if (!depth) return evaluate();
  let bestScore = -10000;
  for (let sq of getUrgentMoves()) {
    for (let offset of [1, -1, size, -size])
      if (board[sq+offset] == OFFBOARD && depth == 1) continue;
    if (sq == ko) continue;
    let oldBoard = JSON.stringify(board);
    let oldSide = side;
    let oldKo = ko;
    if (!setStone(sq, side, false)) continue;
    let eval = -search(depth-1);
    if (eval > bestScore) {
      bestScore = eval;
      bestMove = sq;
    } board = JSON.parse(oldBoard);
    side = oldSide;
    ko = oldKo;
  };return bestScore;
}

// Used to allow snapbacks
function inEye(sq, offset) {
  let count = 0;
  for (let dir of [1, -1, size, -size]) {
    if (board[sq+offset+dir] == side ||
      board[sq+offset+dir] == (3-side) ||
      board[sq+offset+dir] == OFFBOARD)
      count++;
  };if (count == 4) return 1;
  else return 0;
}

// Used to attach randomly
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  };return array;
}

// Play away
function tenuki() {
  const corners = [(4*size+4), (4*size+(size-5)), ((size-5)*size+4), ((size-5)*size+(size-5))];
  const sides = [((size-1)/2*size+3), (3*size+(size-1)/2), ((size-1)/2*size+(size-4)), ((size-4)*size+(size-1)/2)];
  for (let sq of corners) {
    if (board[sq] == EMPTY) {
      if (inEye(sq, 0)) break;
      else return sq;
    }
  };if (size > 11) {
    for (let sq of sides) if (board[sq] == EMPTY) {
      if (inEye(sq, 0)) break;
      else return sq;
    }
  };if (score()[EMPTY]) {
    let indexes = Array.from({length: size ** 2}, (_, i) => i);
    let shuffledIndexes = shuffle(indexes);
    for (let sq of shuffledIndexes) {
      if (board[sq] == (3-side)) {
        for (let offset of [1, -1, size, -size]) {
          if (board[sq+offset] == OFFBOARD ||
            board[sq+offset*2] == OFFBOARD ||
            board[sq+offset*3] == OFFBOARD) continue;
          else if (board[sq+offset] == EMPTY) {
            if (inEye(sq, offset)) continue;
            else { console.log("attach"); return sq+offset; }
          }
        }
      }
    }
  }
}

// Engine plays move
var attempts = 0;
function play(depth) {
  let eval = 0;
  let bestQuick = isAtari();
  if (bestQuick >= 0 && bestQuick != ko) bestMove = bestQuick;
  else {
    eval = search(depth);
    if (eval < 0) bestMove = tenuki();
  };let oldSide = side;
  if (!setStone(bestMove, side, false)) {
    if (attempts > 10) {
      side = 3 - side;
      updateScore();
      let empty = score()[EMPTY];
      if (empty == 0) {
        let finalScore = score();
        finalScore = finalScore[BLACK] - finalScore[WHITE];
        alert(((finalScore > 0) ? "Black": "White") + " wins by " + Math.abs(finalScore) + " points");
        canvas.removeEventListener("click", userInput);
      } else alert("Pass");
      return;
    };attempts++;
    play(depth-1);
  };drawBoard();
  updateScore();
  attempts = 0;
  let scorePosition = score();
}

// Main
initBoard();
drawBoard();
