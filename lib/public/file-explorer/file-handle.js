/** TESTS */
window.addEventListener("resize", () => $(".file-explorer").css({ "--height": `${window.innerHeight}px`, "--width": `${window.innerWidth}px` }))

const fe = {
    _: ".file-explorer",
    ws: new WebSocket("ws://localhost/ws/file"),
    toast: Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 3000, timerProgressBar: true }),
    files: {},
    lang: {
        name: "Dosya Yöneticisi",
        con_try: "Bağlantı Deneniyor...",
        con_suc: "Bağlantı Başarılı.",
        con_los: "Bağlantı Kesildi. Tekrar Denenecek..."
    },
    path: "",
    contextmenu: {
        isactive: false
    },
    dragzone: {
        isactive: false
    }
}

window.addEventListener("load", () => {
    $(fe._).css({ "--height": `${window.innerHeight}px`, "--width": `${window.innerWidth}px` })

    // todo: in development 
    $(`${fe._} .main .side.c`).remove();

    // for cook animations
    $(`${fe._} [data-cookable=1]`).click((a, b = "cook") => { let c = a.currentTarget.classList; if (!c.contains(b)) { c.add(b); setTimeout(() => c.contains(b) ? c.remove(b) : !0, 600) } });
    ((a = `${fe._} .address `, b = "focus") => $(a).on(b + "in", "input", () => $(a).addClass(b)).on(b + "out", "input", () => $(a).removeClass(b)))();

    // Box sizing
    ((a, b) => b.forEach(c => c.addEventListener("mousedown", (d) => {
        let e = c.parentElement, f = e.nextElementSibling; if (!f) return; let g = e.offsetWidth, h = f.offsetWidth;
        function _tica(i) { let _a = i.clientX - d.clientX, _b = Math.max(50, g + _a), _c = Math.max(50, h - _a); if (_b + _c !== g + h) return; e.style.flex = `0 0 ${_b}px`; f.style.flex = `0 0 ${_c}px`; }
        function _stoptica() { document.removeEventListener(a[0], _tica); document.removeEventListener(a[1], _stoptica); }
        document.addEventListener(a[0], _tica); document.addEventListener(a[1], _stoptica);
    })))(["mousemove", "mouseup"], document.querySelectorAll(`${fe._} .main .size-controller`));

    $(`${fe._} .main .side.b .cont`).on("contextmenu", "a", (e) => {
        e.preventDefault(); fe.contextmenu.isactive = true;
        let cm = document.querySelector(`${fe._} .main .contextmenu`), cn = e.currentTarget.dataset, cl = cm.classList;
        cm.classList.add("visible"); cm.style = `top:${e.clientY}px;left:${e.clientX}px;`;

        if (cn.isfolder === "true") { cl.contains("folder") ? null : cl.add("folder"); cl.contains("file") ? cl.remove("file") : null; }
        else { cl.contains("folder") ? cl.remove("folder") : null; cl.contains("file") ? null : cl.remove("file"); };
        cm.setAttribute("data-query", JSON.stringify(cn, null, 0));

        function _WatchOpenedMenu() { if (fe.contextmenu.isactive) { document.querySelector(`${fe._} .main .contextmenu`).classList.remove("visible"); fe.contextmenu.isactive = false; window.removeEventListener("click", _WatchOpenedMenu); } }
        window.addEventListener("click", _WatchOpenedMenu);
    });
    $(`${fe._} .main .side.b .contextmenu`).on("click", "a[data-action=copy-path]", (_) => navigator.clipboard.writeText(JSON.parse(_.delegateTarget.dataset.query).url));


    fe.ws.addEventListener("message", (e) => {
        var data = { name: "", value: null };
        try { data = JSON.parse(e.data); } catch { return console.error("Invalid JSON") }

        switch (data.name) {
            case "GetFiles":
                data.value = data.value.sort((a, b) => b.name - a.name);
                data.value = data.value.sort((a, b) => b.isDirectory - a.isDirectory);

                let address = document.querySelector(".file-explorer .top-header .address"), list = document.querySelector(".file-explorer .side.b .list-grid"), back = document.querySelector(".file-explorer .top-header .goback"), path = data.path.split("/").filter(_ => _ !== ""), refresh = document.querySelector(".file-explorer .top-header .refresh");

                list.innerHTML = "";
                address.innerHTML = "<a data-url=\"/\"><span>~</span></a>" + new Array(...path).map((v, i, a) => `<a data-url="/${a.slice(0, i + 1).join("/")}"><span>${v}</span></a>`).join(" ") + `<input type="text" value="/${path.join("/")}">`
                if (path.length === 0) back.classList.add("disabled");
                else if (path.length === 1) { back.classList.remove("disabled"); back.setAttribute("data-url", "/"); }
                else { back.classList.remove("disabled"); let a = path; a.pop(); back.setAttribute("data-url", `/${a.join("/")}`); }
                refresh.setAttribute("data-url", `/${path.join("/")}`);
                fe.path = `/${path.join("/")}`;
                for (let i = 0; i < data.value.length; i++) {
                    let file = data.value[i], elm = [document.createElement("a")], icon = () => { let exc = (_ = file.name.split(".")) => String(_[_.length - 1]).toLowerCase(), type = allowedSVGFILESTYPES.find(x => (file.isDirectory ? "folder" : exc()) === x); if (!type && !file.isDirectory) return dynamicSVGFileText(exc().toUpperCase(), "#149be6", exc().length > 5 ? "70" : "100"); else return `<svg><use xlink:href="#svg-${file.isDirectory ? "folder" : "file" + (type ? "-" + type : "")}"></use></svg>`; }
                    elm[0].title = file.name; elm[0].innerHTML = `<div class="item">${icon()}<span>${file.name}</span></div>`;
                    elm[0].setAttribute("data-url", `${file.path === "/" ? "" : file.path}/${file.name}`);
                    elm[0].setAttribute("data-isfolder", file.isDirectory); list.appendChild(elm[0]);
                };
                listFiles(data.value);
                break;
            case "GetFolders": listFiles(data.value.sort((a, b) => b.name - a.name)); break;

            default: console.log(data); break;
        }
    });

    setTimeout(() => { if (fe.ws.readyState === 0) fe.toast.fire({ icon: "warning", title: fe.lang.con_try, timer: 2000 }) }, 500);

    fe.ws.onopen = () => { fe.toast.fire({ icon: "success", title: fe.lang.con_suc, timer: 800 }); fe.ws.send(JSON.stringify({ name: "GetFiles", path: "/" })); }
    fe.ws.onclose = () => { fe.toast.fire({ icon: "error", title: fe.lang.con_los, timer: 15000 }); setTimeout(() => window.location.reload(), 15000) };
    function GetFiles(_) { _.stopPropagation(); fe.ws.send(JSON.stringify({ name: "GetFiles", path: _.currentTarget.dataset?.url ?? _.currentTarget.value })); }

    $(`${fe._} div.cont.list-grid`).on("click", "a[data-isfolder=true]", GetFiles);
    $(`${fe._} div.top-header`).on("click", "a.goback", GetFiles).on("click", "a.refresh", GetFiles).on("click", "div.address a", GetFiles).on("change", "div.address input", GetFiles)
    $(`${fe._} div.side.a .cont`).on("click", "a", GetFiles).on("click", "svg.arr", (_) => { _.stopPropagation(); let a = _.currentTarget?.parentElement?.parentElement; if (a?.dataset?.url) { a.classList.contains("on") ? a.classList.remove("on") : a.classList.add("on"); fe.ws.send(JSON.stringify({ name: "GetFolders", path: a.dataset.url })) } });

    function dragdrop() { }

    dragdrop.zone = document.querySelector(`${fe._} div.side.b`);

    dragdrop.over = function (e) {
        e.preventDefault();
        if (!fe.dragzone.isactive) {
            fe.dragzone.isactive = true;
            e.currentTarget.parentElement.classList.add("dragging");
            dragdrop.zone.addEventListener("dragleave", dragdrop.leave);
        }
    };

    dragdrop.leave = function (e) {
        if (e.target === dragdrop.zone.querySelector(".cont")) return;  // CSS animasyon için kontrol
        if (fe.dragzone.isactive) {
            fe.dragzone.isactive = false;
            e.currentTarget.parentElement.classList.remove("dragging");
            dragdrop.zone.removeEventListener("dragleave", dragdrop.leave);
        }
    };

    dragdrop.drop = function (e) {
        e.preventDefault();
        let p = e.currentTarget.parentElement.classList;
        p.replace("dragging", "uploading");
        setTimeout(() => p.remove("uploading"), 600);
        dragdrop.zone.removeEventListener("dragover", dragdrop.over);
        dragdrop.zone.removeEventListener("dragleave", dragdrop.leave);

        console.log("Dropped");

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

    // Dragover ve Drop olaylarını doğru şekilde bağla
    dragdrop.zone.addEventListener("dragover", dragdrop.over);
    dragdrop.zone.addEventListener("drop", dragdrop.drop);


    function listFiles(a) {
        a = a.filter(x => x.isDirectory);
        a.forEach(x => {
            x.path = x.path.split("/").filter(y => y !== "");
            if (x.path.length === 0) { if (!fe.files[x.name]) fe.files[x.name] = { name: x.name, path: "/" + x.name, childs: {} } }
            else {
                let current = fe.files;
                x.path.forEach(dir => { if (!current[dir]) current[dir] = { name: dir, path: "/" + dir, childs: {} }; current = current[dir].childs; });
                if (!current[x.name]) current[x.name] = { name: x.name, path: "/" + [...x.path, x.name].join("/"), childs: {} };
            }
        })
        return generateFilesForSide(fe.files, document.querySelector(`${fe._} .side.a .cont`));
    }

    function generateFilesForSide(a, b, depth = 0) {
        for (const c in a) {
            let item = a[c], elm = b.querySelector(`.side.a .cont a[data-url="${item.path}"]`);
            if (!elm) { elm = document.createElement("a"); elm.setAttribute("data-url", item.path); elm.innerHTML = `<div><svg class="arr"><use xlink:href="#svg-arrow-thin"></use></svg><svg><use xlink:href="#svg-folder"></use></svg><span>${item.name}</span></div>`; elm.style = `--path:${depth + 1}`; b.appendChild(elm); }
            let d = elm.querySelector(".child-container");
            if (!d) { d = document.createElement("div"); d.classList.add("child-container"); elm.appendChild(d); }
            if (Object.keys(item.childs).length > 0) generateFilesForSide(item.childs, d, depth + 1);
        }
    }
});