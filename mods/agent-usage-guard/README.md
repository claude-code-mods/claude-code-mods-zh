# agent-usage-guard

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

防止 Claude Code 在十分钟内耗尽你的五小时用量窗口。

它在花费发生前行动：在 agent 启动、提示发送或工具调用运行之前拦下失控花费。读取套餐的实时用量，拦住子 agent 扩散、重上下文翻搅与重试循环。当你在键盘前，它用 Claude Code 自己的对话框询问；无人能回答时，它拒绝并说明原因。

- 感知套餐：读取 5 小时与每周百分比，为你看住窗口末尾
- 一次回答管一阵：批准在其条件解除或超时前一直生效
- 本地且隐私最小：无网络、无进程，只存计数与粗粒度分桶
- 失败时放行：钩子失败时事件照常进行

## 安装

```text
/plugin marketplace add rbartoli/agent-usage-guard
/plugin install agent-usage-guard@agent-usage-guard
/reload-plugins
```

然后运行 `/agent-guard` 查看状态。

## 出处与许可证

- 原作者：[rbartoli](https://github.com/rbartoli/agent-usage-guard)
- 原仓库：https://github.com/rbartoli/agent-usage-guard
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
