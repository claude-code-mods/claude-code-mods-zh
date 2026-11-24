# Agent Standup 状态带

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。


![Agent Standup](.claude-plugin/icon.png)

当本机另一个 Claude Code 会话需要你时，在你的 Claude Code 提示行上方显示一行提示：

    ✋ web-shop (VS Code) 需要确认
    Agent Standup · /agent-standup:open 查看全部   隐藏

当某个会话开始等待你、或完成它的一轮时，还会弹出一个简短的提示条。你仍留在当前会话中工作，同时知道其他会话是否卡在问题或确认上。

它是一个 mod：由 Claude Code 函数钩子构成的插件。它会在终端中绘制，也会在 Claude 桌面应用的 Code 标签页中绘制。在 VS Code 中，[Agent Standup 扩展](https://marketplace.visualstudio.com/items?itemName=DoubleGeste.agent-standup)会在其状态栏中显示同样的内容。

## 安装

在 Claude Code 2.1.294 或更高版本中：

    /plugin install agent-standup-band --marketplace Atoll92/agent-standup

在更早的版本中，它会加载但什么也不做：那些版本不运行 mod（且早于终端 2.1.221、其他环境 2.1.269 的版本也不会写入它读取的状态文件）。

若想把每个会话都看成一通实时团队电话，可再安装主插件：`/plugin install agent-standup --marketplace Atoll92/agent-standup`，然后运行 `/agent-standup:open`。

## 它读取和运行什么

- 每 4 秒读取一次 Claude Code 为每个打开的会话保留的状态文件，位于 `~/.claude/sessions/<pid>.json`（或 `CLAUDE_CONFIG_DIR` 下）：包括是哪个会话、所在文件夹，以及它处于忙碌、空闲还是等待你。不读取对话内容。由程序通过 `claude -p` 启动的会话会被排除：它的问题会交给那个程序。Agent SDK 应用（如 Zed、自建应用）会保留，因为它们可能把菜单展示给人。
- 运行 `ps`，用来确认标记为“等待中”的会话仍在运行：崩溃的会话会留下文件。

它不写入任何内容，也不向任何地方发送数据。

## 更多

源码与问题反馈：https://github.com/Atoll92/agent-standup。非官方作品，与 Anthropic 无隶属关系，也未获其背书。MIT 许可证。

## 出处与许可证

- 原作者：[Atoll92](https://github.com/Atoll92/agent-standup)
- 原仓库：https://github.com/Atoll92/agent-standup
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
