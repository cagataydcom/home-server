require("dotenv").config();

const express = require("express"), app = express();
app.use(express.static("./lib/public")).set("view engine", "ejs").set("views", "./lib/views/")
    .use("/gopc", require("./lib/routers/upload"))
    .use((req, res, next) => {
        try {
            let directory = req._parsedUrl.pathname.split("/").filter(x => x !== "");
            let folder = require("node:fs").readdirSync(`./lib/public/${directory.join("/")}`);

            let file = require("node:fs").readFileSync("./lib/private/folder.html", { "encoding": "utf8" });
            file = file.replace("// <!-- Directory -->", `const directory = ${JSON.stringify([directory, folder])};`);

            return res.send(file);
        } catch { return next() }
    }, (req, res, next) => res.sendStatus(404));

const server = app.listen(process.env.production === "dev" ? 8081 : 80, () => { });
server.on("upgrade", require("./lib/ws"));