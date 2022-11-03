const GamesManager = require("../../game/GamesManager");

module.exports = router => {
  const gameManager = GamesManager.getManager();

  const routeGuard = handler => (req, res) => {
    const gameData = gameManager.findByGameID(req.query.get("gameId"));
    if (!gameData) {
      return res.status(400);
    }
    req.gameData = gameData;
    req.playerRole = gameData.verifyAndGetRole(req.query.get("playerId"));
    handler(req, res);
  };

  router.post("/api/start", async (_, res) => {
    const { gameId, playerO, playerX } = gameManager.startNewGame();
    res.json({ gameId, playerO, playerX });
  });

  router.post("/api/replay", routeGuard(async (req, res) => {
    if (req.playerRole) {
      req.gameData.resetTheBoard();
      res.status(200);
    } else {
      res.status(403);
    }
  }));

  router.get("/api/stats", routeGuard(async (req, res) => {
    const stats = req.gameData.state.asJSON();
    if (req.playerRole) {
      res.json({ ...stats, playerRole: req.playerRole });
    } else {
      res.json(stats);
    }
  }));

  router.post("/api/move", routeGuard(async (req, res) => {
    if (!req.playerRole) {
      return res.json({ message: "Spectators are not able to move!" }, 403);
    }
    const move = req.body.move;
    if (!Number.isInteger(move)) {
      return res.json({ message: "No move index found!" }, 403);
    }
    req.gameData.registerMove(Number(move));
    res.status(200);
  }));

  router.get("/api/waitTurn", routeGuard(async (req, res) => {
    await req.gameData.waitForTurn();
    return res.status(200);
  }));

  router.get("/api/waitReplay", routeGuard(async (req, res) => {
    await req.gameData.waitForReplay();
    return res.status(200);
  }));
};
