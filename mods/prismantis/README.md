# prismantis

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

一个 Claude Code mod，用彩色重绘 Claude 的回复：表格、标题、列表、引用、高亮代码、数字、路径与链接、mermaid 图表，以及工具行，共 17 种主题，并带复制按钮。运行 `/prismantis setup` 选择外观，或 `/prismantis demo` 查看它绘制的一切。

截图、全部选项与更新日志见[完整 README](https://github.com/NahumLitvin/prismantis#readme)。

## 它运行、读取和改动了什么

prismantis 不发任何网络请求。以下一切都在你的机器上完成。

- **程序。** 点击 `⧉ html` 或 `▣ png` 会把复制的表格、图示或图形通过标准输入交给剪贴板辅助程序：macOS 上是 `osascript`，Windows 上是 `powershell.exe`（它读取 `SystemRoot` 找到它），Linux 上是 `copyq`。开启 `latex` 时，它从你的 `PATH` 运行 `ratex-render`，把回复中的公式通过标准输入传入。它不再运行其他任何东西。
- **文件。** 它读取回复中作为 Markdown 图片链接的本地 PNG（最大 2 MB），以在 kitty 或 Ghostty 中绘制它。它读回 `ratex-render` 写入 `$TMPDIR/prismantis-latex-<session>-<id>` 的 PNG。它自身不写任何文件。
- **设置。** `/prismantis setup` 与 `/prismantis theme` 通过 `/config` 保存你的选择，只写入 prismantis 自己的选项（`prismantis.theme`、`prismantis.tableStyle` 及其他设置步骤）。你的设置中没有任何其他内容会改变。
- **桌面应用颜色。** 仅在 `desktopColors` 为 `match` 时：会话启动时以及 `/prismantis theme` 时，它用 `$.theme.set` 按当前调色板为会话设置桌面应用的颜色。把 `desktopColors` 改回 `off` 会调用一次 `$.theme.clear()`。它在会话启动或重载时绝不清除。
- **钩子。** 它通过 `ui.render` 绘制，通过 `command.run` 应答 `/prismantis` 命令，在 `config.set` 中观察自己的 `desktopColors` 行，在 `prompt.submit` 中添加仅模型可见的[图示提示](https://github.com/NahumLitvin/prismantis#diagram-hints)说明，并在开启 `keyPointHint` 时添加要点说明，还在 `engine.create` 中为[其他 mod](https://github.com/NahumLitvin/prismantis#other-mods) 添加 `$.prismantis.markdown`。`prismantis.markdown` 是该调用自己的事件。

## 出处与许可证

- 原作者：[Nahum Litvin](https://github.com/NahumLitvin/prismantis)
- 原仓库：https://github.com/NahumLitvin/prismantis
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
