const fs = require("fs");
const { GameData } = require("../game_data");

// just a dummy storage using json
function StorageManager() {
    return {
        save(gameStates) {
            let simplified = Object.create(null);
            for (const gameId in gameStates) {
                simplified[gameId] = gameStates[gameId].toJson();
            }
            fs.writeFileSync('state/storage.json', JSON.stringify(simplified), { encoding: "utf-8" });
        },
        load() {
            const storage = fs.readFileSync('state/storage.json', { encoding: "utf-8" })
            try {
                let gameStates = Object.create(null);
                const json = JSON.parse(storage);
                for (const game in json) {
                    gameStates[game] = new GameData(json[game].playerX, json[game].playerO, json[game].state);
                }
                return gameStates;
            } catch (error) {
                return Object.create(null);
            }
        }
    }
}

module.exports = { StorageManager }