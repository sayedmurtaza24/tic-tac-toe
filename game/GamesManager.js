const GameData = require('./GameData');

let gameManager;

module.exports = class GamesManager {
  #gameDataList = [];
  static getManager() {
    if (!gameManager) {
      gameManager = new GamesManager();
    }
    return gameManager;
  }
  startNewGame() {
    const gameData = new GameData();
    this.#gameDataList.push(gameData);
    return gameData;
  }
  findByGameID(gameId) {
    return this.#gameDataList.find(gameData => gameData.gameId === gameId);
  }
}