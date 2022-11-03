class GameData {
    constructor(playerX, playerO, state) {
        this.playerX = playerX;
        this.playerO = playerO;
        this.state = state;
        this.promise = new Promise(res => {
            this.resolve = res;
        })
        this.waitReplayPromise = new Promise(res => {
            this.resolveReplay = res;
        })
    }
    refreshTurn() {
        this.promise = new Promise(res => {
            this.resolve = res;
        })
    }
    refreshReplay() {
        this.waitReplayPromise = new Promise(res => {
            this.resolveReplay = res;
        })
    }
    toJson() {
        return {
            playerX: this.playerX,
            playerO: this.playerO,
            state: this.state,
        }
    }
}

module.exports = { GameData }