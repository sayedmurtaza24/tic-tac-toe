const http = require("http");
const fs = require("fs");

const { stateManager } = require("./state/state_manager");

const PORT = process.env.PORT || 3000;

const sendResponse = (response_object, response_status, response_json) => {
    return response_object
        .writeHead(response_status, { 'Content-Type': 'application/json' })
        .end(JSON.stringify(response_json));
}

const send400Response = (response_object) => response_object.writeHead(400).end("400 Bad Request.");

const getRequestBody = (request_object) => new Promise((resolve) => {
    let body = "";
    request_object.on("data", (dataChunk) => body += dataChunk).on("end", () => resolve(JSON.parse(body)));
})

function checkBoardForResults(boardState, moveNumber) {
    // winning scenarios
    let ws = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal win scenario
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertical win scenario
        [0, 4, 8], [6, 4, 2] // diagonal win scenario
    ]
    let winner;
    for (let i = 0; i < ws.length; i++) {
        if (boardState[ws[i][0]] &&
            boardState[ws[i][0]] === boardState[ws[i][1]] &&
            boardState[ws[i][1]] === boardState[ws[i][2]]) {
            winner = boardState[ws[i][0]];
            continue;
        }
    }
    if (winner) return winner;
    else if (!winner && moveNumber == 9) return "draw";
    else return null;
}

function requestListener(req, res) {
    // cut off the search params
    const routePath = req.url.split("?")[0];
    const params = new URLSearchParams(req.url.split("?")[1]);

    // log route-path/method with date/time
    console.log(`${(new Date()).toISOString()} => ${req.method} @ ${routePath}`);

    if (routePath === "/start" && req.method === "GET") {
        // create game data object
        const gameData = stateManager.createNewGameData();
        // respond with the created data
        sendResponse(res, 200, { playerX: gameData.playerX, playerO: gameData.playerO, gameId: gameData.gameId });
    } else if (routePath === "/getGameStats" && req.method === "GET") {
        // Check if asking for playing mode vs spectating mode
        if (params.get("gameId") && params.get("playerId")) {
            // handling play mode
            const gs = stateManager.getGameStates(params.get("gameId"));
            if (!gs) return send400Response(res);

            // figure out the player role and if not correct send 400 response
            let playerRole;
            if (gs.playerX == params.get("playerId")) playerRole = "X";
            else if (gs.playerO == params.get("playerId")) playerRole = "O";
            else return send400Response(res);

            let response = { playerRole, ...gs.state };

            sendResponse(res, 200, response);
        } else if (params.get("gameId") && !params.get("playerId")) {
            // handling spectate mode
            const gs = stateManager.getGameStates(params.get("gameId"));
            if (!gs) return send400Response(res);

            sendResponse(res, 200, gs.state);
        }
    }
    else if (routePath === "/postGameUpdate" && req.method == "POST") {
        getRequestBody(req).then((body) => {
            if (body["gameId"]) {
                // check the game id and fetch the game stats
                let gs = stateManager.getGameStates(body.gameId);
                if (!gs) return send400Response(res);

                // figure out the player role and if not correct send 400 response
                let playerRole;
                if (gs.playerX == body?.playerId) playerRole = "X";
                else if (gs.playerO == body?.playerId) playerRole = "O";
                else return send400Response(res);

                // check if correct player is sending the update
                if (gs.state.currentPlayer == playerRole) {
                    // change the game board state according to moveIndex
                    try {
                        gs.state.boardState[body.moveIndex] = playerRole;
                        // switch to the next role
                        gs.state.currentPlayer = gs.state.currentPlayer == "X" ? "O" : "X";
                        // save the last move 
                        gs.state.lastMove = body.moveIndex;
                        // increase moveNumber
                        gs.state.moveNumber++;
                        // check for winner
                        const result = checkBoardForResults(gs.state.boardState, gs.state.moveNumber);
                        if (result == "X") gs.state.winCountX++;
                        else if (result == "O") gs.state.winCountO++;
                        else if (result == "draw") gs.state.draws++;

                        gs.resolve();

                        stateManager.saveGameData();

                        return res.writeHead(200).end();
                    } catch (error) {
                        return res.writeHead(400).end();
                    }
                } else {
                    return res.writeHead(400).end();
                }
            }
        })
    } else if (routePath == "/waitForTurn" && req.method == "POST") {
        getRequestBody(req).then((body) => {
            if (body["gameId"] && body["playerId"]) {
                // check the game id and fetch the game stats
                let gs = stateManager.getGameStates(body.gameId);
                if (!gs) return res.writeHead(400).end()

                // figure out the player role and if not correct send 400 response
                let playerRole;
                if (gs.playerX == body?.playerId) playerRole = "X";
                else if (gs.playerO == body?.playerId) playerRole = "O";
                else return send400Response(res);

                if (playerRole == gs.state.currentPlayer) {
                    // No waiting
                    return res.writeHead(200).end();
                } else {
                    gs.promise.then(() => {
                        gs.refreshTurn();
                        res.writeHead(200).end();
                    });
                }
            } else if (body["gameId"] && !body["playerId"]) {
                // spectator watching

                // check the game id and fetch the game stats
                let gs = stateManager.getGameStates(body.gameId);
                if (!gs) return res.writeHead(400).end()

                // wait for turn to come
                gs.promise.then(() => {
                    // gs.refreshTurn();
                    res.writeHead(200).end();
                });
            }
        })
    } else if (routePath == "/waitForReplay" && req.method == "POST") {
        getRequestBody(req).then((body) => {
            if (body["gameId"]) {
                // check the game id and fetch the game stats
                let gs = stateManager.getGameStates(body.gameId);
                if (!gs) return res.writeHead(400).end()

                gs.waitReplayPromise.then(() => {
                    gs.refreshReplay();
                    res.writeHead(200).end();
                });
            }
        })
    } else if (routePath === "/replay" && req.method == "POST") {
        getRequestBody(req).then(body => {
            // check the game id and fetch the game stats
            let gs = stateManager.getGameStates(body.gameId);
            if (!gs) return res.writeHead(400).end()

            // figure out the player role to if it can replay the game
            if (gs.playerX != body?.playerId && gs.playerO != body?.playerId) return send400Response(res);

            // check the board for winner/loser/draw result
            const result = checkBoardForResults(gs.state.boardState, gs.state.moveNumber);
            if (!result) {
                // no results yet, can't replay
                return send400Response(res);
            }
            gs.state.boardState = Array(9).fill(null);
            // currentPlayer is already alternated so no changes
            // reset move number
            gs.state.moveNumber = 0;
            gs.resolveReplay();

            stateManager.saveGameData();

            return res.writeHead(200).end();
        })
    }
    else {
        // handle static files
        const route = routePath == "/" ? "/index.html" : routePath;
        fs.readFile(__dirname + "/static/" + route, function (err, data) {
            if (err) {
                res.writeHead(404);
                res.end("404 Not Found.");
                return;
            }
            res.writeHead(200);
            res.end(data);
        });
    }
}

http.createServer(requestListener).listen(PORT)
console.log("Server running on port " + PORT);
