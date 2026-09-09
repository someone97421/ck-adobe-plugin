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
        var palette = [], i, j;
        // 按文档色板面板顺序排列；不把点击先后顺序当作接口保证。
        var selectedNames = {};
        for (i = 0; i < picked.length; i++) selectedNames["$" + picked[i].name] = true;
        for (i = 0; i < doc.swatches.length; i++) {
            var sw = doc.swatches[i];
            if (selectedNames["$" + sw.name] && solid(sw.color))
                palette.push({name:sw.name, color:copy(sw.color)});
        }
        if (!palette.length) {
            alert("请先在色板面板中选中一个或多个纯色色板，再运行脚本。\n支持 RGB、CMYK、灰度、Lab、全局色和专色。\n无色、套版色、图案和渐变色板不会作为替换颜色。");
            return;
        }
        var w = new Window("dialog", "02 · 用所选色板替换渐变色标");
        w.orientation = "column"; w.alignChildren = "fill";
        var total = 0;
        for (i = 0; i < gradients.length; i++) total += gradients[i].gradientStops.length;
        w.add("statictext", undefined, gradients.length + " 个渐变，共 " + total + " 个色标；" + palette.length + " 个可用颜色。");
        w.add("statictext", undefined, "下面的顺序就是取色顺序，可选中一行后上移／下移：");
        var list = w.add("listbox", undefined, [], {multiselect:false});
        list.preferredSize = [520, 170];
        function refresh(index) {
            list.removeAll();
            for (var a = 0; a < palette.length; a++)
                list.add("item", (a + 1) + ". " + palette[a].name);
            list.selection = index;
        }
        refresh(0);
        var order = w.add("group");
        var up = order.add("button", undefined, "上移");
        var down = order.add("button", undefined, "下移");
        var reverse = order.add("button", undefined, "反转顺序");
        function move(delta) {
            if (!list.selection) return;
            var a = list.selection.index, b = a + delta, temp;
            if (b < 0 || b >= palette.length) return;
            temp = palette[a]; palette[a] = palette[b]; palette[b] = temp; refresh(b);
        }
        up.onClick = function () { move(-1); };
        down.onClick = function () { move(1); };
        reverse.onClick = function () { palette.reverse(); refresh(0); };
        var mode = w.add("dropdownlist", undefined, [
            "顺序循环：A、B、C、A、B、C……",
            "均匀分配：按色标序号覆盖整个颜色列表",
            "按位置分配：按色标的 0–100% 位置取最近的色板"
        ]);
        mode.selection = 0;
        w.add("statictext", undefined, "每个渐变分别从列表开头取色；一个颜色会替换全部色标。");
        var note = w.add("statictext", undefined,
            "注意：本脚本直接修改渐变定义。同一文档中共用该定义的\n其他对象和渐变色板也会同步变色，即使它们没有被选中。\n保留原渐变的几何参数、色标数量、位置、中点和透明度。", {multiline:true});
        note.preferredSize = [520, 60];
        var shared = w.add("checkbox", undefined, "我确认修改这些渐变定义及其所有引用");
        foot(w);
        var buttons = w.add("group"); buttons.alignment = "right";
        buttons.add("button", undefined, "取消", {name:"cancel"});
        var run = buttons.add("button", undefined, "替换全部色标", {name:"ok"});
        run.enabled = false;
        shared.onClick = function () { run.enabled = shared.value; };
        if (w.show() !== 1 || !shared.value) return;
        // 先完整读取原色并规划，再修改。写入失败时逐项恢复已经处理的色标。
        var plan = [], modeIndex = mode.selection.index;
        for (i = 0; i < gradients.length; i++) {
            var ordered = [], stops = gradients[i].gradientStops;
            for (j = 0; j < stops.length; j++) ordered.push({stop:stops[j], index:j});
            ordered.sort(function (a,b) {
                return a.stop.rampPoint - b.stop.rampPoint || a.index - b.index;
            });
            for (j = 0; j < ordered.length; j++) {
                var stop = ordered[j].stop, p;
                if (modeIndex === 0) p = j % palette.length;
                else if (modeIndex === 1)
                    p = ordered.length < 2 ? 0 : Math.round(j * (palette.length - 1) / (ordered.length - 1));
                else p = Math.round(stop.rampPoint / 100 * (palette.length - 1));
                p = Math.max(0, Math.min(palette.length - 1, p));
                plan.push({stop:stop, before:copy(stop.color), after:copy(palette[p].color)});
            }
        }
        var applied = -1;
        try {
            for (i = 0; i < plan.length; i++) { applied = i; plan[i].stop.color = plan[i].after; }
        } catch (err) {
            var failedRestore = 0;
            for (j = applied; j >= 0; j--) {
                try { plan[j].stop.color = plan[j].before; } catch (restoreErr) { failedRestore++; }
            }
            alert("替换失败：" + err.message + "\n" +
                (failedRestore ? "有 " + failedRestore + " 项恢复失败，请撤销或恢复文档备份。" : "已恢复本次处理的色标颜色。"));
            return;
        }
        app.redraw();
        alert("已替换 " + gradients.length + " 个渐变中的 " + plan.length + " 个色标。\n" +
            (warnings ? "有 " + warnings + " 项被跳过或无法读取。" : ""));
    } catch (e) {
        alert("脚本未能完成：" + e.message + (e.line ? "\n行号：" + e.line : ""));
    }
}());