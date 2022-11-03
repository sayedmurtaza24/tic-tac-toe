const fs = require("fs/promises");

const router = (() => {
  const routes = {
    GET: {},
    POST: {},
    STATIC_DIR: null,
  };
  return {
    get: (endpoint, callback) => {
      routes.GET[endpoint] = callback;
    },
    post: (endpoint, callback) => {
      routes.POST[endpoint] = callback;
    },
    static: dirPath => {
      routes.STATIC_DIR = dirPath;
    },
    handleRoute: (req, res) => {
      if (process.env.NODE_ENV !== 'test')
        console.log(`${req.method}: ${req.url} @ ${new Date().toLocaleTimeString()}`);

      const [urlPart] = req.url.split("?");
      const routeEndpoint = urlPart === "/index.html" ? "/" : urlPart;
      const routeCallback = routes[req.method]?.[routeEndpoint];

      if (routeCallback) return routeCallback(req, res);

      if (req.method === "GET" && routes.STATIC_DIR) {
        const filePath = (urlPart === "/" ? "/index.html" : urlPart).replace(/\.+/g, ".");
        return fs
          .readFile(`./${routes.STATIC_DIR}${filePath}`)
          .then(file => res.end(file))
          .catch(() => res.status(404));
      }

      res.status(404);
    },
  };
})();

module.exports = router;
