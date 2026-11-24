# Operator Memory for Claude Code

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。


Operator Memory 为 Claude Code 提供由 agent 维护的、以可读 Markdown 保存的持久项目与用户上下文。

## 安装

需要 Claude Code `v2.1.287` 或更高版本，并且 `PATH` 中已有 Operator Helper。

```sh
operator-helper install claude-code
```

安装后请启动一个新的 Claude Code 进程。运行 `claude plugin list` 确认 `operator@operator-memory` 已启用，然后询问 agent 是否可以使用 Operator Memory 指引。

插件会把前言注入主系统提示词和子 agent 的任务提示词中。它每个进程只渲染一次记忆；重新加载记忆需要重启 Claude Code。`/clear` 不会刷新已缓存的这段前言。

## 命令

- `/operator:user-init` — 配置用户分区（User Partition）。
- `/operator:project-init` — 配置项目大脑（Project Brain）。
- `/operator:index` — 构建或刷新项目索引（Project Index）。

## 更新

安装期间，Helper 会为 Operator marketplace 启用自动更新（重复安装同样如此）。之后如需关闭，可在 `/plugin` → Marketplaces 中设置。

重新运行 `operator-helper install claude-code`，或使用 `claude plugin update operator@operator-memory`，然后重启 Claude Code。

验证、更新与故障排查参见 [Claude Code 指南](https://github.com/aerovato/operator-memory/blob/main/docs/harnesses/claude-code.md)。本地开发时，在 workspace 根目录运行 `bun run preview:claude-code`。

## 出处与许可证

- 原作者：[aerovato](https://github.com/aerovato/operator-memory)
- 原仓库：https://github.com/aerovato/operator-memory
- 许可证：BSD-3-Clause
- 中文翻译与界面本地化：claude-code-mods-zh 项目
