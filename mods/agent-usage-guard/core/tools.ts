// The tool gate: identical failing retries, and long runs of tool calls while a
// loop carries a heavy context. Each loop is judged on its own context, so a
// subagent's calls never inherit the main conversation's size.

import { highestLimit, limitDetail } from './agents.ts'
import type { Config } from './config.ts'
import { type LoopId, MAIN, type PeerRecord, type SessionState, loopOf, overrideCovers, within } from './state.ts'
import { count, duration, sentence, shortClock, tokens } from './text.ts'
import { ALLOW, type Ask, type Deny, type Verdict, refuse } from './verdict.ts'

/**
 * Tools the guard never holds: holding them loses a subagent's report, stops
 * a cleanup, or blocks the user from answering a question.
 */
const EXEMPT_TOOLS: ReadonlySet<string> = new Set([
  'SubagentHandback',
  'TaskStop',
  'AskUserQuestion',
  'ExitPlanMode',
])

/** Tools that start a turn later, on their own: a wakeup, a scheduled job. */
const SCHEDULING: ReadonlySet<string> = new Set(['ScheduleWakeup', 'CronCreate'])

export function isScheduling(tool: string): boolean {
  return SCHEDULING.has(tool)
}

/**
 * From the refusal threshold, a wakeup or scheduled job is refused like a new
 * agent: the turn it starts later would run into the limit with nobody there.
 * The agents override lifts it.
 */
export function scheduleGate(state: SessionState, peers: readonly PeerRecord[], config: Config, now: number, request: ToolRequest): Verdict {
  if (!config.enabled || !isScheduling(request.tool) || overrideCovers(state, now, 'agents')) return ALLOW
  const limit = highestLimit(state, peers, now)
  if (!limit || limit.percent < config.limitDenyPercent) return ALLOW
  const base = `此 ${request.tool} 调用被拒绝：${limitDetail(limit)}，且它启动的后续轮次将遇到该限制。请先完成当前步骤；用户可以通过 /agent-guard allow 解除限制。`
  return refuse(state, config, now, 'schedule', `schedule:${request.tool}`, base, false)
}

export type ToolRequest = {
  loop: LoopId
  tool: string
  fingerprint: string
  /** How the user names the loop in a question: "this conversation", "agent Explore". */
  label: string
}

/** How long "keep going" lasts if the loop never compacts. */
const HEAVY_LEASE_MS = 60 * 60 * 1000

const HEAVY_CONTINUE = '继续执行'
const HEAVY_COMPACT = '本轮结束后压缩'
const HEAVY_STOP = '停止本轮'
const HEAVY_STOP_AGENT = '停止此智能体'

export function toolGate(state: SessionState, config: Config, now: number, request: ToolRequest): Verdict {
  if (!config.enabled || EXEMPT_TOOLS.has(request.tool)) return ALLOW
  const lifted = overrideCovers(state, now, 'context')

  const failure = state.failures[request.fingerprint]
  if (!lifted && failure && failure.count >= config.failureMax && now - failure.last < config.windowMs) {
    const base = `此 ${request.tool} 调用以完全相同的参数连续失败 ${failure.count} 次，最近一次是在 ${shortClock(failure.last)}。请更改输入或方法，或报告失败，不要继续重复。`
    return refuse(state, config, now, 'retry', `retry:${request.fingerprint}`, base, false)
  }

  const loop = loopOf(state, request.loop)
  if (loop.stopped) return refuseStopped(state, config, now, request.loop)

  const context = loop.context
  if (lifted || context === undefined || context < config.toolContext) return ALLOW
  const heavy = within(loop.heavyCalls, now, config.windowMs)
  loop.heavyCalls = heavy
  const leasedUntil = loop.heavyLeaseUntil
  if (heavy.length < config.toolMax || (leasedUntil !== undefined && now < leasedUntil)) {
    heavy.push(now)
    return ALLOW
  }

  const detail = `${request.label}在最近 ${duration(config.windowMs)} 内，于超过 ${tokens(config.toolContext)} 上下文 token 的情况下发起了 ${heavy.length} 次工具调用，每次都会重新读取 ${tokens(context)}`
  if (!state.canAsk) {
    const base = `${sentence(detail)}。此会话中没有人可以批准更多调用。${request.loop === MAIN ? '结束本轮；该会话需要运行 /compact。' : '用现有结果收尾并汇报。'}`
    return refuse(state, config, now, 'tool-budget', `tool-budget:${request.loop}`, base, false)
  }
  return {
    kind: 'ask',
    family: 'heavy',
    loop: request.loop,
    trips: [{ rule: 'tool-budget', detail, leaseKey: `heavy:${request.loop}`, leaseUntil: now + HEAVY_LEASE_MS }],
    question: `${sentence(detail)}。是否要在 ${tokens(context)} 上下文下继续工作？`,
    options: request.loop === MAIN ? [HEAVY_CONTINUE, HEAVY_COMPACT, HEAVY_STOP] : [HEAVY_CONTINUE, HEAVY_STOP_AGENT],
  }
}

export type HeavyOutcome = { verdict: Verdict; compactAfterTurn: boolean }

/** Applies the user's answer to a heavy-context question; dismissing it stops the loop. */
export function resolveHeavyAsk(
  state: SessionState,
  config: Config,
  now: number,
  ask: Ask,
  answer: string | undefined,
): HeavyOutcome {
  const loop = loopOf(state, ask.loop)
  if (answer === HEAVY_CONTINUE || answer === HEAVY_COMPACT) {
    loop.heavyLeaseUntil = now + HEAVY_LEASE_MS
    loop.heavyCalls.push(now)
    return { verdict: ALLOW, compactAfterTurn: answer === HEAVY_COMPACT }
  }
  loop.stopped = true
  const typed = answer === undefined || answer === HEAVY_STOP || answer === HEAVY_STOP_AGENT ? undefined : answer
  return { verdict: refuseStopped(state, config, now, ask.loop, typed), compactAfterTurn: false }
}

/** Refuses a call in a loop the user stopped; `typed` is what they wrote in place of choosing. */
function refuseStopped(state: SessionState, config: Config, now: number, loop: LoopId, typed?: string): Deny {
  const isMain = loop === MAIN
  const said = typed === undefined ? `用户停止了此${isMain ? '轮次' : '智能体'}` : `用户回答“${typed}”`
  const next = isMain ? '立即结束本轮，并建议在下一个任务前运行 /compact。' : '停止工作并汇报已有结果。'
  const base = `${said}，当时上下文为 ${tokens(loopOf(state, loop).context ?? 0)} tokens。${next}`
  return refuse(state, config, now, 'stopped', `stopped:${loop}`, base, false)
}
