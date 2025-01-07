const express = require("express"), app = express(), http = require("node:http"), _env = require("dotenv").config();

app.use(express.static("./lib/public")).set("view engine", "ejs").set("views", "./lib/views/").get("/", (req) => req.res.render("file-explorer")).use((req) => req.res.sendStatus(404));

const options = { ...(process.env.production !== "dev" ? { key: fs.readFileSync("./lib/key.pem"), cert: fs.readFileSync("./lib/cert.pem") } : {}) },
    server = http.createServer(options, app).listen(process.env.production !== "dev" ? 443 : 80);

server.on("upgrade", require("./lib/ws"));

const path = require("node:path"), electron = require("electron/main");
let mainWindow, tray;

electron.app.on("ready", () => {
    mainWindow = new electron.BrowserWindow({ autoHideMenuBar: true, frame: true, icon: path.join(__dirname, "/lib/public/assets/img/logo.png"), titleBarStyle: "hiddenInset", title: "Dosya Gezgini", height: 600, webPreferences: { nodeIntegration: false, contextIsolation: true }, width: 1024 });
    mainWindow.loadURL(`http://localhost:${process.env.production !== "dev" ? 443 : 80}`);
    mainWindow.on("close", e => { electron.app.isQuiting ? null : e.preventDefault(); mainWindow.hide(); electron.app.hidden = true; });

    tray = new electron.Tray(path.join(__dirname, "/lib/public/favicon.ico"));
    tray.addListener("click", () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show());
    tray.setContextMenu(electron.Menu.buildFromTemplate([{ label: "Çıkış Yap", click: () => { electron.app.isQuiting = true; electron.app.quit() } }]))
    tray.setToolTip("Dosya Gezgini");
});

electron.app.on('window-all-closed', () => { if (process.platform !== 'darwin') { electron.app.quit() } });