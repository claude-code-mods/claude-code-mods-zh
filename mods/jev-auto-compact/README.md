# jev-auto-compact

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。

基于 Jev 的逐字压缩：当上下文达到 60% 时，在不生成任何内容的情况下裁剪陈旧的工具调用。如果无可裁剪内容则直接跳过（绝不回退到 LLM 摘要）；同时为 learning.db 记录证据。

## 安装

```
/plugin install jev-auto-compact@claude-code-mods-zh
```

## 出处与许可证

- 原作者：[notque](https://github.com/notque/vexjoy-agent)
- 原仓库：https://github.com/notque/vexjoy-agent
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
