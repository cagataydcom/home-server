const app = require("express").Router();
const fs = require("node:fs");
const multer = require("multer");

app.route("/").get((req) => req.res.render("upload_select")).post(multer({
    storage: multer.diskStorage({
        destination: (_r, _f, cb) => { let f = process.env["USERPROFILE"] + (process.env["OS"] == "Windows_NT" ? "\\Desktop\\Uploads" : "/Desktop/Uploads"); if (!fs.existsSync(f)) fs.mkdirSync(f); return cb(null, f) },
        filename: (_r, file, cb) => cb(null, file.originalname)
    })
}).array("files", 100), (req) => req.res.render("upload_done", { file_types: [...new Set(req.files.map(x => x.mimetype))].map(x => `${x} (${req.files.filter(y => y.mimetype === x).length})`), length: req.files.length }))

module.exports = app;