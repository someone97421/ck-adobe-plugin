#target illustrator
/*
Windows / Illustrator 30.5.1 目标版本。
基于公开 ExtendScript DOM；未在该版本实际运行。
仅处理 DOM 暴露的普通线性/径向渐变，不支持自由渐变和网格。
*/
(function () {
    if (!app.documents.length) { alert("请先打开 Illustrator 文档。"); return; }
    var doc = app.activeDocument, gradients = [], warnings = 0;
    function solid(c) {
        if (!c) return false;
        var t = c.typename;
        if (t === "SpotColor") return c.spot.colorType !== ColorModel.REGISTRATION;
        return t === "RGBColor" || t === "CMYKColor" || t === "GrayColor" || t === "LabColor";
    }
    function copy(c) {
        var d, fields, i;
        switch (c.typename) {
            case "RGBColor": d = new RGBColor(); fields = ["red","green","blue"]; break;
            case "CMYKColor": d = new CMYKColor(); fields = ["cyan","magenta","yellow","black"]; break;
            case "GrayColor": d = new GrayColor(); fields = ["gray"]; break;
            case "LabColor": d = new LabColor(); fields = ["l","a","b"]; break;
            case "SpotColor": d = new SpotColor(); d.spot = c.spot; d.tint = c.tint; return d;
            default: throw Error("不支持的色标颜色类型：" + c.typename);
        }
        for (i = 0; i < fields.length; i++) d[fields[i]] = c[fields[i]];
        return d;
    }
    function key(c) {
        function n(v) { return String(Math.round(v * 10000) / 10000); }
        switch (c.typename) {
            case "RGBColor": return "RGB " + n(c.red)+","+n(c.green)+","+n(c.blue);
            case "CMYKColor": return "CMYK " + n(c.cyan)+","+n(c.magenta)+","+n(c.yellow)+","+n(c.black);
            case "GrayColor": return "Gray " + n(c.gray);
            case "LabColor": return "Lab " + n(c.l)+","+n(c.a)+","+n(c.b);
            case "SpotColor": return "Spot " + c.spot.name + " / " + n(c.tint) + "%";
        }
        return "";
    }
    function addColor(c) {
        if (!c || c.typename !== "GradientColor") return;
        var g = c.gradient, i;
        if (g.type !== GradientType.LINEAR && g.type !== GradientType.RADIAL) { warnings++; return; }
        if (g.gradientStops.length < 2) { warnings++; return; }
        for (i = 0; i < gradients.length; i++) if (gradients[i].name === g.name) return;
        gradients.push(g);
    }
    function readPaint(x, text) {
        try {
            if (text || x.filled) addColor(x.fillColor);
            if (text || x.stroked) addColor(x.strokeColor);
        } catch (e) { warnings++; }
    }
    function walk(x) {
        var i;
        try {
            if (x.locked || x.hidden) { warnings++; return; }
            switch (x.typename) {
                case "PathItem": readPaint(x, false); break;
                case "GroupItem":
                    for (i = 0; i < x.pageItems.length; i++) walk(x.pageItems[i]); break;
                case "CompoundPathItem":
                    for (i = 0; i < x.pathItems.length; i++) walk(x.pathItems[i]); break;
                case "TextFrame":
                    for (i = 0; i < x.textRange.characters.length; i++)
                        readPaint(x.textRange.characters[i].characterAttributes, true);
                    break;
                case "TextRange":
                    for (i = 0; i < x.characters.length; i++)
                        readPaint(x.characters[i].characterAttributes, true);
                    break;
                default: warnings++;
            }
        } catch (e) { warnings++; }
    }
    function targets(selectedSwatches) {
        var s = doc.selection, i;
        if (s && s.typename === "TextRange") walk(s);
        else if (s && s.length) for (i = 0; i < s.length; i++) walk(s[i]);
        // 没有从对象读到渐变时，允许直接处理色板面板选中的渐变色板。
        if (!gradients.length) for (i = 0; i < selectedSwatches.length; i++) addColor(selectedSwatches[i].color);
        if (!gradients.length) {
            alert("没有找到可读取的普通渐变。\n请选择含线性／径向渐变的对象，或选中渐变色板。\n自由渐变、渐变网格、符号内部及外观面板附加填充不在支持范围内。");
            return false;
        }
        return true;
    }
    function uniqueName(collection, base) {
        var name = base, i = 2, found;
        while (true) {
            found = false;
            try { collection.getByName(name); found = true; } catch (e) {}
            if (!found) return name;
            name = base + " " + i++;
        }
    }
    function foot(w) {
        var t = w.add("statictext", undefined,
            "范围：普通线性／径向渐变，包括多色标、填充和描边。\n自由渐变／网格及外观附加填充不受支持。", {multiline:true});
        t.preferredSize = [520, 40];
    }
    try {
        var picked = doc.swatches.getSelected();
        if (!targets(picked)) return;
        var w = new Window("dialog", "01 · 从渐变色标提取色板");
        w.orientation = "column"; w.alignChildren = "fill";
        w.add("statictext", undefined, "已找到 " + gradients.length + " 个渐变定义。");
        var row = w.add("group");
        row.add("statictext", undefined, "新建颜色组：");
        var nameInput = row.add("edittext", undefined, "渐变色标提取");
        nameInput.characters = 30;
        var dedup = w.add("checkbox", undefined, "合并相同颜色（包含专色色调值）");
        dedup.value = true;
        w.add("statictext", undefined, "色板保存原始颜色；色标透明度不会合成白底颜色。");
        foot(w);
        var buttons = w.add("group"); buttons.alignment = "right";
        buttons.add("button", undefined, "取消", {name:"cancel"});
        buttons.add("button", undefined, "提取", {name:"ok"});
        if (w.show() !== 1) return;
        var colors = [], seen = {}, i, j, c, k;
        for (i = 0; i < gradients.length; i++) {
            var stops = gradients[i].gradientStops;
            for (j = 0; j < stops.length; j++) {
                c = stops[j].color;
                if (!solid(c)) { warnings++; continue; }
                k = "$" + key(c);
                if (dedup.value && seen[k]) continue;
                seen[k] = true;
                colors.push({color:copy(c), label:key(c)});
            }
        }
        if (!colors.length) { alert("没有可提取的纯色色标。"); return; }
        var created = [], group = null, sw;
        try {
            group = doc.swatchGroups.add();
            group.name = nameInput.text.replace(/^\s+|\s+$/g, "") || "渐变色标提取";
            for (i = 0; i < colors.length; i++) {
                var newName = uniqueName(doc.swatches, "色标 " + (i + 1) + " · " + colors[i].label);
                sw = doc.swatches.add(); created.push(sw);
                sw.name = newName; sw.color = colors[i].color;
                group.addSwatch(sw);
            }
        } catch (err) {
            for (i = created.length - 1; i >= 0; i--) { try { created[i].remove(); } catch (ignore) {} }
            if (group) { try { group.remove(); } catch (ignore2) {} }
            throw err;
        }
        alert("已提取 " + colors.length + " 个颜色到色板面板的新颜色组。\n" +
            (warnings ? "有 " + warnings + " 项被跳过或无法读取。" : ""));
    } catch (e) {
        alert("脚本未能完成：" + e.message + (e.line ? "\n行号：" + e.line : ""));
    }
}());