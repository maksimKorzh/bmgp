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

function setStone(board, square, stone) { return board.slice(0, square) + stone + board.slice(square + 1); }
function moveToSquare(x, y) { return y*(size+2)+ x; }

function Position(board, capture, moves, ko, komi) {
  return {
  "board": board,
  "capture": capture,
  "moves": moves,
  "ko": ko,
  "komi": komi
  }
}

function initBoard() {
  let empty = [
    ...Array(size+2)].map((_, i) => i === 0 ?
      ' '.repeat(size + 1) : i === size + 1 ?
        ' '.repeat(size + 2) : ' ' +
        '.'.repeat(size)).join('\n');
  return Position(empty, [0, 0], 0, null, komi=7.5);
}

function makeMove(position, square) {
  if (square == position.ko) return null;
  //# Are we trying to play in enemy's eye?
  //in_enemy_eye = is_eyeish(self.board, c) == 'x'
  let board = setStone(position.board, square, 'X');
//# Test for captures, and track ko
//capX = self.cap[0]
//singlecaps = []
//for d in neighbors(c):
//    if board[d] != 'x':
//        continue
//    # XXX: The following is an extremely naive and SLOW approach
//    # at things - to do it properly, we should maintain some per-group
//    # data structures tracking liberties.
//    fboard = floodfill(board, d)  # get a board with the adjecent group replaced by '#'
//    if contact(fboard, '.') is not None:
//        continue  # some liberties left
//    # no liberties left for this group, remove the stones!
//    capcount = fboard.count('#')
//    if capcount == 1:
//        singlecaps.append(d)
//    capX += capcount
//    board = fboard.replace('#', '.')  # capture the group
//# Set ko
//ko = singlecaps[0] if in_enemy_eye and len(singlecaps) == 1 else None
//# Test for suicide
//if contact(floodfill(board, c), '.') is None:
//    return None
//
//# Update

  board = board.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
  return Position(board, [0,0], position.moves+1, null, 7.5);
}

// MAIN
canvas.addEventListener('click', userInput);
function userInput(event) {
  let rect = canvas.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let col = Math.floor(mouseX / cell);
  let row = Math.floor(mouseY / cell);
  position = makeMove(position, moveToSquare(col, row));
  //if (board[sq]) return;
  //if (!setStone(sq, side, true)) return;
  drawBoard(position);
  //setTimeout(function() { play(2); }, 10);
}


let position = initBoard();
drawBoard(position);
