# Context Attachment Manager

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

一个面向图片密集型对话的本地插件，支持 Codex、Claude Code 及其他 agent。较早的图片不再随每条消息重发；模型按 ID 取回所需图片，即使对话压缩后也如此。

它给每张图编号（IMG-001、IMG-002……），把较早的图片换成简短占位符：模型按需按 ID 取回原图；每张图有一行说明与你的批注；占位符只写一次，让提示词缓存继续有效；原图与历史都不删除。默认开启。

## 安装

把下面这句发给你的 agent，它会识别平台并安装：

```text
Install Context Attachment Manager for me, following https://github.com/chipfighter/context-attachment-manager/blob/main/INSTALL.md
```

然后重启 agent。在 Codex 中打开任务侧栏的 Context Assets；在 Claude Desktop 的 Code 标签页中有图片时面板会自动打开，输入 `/cam` 可重新唤回。

## 出处与许可证

- 原作者：[chipfighter](https://github.com/chipfighter/context-attachment-manager)
- 原仓库：https://github.com/chipfighter/context-attachment-manager
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
