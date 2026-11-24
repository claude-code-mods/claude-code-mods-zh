# tokendoctor

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

同一个 Claude Code，最多省 38%。

回放你自己的历史会话，展示每项改动本来能省多少，然后只应用你选中的改动。

**你的过去会话说了算，不是别人的基准。** 某项设置能省多少取决于你的工作方式：会话多长、用哪些模型、做什么工作。

- ① 回看最近 30 天：`/tokendoctor:sessions` 以 200K/300K/400K/600K 压缩窗口逐请求回放每个会话，显示各自的花费。只读，不调用模型，不改动任何内容。
- ② 只改你的会话显示划算的：`/tokendoctor:optimize` 根据这些数字提出改动，只应用你选中的，且先以 diff 展示。`/tokendoctor undo` 可撤销。
- ③ 可选：用滑动代替摘要。当 Claude Code 要停下总结对话时，改为丢弃旧工具输出而保留每条消息，无模型调用，只需几毫秒。

## 安装

```bash
claude plugin marketplace add localixai/tokendoctor
claude plugin install tokendoctor@tokendoctor
```

重启 Claude Code 并运行 `/tokendoctor:sessions`。

## 出处与许可证

- 原作者：[localixai](https://github.com/localixai/tokendoctor)
- 原仓库：https://github.com/localixai/tokendoctor
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
