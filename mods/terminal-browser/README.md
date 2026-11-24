# terminal-browser Claude Code 插件（中文版）

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。


> 本插件为实验性功能，存在一些[已知限制](#注意事项)。

https://github.com/user-attachments/assets/a79e7667-6fcb-49a4-9967-44d0f942102c

## 安装

安装 terminal-browser：
```
curl -fsSL https://terminal-browser.sh/install | bash # 或 brew install terminal-browser
```

确保 Claude Code 是最新版本：
```
claude update
```

在 `~/.claude/settings.json` 中加入以下配置以启用 Claude Code 的界面插件：
```json
{
  "env": { "CLAUDE_CODE_ENABLE_FUNCTION_HOOKS": "1" }
}
```

安装 terminal-browser 插件：
```
# 设置 marketplace
claude plugin marketplace add zenbu-labs/terminal-browser

# 安装插件
claude plugin install terminal-browser@terminal-browser
```

现在可以在 Claude Code 中输入 "/browser" 打开浏览器。

### 更新

更新 Claude Code 插件：
```
claude plugin update terminal-browser@terminal-browser
```

更新 terminal-browser：
```
terminal-browser upgrade
```

### 配置

你可以配置该插件，让 Claude 使用一个工具来打开浏览器。此功能默认关闭，因为 Claude 已可通过 `terminal-browser` CLI 在终端分屏中打开浏览器。在 `~/.claude/settings.json` 中加入以下内容即可启用：

```json
{
  "pluginConfigs": {
    "terminal-browser@terminal-browser": {
      "options": {
        "agentTool": true
      }
    }
  }
}
```

## terminal-browser 插件 API

该插件附带一个 API，可在另一个 Claude Code 插件中以编程方式打开浏览器并加载 URL。可用它构建的实用插件示例：
- `/tldraw` 斜杠命令：在 Claude Code 分屏中打开 tldraw
- `/open-pr` 斜杠命令：打开当前分支关联的 PR

```typescript
export type BrowserOpenInput = { url?: string }

export type BrowserOpenResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

export type Browser = {
  open: (input: BrowserOpenInput) => Promise<BrowserOpenResult>
  close: (input?: Record<string, never>) => Promise<boolean>
}

// 用法：在你的插件 hooks 模块中
on('command.run', { command: 'tldraw' }, async ($) => {
  const result = await $.browser.open({ url: 'https://www.tldraw.com/' })
  return { text: result.ok ? '已打开 tldraw' : result.error }
})
```

## 工作原理

terminal-browser 使用 [kitty 图形协议] 在终端内显示由真实浏览器生成的像素。为了在 Claude Code 内显示浏览器，我们使用了 Claude Code 新的[函数钩子 API](https://github.com/anthropics/claude-code/issues/91870)。

terminal-browser 的内部实现已提取为 JavaScript 库 —— https://github.com/zenbu-labs/terminal-browser/tree/main/pixel —— 如果你想在 Claude Code 或终端内构建图形应用，可以参考。

## 支持的终端

该插件只能在支持 [kitty 图形协议] 并实现 [kitty unicode placeholders](https://sw.kovidgoyal.net/kitty/graphics-protocol/#unicode-placeholders) 的终端中运行。常见的支持终端：
- [ghostty](https://ghostty.org)
- [kitty](https://sw.kovidgoyal.net/kitty/)

如果你的终端不支持所需功能，在 Claude Code 中打开浏览器可能导致 TUI 乱码。

任何基于 libghostty 构建的终端也都支持，例如：
- [cmux](https://cmux.com/)
- [supacode](https://supacode.sh/)

更多基于 libghostty 的终端：[awesome-libghostty](https://github.com/Uzaaft/awesome-libghostty)

即使终端支持图形功能，如果运行了多路复用器，插件也可能不工作，因为多路复用器会重写终端输出、破坏终端图形命令。tmux 支持即将到来（terminal-browser 目前可在 tmux 中工作，但还不能通过 Claude Code 插件使用）；在 herdr 中通过插件运行性能很差，但可能很快改善。其他多路复用器尚未测试，如不可用请提 issue。

## 注意事项

- 依赖终端支持 [kitty 图形协议]
- 鼠标位置有时会略有偏差，因为 Claude Code 没有启用像素坐标鼠标上报
- 插件需要向本地 HTTP 服务器发起 fetch 请求以与 CLI 通信，操作系统可能提示终端想访问本地网络
- Claude Code 为聊天区设置了很大的最小宽度，有时无法把浏览器调整到想要的大小
- 插件依赖实验性的函数钩子 API，该 API 不稳定，插件可能在不同版本间失效

[kitty 图形协议]: https://sw.kovidgoyal.net/kitty/graphics-protocol/

## 出处与许可证

- 原作者：[zenbu-labs](https://github.com/zenbu-labs/terminal-browser)
- 原仓库：https://github.com/zenbu-labs/terminal-browser
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
