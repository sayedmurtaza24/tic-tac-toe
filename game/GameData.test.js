const GameData = require('./GameData');
const fs = require('fs');

const movesToVictory = [0, 1, 4, 2, 8];
describe('GameData works as expected', () => {
  let gameData;
  beforeEach(() => {
    gameData = new GameData();
  });
  test('new GameData generates ids for game, player x and player o', () => {
    expect(gameData.gameId).toBeTruthy();
    expect(gameData.playerX).toBeTruthy();
    expect(gameData.playerO).toBeTruthy();
  });
  test('turn promise resolves when a player makes a move', done => {
    const assertWaitFunc = jest.fn(() => { });

    gameData.waitForTurn().then(assertWaitFunc).then(() => {
      expect(assertWaitFunc).toBeCalledTimes(1);
      done();
    });

    expect(assertWaitFunc).toBeCalledTimes(0);

    gameData.state.registerMove(5);
  });
  test('replay promise resolves when a game resets', done => {
    const assertWaitFunc = jest.fn(() => { });

    gameData.waitForReplay().then(assertWaitFunc).then(() => {
      expect(assertWaitFunc).toBeCalledTimes(1);
      done();
    });

    expect(assertWaitFunc).toBeCalledTimes(0);

    movesToVictory.forEach(move => gameData.state.registerMove(move));

    gameData.state.resetTheBoard();
  });

  test('saves data to storage as json correctly', async () => {
    const gameId = gameData.gameId;
    await gameData.saveGameToStorage();
    const exists = fs.existsSync('./storage/' + gameId);

    expect(exists).toBe(true);

    const fileData = JSON.parse(fs.readFileSync('./storage/' + gameId, 'utf-8'));

    expect(gameData.state.asJSON()).toEqual(fileData.state);
    expect(gameData.playerX).toEqual(fileData.playerX);
    expect(gameData.playerO).toEqual(fileData.playerO);

    fs.unlinkSync('./storage/' + gameId);
  });

  test('loads a game data correctly from storage', async () => {
    const gameId = gameData.gameId;
    await gameData.saveGameToStorage();

    const newGameData = await GameData.loadGameFromStorage(gameId);

    expect(newGameData).toEqual(gameData);

    fs.unlinkSync('./storage/' + gameId);
  });
});