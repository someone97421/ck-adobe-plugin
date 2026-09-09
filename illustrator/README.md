# Illustrator Gradient Tools

Illustrator 30.5.1 的原生插件工程，目标是提供：

- 从普通渐变、自由渐变、渐变网格的控制点提取颜色到色板。
- 用选定色板按顺序、均匀或按位置替换这些控制点颜色。

## 当前状态

已接入本地 Illustrator SDK 30.5.167 的核心操作模块：

- 普通渐变：读取和替换全部 `AIGradientStop`。
- 渐变网格：通过 `AIMeshSuite::QueryColors` / `MapColors` 读取和替换节点颜色。
- 自由渐变：SDK 30.5.167 没有公开的自由渐变点／线 suite，暂不宣称支持。

`src/GradientOperations.*` 是可被插件 UI 和命令入口调用的核心层；菜单、色板选择和撤销事务仍待接入原生插件壳。

## SDK 接入

设置环境变量 `ILLUSTRATOR_SDK_ROOT` 指向 Adobe Illustrator SDK 根目录，然后执行：

```powershell
cmake -S . -B build
cmake --build build --config Release
```

SDK 不属于本仓库，避免提交 Adobe 的受版权保护文件。
