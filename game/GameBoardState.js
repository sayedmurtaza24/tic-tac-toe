const GameResult = require("./GameResult");

module.exports = class GameBoardState {
  #boardSize;
  #onMove = () => { };
  #onReset = () => { };

  boardState;
  currentResult = GameResult.PLAYING;
  winCountX = 0;
  winCountO = 0;
  draws = 0;
  currentPlayer = 'X';
  constructor({ initialValue, boardSize = 3 }) {
    this.#boardSize = boardSize;
    this.boardState = Array(boardSize * boardSize).fill(null);

    if (initialValue) {
      this.boardState = initialValue.boardState;
      this.currentResult = initialValue.currentResult;
      this.currentPlayer = initialValue.currentPlayer;
      this.winCountX = initialValue.winCountX;
      this.winCountO = initialValue.winCountO;
      this.draws = initialValue.draws;
    }
  };
  setOnMoveListener(listener) {
    this.#onMove = listener;
    listener();
  };
  setOnResetListener(listener) {
    this.#onReset = listener;
    listener();
  }
  getCurrentStepNumber() {
    return this.boardState.reduce((acc, curr) => curr ? acc + 1 : acc, 0);
  }
  registerMove(boardIndex) {
    if (!Number.isInteger(boardIndex)
      || boardIndex > this.boardState.length - 1
      || this.boardState[boardIndex] !== null
      || !this.currentResult === GameResult.PLAYING) {
      return;
    }

    this.boardState[boardIndex] = this.currentPlayer;
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

    this.checkForWinner();

    this.#onMove();
  };
  resetTheBoard() {
    if (this.currentResult === GameResult.PLAYING) return;
    // if the numbers of moves made is an odd number it means that the starting player
    // was the same as current player before resetting so we just flip it once more to
    // get the next starting player...
    this.currentPlayer =
      this.getCurrentStepNumber() % 2 === 0
        ? (this.currentPlayer === 'X' ? 'O' : 'X')
        : this.currentPlayer
    this.boardState = Array(this.#boardSize * this.#boardSize).fill(null);
    this.currentResult = GameResult.PLAYING;

    this.#onReset();
  };
  checkForWinner() {
    // to store the winner
    let winner = null;
    // to get number of moves made
    const filledTileCount = this.getCurrentStepNumber();
    // minimum number of moves before a game can have a result;
    const minimumMovesBeforeWin = (this.#boardSize * 2) - 1;
    if (filledTileCount >= minimumMovesBeforeWin) {
      // looping through 0 to boardsize to get every row and column for that number
      // so we can check who is winning at this point
      // also use the loop to populate the diagonal possibilties of winning...
      const diagonal1 = [], diagonal2 = [];
      for (let i = 0; i < this.#boardSize; i++) {
        // getting rows and columns... some calculation going on here
        const row = this.boardState.slice(this.#boardSize * i, this.#boardSize * i + this.#boardSize);
        const column = this.boardState.reduce((acc, curr, j) => {
          return j % this.#boardSize === i ? acc.concat(curr) : acc
        }, []);

        diagonal1.push(this.boardState[i * this.#boardSize + i]);
        diagonal2.push(this.boardState[(this.#boardSize - 1) * (i + 1)]);

        if (row.every(i => i === 'X') || row.every(i => i === 'O')) {
          winner = row[0];
          break;
        }
        if (column.every(i => i === 'X') || column.every(i => i === 'O')) {
          winner = column[0];
          break;
        }
      }
      if (diagonal1.every(item => item === 'X') || diagonal1.every(item => item === 'O')) {
        winner = diagonal1[0];
      } else if (diagonal2.every(item => item === 'X') || diagonal2.every(item => item === 'O')) {
        winner = diagonal2[0];
      }
    }
    if (!winner && filledTileCount === this.boardState.length) {
      this.draws++;
      this.currentResult = GameResult.IS_A_DRAW;
    } else if (winner === 'X') {
      this.winCountX++;
      this.currentResult = GameResult.X_IS_WINNER;
    } else if (winner === 'O') {
      this.winCountO++;
      this.currentResult = GameResult.O_IS_WINNER;
    }
  };
  asJSON() {
    return {
      boardState: this.boardState,
      currentPlayer: this.currentPlayer,
      winCountX: this.winCountX,
      winCountO: this.winCountO,
      draws: this.draws,
      currentResult: this.currentResult,
    }
  }
  static fromJSON(boardSize, json) {
    return new GameBoardState({ initialValue: json, boardSize });
  }
}