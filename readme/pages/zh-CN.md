# Claude Code 模组精选

{{languages}}

**逐个挑选、校验、固定版本。添加一次，{{count}} 个模组随装随用。**

> **全部 {{count}} 个模组已完整汉化。** 界面文字、命令、面板、提示与说明文档均为简体中文；插件源码已内置在本仓库，安装后即显示中文，无需额外设置。仅代码标识符、hook 事件名、技能（skills）与模型调用说明保留英文，以保证功能不变。

模组是用函数钩子写成的 Claude Code 插件：可以观察、修改或接管 Claude Code 的行为，也能绘制自己的界面。这个市场收录了社区里最好的模组。每一个都用 `claude plugin validate` 校验过，并固定在校验时的 commit 上，作者之后的改动不会未经审核就到你这里。

需要 Claude Code 2.1.287 或更高版本。

## 安装

在 Claude Code 终端会话中输入：

```
/plugin marketplace add claude-code-mods/claude-code-mods-zh
/plugin install <模组名>@claude-code-mods-zh
```

例如 `/plugin install terminal-browser@claude-code-mods-zh`。运行 `/plugin marketplace update claude-code-mods-zh` 获取新模组和更新。

## 目录

每张卡片的**权限**是校验器报告的、该模组除绘制界面以外还能做的事。安装前请先看看它的源码：校验只是静态读取代码，并不运行它，也不等于安全审计。

{{catalog}}

## 推荐模组

开一个 issue，附上模组仓库的链接。也可以自己添加：在 `community.json` 里加一条（仓库、目录、审核过的 commit、分类、许可证），在 `readme/summaries.json` 里写上一句话简介，运行 `python3 scripts/build-catalog.py`，然后提交 pull request。

## 致谢与本地化

每个模组归其原作者所有，沿用各自的许可证。本仓库在收录之外还做了**简体中文本地化**：把插件内置到 `mods/` 目录，翻译界面文字、命令说明、面板与提示，并翻译各模组的说明文档（原版文档保留为 `README.en.md`）。原作者与许可证在每份文档末尾注明。若你希望移除本地化副本或调整署名方式，请开 issue。

非官方项目，与 Anthropic 无关。
