# Token Optimizer 桌面版

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

Claude 桌面应用的状态栏。它绘制在提示行上方，显示会话质量、上下文填充量、缓存倒计时，以及你的 5 小时与每周限制，并由 Clawd 演示会话正在做什么。

## 安装

它随 Token Optimizer 插件一起发布（`hooks/hooks.json` 在 `modules` 下列出本目录的 `hooks/register.tsx`），因此没有额外要安装的东西。本目录保留自己的清单，仅为了让它的测试能用 `claude plugin test` 独立运行。`npm run typecheck` 与 `npm test` 覆盖纯模块（CI）；`npm run typecheck:engine` 针对 Claude Code 的插件 API 声明检查 `hooks/` 与 `tests/engine/`，这些声明只有 claude CLI 会写入，因此只能在本地运行。

需要 Claude Code 2.1.287 或更高版本以及 Anthropic 的 mod 功能。Anthropic 可以远程关闭 mod；关闭时不会出错，只是状态栏不出现。终端保留其现有的状态行。不支持 VS Code。

要确认它是否生效，打开一个启用了 Token Optimizer 插件的 Claude 桌面会话。在提示行上方寻找带 Clawd 与缓存倒计时的 Token Optimizer 状态带。若不存在，检查插件已启用、mod 可用、且 `TOKEN_OPTIMIZER_STATUS_BAR` 不为 `0`，然后重启会话。插件的 `hooks/hooks.json` 注册的是 `desktop/token-optimizer-desktop/hooks/register.tsx`。

要在不使用你的会话的情况下检查记账，运行 `python3 <plugin>/skills/token-optimizer/scripts/measure.py mod-action --selftest`。它会打印 `PASS` 或 `FAIL`，并使用一个临时数据目录。失败的动作诊断会记入 Token Optimizer 数据目录的 `mod-actions.log`。

## 你会得到什么

- 一句关于最紧迫事项的话，最多带一个按钮。
- 五个带悬浮卡片的标记：质量等级、上下文填充、缓存倒计时、5 小时限制、每周限制。
- **Clawd 旁的箭头**展开另一行：分支、会话时长、工具调用数、压缩（若有）、上次保存检查点的时间（任何种类，或来自更早会话的相关检查点），以及过去 30 天 Token Optimizer 为你节省的 token 数，与仪表盘显示的总数一致。
- 按钮：**清理**（按 Token Optimizer 的指引压缩）、**重新开始**（第二次点击保存检查点、清空，并把它交给你的首条消息）、**保持温热**（手动一键刷新缓存，仅在缓存仍温热时可用，绝不自动，会使用少量用量）。
- **完整仪表盘**：在展开行的末尾，一个纯文本链接，两种尺寸的状态带都显示（折叠的状态带不显示它）。点击它会运行 `measure.py dashboard`，与 `token-dashboard` 技能的命令相同：它重新生成仪表盘页面并用默认浏览器打开（macOS 上 `open`，Linux 上 `xdg-open`，Windows 上文件关联）。运行时状态带显示“正在打开仪表盘。”；失败时状态带会显示数秒“无法打开仪表盘。”，其他什么也不会发生。运行中再次点击会被忽略。该链接是以 `plain` 样式绘制的按钮。

缓存倒计时是估算：Claude 套餐为 1 小时，API 为 5 分钟，尽可能从会话本身测量。

## 设置

在 `~/.claude/settings.json` 的 `env` 块中，`TOKEN_OPTIMIZER_STATUS_BAR=0` 隐藏状态栏，`TOKEN_OPTIMIZER_STATUS_BAR_ANIMATE=0` 让 Clawd 静止不动。`TOKEN_OPTIMIZER_STATUS_BAR_TIME_FORMAT=24h`（或 `12h`）强制用于限制续期时间的时钟格式；未设置时跟随你的区域设置。

箭头旁的 `–` 按钮把状态带缩小到一行，`+` 恢复；箭头仍可展开其下的详情行，且选择会被记住，跨会话与重启保留。`TOKEN_OPTIMIZER_STATUS_BAR_SIZE=slim` 在未存下选择前设定初始尺寸；终端状态行也用同一变量打印单行。

上下文标记在你设置了压缩窗口时按自己的窗口度量：`CLAUDE_CODE_AUTO_COMPACT_WINDOW`、`/autocompact` 或 `autoCompactWindow` 设置，范围为 Claude Code 的 100K–1M，且不超过模型的窗口。仅用 `--autocompact` 为单次启动给出的窗口它看不到。

## 完整文档

参见 [Token Optimizer README](../../README.md#desktop-status-bar) 与文档站的“Claude desktop app”页面。

## 出处与许可证

- 原作者：[alexgreensh](https://github.com/alexgreensh/token-optimizer)
- 原仓库：https://github.com/alexgreensh/token-optimizer
- 许可证：NOASSERTION（详见原仓库）
- 中文翻译与界面本地化：claude-code-mods-zh 项目
