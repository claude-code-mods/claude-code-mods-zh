# Lot Map for Claude Code

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

一个 Claude Code mod：在聊天旁的面板中实时展示工作地图。每次工具调用、模型步骤、钩子和技能都从中心向其站点发送脉冲，因此你看到的是记忆、文件、shell、网络和 agent 在工作。

它在本机运行，不向任何地方发送数据。参见 [隐私说明](PRIVACY.md)。

## 安装

```
/plugin install lot-map --marketplace alexeyw/lot-map
```

若提示找不到插件，先添加市场 `claude plugin marketplace add alexeyw/lot-map`。面板在会话启动时自动打开；终端中需要至少 144 列，否则输入 `/lot-map`。

## 出处与许可证

- 原作者：[alexeyw](https://github.com/alexeyw/lot-map)
- 原仓库：https://github.com/alexeyw/lot-map
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
