const _env = require("dotenv").config(), wss = new (require("ws").WebSocket.Server)({ noServer: true, maxPayload: 110 * 1024 * 1024 }), fs = require("node:fs"), path = require("node:path"), mime = require("mime-types");

const directoryBase = path.join(process.env.use_secure_path === "1" ? process.env.secure_path : process.cwd() + "/lib/public"), cleanPath = (a) => { let b = path.normalize(a).replace(directoryBase, "").replaceAll("//", "/").replaceAll("\\", "/"); return b.startsWith("/") ? b : "/" + b; };

wss.on("connection", (ws, request, socket, head) => {
    ws.send(JSON.stringify({ name: "Settings", value: _Cache("fe_Settings") }, null, 0));

    ws.on("message", (raw) => {
        var data = {};
        try { data = JSON.parse(raw) } catch { return socket.destroy(); }

        if (data?.path) {
            var directory = path.join(directoryBase, path.normalize(data.path));
            if (!directory.startsWith(directoryBase)) return ws.send(JSON.stringify({ name: data.name, value: "AccessDenied", path: cleanPath(data.path) }));
        }

        // GET
        if (data.name.startsWith("Get")) switch (data.name) {
            case "GetFiles":
            case "GetFolders":
                if (!data.path) return;
                if (!fs.existsSync(directory)) return ws.send(JSON.stringify({ name: data.name, value: "DirNotFound", path: cleanPath(data.path) }));
                let files = fs.readdirSync(directory, { encoding: "utf8", withFileTypes: true });
                files = files.map(a => ({ name: a.name, path: cleanPath(a.parentPath + "/" + a.name), isDirectory: a.isDirectory(), ...(a.isDirectory() ? {} : { mimetype: mime.lookup(a.name) }) }))
                if (data.name === "GetFolders") files = files.filter(a => a.isDirectory);
                ws.send(JSON.stringify({ name: data.name, value: files, path: cleanPath(data.path) }, null, 0));
                break;
            case "GetSettings":
                let Settings = _Cache("fe_Settings");
                ws.send(JSON.stringify({ name: "Settings", value: Settings }, null, 0));
                break;
            default: console.log(data); break;
        } else if (data.name.startsWith("Post")) switch (data.name) {
            case "PostSettings":
                let Settings = _Cache("fe_Settings");
                if (data.cname) { Settings[data.cname] = data.value; _Cache.write("fe_Settings", Settings) };
                ws.send(JSON.stringify({ name: "Settings", value: Settings }, null, 0));
                break;
            case "PostUpload":
                if (!data.path) return;
                if (!fs.existsSync(directory)) fs.writeFileSync(directory, "");
                fs.appendFile(directory, Buffer.from(data.chunk, "base64"), (err) => {
                    if (err) return ws.send(JSON.stringify({ name: data.name, value: "Error", message: err }))
                    else if (data.lastChunk) ws.send(JSON.stringify({ name: data.name, value: "Success", path: data.path + data.fileName }));
                });
                break;
            case "PostCreateFolder":
                if (!data.path) return;
                if (fs.existsSync(directory)) return ws.send(JSON.stringify({ name: data.name, value: "DirectoryAlreadyHas" }));
                else { fs.mkdirSync(directory); return ws.send(JSON.stringify({ name: data.name, value: "DirectoryCreated" })) };
                break;
            case "PostRenameFolder":
                if (!data.path) return;
                else if (!fs.existsSync(directory)) return ws.send(JSON.stringify({ name: data.name, value: "DirectoryNotFound" }));

                var newdirectory = path.join(directoryBase, path.normalize(data.newpath));
                if (!newdirectory.startsWith(directoryBase)) return ws.send(JSON.stringify({ name: data.name, value: "AccessDenied", path: cleanPath(data.newpath) }));

                return fs.rename(directory, newdirectory, (err) => {
                    if (err) return ws.send(JSON.stringify({ name: data.name, value: "Error", message: err }))
                    else ws.send(JSON.stringify({ name: data.name, value: "Success", path: [directory, newdirectory] }));
                });
                break;
            default: console.log(data); break;
        }
    })
});

module.exports = wss;

function _Cache(file) {
    if (!fs.existsSync("./.cache")) fs.mkdirSync("./.cache");
    if (!fs.existsSync(`./.cache/${file}.json`)) { fs.writeFileSync(`./.cache/${file}.json`, JSON.stringify({}, null, 0)); return {} } else return JSON.parse(fs.readFileSync(`./.cache/${file}.json`, { encoding: "utf8" }));
}
_Cache.write = function (file, data) { data = { ..._Cache(file), ...data }; fs.writeFileSync(`./.cache/${file}.json`, JSON.stringify(data, null, 0)) }
