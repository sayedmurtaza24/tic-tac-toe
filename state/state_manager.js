const { GameData } = require("../game_data");
const { StorageManager } = require("./storage_manager");

function StateManager() {
    const storageManager = StorageManager();

    return {
        gameStates: storageManager.load(),
        getGameStates(gameId) {
            return this.gameStates[gameId];
        },
        saveGameData() {
            storageManager.save(this.gameStates);
        },
        createNewGameData() {
            const gameId = "g" + Date.now(); // random id for the game
            const playerX = "px" + Date.now(); // random id for the player
            const playerO = "po" + Date.now(); // random id for the player

            const data = new GameData(playerX, playerO, {
                boardState: Array(9).fill(null),
                winCountX: 0,
                winCountO: 0,
                draws: 0,
                currentPlayer: "X",
                moveNumber: 0,
            })

            this.gameStates[gameId] = data;

            storageManager.save(this.gameStates);

            return { ...data, gameId };
        }
    }
}

const stateManager = StateManager();

module.exports = { stateManager };