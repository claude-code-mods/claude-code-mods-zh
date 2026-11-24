<picture>
  <source media="(prefers-color-scheme: dark)" srcset="site/assets/cache-tax-dark.svg">
  <img src="site/assets/cache-tax-light.svg" alt="Cache Tax" width="64" height="64">
</picture>

# Cache Tax for Claude Code（中文版）

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

**在你离开时保持 Claude Code 的提示词缓存温热。**

Cache Tax 是一个 Claude Code mod：当你离开一会儿时刷新你的提示词缓存，并在冷启动发送前显示估算的重写成本。休息前运行 `/keepwarm 90m`。探测（ping）会消耗 token，请选择你预期会在窗口内返回的时长。

**[安装](#安装)** · [官网](https://cachetax.aidojo.si/) · [工作原理](#工作原理) · [成本与套餐限制](#成本与套餐限制) · [命令](#命令)

![真实录屏：cache-tax 以 6.61 美元估算值拦截一次冷启动发送](https://github.com/karanb192/cache-tax/raw/main/site/assets/refusal.gif)

在一个 330k token 的会话中，一次两行的回顾触发了 **$6.61 的估算**。重新发送后，报告的实际缓存写入为 **$6.28**。录制于 2.1.1；当前措辞为“最多”该估算 token 数。这些是与 API 等价的成本，不是额外的订阅费用。

## 安装

需要 [Claude Code 2.1.287 或更高版本](https://code.claude.com/docs/en/plugins/mods/overview#turn-mods-on-or-off)、一小时缓存，且 Claude Code 保持运行。mod 默认开启。探测会消耗 token，包括不封顶的输出。

```sh
claude plugin marketplace add karanb192/claude-code-mods
claude plugin install cache-tax@claude-code-mods
```

重启 Claude Code，或在打开的会话中运行 `/reload-plugins`。不需要早期访问标志。如果你之前设置过 `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`，请将其移除；当前 Claude Code 会忽略它。

在温热的会话中，运行 `/keepwarm` 来武装六小时。用 `/keepwarm 90m` 设置更短的窗口，或用 `/keepwarm off` 停止。

**确认主缓存的生命周期。** 订阅套餐的默认值是一小时。API key、用量额度和云提供商的会话默认是五分钟，请把这些计费路径的 [`promptCacheTtl`](https://code.claude.com/docs/en/prompt-caching#choose-the-ttl-yourself) 设为 `"1h"`。50 分钟的定时器无法保护五分钟的主缓存。关于分叉（fork）证据见[限制](#限制)。

**想用 settings hook 版本？** [hook 版](https://github.com/karanb192/claude-code-hooks/tree/main/plugins/cache-tax) 默认只警告，设置 `CACHE_TAX_BLOCK=1` 时会拒绝一次，并提供独立的状态行倒计时。预热是本 mod 的一部分。

由 [Karan Bansal](https://karanbansal.in/) 构建。阅读 [Cache Tax 的故事与实测缓存成本](https://karanbansal.in/blog/cache-tax/)。

## 选项

在 `/config` 中，找到 cache-tax：

    Auto keepwarm:    on | off
    Display:          band | status
    Ping floor:       2 (一个数字，0 或以上)
    Headless prompts: guard | send

`on`（默认）保留当前行为：当你支付了一次冷缓存写入后，keepwarm 会自动武装三小时。`off` 则在你用 `/keepwarm` 武装前不会自动启用；此时守卫的措辞会说 keepwarm 保持关闭，或会说明你已武装的窗口还剩多少时间。无论哪种情况，`/keepwarm always` 都仍会武装。

Ping floor（探测下限）把估算的冷重写成本分摊成一个空闲休息预算：填 2 允许估算探测花费低于一次重写的一半；填 0 则禁用该限制。探测前，本次休息已观察到的花费加上下一次探测的估算必须低于该预算。估算采用最近五次温热回执中最便宜的那次，并按当前模型和上下文重新定价（含其提示词档位）。新的主回合会重置花费；延长、停止或重新武装窗口则不会。被跳过的探测会让缓存自然变冷。日志和状态会说明原因，且 `$.cacheTax.status()` 会暴露 `pingSkipped` 和 `idlePingUsd`。

第一次探测没有回执，所以会发出。之后的回答可能比估算更贵，因此这是基于估算的限制，不是保证的最大账单。如果没有模型价格、上下文或已定价的回执，则无法比较。回执与花费都在内存中：重启或新会话会清空它们。探测可能在请求的预热窗口结束前就停止。

Display 选择在 keepwarm 武装时状态显示在哪里。`band`（默认）是提示行上方的一行：终端中是文本图标，桌面端是立方体图标。`status` 把同样的文本放到提示行下方的状态条目中，不绘制任何一行——当另一个 mod 占用了提示行上方区域时适用。没有隐藏它的设置：探测会消耗 token，所以屏幕始终要说明它们何时运行。

## 工作原理

**休息前：** `/keepwarm` 武装一个有界窗口。50 分钟空闲后，Claude Code 内部的一个定时器会基于会话的转录发送一次无工具的 fork。它每次探测后读取用量，当读取为 0 或写入达到读取的 10% 时停止。空闲花费限制可以在窗口结束前跳过后续探测。没有后台转录轮询循环。

**当你冷启动返回时：** 对于至少 50,000 token 的上下文，守卫会在其一小时时钟判定为冷时，在你发送普通消息前询问。问题会显示估算的重写成本和预热建议。**仍然发送**会发送该消息；**不要发送**则丢弃它。如果对话框被关闭或宿主无法回答，守卫会拒绝一次，而重发会顺利通过。能回答对话框的 SDK 宿主会保留该选择。`/cache-tax guard refuse 5` 表示在 5 美元及以上时询问（包括没有价格行的模型）；更便宜的发送会记录其价格并继续。

`Headless prompts: send` 让非交互的 `sdk` 来源提示在默认守卫设置下立即发送。Claude Code 对 `claude -p` 和 Agent SDK 回合使用相同的字段，因此该选项同时覆盖两者；它无法区分 CLI 与 SDK 宿主。默认值 `guard` 会继续询问，或在没有人能回答时拒绝一次。显式的 `/cache-tax guard refuse`（无论是否带美元下限）在 `send` 下仍然生效；`/cache-tax guard default` 会清除该显式偏好。远程的人类消息（`composer`、`bridge`、`unclassified` 及频道来源）即使是非交互宿主也保留守卫。后台通知和定时提示会带价格记录地发送，因为没有人能重发它们。

无头（headless）拒绝会返回原因并记录到转录/调试日志。排查脚本时使用 Claude Code 的 `--debug-file`。mod API 无法设置进程退出码或把拒绝写入 stderr；拒绝不一定会产生非零退出码或 stdout 上的原因。命中美元下限的显式选择运行仍需有意地重试。

默认情况下，检测到冷写入会自动武装至少三小时的 keepwarm、始终窗口（默认六小时，除非你设置其他值）且 `always` 开启，并打印其成本；Auto keepwarm 选项会关闭自动部分。`/cache-tax` 显示当前缓存估算、预热窗口以及本会话的冷写入累计。

累计跟随缓存回执。对每个请求，它估算旧上下文被重新写入的量，取“报告的写入”与“先前上下文减去报告的读取”中较小者。小于读取 10% 的缺失尾部视为缓存命中。命中上的新内容不计入也不会武装 keepwarm；但实质性的部分重写仍可能计入。每次重写使用该请求的模型与价格档。

如果宿主只报告累计的回合用量，估算可能漏掉被后续缓存读取掩盖的重写；而未按请求提供回执的、经过压缩的回合则不会被计分。

当守卫允许发送但检测到没有重写时，完成提示会说明没有打开自动冷写入窗口，或说明已有的预热状态。这并不确认服务端的缓存状态（基于累计用量）。被 `/clear` 打断的冷写入完成无法在替换会话中打开它的自动窗口。

准备或跳过压缩不会改变预热。已应用的压缩会暂停预热，直到某个主请求读取或写入新前缀。武装的窗口随后可以在回合等待工具或用户回答时恢复探测。摘要写入不计入累计；压缩前已支付的重写保留其原始上下文与价格。

窗口属于单个会话。已经变冷的会话会等待你的下一轮再探测；Claude Code 重启后恢复的窗口也是如此，直到新进程有一轮可以 fork。如果一次探测发现没有可 fork 的内容，会一次性用一行提示说明，随后探测会在你的下一条消息后开始。被繁忙的 API（429、529、5xx）拒绝的探测会在 1、2 和 4 分钟后重试，前提是仍能赶在缓存变冷之前到达。当 `always` 开启时，你每一轮触达缓存的回合都会在默认周期内至少留下始终窗口（默认六小时），受空闲花费限制和成功温热回读约束。`/keepwarm always 24h` 把该下限改为 24 小时（对每个会话；范围 1h 到 168h；裸 `/keepwarm always` 回到六小时）。同一回合会恢复已停止的窗口、把较短的窗口拉长到始终窗口，并重置测试周期；你设置的更长窗口则保留。任何会话中的 `/keepwarm off` 都会从下一轮起停止每个会话的滚动。窗口在其截止时间结束；`/keepwarm off` 也会取消它并清除 always 设置。

### 一次实测的预热探测

![真实 keepwarm 状态显示以 0.02 美元读取 75k token](site/assets/keepwarm-receipt.png)

Sonnet 5，2026 年 9 月 16 日：状态报告 **75k token，读取花费 $0.02**。实时运行期间对话中没有任何内容出现。该截图使用的是 2.0.0 上的一分钟测试间隔；其卡片的 $0.45 重写估算使用了旧版 Sonnet 价格行，而当前价格行对相同上下文为 $0.30。两美分的探测是该会话的回执，不是固定价格。

## 为什么短消息也可能很贵

当缓存前缀过期时，即使是“给我一个回顾”也可能在回答前触发旧上下文的重写。Cache Tax 的 Fable 5.1 价格行对比了每百万 token $20 的一小时写入与 $0.25 的缓存读取：每 token 相差 80 倍，而非总节省相差 80 倍。参见[定价假设](#成本与套餐限制)和 [Anthropic 价格表](https://platform.claude.com/docs/en/about-claude/pricing)。

[观看 23 秒概览](docs/assets/cache-cost-explainer.mp4)。其设计场景标注的是 Fable 5.1 的标价；每个终端与状态行像素都来自上文的真实拒绝录屏与预热回执。拒绝录制于 2.1.1，预热截图截于 2.0.0。

不熟悉缓存？[Anthropic 解释了 Claude Code 如何使用它](https://code.claude.com/docs/en/prompt-caching)。

## 命令

    /keepwarm               保持温热六小时
    /keepwarm 90m           按你自己的窗口保持温热，1m 到 168h（也支持 2h30m、6h）
    /keepwarm always        让每个会话在其最后一轮后六小时内保持温热，跨会话记住
    /keepwarm always 24h    同上，直到最后一轮后 24 小时（1h 到 168h）
    /keepwarm 6h every 2m   每两分钟探测一次；测试旋钮，1m 到 59m，本窗口结束后忘记（always 开启时于你的下一轮）
    /keepwarm status        预热窗口、下次探测和最近回执
    /keepwarm off           停止、忘记窗口，并关闭 always
    /cache-tax              卡片
    /cache-tax guard warn   显示价格并发送（hook 的默认）
    /cache-tax guard default
                            恢复默认守卫，并让 Headless prompts 控制非交互 SDK 发送
    /cache-tax guard refuse 冷启动发送前询问，覆盖 Headless prompts: send
    /cache-tax guard refuse 5
                            仅在 5 美元及以上时询问；低于该值时显示价格并发送
    /cache-tax guard test   在你发送的下一条提示上像缓存是冷的一样询问一次，按本会话上下文定价；测试不计分，真正冷缓存中的发送照常计分

`/keepwarm` 会拒绝多余的词、无效时长以及超出限制的窗口，且不改变当前预热窗口。它启动时也会丢弃无效或过长的已存截止时间。在其首次探测到期前结束的窗口会在回复中说明这一点。

问题原文，其下为 **Send anyway ($4.01)** 与 **Don't send**：

    cache-tax: 提示词缓存在 2h00m 前变冷。发送此消息会重写最多 200,502 个 token，按 $20/MTok = $4.01（温热回合的成本本应只有 $0.05）。不要发送可省下 $4.01；发送后 keepwarm 会武装最多 3h00m。仅缓存读取每次探测约 $0.05。探测可能更早停在空闲花费限制，让缓存变冷。仍然发送？

当问题被关闭、或有守卫的无头运行无法展示它时，改为显示拒绝文本，且重发会顺利通过：

    cache-tax: 提示词缓存在 2h00m 前变冷。发送此消息会重写最多 200,502 个 token，按 $20/MTok = $4.01（温热回合本应只花 $0.05）。重新发送一次即可支付它，keepwarm 随后会武装最多 3h00m，但可能更早停在空闲花费限制。或者 /clear 并从头以一条笔记开始。

该数字是上限。引擎为恢复会话报告的上下文计数是最后一次响应的输入、缓存读取、缓存写入和输出之和，而恢复载荷没有单独的输出计数可供扣除；在一个 15 天前的会话上，守卫说 330,316 token、$6.61，而随后的写入为 314k token、$6.28。

当 keepwarm 武装时，终端和桌面 Code 标签页会在提示行上方显示一行，除非 Display 为 `status`。终端使用加粗的 `[>]` 文本图标并使用状态色。桌面端显示 Cache Tax 立方体，温热时盖为绿色、冷时为橙色，首轮前或压缩后为灰色。加粗的状态标签一致；计时器与回执文本使用常规字重。非空的 `NO_COLOR` 会在两种界面上选择加粗文本图标并移除状态色。两种显示选择都会显示 `warm`、`cold` 或 `unknown`，因此颜色永远不会是唯一信号。这些状态使用与 `/cache-tax` 相同的一小时时钟；它们是估算，不是对服务器缓存的实时检查。

当 keepwarm 武装时，该行和纯状态回退每分钟刷新一次，空闲时也刷新。刷新只更新显示，不发送模型请求。

该行包含预热窗口、下次探测和最近回读。已停止的循环显示一个中性符号及其原因。`/keepwarm off` 或窗口过期会移除该行。问卷会临时优先，其他 mod 的内容仍留在状态带中。Display `status` 会在状态条目中显示同样的带标签文本；没有状态带的界面上若 Display 仍为 `band`，则保留纯状态文本。

桌面的立方体和终端的冷状态色会跟随 Claude 的浅色或深色主题。内嵌 SVG 来自官网的官方资源；维护者可用 `python3 tools/generate-status-icons.py` 重新生成。运行时不会读取或获取任何图像文件。

mod 在会话启动时读取一次主题和 `NO_COLOR`。被接受的主题变更会立即更新图标；普通重绘不会重新读取任一设置。请在启动会话前设置 `NO_COLOR`。

## 两者都安装了

hook 与 mod 共用一个名称和一项工作，同时拥有两者意味着每次冷启动发送都有两道守卫。mod 会在会话启动时检查 hook 的 `/cache-tax:status` 命令是否存在，并一次性说明。只保留一个守卫。hook 仍是偏好 settings hook 的用户可选方案。卸载它之前，检查你的状态行：接到 `cache-tax.js` 的 🧊 行来自 hook 的文件。本 mod 在 keepwarm 武装时在提示行上方绘制；它不会替换你的 shell 状态行。

## 它能触及什么

已在 Claude Code 2.1.312 上验证：

    ❯ ./register.ts hooks: config.set{key=theme}, ui.render{component=AbovePrompt}, session.start, session.end, classic.SessionStart, command.run{command=keepwarm}, command.run{command=cache-tax}, prompt.submit, turn.step, turn.complete, session.compact
    ❯ ./register.ts calls: $.clock.after (via arm, ping), $.clock.every (via updateStatus), $.clock.now, $.command.list, $.command.register, $.config.list, $.env.get, $.model.fork (via ping), $.session.id (via reseat, seat), $.session.model, $.session.usage, $.store.delete, $.store.get, $.store.set, $.ui.ask (via ask), $.ui.invalidate, $.ui.log, $.ui.resolve, $.ui.status
    ❯ ./register.ts env reads: NO_COLOR

Reach L2，驱动 Claude。看到你输入的每个提示、每个模型请求的时机和每次回答的 token 数。

同一份扫描结果见 [cache-tax 在 Awesome Claude Code Mods 的页面](https://mods.aidojo.si/mods/karanb192--cache-tax--cache-tax/)，其中记录了数千个其他 mod 的可触及范围。

    cache-tax 威胁模型（reach L2，驱动 Claude）
    1. 读取：每个提示是否以斜杠开头且别无其他内容（文本原样传递，从不保留、从不记录）；时间；回合完成和 fork 回复上引擎已持有的 token 计数与模型 id；Claude Code 为 settings hook 计算的恢复字段；命令列表；本进程运行每个会话一次的 session id、会话模型以及引擎自身的上下文数字和开始时间，且在定价冷启动发送和每次探测前再次读取模型；在 /clear 或进程内恢复下结束的会话的原因与 session id；每个主请求的消息数；来自其自身 $.store 的、按 session id 键入的 keepwarm 截止时间与探测周期，以及全局 always 开关（及其窗口）和带美元下限的守卫模式；加载时读取其 Auto keepwarm、Display、Ping floor 与 Headless prompts 选项；会话是否以交互方式启动
    2. 运行：keepwarm 窗口内每段空闲一次的 $.model.fork，每个探测周期一次（除非测试旋钮设置，否则 50 分钟，下限 1 分钟），绝不超出窗口，绝不落到 mod 已知为冷的缓存上，在一次回读什么也未读到或写入达到读取量的十分之一后绝不运行；在价格与回执已知时，仅在已观察到的空闲花费加上下一次估算探测低于重写成本除以 Ping floor（0 禁用限制）时运行；在冷启动发送发出前于 Claude Code 自己的对话框中提问一次，或在 `/cache-tax guard test` 后于你的下一条提示上提问
    3. 发送：除了 fork 之外没有任何东西离开本机——fork 是基于会话自身转录的一次 API 请求，带固定的单行提示
    4. 持久化：在 $.store 中，按本会话 id 存 keepwarm 截止时间与探测周期（always 开启时每轮后重写），以及对每个会话存 always 开关（true，或其毫秒窗口）和守卫模式（美元下限以其位置存储）；拒绝后，按本会话 id 存最近一次响应的时间，使新进程的 resend（claude -p 每轮启动一个）可以通过，由该 resend 或 /clear 删除；已结束的窗口在停止时和本会话下次启动时删除，连同 2.1.0 store 的裸键一起；这里绝不删除其他会话的键，因为“读取后删除”无法与那个会话续期其窗口做成原子操作，所以武装了 keepwarm 却再未返回的会话会留下两个小键；会话的冷写入累计、最多五条温热探测回执和空闲探测花费都在内存中，随进程消亡
    5. 敌意输入：它解析的唯一文本是其两个命令的参数，对照时长正则、美元金额和几个字面量匹配；对话框的回答只与其自身两个标签比较；提示文本只检查第一个非空白字符是否为斜杠；工具结果与文件绝不会进入分支；fork 的提示是常量，因此无法借它发送任何构造内容；守卫只会丢弃用户自己的消息：在“不要发送”后会再次询问 resend，在被关闭或无法回答的问题之后 resend 是无条件的；如果 hook 抛错，引擎会跳过它，消息无守卫地进入，并带一行灰色提示

## 成本与套餐限制

价格采用标价表：Fable 5.1 读取 $0.25、1h 档写入 $20、回答 $50（每百万 token）；Fable 5.2（$0.20、$16、$40）与 Sonnet 5（$0.20、$4、$10）各有自己的行。只有列出的版本会定价：比表更新的模型会显示 `n/a` 和一行“尚无价格行”的说明，且从不借用旧模型的费率。API key 上的算术很直接。一次探测按缓存读取、其自身少量未缓存 token 按基础费率、以及模型回复按输出费率计费；显示的探测成本包含全部，因为 fork 没有输出上限，且高 effort 的模型可能先说 “warm” 再展开思考。失效后的回归是一次写入。卡片会为你所选模型打印只读上限（Fable 5.1 为 80 次探测），以及当前探测周期下能覆盖的空闲时长；真实探测的成本略高于一次读取，因此真正的回本点位于该数字之下。订阅套餐上的美元是尺子而非账单，而缓存读取如何计入 5 小时与每周限制，在我能找到的任何地方都没有文档。请在第一个窗口期间留意状态行的速率限制行。

## 限制

- mod 需要 Claude Code 2.1.287+。它们默认开启，但本地设置、安全模式或组织策略可能阻止加载。参见 [mod 控制](https://code.claude.com/docs/en/plugins/mods/overview#turn-mods-on-or-off)。
- 50 分钟的计划需要一小时主缓存。订阅套餐默认具备。其他计费路径需把 [`promptCacheTtl`](https://code.claude.com/docs/en/prompt-caching#choose-the-ttl-yourself) 设为 `"1h"`。
- 默认间隔下的一次转录验证的返回，Fable 5.1 订阅，2026 年 9 月 19 日：`/keepwarm` 在休息第 42 分钟武装，探测在第 50 分钟触发并读取 157k，第 62 分钟发送的消息从缓存读取 156,886 token 并写入 2,255。Claude Code 自身的缓存倒计时在探测后重置为 58 分钟，因此 fork 携带了一小时的 TTL。一次运行、一种配置：它表明该探测使那个缓存活过了一小时，而非每种配置都能净省。Claude Code 在文档中把 fork 归入非主请求桶，通常为五分钟。在此运行中，fork 仍读取了一小时会话前缀并重置了原生倒计时。这是一次配置下的观察行为，而非所有提供方对分桶处理相同的证明。
- 一次读取温热的探测证明当时缓存是温热的。前缀变更无论时间如何都可能使缓存失效。确切效果取决于模型以及 Claude Code 何时应用变更；参见 [Claude Code 的缓存行为](https://code.claude.com/docs/en/prompt-caching)。
- 恢复字段让守卫能检查恢复后的第一次普通发送。若这些字段缺失，第一轮会自行播种其时钟与上下文。
- 在 Team 和 Enterprise 账号上，一个托管插件位于本 mod 之上，处理经典事件与压缩并继续在其下运行，因此它们永远不会到达本 mod。它随后从会话结束得知 `/clear`，使 keepwarm 停止，新会话得到自己的窗口；恢复转录的上下文取自引擎数字，但没有其最后响应的时间，因此从该转录首次启动起一小时后，第一条消息会记录冷启动发送的成本而非拒绝；压缩从少于前一条请求一半消息数量的请求识别（rewind 会减掉几条，摘要会替换几十条），因此压缩与该请求之间的探测或发送仍会看到旧上下文。压缩后写入的摘要永远不会被计为冷写入；同一回合在压缩前已支付的冷写入仍然计入（当宿主按请求报告用量时）。通过进程内恢复携带的窗口会迁移到新会话的键。
- 守卫的 token 计数是上限：它是引擎为最后一次响应报告的上下文，在恢复时包含该响应的输出，而 mod 没有单独的输出计数可减。
- 冷写入累计按会话且仅在内存中；`/clear` 会清空它。
- 上下文大小是引擎的实时窗口数字。一轮自身的用量是其各次响应的总和，在十步回合上是十次上下文读取，因此只在宿主没有实时数字时作为回退。

## 本地开发

从本地检出加载一个会话：

    claude --plugin-dir .

若要长期安装，请使用[市场命令](#安装)。

要提交改动？[CONTRIBUTING.md](CONTRIBUTING.md) 说明了 PR 需要哪些证据。

## 在你自己的会话上验证

模拟时钟测试证明定时器、守卫和计分，而非 fork 命中主缓存。一次探测即可证明，其成本是一次缓存读取加回答。在任意温热会话中：

    > 用一句话回复：ready
    > /keepwarm 1h every 1m

一分钟后在提示行上方观察，或在 Display 为 `status`、或界面没有状态带时观察状态条目。`last ping read 20k $0.01` 报告 fork 的回读。`keepwarm stopped: the ping read ... and wrote ...` 表示回读未达到温热阈值，循环已停止。`API busy, ping retry 1 of 3` 表示正在重试 429、529 或 5xx；若三次重试后 API 仍繁忙或距缓存变冷不足一分钟，循环会停止。`nothing to fork yet` 表示进程没有可 fork 的会话，如重启后；窗口会等待你的下一条消息。任何其他 API 错误、中断或空回复都会带原因停止循环。返回 null 的旧引擎会显示合并的冷快照或 API 失败消息。以 `/keepwarm off` 结束。这个简短检查证明了一次缓存读取，而非默认 50 分钟间隔下的保留。

## 测试与类型检查

从仓库根目录运行：

```sh
claude plugin validate .claude-plugin/plugin.json
claude plugin test .
```

[366 个测试](tests/register.test.ts) 使用模拟时钟与引擎，覆盖：

- **Auto keepwarm 选项：** off 对已支付的冷写入计分但不武装 keepwarm，并在拒绝与问题中说明；手动武装的窗口会守约到其截止时间并持续探测；always 仍会续期六小时。
- **Ping floor 选项：** 累计花费会停止长时间休息，主回合会重置它，重新武装不能重置，近期便宜回执在昂贵异常值后仍存在，模型切换会在下一次探测前定价，且在模型读取期间的 off 命令会取消该探测。跨停止计费的探测仍计数，回合结束后完成的则不计入，出错的回合会保留跳过。既有的跳过、压缩、清除、未知上下文和禁用限制的覆盖仍然保留。
- **Headless prompts 选项：** 非交互 SDK 提示的选择加入、SDK 对话框回答、交互 SDK 与远程人类守卫、显式拒绝与美元下限、恢复默认值，以及在已存偏好仍在加载时到达的提示。
- **守卫：** Send anyway / Don't send 问题、其关闭回退与守卫测试、拒绝一次并重发（包括新进程与无响应的 API 错误后）、warn 模式、美元下限（低于、等于、无定价模型、自上一回合起切换的模型）、斜杠命令、小上下文、无人输入的提示、恢复播种和冷写入计分。
- **预热：** 命令默认值与拒绝的窗口和周期、always/off、always 及其自身窗口与它拒绝的窗口、`/clear` 后的 always、从最后一轮滚动的 always、空闲重置、基于用量的停止、冷窗口过期以及睡眠后的延迟定时器。
- **会话状态：** 隔离的 store 键、恢复的窗口、旧版清理、clear/压缩重置和子 agent 隔离。自动窗口的时钟或 store 等待期间的 clear 不能武装下一会话或抹去其手动窗口。
- **压缩就绪：** 准备或跳过摘要不会改变预热。已应用压缩后，读取或写入缓存的主响应会让预热在回合等待工具或用户回答时恢复。摘要写入不计入冷写入累计；清除、停止或更新压缩后的失败请求与陈旧响应不能重新启动探测。
- **位于 mod 之上的托管插件：** 经典与压缩事件继续运行于用户层之下的 `/clear`、恢复、恢复的窗口和压缩；相同事件被重复或乱序送达而不会产生第二个窗口、警告或重置；窗口与模型变更通过进程内恢复携带；一个在恢复后变得足够旧而变冷的转录；与压缩区分开的 rewind；一条非冷写入的摘要写入与一条冷写入并存（首次请求前被压缩的有守卫发送、一轮中两次压缩）；与经典恢复重叠或延续更久的旧会话结束；以及在宿主报告下一会话 id 之前运行的 `/keepwarm`。
- **定价与显示：** 每个列出的模型在其日期化、提供方和显示名拼写下的行；表未列出的版本不借用行；无价格行的冷写入与美元总计分开计数；Haiku 5.5 长提示档按请求定价；请求合计写入一半上下文的长温热回合与冷写入分开；有守卫的缓存命中和大段粘贴不计分；部分重写与新内容分开；后续读取无法掩盖按请求的未命中；已持有的请求期间或 clear 期间的上下文读取中丢弃的旧回执；Opus 4 与 4.1 区别于 Opus 4.5；输出与未缓存输入成本、上下文计数、时长格式化和只读回本数字。
- **指示器：** 终端文本图标不含图像元素、桌面 SVG、主题选择、温热/冷转换、恢复、压缩、clear、过期、问卷、其他 mod 的内容以及 `NO_COLOR` 回退。
- **Display 选项：** `band` 绘制该行；`status` 把文本（含其 cache-tax 和状态标签）移到终端和桌面没有行的界面上状态条目中。任何其他值（如旧的 `off`）回退到该行。
- **偏好：** 每会话读取一次、主题变更立即生效、被拒绝的变更和设置写入器返回的有效主题。
- **Fork 失败：** 繁忙的 API 在缓存温热时重试、醒得太晚的重试被丢弃、无可 fork 时等待下一轮、同一时刻只有一个探测在途、在请求、`/clear` 或压缩之后到达的回复被丢弃，而其他失败和旧版本返回的 null 结果则不重试地停止。

渲染测试检查元素树，而非原生终端或桌面像素。它们不验证服务端缓存保留。参见[实时检查](#在你自己的会话上验证)。

### 类型检查

用 `claude --plugin-dir .` 加载此检出来在插件旁生成声明。然后从仓库根目录：

```sh
npx -p typescript tsc -p .
```

生成的声明位于 `.claude-plugin/types/`。保持它们不被追踪。

## 从其他 mod 读取状态

cache-tax 向 mod API 添加了只读的 `$.cacheTax.status()`，因此状态带可以不解析 `/cache-tax` 就显示 keepwarm。它在 3.0 前为实验性：字段可能在次版本中变更。`cold` 是 `/cache-tax` 显示的同一小时估算，而非对服务器缓存的检查。它解析为 `{ keepwarm: 'on' | 'off' | 'stopped', leftMs, always, alwaysMs, autoWarm, guard, guardFloorUsd, cold, stopped, coldWrites, pingSkipped, idlePingUsd }`；类型位于 `types/index.d.ts`。在 cache-tax 未安装的地方没有 `$.cacheTax`，因此调用方要把调用包在 `try`/`catch` 中。

## 更多 Claude Code mod

cache-tax 是 [Awesome Claude Code Mods](https://github.com/karanb192/awesome-claude-code-mods) 中列出的 [Claude Code 提示词缓存 mod](https://mods.aidojo.si/topics/prompt-cache/) 之一。浏览完整目录 [mods.aidojo.si](https://mods.aidojo.si/) 按任务查找 mod，并在安装前查看它能触及什么。

## 出处与许可证

- 原作者：[Karan Bansal](https://karanbansal.in/)（karanb192）
- 原仓库：https://github.com/karanb192/cache-tax
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
