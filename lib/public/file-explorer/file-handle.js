/** TESTS */
window.addEventListener("resize", () => $(".file-explorer").css({ "--height": `${window.innerHeight}px`, "--width": `${window.innerWidth}px` }));

const fe = {
    _: ".file-explorer",
    ws: new WebSocket("ws://localhost/ws/file"),
    toast: Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true }),
    files: {},
    lang: {
        name: "Dosya Yöneticisi",
        con_try: "Bağlantı Deneniyor...",
        con_suc: "Bağlantı Başarılı.",
        con_los: "Bağlantı Kesildi. Tekrar Denenecek...",
        con_clo: "Bağlantı Sonlandırıldı."
    },
    path: "",
    contextmenu: { isactive: false },
    dragzone: { isactive: false },
    Settings: {},
    isReady: !1
}

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

    function GetFiles(_) { _.stopPropagation(); _ = $(_.currentTarget); fe.ws.send(JSON.stringify({ name: "GetFiles", path: _.data("url") ?? _.val() })) };

    /** Top Header */
    $(`${fe._} div.top-header`).on("click", "a.wforurl", GetFiles);

    /** Side A */
    $(`${fe._} div.side.a .cont`).on("click", "a", GetFiles).on("click", "svg.arr", (_) => { _.stopPropagation(); let a = $(_.currentTarget).closest(".pp"), b = a.data("url"); if (b) { a.toggleClass("on"); fe.ws.send(JSON.stringify({ name: "GetFolders", path: b })) } });

    /** Side B */
    $(`${fe._} .main .side.b`).on("click", "a[data-isfolder=true]", GetFiles)
        .on("click", ".contextmenu a[data-action=copy-path]", (_) => navigator.clipboard.writeText(JSON.parse(_.delegateTarget.dataset.query).url))
        .on("contextmenu", ".cont a:not(.skeleton)", (a) => {
            a.preventDefault(); fe.contextmenu.isactive = true;
            let b = $(`${fe._} .main .contextmenu`), c = a.currentTarget.dataset; b.addClass("visible"); b.css({ "top": a.clientY, "left": a.clientX });

            if (c.isfolder === "true") { b.addClass("folder"); b.removeClass("file") } else { b.removeClass("folder"); b.addClass("file") };
            b.attr("data-query", JSON.stringify(c, null, 0));

            function _WatchOpenedMenu() { if (fe.contextmenu.isactive) { $(`${fe._} .main .contextmenu`).removeClass("visible"); fe.contextmenu.isactive = false; $(window).off("click", _WatchOpenedMenu); } }
            $(window).on("click", _WatchOpenedMenu);
        });

    /** Tab */
    $("a[data-tab]").on("click", (a) => { let b = $(`div.tab[data-tab=${a.currentTarget.dataset.tab}]`)[0]; b.classList.contains("active") ? b.classList.remove("active") : b.classList.add("active") })
    $("div.tab").on("click", (a) => a.currentTarget === a.target ? a.currentTarget.classList.remove("active") : null).on("click", "a.close", (a) => a.delegateTarget.classList.remove("active"));

    /** Settings Input Change */
    $("div.tab[data-tab=settings]").on("change", "input", (a) => { let { name, value, checked } = a.currentTarget; if (name === "performance") value = String(checked); else if (name === "defPath" && value.length === 0) value = "/"; fe.ws.send(JSON.stringify({ name: "Settings", cname: name, value })) });

    function dragdrop() { }
    dragdrop.zone = $(`${fe._} div.side.b`);

    dragdrop.over = function (e) {
        e.preventDefault();
        if (!fe.dragzone.isactive) { fe.dragzone.isactive = true; e.currentTarget.parentElement.classList.add("dragging"); dragdrop.zone.on("dragleave", dragdrop.leave); }
    };

    dragdrop.leave = function (e) {
        if (e.target === dragdrop.zone.querySelector(".cont")) return;
        if (fe.dragzone.isactive) { fe.dragzone.isactive = false; e.currentTarget.parentElement.classList.remove("dragging"); dragdrop.zone.off("dragleave", dragdrop.leave); }
    };

    dragdrop.drop = function (e) {
        e.preventDefault();
        let p = e.currentTarget.parentElement.classList; p.replace("dragging", "uploading"); setTimeout(() => p.remove("uploading"), 600);
        dragdrop.zone.off("dragover", dragdrop.over); dragdrop.zone.off("dragleave", dragdrop.leave);

        if (fe.dragzone.isactive) {
            fe.dragzone.isactive = false;
            let files = e.dataTransfer.files;

            Array.from(files).forEach(file => {
                let reader = new FileReader();
                reader.onload = (e) => {

                    //fe.ws.send(JSON.stringify({ name: "UploadFile", path: fe.path, file: e.target.result }));
                };

                //todo: Dosya büyükse bir uyarı ekle
                // if (file.size > 10000000) {
                reader.readAsDataURL(file);  // File'ın binary base64 şeklinde dönüşümü
                //fe.toast.fire({ icon: "error", title: fe.lang.file_large, timer: 10000 });
                //  return;
                // }

                console.log(file);
            });
        }
    };

    dragdrop.zone.on("dragover", dragdrop.over);
    dragdrop.zone.on("drop", dragdrop.drop);

    /** Tooltip */
    [...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(a => new bootstrap.Tooltip(a));

    /** WebSocket */
    setTimeout(() => CreateWebSocket(new WebSocket("ws://localhost/ws/file")), 1000);
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
            default: console.log(data); break;
        }
    });

    ws.addEventListener("close", (e) => {
        if (e.wasClean) fe.toast.fire({ icon: "warning", title: fe.lang.con_clo, timer: 3000 });
        else { fe.toast.fire({ icon: "error", title: fe.lang.con_los, timer: 15000 }); setTimeout(() => window.location.reload(), 15000); };
    });

    setTimeout(() => {
        if (ws.readyState === 0) {
            fe.toast.fire({ icon: "warning", title: fe.lang.con_try, timer: 2000 });
            let _waitConnection = () => { fe.toast.fire({ icon: "success", title: fe.lang.con_suc, timer: 800 }); return ws.removeEventListener("open", _waitConnection); }
            ws.addEventListener("open", _waitConnection);
        }
    }, 500);
}



function FileExplorer() { }

FileExplorer.GetFiles = function (data) {
    let top_header = $(`${fe._} .top-header`), list = $(`${fe._} .side.b .cont`), path = data.path.split("/").filter(_ => _ !== "");

    /** Path */
    fe.path = `/${path.join("/")}`;

    /** Back Button */
    if (path.length === 0) top_header.find(".goback").addClass("disabled");
    else if (path.length === 1) { let a = top_header.find(".goback"); a.removeClass("disabled"); a.attr("data-url", "/"); }
    else { let a = top_header.find(".goback"), b = path; b.pop(); a.removeClass("disabled"); a.attr("data-url", `/${b.join("/")}`); }

    /** Refresh Button */
    top_header.find(".refresh").attr("data-url", fe.path);

    /** Address */
    top_header.find(".address").innerHTML = `<a data-url="/"><span>~</span></a>` + [...path].map((a, b, c) => `<a data-url="/${c.slice(0, b + 1).join("/")}"><span>${a}</span></a>`).join(" ") + `<input type="text" value="${fe.path}">`;

    /** List */
    list.html("");
    for (let i = 0; i < data.value.length; i++) {
        let a = data.value[i], b = (c = (typeof allowedSVGFILESTYPES !== "undefined" && !a.isDirectory) ? allowedSVGFILESTYPES.find(_ => _ === String(a.name.split(".").at(-1)).toLowerCase()) : null) => `<svg><use xlink:href="#svg-${c ? "file-" + c : a.isDirectory ? "folder" : "file"}"></use></svg>`;
        list.append($("<a>", { "title": a.name, "data-isfolder": a.isDirectory, "data-url": `${a.path === "/" ? "" : a.path}`, "html": `<div class="item">${b()}<span>${a.name}</span></div>` }));
    };
};

FileExplorer.ListFiles = function (data) {
    data.filter(_ => _.isDirectory).forEach(a => {
        a.path = a.path.split("/").filter(_ => _ !== "");
        let b = fe.files;

        for (let i = 0; i < a.path.length; i++) { let c = a.path[i], d = a.path; if (!b[c]) b[c] = { name: c, path: `/${d.slice(0, i + 1).join("/")}`, childs: {} }; b = b[c].childs; }
    });

    return FileExplorer.ShowListedFiles(fe.files);
}

FileExplorer.ShowListedFiles = function (data, depth = 1, column = $(`${fe._} .side.a .cont`)) {
    column.find(".skeleton").remove();
    for (let a in data) {
        let b = data[a], c = column.find(`a[data-url="${b.path}"]`);
        if (!c.length) { c = $("<a>", { "class": "pp", "data-url": b.path, "style": `--path:${depth}`, "html": `<div><svg class="arr"><use xlink:href="#svg-arrow-thin"></use></svg><svg><use xlink:href="#svg-folder"></use></svg><span>${b.name}</span></div>` }); column.append(c); }

        let d = c.find(".child-container");
        if (!d.length) { d = $("<div>", { class: "child-container" }); c.append(d); }

        if (Object.keys(b.childs).length) FileExplorer.ShowListedFiles(b.childs, depth + 1, d);
    }
}

FileExplorer.SetSettings = function (data) {
    fe.Settings = { ...fe.Settings, ...data.value };
    /** Custom Options */
    Object.entries(data.value).forEach(([a, b]) => { let c = $(`div.tab input[name=${a}]`)[0]; if (c) { if (c.type === "checkbox") c.checked = b === "true"; else c.value = b; } });
    /** Setting */
    $("body")[fe.Settings.performance === "true" ? "addClass" : "removeClass"]("performance");
    $("body").css("--trs", (fe.Settings.performance === "true" ? 0 : fe.Settings?.transition ?? "300") + "ms");

    /** Wait Until Settings Done! */
    if (!fe.isReady) {
        fe.isReady = !0; fe.ws.send(JSON.stringify({ name: "GetFiles", path: fe.Settings.defPath }));
        if (fe.Settings.defPath !== "/") fe.ws.send(JSON.stringify({ name: "GetFolders", path: "/" }));
    }
}