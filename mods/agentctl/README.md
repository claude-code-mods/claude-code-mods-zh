# agentctl —— 单个 Claude Code 会话的 Agent 控制面板

已用 **Claude Code 2.1.288**（无头）与 **2.1.289**（交互，宿主自动更新后）测试（`claude plugin validate .`、`claude plugin test .`：203 个测试）；0.2.x 已在 2.1.289 上实时重新验证（§ 0.2.x 实时验证）。
mods API 被标记为可能在版本间变更；宿主写入 `.claude-plugin/types/` 的类型声明是当前安装版本的权威。每次升级 Claude Code 后运行 `claude plugin validate .`。

设计：本仓库中的 `docs/features/agent-control-plane-mod/`（需求、可行性研究、技术规格、请求票据）。该目录不属于 sd0x-dev-flow 插件：安装插件不会安装该 mod。要安装它，运行 `/agentctl-setup`（它检查宿主、经你批准后安装 `agentctl@sd0xdev-marketplace`，并构建你的首条任务行；`/agentctl-setup --task` 与工作流技能会代拟一份方案供你接受），或用 `claude --plugin-dir mods/agentctl` 为一个会话加载它。

> 中文版由 claude-code-mods-zh 项目翻译，原作者与许可证见文末。原版 README 见 [README.en.md](README.en.md)。

## 首次运行

直接输入你正在做的事 —— 不需要任何其他命令：

```text
/agentctl 測試一下這個新功能
```

1. 该 mod 把一条给 Claude 的请求放进你的输入框（它从不发送）。按 **Enter**。
2. Claude 读取项目并起草一份范围 —— 它可编辑什么、哪些检查算作证据、“完成”意味着什么 —— 并通过 mod 内置的辅助程序（`bin/propose.mjs`）写入。若有不清楚之处，它会问你，而不是自行编造权限。
3. 在该回复末尾，mod 显示范围并在输入框提供 `/agentctl accept <digest>`：**Tab**，然后 **Enter**。接受即绑定该范围；它不会开始任何工作。
4. 让 Claude 开始。`/agentctl` 显示进展与下一步 —— 运行检查，然后 `/agentctl handoff`；`/agentctl help` 列出其余命令。

一位未读过设计的测试者独立完成了步骤 1–4 与交接（§ 无指导运行）。

发送请求本身就是一次普通的 Claude 回合；mod 自身不调用模型。当你的目标以中文书写时回复使用繁体中文，否则用英文 —— 这只是启发式，不是语言区域检测。

## 它做什么

| 功能 | 方式 |
|---|---|
| 任务范围 | Claude 起草方案（`/agentctl-setup --task`，或在 mod 安装后 `/feature-dev`、`/bug-fix`、`/refactor`）；mod 预览它，而在你自己的提示行输入 `/agentctl accept` 绑定的正是所预览的内容 —— 见 § 方案。在提示行输入 `/agentctl task set <json>` 也能把任务绑定到工作树。工具输出、文件与消息无法改变它 —— 只有你输入的命令可以。绑定按工作树，因此你在同一工作树的另一会话中自行执行 `task set` / `task clear` 确实会替换或清除它。任务记录与交接按工作树保留，因此两个工作树中的同一任务 id 指向两个不同任务。存储错误会被如实报告，且原任务继续生效；记录缺失的绑定在工作树中只允许读取 |
| 拒绝 | 一个拒绝列表。被识别的直接生产写入与远程 git 写入，**无论有无任务**都被拒绝；在绑定任务时，其自身的 `forbid` 条目与工作树根之外的编辑也被拒绝。编辑根会绑定编辑工具（Write、Edit、NotebookEdit）；通过 shell 重定向写入的文件是 Bash 命令，mod 无法分类，因此交给宿主 —— 拒绝信息会告诉 Claude 不要用其他方式达到同样结果，但编辑根不是沙箱。mod 无法分类的一切 —— 脚本、复合 shell、未知工具 —— 都交给 Claude Code 自己的权限提示或自动模式，记录为 `delegated`。下游拒绝绝不会被削弱，也绝不会创建允许。**尽力而为**：mod 读取每次工具调用，从不读取脚本内容或其启动的命令，因此脚本内的 push 属于宿主与该工作流自行授权的范围 |
| 证据 | 一次运行当它匹配已声明的 `check` 执行器时算数 —— 优先匹配词语，因此带新增参数的仍算数，但可能比声明的检查更少；而管道、重定向或包装（`npm test \| grep pass`）不算。accept 回复与 `/agentctl` 会把每个检查命名为与之匹配的一行，或 —— 当格式化器无法把某个词以单段引用时 —— 命名其 JSON 词形，若原样复制则不匹配（同样词的、正确引用的拼写则匹配）。匹配的调用以 Git 派生的树读数括起（执行器优先匹配，因此声明的 `git status` 检查也算检查）；其后的编辑会在 30 秒内使结果变为 stale；后台检查在见到终端结果前保持“completion unobserved”。证据属于它被观察到时的任务与策略版本，且覆盖率不完全的读数永远不会被列为已验证 |
| 面板 | 提示行上方的状态带是紧凑的：任务、运行时及其时长、需要你做什么、闸门读数及其年龄（超过 30 秒标 `stale`）、上次交接时间。`/agentctl` 是紧凑的状态回复 —— 下一步、任务、需要你做什么、闸门与证据；`/agentctl status --details` 还会加上存储健康度、运行时、上下文与 5h 窗口。闸门、上下文与窗口行会注明来源与年龄，或显示 `missing` / `unavailable`，每条证据行则显示其结论、新鲜度、覆盖率与年龄 |
| 交接 | `/agentctl handoff` —— 从记录得出八个回答，无模型、无网络、无进程；重新打开时完整记录（仅转录）；裸 `/agentctl` 只指向它，`/agentctl last` 打印它 |
| 停止 | `/agentctl stop` —— 保存交接、请求取消当前回合、列出正在跟踪的操作；绝不说“全部已停止” |

## 方案

Claude 通过 mod 内置的 `bin/propose.mjs`（`/agentctl <目标>` 路径）或 sd0x-dev-flow 的 `agentctl-setup.js propose`（设置与工作流技能）写出 `~/.claude/agentctl/proposals/<URI 编码的工作树>.json`（在工作树之外）；两者都会先应用 mod 自身的校验。mod 在会话启动时与每个主回合结束时各读取一次、再次校验，并保留**生效**对象：工作树取自会话，若方案指定了另一个工作树、针对已不再绑定的任务起草，或与内置类别重叠，则会被拒绝（原因会记录）。预览会在转录与状态带中列出每个被接受的权限及其 SHA-256 摘要（24 位十六进制）。每条最多显示 160 个字符；更长的以 `…` 结尾，而摘要 —— 以及 accept 所绑定的内容 —— 仍然覆盖全部，因此若某条草稿你无法看到完整内容，请丢弃它。

| 命令 | 谁 | 作用 |
|---|---|---|
| `/agentctl proposal` | 任何人 | 打印等待中的预览 |
| `/agentctl accept [digest 前缀]` | **仅你的提示行** | 若自预览以来已绑定的任务未变，则绑定保留的对象 —— 绝不重新读取文件 |
| `/agentctl discard` | 任何人 | 丢弃等待中的方案；已绑定的任务保留 |

之后修改文件会产生新的预览与摘要；较旧的摘要不再匹配。同一工作树上的并发会话共享一个绑定与一个存储，且跨会话非原子：请在显示预览的那个会话中 accept。

## 任务 JSON

```json
{
  "goal": "investigate the quiz service timeout",
  "allow": ["edit"],
  "editRoots": ["src", "tests"],
  "forbid": ["terraform apply"],
  "executors": [{ "argv": ["npm", "test"], "check": true }],
  "needsUser": [["npm", "publish"]],
  "tools": ["mcp__docs__search"],
  "acceptance": ["unit tests pass on the final tree"]
}
```

内置的禁止类别无论有无任务都生效，并叠加在任务自身之上：生产写入（`kubectl apply|delete|patch|rollout|scale|edit|replace`、`helm install|upgrade|uninstall|rollback`、`gcloud … deploy|delete|update`）与远程 git 写入（`git push`、`gh pr merge`）。任务里绝不该有秘密：策略字段中形似凭据的值会被拒绝。

`needsUser` 只在曾见到有人在回答处发问：`default`（手动）、`acceptEdits` 与 `auto` 权限模式下的交互终端（`lib/verdict.js`）。该模式在每个提示与工具结束时从经典钩子输入读取；在见到之前，以及在其他任何界面或模式 —— `-p`、`dontAsk`、`plan`、`bypassPermissions`、桌面、VS Code、移动端 —— 下一个 `needsUser` 调用会被拒绝。回合中途切换的模式会在下次工具结束时被看到。

## 它不是什么

- **不是隔离边界。** 它以你的权限运行。生产只读是凭据与目标 IAM/RBAC 的事。
- **不是唯一防线。** 若宿主跳过其钩子（mod 被禁用、worker 崩溃），这里没有任何东西会拒绝。请把具名的危险命令留在你自己的 `permissions.deny` 中，例如：

  ```json
  { "permissions": { "deny": ["Bash(kubectl delete:*)", "Bash(kubectl rollout:*)", "Bash(helm upgrade:*)"] } }
  ```

  这些规则匹配命令文本而非程序（`git -C . push` 是不同的文本），这就是两层都存在的原因。`Bash(git push:*)` 被故意省略：sd0x-dev-flow 的 `/push-ci` 会运行它。
- 另一个 mod 可以在 `tool.check` 处改变结论；本 mod 在 `/agentctl policy` 中披露这一点。
- 被授权的执行器（如 `npm test`）运行时不分类其影响。

## 开发

```bash
cd mods/agentctl            # 从仓库根目录
claude plugin validate .   # 钩子与 $ 调用：无 $.model.*、$.http.*、$.tool.register、$.prompt.submit（允许 fill/suggest/read）
claude plugin test .       # tests/ 下每个 *.test.ts
```

## 发布

该 mod 独立版本化，以 `agentctl-v<version>` 标签发布（`.github/workflows/release-agentctl.yml`），与 sd0x-dev-flow 的发布分开。Claude Code 按版本缓存已安装插件，因此对除本 README 或 `tests/` 之外的任何改动都需要升版本：提高 `.claude-plugin/plugin.json` 中的 `"version"`，然后从仓库根目录运行 `node .github/scripts/agentctl-version.js update`（或 `/bump-version agentctl`）。在两者完成前 CI 的版本锁会失败，CI 也会在此运行 `claude plugin validate` 与 `claude plugin test`。

## 实时验证（2026-10-04，临时仓库：2.1.288 无头 `claude -p --plugin-dir`，2.1.289 交互 tmux）

这些行记录的是 0.1.0 版本。自 0.2.0 起，未分类的调用改为委派给宿主而非拒绝，且增加了方案命令；0.2.x 的行见下表。

| 检查 | 结果 |
|---|---|
| 在 `-p` 下加载与 `/agentctl` | 仅为该会话加载；约 3.7 秒回复，无模型回合 |
| 从 `-p` 提示执行 `task set` | 被拒绝：`-p` 提示未被标记为 `composer`。无头运行无法设置任务；请在交互提示中设置 |
| 被禁止与未分类的 Bash 调用 | 运行前被拒绝，并指出规则（`task-forbid: …`、`unclassified: python3 has no adapter`） |
| 被允许读取（`git status`） | 进入宿主自己的权限路径并运行 |
| 检查非零退出（`sh check.sh` → exit 1） | 记为 `error`：非零 Bash 退出以 `isError` 到达 mod |
| 证据括起 | 记录前后读数，覆盖率 `git-hybrid` |
| 两个并发会话 | 两个会话记录都写入；任务记录保留 |
| 退出后遗留进程 | 无 |
| 树读数成本 | 500 个已变更/未跟踪文件约 90ms；干净的 974 文件仓库约 75ms |
| 模型回合后的 5h 窗口（V7） | `1% (resets …)` 自宿主读取，含其来源与年龄 |
| 后台检查（V5，后台半） | 由宿主的任务通知（`<task-id>`、`<status>`）以 `error` 收尾 —— 无需轮询。`TaskGet` 是待办列表工具；`GetTask` 读取后台任务 |
| 子 agent 工具调用（V4） | 子 agent 的 `danger-cmd` 被同一规则拒绝 |
| 在 `-p` 下的 `ask`（V3，仅 `-p`） | 用副本应答 `ask` 时，两种已测无头配置（有/无 Bash 允许规则）在 2.1.288 上都没运行该命令 —— 副本的 `ask` 未被自动批准 |
| 在 `-p` 流输入下的 `/agentctl stop`（V6） | 输入在回合结束后才被处理，因此 `immediate` 在此不适用；回复称未观察到运行中的回合 —— 绝不说“已停止” |
| MCP 工具调用（V4） | 副本 MCP 工具在任务未命名它之前作为未分类被拒绝，随后运行 |
| tmux 中的交互终端（V10） | 状态带在 80 与 50 列下正确渲染 CJK 目标文本，分别换行为两行与三行 |
| 交互中前台工具运行期间的 `/agentctl stop`（V6） | 立即运行（`immediate`）；回合被取消；宿主把运行中的命令移到后台，它继续运行 —— 回复将其列为运行中且绝不说“已停止”；完成后，宿主通知关闭其证据 |
| 手动模式交互终端下的 `ask`（V3） | 用副本应答 `ask` 时，宿主显示自己的审批对话框并带 mod 的原因（是/否，无“不再询问”）；拒绝会中断调用；用发布代码重跑（手动：对话框；`dontAsk`：mod 拒绝），并用副本在 `acceptEdits` 与 `auto`（对话框）及 `dontAsk`（拒绝）下测试。宿主发送的字符串从普通经典 `UserPromptSubmit` 钩子（2.1.289）读取：`default`、`acceptEdits`、`auto`、`plan`、`dontAsk` 各自原样到达；在无自动模式的模型上（Haiku）`--permission-mode auto` 回退为 `default` |
| 交互启动（实测发现） | `session.start` 与首次状态带渲染同时到达；两个并发上下文构建使状态带停留在孤立上下文（`gates missing`）。已修复：一个共享构建 |
| 安装、禁用、卸载（Signal 12） | 从本地市场安装、运行、禁用（`/agentctl` 消失）、卸载：无 mod 进程残留，`permissions` 设置字节级一致。宿主自身留下空的 `extraKnownMarketplaces` 键、一个插件缓存目录和空的 `installed_plugins.json`；mod 只留下自己的存储文件。事后全部已恢复并验证字节级一致 |

移除：`--plugin-dir` 不安装任何东西，也不改设置。mod 自身数据留在 `~/.claude/plugins/store/agentctl_*.json`（会话、任务、检查点），起草的方案留在 `~/.claude/agentctl/proposals/`；删除它们即可移除。

## 实时验证，0.2.x（2026-10-05，临时克隆与临时裸远程，2.1.289，Haiku）

| 检查 | 结果 |
|---|---|
| 未绑定任务时直接 `git push`（`-p`） | 运行前以 `remote-git-write` 拒绝；远程保持为空 |
| 未分类 `python3 -c …` 与会 push 的脚本（`/bin/bash -p push.sh`，`-p`） | 均传给宿主并运行；脚本的 push 到达 git（被临时远程自身拒绝，而非 mod）—— 已披露的脚本盲区 |
| 由 `agentctl-setup.js propose` 写入的方案，交互启动 | 预览在会话启动时以辅助程序的摘要记录，状态带指名等待中的方案 |
| 在提示行输入 `/agentctl accept <digest>` | 绑定预览范围为新任务；无 `base` 时辅助程序不打印摘要，mod 填入已绑定任务且其自身摘要被接受 |
| 一个已声明检查、一个未分类调用、一次根外编辑、一次直接 push（已绑定任务） | 检查记为 `current` 证据；`python3` 被委派，`/agentctl events` 将其列为如此；编辑被拒 `edit outside the allowed roots`；push 被拒 `remote-git-write` |
| 从外部添加未跟踪文件 | 检查在 32 秒内读到 `stale (tree changed since)` |
| `/agentctl handoff`、重新打开、`/agentctl`、`/agentctl last` | 交接说明何时读取了树，并在“未验证”下列出该 stale 检查；重新打开时转录显示它，裸 `/agentctl` 打印一行指针，`/agentctl last` 打印全部 |
| 0.2.1 中实测发现并修复 | 已接受的方案文件被下一会话再次读为陈旧草稿（现按工作树记住）；内置拒绝说“该任务的范围”，Claude 随后提议扩大任务（现为“内置类别，任务无法解除”）；转录行读为 `agentctl: agentctl:` |
| 两次 `-p` 探测的成本 | 各 2–3 回合，Haiku 上各约 $0.06；mod 自身回复、预览与状态带不调用模型 |
| 独立对抗测试（Codex，2026-10-05），0.2.2 修复 | 绝对或大写程序路径（`/usr/bin/git push`、`GIT push`）绕过内置类别；编辑根如 `../other` 授权工作树之外的写入；方案上限计字符而非 UTF-8 字节；未绑定任务时委派调用未被 `/agentctl events` 记录。摘要一致性、原型键、其他工作树拒绝、证据分区与部分覆盖率均成立 |

## 实时验证，0.3.0（2026-10-07，临时克隆与临时远程，交互 tmux，Haiku）

Signal 13，在 2.1.289（步骤 1–3）与再次从头在 2.1.292 上演练：

| 步骤 | 结果 |
|---|---|
| `/agentctl 幫 …/README 加一行測試說明` | 请求以繁体中文填入空输入框，附带来自 `$.plugin.root` 的辅助程序路径；未发送也未绑定 |
| Enter | Claude 运行辅助程序的 `--help`、读取项目、发现文件不存在并**询问**，而非编造范围；得到回答后通过辅助程序写入方案 |
| 预览 | 在回合结束时连同摘要与“仅绑定范围；不启动工作”显示；状态带指名等待中的方案 |
| Tab + Enter | 从建议接受；回复指名下一步 |
| “开始工作” | 接受根内的编辑进入宿主自己的权限提示；声明的检查记为当前证据 |
| `/agentctl`、`handoff`、重新打开、`last` | 状态以下一步开头；交接列出该检查为已验证及其读数时间；重新打开指向它，`last` 打印它 |
| 绑定任务时的第二个目标 | 辅助程序在绑定任务下交付；预览说“替换：任务 …”；Tab + Enter 替换 |

演练中发现并修复：在 2.1.292 上，宿主自己的下一提示猜测（“確認”）占用了输入框，因此 Tab + Enter 会把那个词发给 Claude —— 现在在有方案等待时 mod 会用 accept 行替换宿主的猜测，并在每个回合结束时再提供一次；accept 回复最后一行在中文会话中仍为英文；有任务绑定时，填入回复说“未绑定任何内容”。记录的犹豫：Claude 曾试图读取工作树之外的 mod 自身文件（在宿主提示处被拒绝）；复制语言随每个新会话重置。

## 无指导运行，0.3.0（2026-10-07，Codex 作为首次用户，交互 tmux，一次性克隆）

测试者只被给了 `/agentctl <你在做什么>`，既未读 `docs/` 也未读本 mod 代码。描述 → Enter → 预览（约 72 秒，仅 README 范围，三个检查）→ Tab + Enter → “开始工作”→ `/agentctl` → `/agentctl handoff` 六步完成，无外部帮助。从其中发现并在 0.3.1 修复：

| 发现 | 0.3.1 |
|---|---|
| 在 README 已变更旁，交接读为“Edits observed: 0”（Claude 经 Bash 编辑） | 该行计编辑工具调用，并说明 Bash 变更在树行 |
| Claude 把测试用管道传给 `grep`；交接称检查 stale，而 Claude 称其通过 | accept 回复指名应逐字运行的检查；`/agentctl` 再次按名称索取 |
| 工作已完成，`/agentctl` 仍说“让 Claude 开始工作” | 下一步跟随声明的检查：工作并运行、重跑非当前者，或交接 |
| 一次根外 Write 被拒，随后同一文件用 Bash heredoc 写入 | 拒绝告诉 Claude 不要用其他方式达到结果；本节与 § 它做什么 说明根只绑定编辑工具 |
| Claude 在同一回合提问并写方案 | 起草请求说明要先等回答再写 |

保持原样：该运行耗时数分钟，是因为克隆自身的 `CLAUDE.md` 要求文档变更需两轮评审，而非 mod 所致。

## 未验证

桌面、VS Code 与移动端的 V3，以及 `plan` 与 `bypassPermissions` 下（接受绕过模式警告是操作者自己的决定，因此未演练）：`needsUser` 在这些地方保持被拒绝。状态带在 tmux 中检查过，未经 SSH。

## 出处与许可证

- 原作者：[sd0xdev](https://github.com/sd0xdev/sd0x-harness)
- 原仓库：https://github.com/sd0xdev/sd0x-harness（路径 mods/agentctl）
- 许可证：MIT
- 中文翻译与界面本地化：claude-code-mods-zh 项目
