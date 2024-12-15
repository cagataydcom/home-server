const WebSocket = require("ws"), wss = new WebSocket.Server({ noServer: true }), fs = require("node:fs"), path = require("node:path");

const securePath = process.cwd() + "/lib/public";

wss.on("connection", (ws, request, socket, head) => ws.on("message", (raw) => {
    var data = {};
    try { data = JSON.parse(raw) } catch { socket.write('HTTP/1.1 400 Bad Request\r\n\r\n'); return socket.destroy(); }

    switch (data.name) {
        case "GetFiles":
        case "GetFolders":
            if (!data.path) return socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');

            let directoryBase = path.join(securePath),
                directory = path.join(directoryBase, path.normalize(data.path)),
                cleanPath = (_ = directory) => path.normalize(_).replace(directoryBase, "").replaceAll("//", "/").replaceAll("\\", "/");

            if (!directory.startsWith(directoryBase)) return ws.send(JSON.stringify({ name: "AccessDenied", value: cleanPath(data.path) }));
            if (!fs.existsSync(directory)) return ws.send(JSON.stringify({ name: "DirNotFound", value: cleanPath(data.path) }));

            let files = fs.readdirSync(directory, { encoding: "utf8", withFileTypes: true });
            files = files.map(a => { a.path = cleanPath(a.parentPath); a.isDirectory = a.isDirectory(); delete a.parentPath; return a; })
            if (data.name === "GetFolders") files = files.filter(a => a.isDirectory);

            ws.send(JSON.stringify({ name: data.name, value: files, path: cleanPath(data.path) }, null, 0));
            break;
        default: console.log(data); break;
    }

}))

module.exports = wss;