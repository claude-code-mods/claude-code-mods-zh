# Claude Code 原生提示预测

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。


本适配器使用 Claude Code 原生的函数钩子（function hooks）。它已在 Claude Code 2.1.310 上验证；更早版本不在支持范围内。加载到新进程的方式是 `--plugin-dir <适配器绝对路径>` 并设置 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1`。加载适配器并不会把它安装到用户的全局 Claude 配置中。

启动器必须提供 `PEBREL_PREDICTION_ENDPOINT`（带端口的 HTTP IPv4 回环地址）、`PEBREL_PREDICTION_TOKEN` 以及 `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION=false`。最后一个变量用于禁用该进程内 Claude Code 内置的预测推理；不设置它，适配器就不会工作，以免对同一轮完成重复发起两次推理请求。不会修改任何全局设置或主模型设置。

只有成功完成、且终端输入框为空并已挂载的主回合才有资格触发。`$.session.messages()` 提供内存中的用户/助手文本；不会发送工具调用的载荷。桥接端最多接收 24 条消息，每条最多 3000 个 UTF-16 单元，总计不超过 12000 单元。预测提示词、所配置的提供商、语言及进一步的上下文限制均由 Pebrel 负责。适配器不添加任何说话风格提示词，也不做持久化。

本地化的桥接文案 `loading_text` 会显示在 Claude Code 底部灰色的 `PromptHint` 中，并每 400 毫秒依次追加 `.`、`..`、`...`。它不可编辑，也从不会发送给 `prompt.suggest`。候选完成后调用原生 `$.prompt.suggest({text})`，因此原生的 Tab/右方向键行为会填充输入框而不会提交。输入框始终归 Claude Code 所有。

编辑、提示词变更、新回合、会话结束以及十秒期限都会使待处理的界面工作失效。每个结果都会重新校验版本、会话和空草稿。原生 `http.fetch` API 没有中止信号：这里的取消只是抑制过期结果，网络/请求的期限由桥接端负责。预测界面空闲时不会留下磁盘轮询或定时器。

运行行为契约：`node --test tests/*.test.mjs`；运行真实的 Claude 扫描器：`claude plugin validate --strict --json <适配器目录>`。模拟测试不能证明原生终端的视觉验收，也不能证明与未测试 Claude 版本的兼容性。

## 出处与许可证

- 原作者：[Kuddev](https://github.com/Kuddev/pebrel)
- 原仓库：https://github.com/Kuddev/pebrel
- 许可证：GPL-3.0
- 中文翻译与界面本地化：claude-code-mods-zh 项目
