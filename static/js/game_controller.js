const GameMode = Object.freeze({
    LOCAL: 1,
    NETWORK: 2,
    SPECTATE: 3,
});

function GameController() {
    // controllers
    const boardController = BoardController();
    let httpController;

    return {
        // general states
        boardState: Array(9).fill(null),
        currentPlayer: "X",
        moveNumber: 0,
        gameMode: GameMode.LOCAL,
        localGameHistoryStats: {
            xWinCount: 0,
            oWinCount: 0,
            drawCount: 0,
        },
        // network states
        playerRole: null,
        gameId: null,
        playerId: null,

        // methods
        initialize() {
            // check window url for game mode
            const params = new URLSearchParams(window.location.search);
            if (params.get("gameId") && params.get("playerId")) {
                // playing as a player
                this.gameMode = GameMode.NETWORK;
                this.gameId = params.get("gameId");
                this.playerId = params.get("playerId");

                // initialize httpController
                httpController = HttpController(this.gameId, this.playerId);

                this.syncGameStats();
            } else if (params.get("gameId") && !params.get("playerId")) {
                // watching as as spectator
                this.gameMode = GameMode.SPECTATE;
                this.gameId = params.get("gameId");
                // initialize httpController
                httpController = HttpController(this.gameId);

                boardController.setBoardStatus({ boardStatus: BoardStatus.SPECTATING })
                this.syncGameStats();
            }

            // handle tile clicks
            const tiles = document.querySelectorAll(".boardTile");
            for (let i = 0; i < tiles.length; i++) {
                tiles[i].addEventListener('click', () => this.onTileClick(i));
            }
            // handle replay button
            const replayButton = document.querySelector(".replayButton");
            if (this.gameMode != GameMode.SPECTATE) {
                replayButton.addEventListener("click", () => this.onReplay());
            } else {
                replayButton.classList.add("disabledButton");
            }

            // handle back button
            const backButton = document.querySelector(".goBackButton");
            backButton.addEventListener("click", () => window.location.href = "/");
        },
        async onReplay() {
            switch (this.gameMode) {
                case GameMode.NETWORK:
                    return await httpController.replay();
                case GameMode.LOCAL:
                    this.boardState = Array(9).fill(null);
                    this.currentPlayer = "X";
                    this.moveNumber = 0;
                    boardController.setBoardStatus({ boardStatus: null });
                    boardController.setCurrentPlayer(this.currentPlayer);
                    boardController.resetBoard();
                    break;
                default:
                    break;
            }
        },
        async onTileClick(tileIndex) {
            // check game mode
            switch (this.gameMode) {
                case GameMode.NETWORK:
                    const response = await httpController.postUpdate(tileIndex);
                    if (response == 200) {
                        await this.syncGameStats();
                    }
                    break;
                default:
                    // local
                    if (this.boardState[tileIndex]) return;

                    this.moveNumber++;
                    boardController.fillTile(tileIndex, this.currentPlayer);
                    this.boardState[tileIndex] = this.currentPlayer;
                    // change current player role
                    this.currentPlayer = this.currentPlayer == "X" ? "O" : "X";
                    boardController.setCurrentPlayer(this.currentPlayer);

                    const result = this.checkBoardForResults();
                    switch (result) {
                        case "X":
                            this.localGameHistoryStats.xWinCount++;
                            boardController.setBoardCounters(this.localGameHistoryStats);
                            boardController.setBoardStatus({ boardStatus: BoardStatus.ENDED });
                            break;
                        case "O":
                            this.localGameHistoryStats.oWinCount++;
                            boardController.setBoardCounters(this.localGameHistoryStats);
                            boardController.setBoardStatus({ boardStatus: BoardStatus.ENDED });
                            break;
                        case "draw":
                            this.localGameHistoryStats.drawCount++;
                            boardController.setBoardCounters(this.localGameHistoryStats);
                            boardController.setBoardStatus({ boardStatus: BoardStatus.ENDED });
                            break;
                        default:
                            break;
                    }
                    break;
            }
        },
        checkBoardForResults() {
            // winning scenarios
            let ws = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal win scenario
                [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertical win scenario
                [0, 4, 8], [6, 4, 2] // diagonal win scenario
            ]
            let winner, winner_tile;
            for (let i = 0; i < ws.length; i++) {
                if (this.boardState[ws[i][0]] &&
                    this.boardState[ws[i][0]] === this.boardState[ws[i][1]] &&
                    this.boardState[ws[i][1]] === this.boardState[ws[i][2]]) {
                    winner = this.boardState[ws[i][0]];
                    winner_tile = ws[i];
                    continue;
                }
            }
            if (winner) {
                boardController.highlightWinnerTiles({ winnerTileIndices: winner_tile });
                boardController.setBoardWinner({ winner });
                return winner;
            }
            else if (!winner && this.moveNumber == 9) {
                boardController.setBoardWinner({ winner });
                return "draw";
            }
            else return null;
        },
        async syncGameStats() {
            const gameState = await httpController.fetchGameState();
            if (gameState && this.gameMode == GameMode.NETWORK) {
                // current player
                this.currentPlayer = gameState.currentPlayer;
                boardController.setCurrentPlayer(this.currentPlayer);

                // player role
                this.playerRole = gameState.playerRole;

                // board state
                this.boardState = gameState.boardState;
                boardController.updateBoardState(this.boardState);

                // board counters
                boardController.setBoardCounters({
                    xWinCount: gameState.winCountX,
                    oWinCount: gameState.winCountO,
                    drawCount: gameState.draws,
                })

                // move number
                this.moveNumber = gameState.moveNumber;

                // check for win or draw
                const results = this.checkBoardForResults();

                // set board status
                let boardStatus = this.currentPlayer == this.playerRole ? BoardStatus.MOVING : BoardStatus.WAITING;
                if (results) {
                    // override boardStatus if there is a result
                    boardStatus = BoardStatus.ENDED;
                    // wait for any potential replay request
                    httpController.waitForReplay().then(async () => {
                        boardController.resetBoard();
                        await this.syncGameStats();
                    })
                };
                boardController.setBoardStatus({ boardStatus });

                if (boardStatus == BoardStatus.WAITING && !results) await this.waitForOtherPlayersMove()
            } else {
                // current player
                this.currentPlayer = gameState.currentPlayer;
                boardController.setCurrentPlayer(this.currentPlayer);

                // board state
                this.boardState = gameState.boardState;
                boardController.updateBoardState(this.boardState);

                // board counters
                boardController.setBoardCounters({
                    xWinCount: gameState.winCountX,
                    oWinCount: gameState.winCountO,
                    drawCount: gameState.draws,
                })

                // move number
                this.moveNumber = gameState.moveNumber;

                const result = await this.checkBoardForResults();
                if (result) {
                    httpController.waitForReplay().then(async () => {
                        boardController.resetBoard();
                        boardController.freezeBoard();
                        await this.syncGameStats();
                    })
                }

                await this.waitForOtherPlayersMove();
            }
        },
        async waitForOtherPlayersMove() {
            await httpController.waitForTurn();
            await this.syncGameStats();
        },
    }
}

GameController().initialize();
