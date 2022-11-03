const GamesManager = require('./GamesManager');

describe('GamesManager works properly', () => {
  test('create a gamedata and finds it back', () => {
    const gamesManager = new GamesManager();
    const newGame = gamesManager.startNewGame();
    const foundGame = gamesManager.findByGameID(newGame.gameId);

    expect(newGame).toEqual(foundGame);
  });
});