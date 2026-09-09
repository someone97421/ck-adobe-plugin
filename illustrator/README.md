# Illustrator Gradient Tools

Illustrator 30.5.1 的原生插件工程，目标是提供：

- 从普通渐变、自由渐变、渐变网格的控制点提取颜色到色板。
- 用选定色板按顺序、均匀或按位置替换这些控制点颜色。

## 当前状态

仓库初始化阶段。当前机器未发现 Adobe Illustrator SDK，因此暂不提交声称可编译的 SDK 头文件或伪造 API。插件实现会在 SDK 接入后放入 `src/`，CMake 构建入口已预留。

## SDK 接入

设置环境变量 `ILLUSTRATOR_SDK_ROOT` 指向 Adobe Illustrator SDK 根目录，然后执行：

```powershell
cmake -S . -B build -DILLUSTRATOR_SDK_ROOT=$env:ILLUSTRATOR_SDK_ROOT
cmake --build build --config Release
```

SDK 不属于本仓库，避免提交 Adobe 的受版权保护文件。
