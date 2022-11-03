const gameRoutes = require("./game");
const router = require("./router");

const requestListener = router => (req, res) => {
  let body = "";
  req.on("data", chunk => (body += chunk));
  req.query = new URLSearchParams(req.url.split("?")?.[1]);
  res.status = statusCode => res.writeHead(statusCode).end();
  res.json = (content, statusCode = 200) =>
    res
      .writeHead(statusCode, {
        "Content-Type": "application/json"
      })
      .end(JSON.stringify(content));

  req.on("end", () => {
    if (body) req.body = JSON.parse(body);
    router.handleRoute(req, res);
  });
};

router.static("static");
gameRoutes(router);

module.exports = requestListener(router);
