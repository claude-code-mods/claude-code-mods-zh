# 界面文案翻译规则

只翻译**用户在 Claude Code 界面里看得见的文字**。其他一切保持英文原样。

## 要翻译（用户可见）

- `label:` 按钮/选项文字 —— 如 `label: 'Cancel'` → `label: '取消'`
- `placeholder:` 输入框占位符
- 面板/状态带的标题与正文 —— `$.ui.open({ title: ... })`、`<Text>`、`<Box>` 里的文案、`title:` 属性
- 状态行 / toast / 提示条文字（`$.ui.status(...)`、`$.ui.log(...)` 中直接给用户看的提示）
- 斜杠命令在 `/` 菜单里显示的 `description`（`$.command.register({ description: ... })`）
- 能力/设置的 `title` 与面向用户的说明（`userConfig.*.title`）

## 不要翻译（保持英文）

- `$.tool.register({ description, inputSchema })` —— 这些是给模型看的
- `skills/` 目录下的一切
- 代码注释、变量名、函数名、日志与调试信息
- 测试文件（`*.test.ts`、`*.test.tsx`）
- prompt 片段、模型指令、错误码
- 文件路径、命令行、API 标识符、hook 事件名

## 硬性要求

1. 只改字符串字面量的内容，**不要动引号、转义、模板字符串结构**。
2. 改完每个文件后必须语法可解析；不能确定是否是用户可见文字时，**保持英文不改**。
3. 不要改动 README（已翻好）、不要改 marketplace.json、不要 git 提交。
4. 报告时列出改了哪些文件、翻了多少条。
