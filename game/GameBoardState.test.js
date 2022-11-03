const GameBoardState = require('./GameBoardState');
const GameResult = require('./GameResult');

const movesToVictory = [0, 1, 4, 2, 8];
describe('GameBoardState works as expected', () => {
  const movesToDraw = [0, 4, 1, 2, 6, 3, 5, 7, 8];

  const horizontalWinMoves = [0, 3, 1, 4, 2];
  const verticalWinMoves = [0, 1, 3, 4, 6];

  let gameBoardState;
  beforeEach(() => {
    gameBoardState = new GameBoardState({ boardSize: 3 });
  });

  test('registers moves correctly', () => {
    gameBoardState.registerMove(4);

    expect(gameBoardState.boardState[4]).toBe('X');
  });

  test('ignore moves when already filled', () => {
    gameBoardState.registerMove(4);
    gameBoardState.registerMove(4);

    expect(gameBoardState.boardState[4]).toBe('X');
    expect(gameBoardState.currentPlayer).toBe('O');
  });

  test('registers multiple moves correctly', () => {
    gameBoardState.registerMove(4);
    gameBoardState.registerMove(2);
    gameBoardState.registerMove(6);

    expect(gameBoardState.boardState).toEqual([null, null, 'O', null, 'X', null, 'X', null, null]);
  });

  test('flips currentPlayer correctly', () => {
    gameBoardState.registerMove(4);

    expect(gameBoardState.currentPlayer).toBe('O');
  });

  test('determines winner diagonally correctly', () => {
    movesToVictory.forEach(move => gameBoardState.registerMove(move));

    expect(gameBoardState.currentResult).toBe(GameResult.X_IS_WINNER);
    expect(gameBoardState.winCountX).toBe(1);
  });

  test('determines winner horizontally correctly', () => {
    horizontalWinMoves.forEach(move => gameBoardState.registerMove(move));

    expect(gameBoardState.currentResult).toBe(GameResult.X_IS_WINNER);
    expect(gameBoardState.winCountX).toBe(1);
  });

  test('determines winner vertically correctly', () => {
    verticalWinMoves.forEach(move => gameBoardState.registerMove(move));

    expect(gameBoardState.currentResult).toBe(GameResult.X_IS_WINNER);
    expect(gameBoardState.winCountX).toBe(1);
  });

  test('determines draw correctly', () => {
    movesToDraw.forEach(move => gameBoardState.registerMove(move));

    expect(gameBoardState.currentResult).toBe(GameResult.IS_A_DRAW);
    expect(gameBoardState.draws).toBe(1);
  });

  test('playing, resetting board, flipping next starter works correctly after a result', () => {
    movesToVictory.forEach(move => gameBoardState.registerMove(move));

    expect(gameBoardState.currentResult).toBe(GameResult.X_IS_WINNER);
    expect(gameBoardState.winCountX).toBe(1);

    gameBoardState.resetTheBoard();

    expect(gameBoardState.currentPlayer).toBe('O');

    movesToVictory.forEach(move => gameBoardState.registerMove(move));

    expect(gameBoardState.currentResult).toBe(GameResult.O_IS_WINNER);
    expect(gameBoardState.winCountX).toBe(1);
    expect(gameBoardState.winCountO).toBe(1);

    gameBoardState.resetTheBoard();

    expect(gameBoardState.currentPlayer).toBe('X');

    movesToDraw.forEach(move => gameBoardState.registerMove(move));

    expect(gameBoardState.currentResult).toBe(GameResult.IS_A_DRAW);
    expect(gameBoardState.winCountX).toBe(1);
    expect(gameBoardState.winCountO).toBe(1);
    expect(gameBoardState.draws).toBe(1);
  });

  test('fires onMove everytime and on start', () => {
    const listener = jest.fn(() => { });

    gameBoardState.setOnMoveListener(listener);
    gameBoardState.registerMove(3);

    expect(listener).toBeCalledTimes(2);

    gameBoardState.registerMove(3);

    expect(listener).toBeCalledTimes(2);
  });

  test('fires onReset on every reset and on start', () => {
    const listener = jest.fn(() => { });

    gameBoardState.setOnResetListener(listener);

    expect(listener).toBeCalledTimes(1);

    movesToVictory.forEach(move => gameBoardState.registerMove(move));
    gameBoardState.resetTheBoard();

    expect(listener).toBeCalledTimes(2);

    movesToVictory.forEach(move => gameBoardState.registerMove(move));
    gameBoardState.resetTheBoard();

    expect(listener).toBeCalledTimes(3);
  });

  test('loading from json (object) works as expected', () => {
    const json = {
      boardState: ['X', 'X', null, 'O', null, null, 'X', null, 'O'],
      currentPlayer: 'O',
      currentResult: GameResult.PLAYING,
      winCountX: 1,
      winCountO: 1,
      draws: 2
    };
    const gameBoardStateFromJson = GameBoardState.fromJSON(3, json);

    expect(gameBoardStateFromJson.boardState).toEqual(json.boardState);
    expect(gameBoardStateFromJson.currentPlayer).toBe(json.currentPlayer);
    expect(gameBoardStateFromJson.currentResult).toBe(json.currentResult);
    expect(gameBoardStateFromJson.winCountX).toBe(json.winCountX);
    expect(gameBoardStateFromJson.winCountO).toBe(json.winCountO);
    expect(gameBoardStateFromJson.draws).toBe(json.draws);
  });

});