const WebSocket = require("ws"), wss = new WebSocket.Server({ noServer: true }), fs = require("node:fs"), path = require("node:path");

const securePath = process.cwd() + "/lib/public";

wss.on("connection", (ws, request, socket, head) => {
    ws.send(JSON.stringify({ name: "Settings", value: _Cache("Settings") }, null, 0));

    ws.on("message", (raw) => {
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
                files = files.map(a => { a.isDirectory = a.isDirectory(); a.path = cleanPath(a.parentPath + "/" + a.name); delete a.parentPath; return a; })
                if (data.name === "GetFolders") files = files.filter(a => a.isDirectory);

                ws.send(JSON.stringify({ name: data.name, value: files, path: cleanPath(data.path) }, null, 0));
                break;
            case "Settings":
                let Settings = _Cache("Settings");
                if (data.cname) { Settings[data.cname] = data.value; _Cache.write("Settings", Settings) };
                ws.send(JSON.stringify({ name: "Settings", value: Settings }, null, 0));
                break;
            default: console.log(data); break;
        }

    })
})

module.exports = wss;

function _Cache(file) {
    if (!fs.existsSync("./.cache")) fs.mkdirSync("./.cache");
    if (!fs.existsSync(`./.cache/${file}.json`)) { fs.writeFileSync(`./.cache/${file}.json`, JSON.stringify({}, null, 0)); return {} } else return JSON.parse(fs.readFileSync(`./.cache/${file}.json`, { encoding: "utf8" }));
}
_Cache.write = function (file, data) { data = { ..._Cache(file), ...data }; fs.writeFileSync(`./.cache/${file}.json`, JSON.stringify(data, null, 0)) }
