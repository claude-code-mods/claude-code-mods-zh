# ctx-handoff

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

长会话工具包：让 Claude 记住你教它的内容、捕捉它常见的疏漏，并在你回来时从长会话的中断处继续。

- 长会话接近满时：自动写入区分已验证工作与未验证改动的摘要，清空并开启新会话继续
- 你离开一小时后：保持缓存温热约 4 小时，下次消息不必全价重读
- 重复指令：变成项目笔记，重复 3 次后写入仓库
- `/clear` 或重开 Claude Code：新会话知道上次停在哪里
- Claude 重复失败命令或未测试就说“完成”：立即收到一行提醒

## 安装

需要 Claude Code 2.1.287+。

```sh
claude plugin marketplace add cablate/ctx-handoff-mod
claude plugin install ctx-handoff@ctx-handoff-mod
```

新会话中输入 `/handoff` 查看状态。基于 Claude 订阅与长会话（如 1M 上下文模型）；API key、Bedrock 或 Vertex 上缓存只有 5 分钟，请运行 `/handoff refresh off`。

## 出处与许可证

- 原作者：[cablate](https://github.com/cablate/ctx-handoff-mod)
- 原仓库：https://github.com/cablate/ctx-handoff-mod
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
