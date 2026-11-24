// What the user sees without asking: one status line while something needs
// attention, and the `/agent-guard` command's text.

import { highestLimit } from './agents.ts'
import type { Config } from './config.ts'
import { MAIN, type PeerRecord, type Scope, type SessionState, countOnMachine, runningAgents } from './state.ts'
import { count, duration, shortClock, tokens, windowName } from './text.ts'

/** The line under the prompt, or undefined when there is nothing to say. */
export function statusLine(state: SessionState, peers: readonly PeerRecord[], config: Config, now: number): string | undefined {
  if (!config.enabled) return undefined
  const parts = liftedOrPaused(state, now)
  const limit = highestLimit(state, peers, now)
  if (limit && limit.percent >= config.limitDenyPercent) {
    parts.push(`${windowName(limit.kind)} 窗口 ${limit.percent}%：拒绝启动新智能体`)
  } else if (limit && limit.percent >= config.limitAskPercent) {
    parts.push(`${windowName(limit.kind)} 窗口 ${limit.percent}%：启动新智能体需要批准`)
  }
  const context = state.loops[MAIN]?.context
  if (context !== undefined && context >= config.contextHard) {
    parts.push(`上下文 ${tokens(context)}：建议运行 /compact`)
  } else if (context !== undefined && context >= config.contextWarn) {
    parts.push(`上下文 ${tokens(context)}`)
  }
  return parts.length > 0 ? parts.join(' · ') : undefined
}

/** Which questions are open now, for the band. */
export type Asking = { agents: boolean; context: boolean }

/**
 * The band above the prompt: the guard's own state while it has something to
 * say, the agents on this machine against their limits first. `alert` when a
 * limit is reached or the guard is holding something.
 */
export function bandLine(
  state: SessionState,
  peers: readonly PeerRecord[],
  config: Config,
  now: number,
  asking: Asking,
): { text: string; alert: boolean } | undefined {
  if (!config.enabled) return undefined
  const window = config.windowMs
  const running = runningAgents(state) + peers.reduce((sum, p) => sum + p.running, 0)
  const starts = countOnMachine(state, peers, 'starts', now, window)
  const declined = state.refusals.agents !== undefined && now < state.refusals.agents ? state.refusals.agents : undefined
  const paused = state.fuseUntil !== undefined && now < state.fuseUntil ? state.fuseUntil : undefined
  const refusal = state.denials.filter((d) => now - d.at < window).at(-1)

  const parts: string[] = []
  if (running > 0 || starts > 0) parts.push(`${running}/${config.agentMax} 个智能体正在运行`)
  if (starts > 0) parts.push(`最近 ${duration(window)} 内已启动 ${starts}/${config.rollingMax} 个`)
  if (asking.agents) parts.push('正在询问你是否启动智能体')
  if (asking.context) parts.push('正在询问上下文大小')
  if (declined !== undefined) parts.push(`已拒绝新智能体直至 ${shortClock(declined)}`)
  if (paused !== undefined) parts.push(`智能体启动已暂停直至 ${shortClock(paused)}`)
  if (refusal) parts.push(`上次拒绝于 ${shortClock(refusal.at)}：${refusal.rule}`)
  if (parts.length === 0) return undefined

  const holding = asking.agents || asking.context || declined !== undefined || paused !== undefined || refusal !== undefined
  const full = running >= config.agentMax || starts >= config.rollingMax
  return { text: `用量守卫 · ${parts.join(' · ')}`, alert: holding || full }
}

/** When the band changes with no event to redraw it: a start, a refusal, a decline or the pause ages out. */
export function bandExpiry(state: SessionState, peers: readonly PeerRecord[], config: Config, now: number): number | undefined {
  if (!config.enabled) return undefined
  const window = config.windowMs
  const aging = [...state.starts, ...peers.flatMap((p) => p.starts), ...state.denials.map((d) => d.at)].map((t) => t + window)
  const later = [...aging, state.refusals.agents, state.fuseUntil].filter((t): t is number => t !== undefined && t > now)
  return later.length > 0 ? Math.min(...later) : undefined
}

/** When the line changes with no event to redraw it: an allow or the fuse ends, or the most-used plan window resets. */
export function statusLineExpiry(state: SessionState, peers: readonly PeerRecord[], config: Config, now: number): number | undefined {
  if (!config.enabled) return undefined
  const times = [state.override?.until, state.fuseUntil, highestLimit(state, peers, now)?.resetsAt]
  const later = times.filter((t): t is number => t !== undefined && t > now)
  return later.length > 0 ? Math.min(...later) : undefined
}

/** What is lifted or paused now, worded alike in the status line and the report. */
function liftedOrPaused(state: SessionState, now: number): string[] {
  const parts: string[] = []
  if (state.override && now < state.override.until) {
    parts.push(`${scopeName(state.override.scope)}已解除，直至 ${shortClock(state.override.until)}`)
  }
  if (state.fuseUntil !== undefined && now < state.fuseUntil) {
    parts.push(`智能体启动已暂停直至 ${shortClock(state.fuseUntil)}`)
  }
  return parts
}

export function scopeName(scope: Scope): string {
  if (scope === 'agents') return '智能体限制'
  if (scope === 'context') return '上下文限制'
  return '全部限制'
}

/** The text `/agent-guard` and `/agent-guard status` print. */
export function statusReport(
  state: SessionState,
  peers: readonly PeerRecord[],
  config: Config,
  now: number,
  problems: readonly string[],
  version?: string,
  storeFailure?: string,
): string {
  const running = version ? ` (${version})` : ''
  if (!config.enabled) return `已关闭${running}：AGENT_GUARD 设置为关闭。`
  const window = config.windowMs
  const lines = [`已开启${running}。`]

  const peerRunning = peers.reduce((sum, p) => sum + p.running, 0)
  const starts = countOnMachine(state, peers, 'starts', now, window)
  lines.push(
    `智能体：本会话 ${runningAgents(state)} 个正在运行，${peerRunning} 个位于其他 ${peers.length} 个会话中（上限 ${config.agentMax}）；最近 ${duration(window)} 内启动 ${starts} 个（上限 ${config.rollingMax}）。`,
  )

  const limits = Object.values(state.limits).filter((r) => r.resetsAt === undefined || r.resetsAt > now)
  if (limits.length > 0) {
    const text = limits
      .map((r) => `${windowName(r.kind)} ${r.percent}%${r.resetsAt === undefined ? '' : `（${shortClock(r.resetsAt)} 重置）`}`)
      .join(', ')
    lines.push(`套餐窗口：${text}。达到 ${config.limitAskPercent}% 时启动新智能体需要批准，达到 ${config.limitDenyPercent}% 时将被拒绝。`)
  } else {
    lines.push('套餐窗口：暂无读数（订阅模式下下一次响应后会有读数）。')
  }

  const context = state.loops[MAIN]?.context
  lines.push(
    `上下文：${context === undefined ? '下次响应前未知' : `${tokens(context)} tokens`}（${tokens(config.contextWarn)} 时警告，${tokens(config.contextHard)} 时发送提示前需批准）。`,
  )

  const held = liftedOrPaused(state, now)
  for (const [key, until] of Object.entries(state.leases)) {
    if (now < until) held.push(`${key} 已批准${until < Number.MAX_SAFE_INTEGER ? `，直至 ${shortClock(until)}` : '，直至上下文缩小'}`)
  }
  for (const [key, until] of Object.entries(state.refusals)) if (now < until) held.push(`${key} 已拒绝，直至 ${shortClock(until)}`)
  if (held.length > 0) lines.push(`当前：${held.join('；')}。`)
  for (const problem of problems) lines.push(`配置：${problem}。`)
  if (storeFailure !== undefined) {
    lines.push(`存储：守卫无法保存计数（${storeFailure}），因此本机其他会话不会计入本会话的智能体。日志也可能缺少记录。`)
  }
  lines.push('', USAGE)
  return lines.join('\n')
}

export const USAGE = [
  '命令：',
  '  /agent-guard allow [agents|context] [minutes]   在本会话中解除守卫限制（默认：全部，10 分钟）',
  '  /agent-guard pause [minutes]                    与 allow 相同，但解除所有限制',
  '  /agent-guard resume                             提前结束 allow 或 pause，并清除已拒绝的问题',
  '  /agent-guard report [days]                      查看守卫在本机执行的操作（默认 7 天）',
  '  /agent-guard simulate <rule>                    展示某条规则的效果，不拦截任何操作、不消耗用量',
  '  /agent-guard status                             显示此摘要',
].join('\n')
