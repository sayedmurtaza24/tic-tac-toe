const request = require("supertest");
const { app } = require("../../app");
const GameResult = require("../../game/GameResult");
const GamesManager = require("../../game/GamesManager");

const gameManager = GamesManager.getManager();

describe('game management routes', () => {
    let game;
    let gameData;

    beforeAll(async () => {
        const { body } = await request(app)
            .post('/api/start')
            .expect('Content-Type', /json/)
            .expect(200);
        game = body;
        gameData = gameManager.findByGameID(body.gameId);
    });

    test('should have started a new game gracefully', async () => {
        expect(game).toBeTruthy();
        expect(game.gameId).toBeTruthy();
        expect(game.playerX).toBeTruthy();
        expect(game.playerO).toBeTruthy();
    });

    test('should return game stats for give gameId (w/ or w/o playerId)', async () => {
        const gameStats = gameData.state.asJSON();

        const { body: withoutPlayerId } = await request(app)
            .get(`/api/stats?gameId=${game.gameId}`)
            .expect('Content-Type', /json/)
            .expect(200);

        const { body: withPlayerId } = await request(app)
            .get(`/api/stats?gameId=${game.gameId}&playerId=${game.playerX}`)
            .expect('Content-Type', /json/)
            .expect(200);

        expect(withoutPlayerId).toEqual(gameStats);
        expect(withPlayerId).toEqual({ ...gameStats, playerRole: 'X' });
    });

    test('should update game board state (register move) and change game result', async () => {
        const victoryMoves = [0, 1, 4, 2, 8];
        let player = 'X';
        for (let i = 0; i < victoryMoves.length; i++) {
            const move = victoryMoves[i];
            const playerId = game[`player${player}`];
            await request(app)
                .post(`/api/move?gameId=${game.gameId}&playerId=${playerId}`)
                .send({ move })
                .set('Content-Type', 'application/json')
                .expect(200)
            player = player === 'X' ? 'O' : 'X';
        }
        const { body } = await request(app)
            .get(`/api/stats?gameId=${game.gameId}&playerId=${game.playerX}`)
            .expect(200);
        expect(body.currentResult).toBe(GameResult.X_IS_WINNER);
        expect(body.boardState).toEqual(['X', 'O', 'O', null, 'X', null, null, null, 'X']);
        expect(body.winCountX).toBe(1);
    });

    test('should restart the game and reset the board', async () => {
        // since board already has a winner
        await request(app)
            .post(`/api/replay?gameId=${game.gameId}&playerId=${game.playerX}`)
            .expect(200);

        const { body } = await request(app)
            .get(`/api/stats?gameId=${game.gameId}&playerId=${game.playerX}`)
            .expect(200);

        expect(body.boardState).toEqual(new Array(9).fill(null));
        expect(body.currentResult).toBe(GameResult.PLAYING);
    });

});