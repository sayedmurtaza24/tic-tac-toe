const http = require("http");
const requestListener = require('./routes');

const PORT = 3000 || process.env.PORT;

const app = http.createServer(requestListener);

if (!module.parent) {
    app.listen(PORT);
    console.log(`server started on port: ${PORT}`);
}

module.exports = { app };