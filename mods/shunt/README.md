# shunt

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

一个 **Claude Mod** —— 一个 Claude Code 插件，其行为是一个[函数钩子](https://github.com/anthropics/claude-code/issues/91870)模块 —— 在提示行上方的状态带中显示用量：如果配置了 [shunt](https://github.com/pleaseai/shunt) 网关，则显示该网关共享账户池的用量；否则显示会话自身的 Claude 速率限制。它还以该池的完整明细回答 `/shunt:usage`。

```
shunt · 5H 5% ↻1h 41m · WK 46% ↻1d 7h · Fable 31% ↻1d 7h ⚠ anthropic degraded
```

```
> /shunt:usage

shunt: pool — degraded   http://127.0.0.1:3001

  5h    ▓▓▓▓▓▓░░░░  62% left   resets 04:11
  7d    ▓▓▓▓▓▓▓▓░░  81% left   resets Sun 01:11
  fable ▓▓░░░░░░░░  19% left   resets Sun 01:11

  claude  ok         5h  71%  7d  84%  fable  19%
  codex   exhausted  5h   0%  7d  40%  fable    —

  headroom left, averaged over the pool's accounts; a shared figure, not a promise about your next request
```

该 mod 读取网关的 [`GET /usage`](https://shunt.sh/reference/endpoints/) 端点并打印出来。命令由它自己回答 —— 钩子直接返回而不调用 `next`，因此不向模型发送任何内容，回答不消耗 token。

## 状态带

在 shunt 网关上，状态带显示该池，标记为 `shunt ·`。每个数字是窗口已被**使用**的比例 —— `1 - remaining`，即命令报告的余量同一池级均值 —— 后跟到该窗口最早重置的时间。用“已用”而非“剩余”，使其读数与 Claude Code 自己的 `/usage` 以及 shunt 的状态带一致。数字从 70% 转琥珀色，90% 转红色。每个状态非 `ok` 的池化提供方在末尾被标记（`⚠ anthropic degraded`：`degraded` 为琥珀色，`exhausted` 或 `capped` 为红色）；若无提供方被列出，则标记池本身。任何账号都不报告的窗口会被省略。

不在 shunt 上时（未设置网关、网关对 `GET /usage` 返回 404、成功响应不是池报告，或报告不含任何提供方），状态带改为显示会话自身的速率限制，不带标记，如 `$.session.usage()` 和 `session.measure` 所报告：

```
5H 5% ↻1h 41m · WK 46% ↻1d 7h
```

在 shunt 上，它在会话启动时读取 `GET /usage`，之后每分钟一次，并在每轮结束后读取一次（即池刚被消耗的时刻），且忽略会话自身限制，因为那些限制来自最后一个应答的池账号。被拒绝的令牌（401 或 403）、不可达的网关、其他错误状态，或失败的 `shunt gateway token` 辅助程序，都算 shunt 故障，因此会被标记而非替换：`shunt · ⚠ credential refused`，或辅助程序情形下的 `shunt · ⚠ gateway login unavailable`。若既无网关也无速率限制（API key 直连 Anthropic），状态带不绘制任何内容。其他插件在状态带中绘制的内容保留在其左侧。

用状态带的 `[-]`（ctrl+x ctrl+a）为会话折叠它，或用下文的 `usageBand` 选项关闭它。

## 读懂数字

`remaining` 是池中合计容量仍**可用**的比例，因此 `62%` 表示仍有 62% 的余量，而非已用掉 62%。它是在报告该窗口的非禁用账号上 `mean(clamp(cap - utilization, 0, 1))`，其中 `cap` 是该账号在该窗口的 `max_utilization` 硬上限（未设置时为 `100%`）：九个耗尽账号加一个全新的无上限账号读作 `10%` 而非 `100%`，而 50% 上限下已用 44% 的账号只计 `6%`。被上限已排除于该窗口请求之外的账号计零；5h 或 7d 上限会把它从所有请求（含 Fable）中排除。

它是**池级汇总，不是预测** —— 路由还会权衡可用性、模型、会话亲和性与优先级，因此健康的数字不保证你的下一次请求会被受理。若要按路由考虑的最坏情况，请改用 `GET /api/oauth/usage`。

| 窗口 | 覆盖范围 |
| --- | --- |
| `5h` | 滚动 5 小时会话窗口 |
| `7d` | 共享每周窗口 |
| `fable` | Fable 范围的每周窗口（`7d_oi`） |

当无未禁用账号报告某窗口时，它显示 `—`。ChatGPT/Codex 账号从 `x-codex-*` 响应头填充 `5h` 和 `7d`，且没有自己的 Fable 范围信号。

`pool` 是每个池化提供方之上的汇总；其下的各行是按提供方的同一汇总，因此被路由到一个提供方的会话可以读取该提供方的余量，而非混合数字。该端点从不携带账号名、计数、优先级或按账号的数字 —— 那些细节留在仅限管理员的 `GET /admin/api/pool` 后面。

## 前置条件

1. **让 Claude Code 指向你的网关**，如同你为经它路由已做的那样：

   ```bash
   export ANTHROPIC_BASE_URL=http://127.0.0.1:3001
   export ANTHROPIC_AUTH_TOKEN=<你的客户端 token>
   ```

2. **在网关上启用该端点**。`GET /usage` 是选择性加入，需要 `[server.auth]`（客户端 token）或 `[server.gateway]`（网关登录），位于 `shunt.toml` 中 `[server.usage]` 表旁边：

   ```toml
   [server.auth]

   # 仅存在即表示启用；该表不带键。
   [server.usage]
   ```

   若用 `[server.gateway]` 替代 `[server.auth]`，见下文 [`shunt gateway claude` 会话](#shunt-gateway-claude-会话)。`[server.auth]` 的 token 取自环境而非 TOML —— 默认为 `SHUNT_CLIENT_TOKENS`，以 `name:token` 对形式 —— 未设置时网关会启动失败。请在运行网关处导出它，使用与上文 `ANTHROPIC_AUTH_TOKEN` 相同的 token：

   ```bash
   export SHUNT_CLIENT_TOKENS="claude-code:<你的客户端 token>"
   ```

3. **以启用函数钩子的方式运行 Claude Code** —— 该功能为早期访问：

   ```bash
   CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude
   ```

没有步骤 3 就没有状态带，命令仍存在但会回退到 `commands/usage.md`，它会要求模型用工具调用去读取端点。

## 安装

```
/plugin marketplace add pleaseai/shunt
/plugin install shunt@shunt
```

## 配置

一个选项，`/config` 中的一行（存于 settings.json 的 `pluginConfigs` 下）：

| 选项 | 默认 | 作用 |
| --- | --- | --- |
| `usageBand` | `true` | 在提示行上方显示状态带。关闭后 mod 不注册状态带也不轮询任何内容；`/shunt:usage` 仍会回答 |

该 mod 读取五个环境变量，不写入任何变量。默认情况下，它把会话自身的凭据发送给会话本就在向其发送每条消息的网关，因此不会触达会话原本不使用的任何主机；`SHUNT_BASE_URL` 是有意的例外，会把请求指向你指定的网关。若完全未设置 base URL，它什么都不问，而不是把凭据发给 Anthropic API。

| 变量 | 作用 |
| --- | --- |
| `SHUNT_BASE_URL` | 网关 base URL；覆盖 `ANTHROPIC_BASE_URL` |
| `ANTHROPIC_BASE_URL` | 本会话已通过其路由的网关 |
| `SHUNT_TOKEN` | 客户端 token；覆盖以下两者，以 `Authorization: Bearer` 发送 |
| `ANTHROPIC_AUTH_TOKEN` | 以 `Authorization: Bearer` 发送，如 Claude Code 所发 |
| `ANTHROPIC_API_KEY` | 以 `x-api-key` 发送，如 Claude Code 所发 |

`SHUNT_BASE_URL` 让你能在流量经另一个网关路由时，读取某一个网关的池。

### `shunt gateway claude` 会话

`shunt gateway claude` 会从它交给 Claude Code 的环境中清除 `ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_API_KEY`，并把 `apiKeyHelper` 接到 `shunt gateway token`；Claude Code 自行使用辅助程序的输出，且从不重新导出它。因此，当上述变量都没有凭据时，该 mod 会读取合并后的设置（含 `--settings`），若 `apiKeyHelper` 是 shunt 自己的（按裸名或按路径，如启动器所写 `shunt gateway token`），就直接运行它（不经 shell），并把其打印的网关登录 token 以 `Authorization: Bearer` 发送。因为没有 shell，未加引号的辅助程序路径中以 `~/` 开头的部分会由该 mod 自行展开为主目录（`HOME`，否则 `USERPROFILE`）；加引号的 `'~/…'` 则保持字面值，如在 shell 中。该登录属于会话所交谈的网关（`ANTHROPIC_BASE_URL`），因此仅在 `SHUNT_BASE_URL` 未设置或拼写同一 base URL 时才发送（比较前会去除空白和尾部斜杠，因此 `localhost` 与 `127.0.0.1` 视为不同）—— 否则辅助程序甚至不会被运行；要读取另一网关的池，请为其导出 `SHUNT_TOKEN`。若该辅助程序失败（非零退出、无输出，或无法启动），状态带会标记 `shunt · ⚠ gateway login unavailable`，且 `/shunt:usage` 会提示运行 `shunt gateway login`，而不是静默显示会话自身限制。

token 复用五分钟，因此每分钟一次轮询不会每分钟运行辅助程序。被网关拒绝的复用 token 会被丢弃，并再请求辅助程序一次，因为刷新可能已轮换它。任何其他 `apiKeyHelper` —— 密码管理器、会提示的脚本 —— 绝不会被运行：否则该 mod 会为用量数字每几分钟运行它一次。在这类会话中，请改为为 `[server.auth]` 客户端 token 导出 `SHUNT_TOKEN`，否则状态带会回退到会话自身速率限制。

网关必须在 `GET /usage` 上接受网关登录，这需要一个在该处对 `[server.gateway]` 登录进行认证（authtenticate）的 shunt 构建；只配置 `[server.gateway]` 的 `[server.usage]` 即已足够。

## 为什么是 `/shunt:usage` 而不是 `/usage`

`/usage` 是 Claude Code 自己的内置命令，引擎不允许插件占用内置名称：

```
$.command.register: "/usage" refused: it is the built-in /usage
```

`$.command.register` 只接受裸的、全局的名称。插件的 **markdown** 命令则按插件命名空间，因此名为 `shunt` 的插件中的 `commands/usage.md` 会显示为 `shunt:usage`，不与任何内容冲突。hooks 模块随后拦截该名称的 `command.run` 并直接回答。

## 布局

| 路径 | 是什么 |
| --- | --- |
| `hooks/register.tsx` | 钩子：`shunt:usage` 上的 `command.run`，以及状态带在 `AbovePrompt` 上的 `session.start`、`session.measure`、`turn.complete` 与 `ui.render` |
| `hooks/endpoint.ts` | 解析网关 URL 与凭据头 |
| `hooks/report.ts` | 防御性地读取 `GET /usage` 响应体 |
| `hooks/reading.ts` | 把一次往返变成完整或简略的报告或问题 |
| `hooks/views.ts` | 渲染命令的条、百分比与重置时间 |
| `hooks/band.ts` | 状态带的单元格、告警、等级与倒计时，取自池或会话自身限制 |
| `hooks/names.ts` | 命令名与固定文本 |
| `types/index.d.ts` | `$.state` 契约：池快照、会话限制与状态带绘制所用的时钟 |
| `commands/usage.md` | 命令本身，以及无函数钩子时的回退 |
| `tests/*.spec.ts` | 纯模块的 Vitest 套件 |
| `tests/mod/*.test.tsx` | 由 `claude plugin test` 运行的引擎套件 |

## 开发

```bash
# 静态副作用分析：挂了哪些事件、调用了哪些 $ 与读取了哪些环境变量。
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin validate plugins/shunt

# 纯模块的套件与类型检查（两者均为 CI 关卡）。
cd plugins/shunt && npm ci && npm run typecheck && npm test

# 用引擎本身测试钩子：状态带与命令，且网关、时钟与环境均已模拟。
# 需要 Claude Code 二进制，因此 CI 不运行它。
claude plugin test plugins/shunt

# 从源码针对真实网关运行。
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir plugins/shunt
```

`hooks/register.tsx` 是唯一导入 `claude-code` 的 hooks 文件。类型检查它需要引擎自身的 `claude-code.d.ts`，Claude Code 会通过 `/plugin-types` 写入插件作者的工程；其他模块不从引擎导入任何东西，因此套件无需它即可覆盖它们。同理，`tsconfig.json` 把 `hooks/register.tsx` 排除在 `npm run typecheck` 之外，连同引擎套件 `tests/mod` —— 该排除是有意的，而非疏忽；要对那个文件做类型检查，意味着先运行 `/plugin-types`。

> 函数钩子是早期访问。hooks 模块只在启用处加载，而本 mod 所针对的 API 可能在 Claude Code 版本之间不经通知地变更。

## 出处与许可证

- 原作者：[pleaseai](https://github.com/pleaseai/shunt)
- 原仓库：https://github.com/pleaseai/shunt
- 许可证：MIT 或 Apache-2.0（与 shunt 项目一致）
- 中文翻译与界面本地化：claude-code-mods-zh 项目
