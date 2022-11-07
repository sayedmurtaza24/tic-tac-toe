const BoardStatus = Object.freeze({
    WAITING: 1,
    MOVING: 2,
    ENDED: 3,
    SPECTATING: 4,
});

function BoardController() {
    // quick tile icon copy functions
    const cross = (animated = true) => {
        const crossTile = document.querySelector(".stats .cross").cloneNode(true);
        if (animated) crossTile.classList.add("animatedCross");
        return crossTile.outerHTML;
    };
    const circle = (animated = true) => {
        const circleTile = document.querySelector(".stats .circle").cloneNode(true);
        if (animated) circleTile.classList.add("animatedCircle");
        return circleTile.outerHTML;
    }
    const balance = () => document.querySelector(".stats .balance").outerHTML;

    // board
    const board = document.querySelector(".boardContainer");
    // board tiles
    const boardTiles = document.querySelectorAll(".boardTile");
    // next move
    const winnerLoserStats = document.querySelector(".controlsContainer .stats");
    // status show
    const serverStatus = document.querySelector(".serverStatus");

    return {
        // controller methods
        updateBoardState(newBoardState) {
            for (let i = 0; i < boardTiles.length; i++) {
                if (newBoardState[i] == "X" && boardTiles[i].innerHTML != cross()) boardTiles[i].innerHTML = cross();
                else if (newBoardState[i] == "O" && boardTiles[i].innerHTML != circle()) boardTiles[i].innerHTML = circle();
                else if (!newBoardState[i]) boardTiles[i].innerHTML = "";
            }
        },
        freezeBoard() {
            board.classList.add('notInteractive');
        },
        unfreezeBoard() {
            board.classList.remove("notInteractive");
        },
        resetBoard() {
            board.classList.remove("notInteractive");
            boardTiles.forEach(tile => {
                tile.classList = ["boardTile"];
                tile.innerHTML = "";
            });
        },
        setCurrentPlayer(newPlayer) {
            winnerLoserStats.innerHTML = (newPlayer == "X" ? cross(false) : circle(false)) + 'Turn';
        },
        setBoardStatus({ boardStatus = BoardStatus.WAITING }) {
            if (boardStatus == BoardStatus.WAITING) {
                this.freezeBoard();
                serverStatus.innerHTML = `Waiting for the other player to make a move...<span class="loading"></span>`;
            } else if (boardStatus == BoardStatus.MOVING) {
                this.unfreezeBoard();
                serverStatus.innerHTML = `Your turn now, make a move.`;
            } else if (boardStatus == BoardStatus.ENDED) {
                this.freezeBoard();
                serverStatus.innerHTML = `Game ended, click replay to start a new one.`
            } else if (boardStatus == BoardStatus.SPECTATING) {
                this.freezeBoard();
                serverStatus.innerHTML = `You're spectating, enjoy!`
            } else {
                this.unfreezeBoard();
                serverStatus.innerHTML = ``
            }
        },
        setBoardWinner({ winner }) {
            if (winner) {
                winnerLoserStats.innerHTML = (winner == "X" ? cross() : circle()) + "Won. 🎉";
            } else {
                winnerLoserStats.innerHTML = balance() + "A draw!"
            }
        },
        setBoardCounters({ xWinCount = 0, oWinCount = 0, drawCount = 0 }) {
            document.querySelector(".winCount_X span").innerHTML = xWinCount;
            document.querySelector(".winCount_O span").innerHTML = oWinCount;
            document.querySelector(".drawCount span").innerHTML = drawCount;
        },
        highlightWinnerTiles({ winnerTileIndices = [] }) {
            for (let t = 0; t < winnerTileIndices.length; t++) {
                boardTiles[winnerTileIndices[t]].classList.add('winnerTile');
            }
        },
        fillTile(tileIndex, player) {
            boardTiles[tileIndex].innerHTML = player == "X" ? cross() : circle();
            boardTiles[tileIndex].classList.add("notHoverable")
        }
    }
}