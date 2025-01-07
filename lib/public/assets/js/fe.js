const fe = {
    _: ".file-explorer",
    ws: null,
    toast: Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true }),
    files: {},
    lang: {},
    path: "",
    contextmenu: { isactive: false },
    dragzone: { isactive: false },
    dragDownload: { isactive: false },
    Settings: {},
    isReady: !1
};

/** TESTS */
window.addEventListener("resize", () => $(fe._).css({ "--height": `${window.innerHeight}px`, "--width": `${window.innerWidth}px` }));

window.addEventListener("load", () => {
    $(fe._).css({ "--height": `${window.innerHeight}px`, "--width": `${window.innerWidth}px` })

    // for cook animations
    $(`${fe._} [data-cookable=1]`).click((a, b = "cook") => { if (fe.Settings?.performance === "true") return; let c = a.currentTarget.classList; if (!c.contains(b)) { c.add(b); setTimeout(() => c.contains(b) ? c.remove(b) : !0, 600) } });
    ((a = `${fe._} .address `, b = "focus") => $(a).on(b + "in", "input", () => $(a).addClass(b)).on(b + "out", "input", () => $(a).removeClass(b)))();

    // God Knows...
    ((a, b) => b.forEach(c => c.addEventListener("mousedown", (d) => {
        let e = c.parentElement, f = e.nextElementSibling; if (!f) return; let g = e.offsetWidth, h = f.offsetWidth;
        function _tica(i) { let _a = i.clientX - d.clientX, _b = Math.max(50, g + _a), _c = Math.max(50, h - _a); if (_b + _c !== g + h) return; e.style.flex = `0 0 ${_b}px`; f.style.flex = `0 0 ${_c}px`; }
        function _stoptica() { $(document).off(a[0], _tica); $(document).off(a[1], _stoptica); }
        $(document).on(a[0], _tica); $(document).on(a[1], _stoptica);
    })))(["mousemove", "mouseup"], document.querySelectorAll(`${fe._} .main .size-controller`));

    function GetFiles(_) { _.stopPropagation(); fe.ws.send(JSON.stringify({ name: "GetFiles", path: _.currentTarget?.dataset?.url ?? _.currentTarget?.value })) };

    /** Top Header */
    $(`${fe._} div.top-header`).on("click", "a.wforurl", GetFiles).on("click", ".address a[data-url]", GetFiles).on("change", ".address input", GetFiles).on("click", "a.upload", () => ["open", "dragging"].forEach(a => $(`${fe._} .main`).toggleClass(a)));

    /** Side A */
    $(`${fe._} div.side.a .cont`).on("click", "a", GetFiles).on("click", "svg.arr", (_) => { _.stopPropagation(); let a = $(_.currentTarget).closest(".pp"), b = a.data("url"); if (b) { a.toggleClass("on"); fe.ws.send(JSON.stringify({ name: "GetFolders", path: b })) } });

    /** Side B */
    let contextRemoveAll = (a, b = ["folder", "file", "empty"]) => b.forEach(c => a.removeClass(c));
    function _WatchOpenedMenu() { if (fe.contextmenu.isactive) { $(`${fe._} .main .contextmenu`).removeClass("visible"); fe.contextmenu.isactive = false; $(window).off("click", _WatchOpenedMenu); } };
    $(`${fe._} .main .side.b`).on("click", "a[data-isfolder=true]", GetFiles).on("contextmenu", ".cont a:not(.skeleton)", (a) => {
        a.preventDefault(); fe.contextmenu.isactive = true;
        let b = $(`${fe._} .main .contextmenu`), c = a.currentTarget.dataset; b.addClass("visible"); b.css({ "top": a.clientY, "left": a.clientX });
        contextRemoveAll(b); if (c.isfolder === "true") { b.addClass("folder"); b.removeClass("file") } else { b.removeClass("folder"); b.addClass("file") };
        b.attr("data-query", JSON.stringify(c, null, 0)); $(window).on("click", _WatchOpenedMenu);
    }).on("contextmenu", ".cont", (a) => {
        if (a.target !== a.currentTarget) return; a.preventDefault(); fe.contextmenu.isactive = true;
        let b = $(`${fe._} .main .contextmenu`); b.addClass("visible"); b.css({ "top": a.clientY, "left": a.clientX });
        contextRemoveAll(b); b.addClass("empty"); $(window).on("click", _WatchOpenedMenu);
    }).on("click", ".contextmenu a[data-action]", (a) => {
        switch (a.currentTarget.dataset.action) {
            case "copy-path": navigator.clipboard.writeText(JSON.parse(a.currentTarget.parentElement.dataset.query).url); break;
            case "copy-page-path": navigator.clipboard.writeText(fe.path); break;
            case "createfolder":
                let b = $("<div>", { class: "new item", html: `<svg><use xlink:href="#svg-folder"></use></svg><input type="text" data-lang="contmenu.newfolder" data-lang-attr="value">` }), c = `${fe._} .main .side.b .cont`;
                $(c).append(b); let d = $(`${c} div.new input`); FileExplorer.setLang(); setTimeout(() => { d.focus(); d.select() }, 50);
                break;
            case "rename":


                break;
        }
    }).on("focusout", "div.new input", (a) => {
        let b = a.currentTarget.value;
        if (b.length > 0) fe.ws.send(JSON.stringify({ name: "PostCreateFolder", path: `${fe.path}/${a.currentTarget.value}` }));
        a.currentTarget.parentElement.remove(); fe.ws.send(JSON.stringify({ name: "GetFiles", path: fe.path }));
    }).on("change", ".dragzone input", (a) => { console.log(Array.from(a.currentTarget.files)); Array.from(a.currentTarget.files).forEach(async file => await FileExplorer.PostUploadFile(file)); });




    /** Tab */
    $("a[data-tab]").on("click", (a) => { let b = $(`div.tab[data-tab=${a.currentTarget.dataset.tab}]`)[0]; b.classList.contains("active") ? b.classList.remove("active") : b.classList.add("active") })
    $("div.tab").on("click", (a) => a.currentTarget === a.target ? a.currentTarget.classList.remove("active") : null).on("click", "a.close", (a) => a.delegateTarget.classList.remove("active"));

    /** Settings Input Change */
    $("div.tab[data-tab=settings]").on("change", "input", (a) => { let { name, value, checked } = a.currentTarget; if (name === "performance") value = String(checked); else if (name === "defPath" && value.length === 0) value = "/"; fe.ws.send(JSON.stringify({ name: "PostSettings", cname: name, value })) });

    function dragdrop() { }
    dragdrop.zone = $(`${fe._} div.side.b`);

    dragdrop.over = function (e) {
        e.preventDefault();
        if (!fe.dragzone.isactive && !fe.dragDownload.isactive) { fe.dragzone.isactive = true; e.currentTarget.parentElement.classList.add("dragging"); dragdrop.zone.on("dragleave", dragdrop.leave); }
    };

    dragdrop.leave = function (e) {
        console.log("Leaved");
        if (e.target === dragdrop.zone.find(".cont")[0]) return;
        if (fe.dragzone.isactive) { fe.dragzone.isactive = false; e.currentTarget.parentElement.classList.remove("dragging"); dragdrop.zone.off("dragleave", dragdrop.leave); }
    };

    dragdrop.drop = function (e) {
        e.preventDefault();
        if (fe.dragDownload.isactive) return;

        let p = e.currentTarget.parentElement.classList; p.replace("dragging", "uploading"); setTimeout(() => p.remove("uploading"), 600);
        dragdrop.zone.off("dragover", dragdrop.over); dragdrop.zone.off("dragleave", dragdrop.leave);

        if (fe.dragzone.isactive) {
            fe.dragzone.isactive = false;
            let files = e.originalEvent.dataTransfer.files;
            Array.from(files).forEach(async file => await FileExplorer.PostUploadFile(file));
            dragdrop.zone.on("dragover", dragdrop.over);
        }
    };
    dragdrop.zone.on("dragover", dragdrop.over);
    dragdrop.zone.on("drop", dragdrop.drop);

});

function CreateWebSocket(ws) {
    fe.ws = ws;

    ws.addEventListener("message", (e) => {
        var data = { name: "", value: null };
        try { data = JSON.parse(e.data); } catch { return console.error("Invalid JSON") }

        switch (data.name) {
            case "GetFiles":
                data.value = data.value.sort((a, b) => b.name - a.name);
                data.value = data.value.sort((a, b) => b.isDirectory - a.isDirectory);

                FileExplorer.GetFiles(data);
                FileExplorer.ListFiles(data.value);
                break;
            case "GetFolders": FileExplorer.ListFiles(data.value.sort((a, b) => b.name - a.name)); break;
            case "Settings": FileExplorer.SetSettings(data); break;
            case "UploadSuccess": ws.send(JSON.stringify({ name: "GetFiles", path: fe.path })); break;
            default: console.log(data); break;
        }
    });

    ws.addEventListener("close", (e) => {
        if (e.wasClean) fe.toast.fire({ icon: "warning", title: fe.lang.con_clo, timer: 3000 });
        else { fe.toast.fire({ icon: "error", title: fe.lang.con_los, timer: 5000 }); setTimeout(() => window.location.reload(), 5000); };
    });

    setTimeout(() => {
        if (ws.readyState === 0) {
            fe.toast.fire({ icon: "warning", title: fe.lang.con_try, timer: 2000 });
            let _waitConnection = () => { fe.toast.fire({ icon: "success", title: fe.lang.con_suc, timer: 800 }); return ws.removeEventListener("open", _waitConnection); }
            ws.addEventListener("open", _waitConnection);
        }
    }, 500);
};

function FileExplorer() { }

FileExplorer.GetFiles = function (data) {
    let top_header = $(`${fe._} .top-header`), list = $(`${fe._} .side.b .cont`), path = data.path.split("/").filter(_ => _ !== "");

    /** Path */
    fe.path = `/${path.join("/")}`;

    /** Back Button */
    if (path.length === 0) top_header.find(".goback").addClass("disabled");
    else if (path.length === 1) { let a = top_header.find(".goback"); a.removeClass("disabled"); a.attr("data-url", "/"); }
    else { let a = top_header.find(".goback"), b = [...path]; b.pop(); a.removeClass("disabled"); a.attr("data-url", `/${b.join("/")}`); }

    /** Refresh Button */
    top_header.find(".refresh").attr("data-url", fe.path);

    /** Address */
    let address = top_header.find(".address");
    address.html(`<a data-url="/"><span>~</span></a>` + [...path].map((a, b, c) => `<a data-url="/${c.slice(0, b + 1).join("/")}"><span>${a}</span></a>`).join(" ") + `<input type="text" value="${fe.path}">`);
    address.scrollLeft(address.prop("scrollWidth"));

    /** List */
    list.html("");
    for (let i = 0; i < data.value.length; i++) {
        let a = data.value[i], b = (c = (typeof allowedSVGFILESTYPES !== "undefined" && !a.isDirectory) ? allowedSVGFILESTYPES.find(_ => _ === String(a.name.split(".").at(-1)).toLowerCase()) : null) => `<svg><use xlink:href="#svg-${c ? "file-" + c : a.isDirectory ? "folder" : "file"}"></use></svg>`;
        list.append($("<a>", {
            ...(a.isDirectory ? {} : { href: "#", "data-mime": a.mimetype, ondragstart: "FileExplorer.DragStartDownloadURL(event)", ondragend: "FileExplorer.DragEndDownloadURL()" }),
            "title": a.name, "data-isfolder": a.isDirectory, "data-url": `${a.path === "/" ? "" : a.path}`, "html": `<div class="item">${b()}<span>${a.name}</span></div>`
        }));
    };
};

FileExplorer.ListFiles = function (data) {
    data.filter(_ => _.isDirectory).forEach(a => {
        a.path = a.path.split("/").filter(_ => _ !== "");
        let b = fe.files;

        for (let i = 0; i < a.path.length; i++) { let c = a.path[i], d = a.path; if (!b[c]) b[c] = { name: c, path: `/${d.slice(0, i + 1).join("/")}`, childs: {} }; b = b[c].childs; }
    });

    return FileExplorer.ShowListedFiles(fe.files);
};

FileExplorer.ShowListedFiles = function (data, depth = 1, column = $(`${fe._} .side.a .cont`)) {
    column.find(".skeleton").remove();
    for (let a in data) {
        let b = data[a], c = column.find(`a[data-url="${b.path}"]`);
        if (!c.length) { c = $("<a>", { "class": "pp", "data-url": b.path, "style": `--path:${depth}`, "html": `<div><svg class="arr"><use xlink:href="#svg-arrow-thin"></use></svg><svg><use xlink:href="#svg-folder"></use></svg><span>${b.name}</span></div>` }); column.append(c); }

        let d = c.find(".child-container");
        if (!d.length) { d = $("<div>", { class: "child-container" }); c.append(d); }

        if (Object.keys(b.childs).length) FileExplorer.ShowListedFiles(b.childs, depth + 1, d);
    }
};

FileExplorer.SetSettings = function (data) {
    fe.Settings = { ...fe.Settings, ...data.value };
    /** Custom Options */
    Object.entries(data.value).forEach(([a, b]) => { let c = $(`div.tab input[name=${a}]`)[0]; if (c) { if (c.type === "checkbox") c.checked = b === "true"; else c.value = b; } });
    /** Setting */
    let body = $("body"), isInPerf = fe.Settings.performance === "true";
    body[isInPerf ? "addClass" : "removeClass"]("performance");
    body.css("--trs", (isInPerf ? 0 : fe.Settings?.transition ?? "300") + "ms");
    body.css("--blr", isInPerf ? "2px" : "10px");

    /** Wait Until Settings Done! */
    if (!fe.isReady) {
        fe.isReady = !0; fe.ws.send(JSON.stringify({ name: "GetFiles", path: fe.Settings.defPath }));
        if (fe.Settings.defPath !== "/") fe.ws.send(JSON.stringify({ name: "GetFolders", path: "/" }));
    }
};

FileExplorer.DragStartDownloadURL = function (a) { fe.dragDownload.isactive = !0; let b = $(a.target); return a.dataTransfer.setData('DownloadURL', `${b.attr("data-mime")}:${b.attr("title")}:${location.origin + b.attr("data-url")}`); }
FileExplorer.DragEndDownloadURL = function () { return fe.dragDownload.isactive = !1; }

FileExplorer.PostUploadFile = async (file) => new Promise(res => {
    function sendChunk(file, offset = 0, path) {
        let chunkSize = Number(fe.Settings.chunkSize) * (1024 * 1024);
        let reader = new FileReader();

        let chunk = file.slice(offset, offset + chunkSize);
        reader.onload = function (_e) {
            let metadata = { fileName: file.name, lastChunk: offset + chunkSize >= file.size, name: "PostUpload", path: path + file.name };
            if (fe.ws.readyState === WebSocket.OPEN) {
                //TODO: Buradaki dosya gönderimini optimize et
            }

            offset += chunkSize;
            if (offset < file.size) sendChunk(file, offset, path);
            else return res(true);
        };

        reader.onerror = function (error) { console.error('File reading error', error); return res(false); };
        reader.readAsArrayBuffer(chunk);
    }
    sendChunk(file, 0, fe.path);
});

FileExplorer.setLang = function (selector = "[data-lang]", attr = ["lang", "lang-attr"]) {
    $(selector).map((i, a) => {
        let b = $(a), c = "", d = b.data(attr[0]), e = b.data(attr[1]);
        c = fe.lang[d] ?? d;
        if (e) { b.attr(e, c); b.removeAttr("data-" + attr[1]) } else b.html(c);
        b.removeAttr("data-" + attr[0]);
    });
};

$(document).ready(async () => {
    await (() => new Promise(async (res) => {
        let map = await (await fetch(`${location.origin}/lang/lang.map.json`)).json();
        let langs = navigator.languages ?? navigator.language ?? "tr";
        let priority = map.available.filter(_a => Array.isArray(langs) ? langs.find(_b => _a === _b) : langs === _a);
        if (!priority.length) priority.push("tr-TR");

        fe.lang = await (await fetch(`${location.origin}/lang/${priority[0]}.json`)).json();

        return res();
    }))();

    FileExplorer.setLang();

    /** WebSocket */
    setTimeout(() => CreateWebSocket(new WebSocket(`ws://${location.host}/ws/file`)), 1000);

    /** Tooltip */
    [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(a => new bootstrap.Tooltip(a));
});