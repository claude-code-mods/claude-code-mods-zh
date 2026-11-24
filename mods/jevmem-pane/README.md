# jevmem pane

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

一个 Claude Code 侧边面板，位于你的对话旁，显示 [jevmem](https://github.com/Avinash-jetwani/jevmem) 为你刚发送的提示与刚结束的回合做了什么：

1. **本提示召回的内容**：每一条提供给 Claude 的记忆行（其 id、种类与文本），以及有多少条被保留未用。
2. **守卫**：守卫询问过或拒绝的最后一次调用，附带规则与分数，并对应到该调用。
3. **上一回合保存的内容**：jvmem 从该回合保存的行及其种类，或该回合被跳过的原因。

每行都有 `why`（为什么）、`wrong`（不对）与 `forget`（忘记）按钮。`forget` 与 `wrong` 会改动 `JEVMEM.md`（该行以 `[retired]` 保留），因此它们会先询问；规则只能在终端中退役，因为 `jevmem trust` 就是那样工作的。面板读取 `.jevmem/` 下的三个本地文件，并以参数向量运行 `jevmem` 命令；它不向任何地方发送数据，也不读取任何密钥。

## 安装

在已添加 jevmem 市场（`claude plugin marketplace add Avinash-jetwani/jevmem`）的 Claude Code 中：

```
/plugin install jevmem-pane@jevmem
```

它需要 jevmem 命令（`npm install -g jevmem`）以及一个已启用的项目（`jevmem setup`）。在宽度 144 列或更宽的终端中，面板会自行打开；`/jevmem` 在任意宽度下打开或关闭它（在全屏终端中从 110 列起停靠在对话旁，更窄时则在提示行上方）。仅支持 Claude Code：Cursor 没有面板。

完整说明（含各状态含义）见 [docs/pane.md](https://avinash-jetwani.github.io/jevmem/pane/)。

## 出处与许可证

- 原作者：[Avinash-jetwani](https://github.com/Avinash-jetwani/jevmem)
- 原仓库：https://github.com/Avinash-jetwani/jevmem
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
