const fs = require("fs/promises");
const GameBoardState = require("./GameBoardState");
const crypto = require("crypto");
// to make board size dynamic,,, all the logic will also be dynamic.
const BOARD_SIZE = 3;

module.exports = class GameData {
  #turn = { resolver: () => {} };
  #replay = { resolver: () => {} };
  playerX;
  playerO;
  gameId;
  state;
  constructor(gameId, { playerX, playerO, state } = {}) {
    this.gameId = gameId;
    this.playerX = playerX;
    this.playerO = playerO;
    this.state = state;

    this.gameId ??= "game-" + crypto.randomUUID();
    this.playerX ??= "player-" + crypto.randomUUID();
    this.playerO ??= "player-" + crypto.randomUUID();
    this.state ??= new GameBoardState({ boardSize: BOARD_SIZE });
    this.state.setOnMoveListener(() => {
      this.#turn.resolver();
      this.#turn.promise = new Promise(res => {
        this.#turn.resolver = res;
      });
    });
    this.state.setOnResetListener(() => {
      this.#replay.resolver();
      this.#replay.promise = new Promise(res => {
        this.#replay.resolver = res;
      });
    });
  }
  verifyAndGetRole(playerId) {
    if (playerId === this.playerX) return "X";
    else if (playerId === this.playerO) return "O";
    else return null;
  }
  async waitForTurn() {
    return await this.#turn.promise;
  }
  async waitForReplay() {
    return await this.#replay.promise;
  }
  registerMove(boardIndex) {
    this.state.registerMove(boardIndex);
  }
  resetTheBoard() {
    this.state.resetTheBoard();
  }
  async saveGameToStorage() {
    await fs.writeFile(
      `./storage/${this.gameId}`,
      JSON.stringify({
        playerX: this.playerX,
        playerO: this.playerO,
        state: this.state.asJSON(),
      })
    );
  }
  static async loadGameFromStorage(gameId) {
    const game = await fs.readFile(`./storage/${gameId}`, "utf-8");
    const json = JSON.parse(game);
    return new GameData(gameId, {
      playerX: json.playerX,
      playerO: json.playerO,
      state: GameBoardState.fromJSON(BOARD_SIZE, json.state),
    });
  }
};
