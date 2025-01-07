const fs = require("node:fs"), router = _ => require(`./routers/${_}.js`);

module.exports = function upgrade(request, socket, head) {
    let name = String(request.url).toLowerCase().replace("/ws/", "").replaceAll("/", "");

    if (fs.existsSync(__dirname + `/routers/${name}.js`)) { let file = router(name); return file.handleUpgrade(request, socket, head, (ws) => file.emit("connection", ws, request, socket, head)); }
    else { socket.write("HTTP/1.1 404 Not Found"); return socket.destroy(); }
}