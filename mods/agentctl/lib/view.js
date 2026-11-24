// What the band, `/agentctl` and `/agentctl policy|events` say (requirements FR-2, FR-3, FR-17,
// FR-23; tech spec § 3.3). Pure: every input arrives as data, every line names its source and age,
// and a field whose source did not answer says so instead of showing a value.

import { checkLine } from './firstrun.js'
import { digest } from './fingerprint.js'
import { sanitize } from './sanitize.js'

// The opaque key evidence for a declared check is stored under: arguments never become a stored
// identifier in plaintext.
export function checkKey(argv) {
  return 'check-' + digest(argv.join('\u0000'))
}

// Evidence counts as current only when the check reported no error, the tree did not change during
// the run, the run's reading matches the last one, and no reading was partial.
export function evidenceCurrent(ev, fingerprint) {
  if (!fingerprint || !ev || ev.outcome !== 'ok' || !ev.before || !ev.after) return false
  if (ev.before.value !== ev.after.value || ev.after.value !== fingerprint.value) return false
  return ![ev.coverage, ev.before.coverage, ev.after.coverage, fingerprint.coverage].includes('partial')
}

// Where the task's declared checks stand on the current tree: how many there are, how many have run
// at all, and which are not current (never run, failed, or stale).
export function checkProgress(task, evidence, fingerprint) {
  const rows = (task?.executors ?? []).filter((e) => e.check).map((e) => {
    const ev = evidence?.[checkKey(e.argv)]
    // Never shortened: the line is one Claude runs, and a cut command would not match the check.
    return { argv: sanitize(checkLine(e.argv), Infinity), ran: Boolean(ev), current: evidenceCurrent(ev, fingerprint) }
  })
  return { declared: rows.length, ran: rows.filter((r) => r.ran).length, pending: rows.filter((r) => !r.current).map((r) => r.argv) }
}

// The four states a field can be in (FR-3).
export function field(label, reading, now) {
  if (!reading) return `${label}：缺失`
  if (reading.failed) return `${label}：不可用（${reading.failed}）`
  const age = Math.max(0, Math.round((now - reading.at) / 1000))
  const stale = reading.staleAfterMs !== undefined && now - reading.at > reading.staleAfterMs
  return `${label}：${reading.value} — ${reading.source}，${age} 秒前${stale ? '（已过期）' : ''}`
}

// review-state.js check --format=json → a gate reading. A gate pass is a gate pass, never a test pass.
export function gateReading(run, at) {
  if (typeof run === 'string') return { failed: run, at }
  if (!run || run.exitCode !== 0) return { failed: `check exited ${run ? run.exitCode : 'without a result'}`, at }
  let s
  try { s = JSON.parse(run.stdout) } catch { return { failed: 'not JSON', at } }
  const word = (p) => (!p ? '?' : p.passed ? '✅' : p.verdict === 'fail' && p.digest_match ? '⛔' : p.noted && !p.digest_match ? '⏳ stale' : p.owed ? '⏳ owed' : '·')
  return { value: `code ${word(s.code_review)} · doc ${word(s.doc_review)} · precommit ${word(s.precommit)}`, source: 'review-state.js check', at }
}

// Usage windows are read by kind; a missing window is missing, never 0%. One account's windows are
// shown for this session only and never summed with other sessions.
export function usageReading(usage, kind, at) {
  if (!usage) return null
  const w = (usage.rateLimits ?? []).find((r) => r.kind === kind)
  if (!w) return null
  return { value: `${Math.round(w.percentUsed)}%${w.resetsAt ? ` (resets ${w.resetsAt})` : ''}`, source: `session usage (${w.source ?? 'host'})`, at }
}

export function contextReading(usage, at) {
  const p = usage?.context?.percent
  return typeof p === 'number' ? { value: `${Math.round(p)}%`, source: 'session usage', at } : null
}

function evidenceLines(evidence, currentFingerprint, now) {
  const out = []
  for (const ev of Object.values(evidence ?? {})) {
    const fresh = currentFingerprint && ev.after && ev.after.value === currentFingerprint.value && ev.before && ev.before.value === ev.after.value
    const state = ev.outcome === 'backgrounded' ? '已启动，未观察到完成'
      : ev.outcome === 'refused' ? 'refused'
      : !ev.after || !ev.before ? '证据不可用'
      : ev.before.value !== ev.after.value ? '运行期间代码树已变化 — 未绑定'
      : fresh && [ev.coverage, ev.before.coverage, ev.after.coverage, currentFingerprint.coverage].includes('partial') ? '匹配，但读取不完整'
      : fresh ? '最新'
      : '已过期（此后代码树有变化）'
    const age = Math.max(0, Math.round((now - ev.at) / 1000))
    out.push(`  ${sanitize(ev.requested, 120)}: ${ev.outcome === 'ok' ? '未报告错误' : ev.outcome} · ${state} · ${ev.coverage ?? 'coverage unknown'} · ${age}s ago`)
  }
  return out
}

const REASON_LABEL = {
  input: '等待你的输入',
  permission: '等待权限决定',
  'policy-denied': '被任务策略拒绝',
  'rate-limit': '已达速率限制',
  'suspected-stall': '无活动（未确认卡住）',
}

function interventionLines(state, now) {
  return Object.entries(state.interventions ?? {}).map(([reason, v]) => {
    const age = Math.max(0, Math.round((now - v.since) / 1000))
    const detail = typeof v.detail === 'string' ? sanitize(v.detail, 120) : v.detail?.resetsAt ? `resets ${v.detail.resetsAt}` : ''
    return `  ${REASON_LABEL[reason] ?? reason}${detail ? ` — ${detail}` : ''} · since ${age}s ago`
  })
}

// Compact by default — it reaches Claude — and the diagnostic lines on `/agentctl status --details`.
// Labels say what they measure (found in a first-run test: "Observation: ok" read as "work passed").
export function statusText(m, { details = false } = {}) {
  const { now, task, state } = m
  const lines = []
  lines.push(task ? `任务：${sanitize(task.goal, 120)}（${task.id}）` : '任务：未绑定')
  const iv = interventionLines(state, now)
  lines.push(iv.length ? '需要关注：' : '需要关注：未观察到')
  lines.push(...iv)
  lines.push(field('审查关卡', m.gate, now))
  const ev = evidenceLines(m.evidence, m.fingerprint, now)
  lines.push(ev.length ? '执行证据（不是审查结论）：' : '执行证据：尚无声明的检查运行过')
  lines.push(...ev)
  const bg = Object.entries(state.background ?? {}).filter(([, b]) => b.status === 'started' || b.status === 'in-flight')
  if (bg.length) lines.push(`后台运行中：${bg.length}（${bg.map(([id]) => id).join('、')}）`)
  if (!details) {
    lines.push('更多：/agentctl status --details · /agentctl help')
    return lines.join('\n')
  }
  lines.push(`状态存储：${m.health === 'ok' ? '正常' : m.health}`)
  lines.push(`运行：${state.runtime.value}${state.runtime.tool ? `（${state.runtime.tool}）` : ''}，已持续 ${Math.max(0, Math.round((now - state.runtime.since) / 1000))} 秒 · 阶段 ${state.phase.value} · 结果 ${state.result.value}`)
  // A usage reading arrives with Claude's first reply in the session; before that it is absent.
  const usage = (label, r) => (r ? field(label, r, now) : `${label}：缺失（Claude 首次回复后读取）`)
  lines.push(usage('上下文', m.context))
  lines.push(usage('5 小时窗口', m.fiveHour))
  return lines.join('\n')
}

export function bandText(m) {
  const { task, state, now } = m
  const iv = Object.keys(state.interventions ?? {})
  const attention = iv.length ? `⚠ ${iv.map((r) => REASON_LABEL[r] ?? r).join(', ')}` : '无需关注'
  const head = task ? `agentctl · ${sanitize(task.goal, 40)}` : 'agentctl · 无任务'
  const rt = `${state.runtime.value}${state.runtime.tool ? `:${state.runtime.tool}` : ''} ${Math.max(0, Math.round((now - state.runtime.since) / 1000))}s`
  let gate = '关卡缺失'
  if (m.gate?.failed) gate = '关卡不可用'
  else if (m.gate) {
    const age = Math.max(0, Math.round((now - m.gate.at) / 1000))
    const stale = m.gate.staleAfterMs !== undefined && now - m.gate.at > m.gate.staleAfterMs
    gate = `${m.gate.value} (${age}s${stale ? '，已过期' : ''})`
  }
  const resume = m.checkpoint ? ` · 上次交接 ${new Date(m.checkpoint.savedAt).toISOString()}` : ''
  const proposal = m.pending ? ` · 草稿 ${m.pending.digest.slice(0, 8)} 待确认 — /agentctl accept` : ''
  return `${head} · ${rt} · ${attention} · ${gate}${proposal}${resume}${m.health === 'ok' ? '' : ` · ${m.health}`}`
}

export const LIMITS = [
  '本模组只是控制和显示，不是隔离边界；生产环境只读由凭据和目标自身的权限保证。',
  '如果宿主跳过本模组的 hook（进程崩溃、模组停用），这里不会拒绝任何操作；请在 permissions.deny 规则中列出危险命令。',
  '原生权限规则匹配命令文本，而不是程序；其他模组可以在 tool.check 时改变结果。',
  '已授权的执行器运行，但不会对其效果进行分类。',
]

export function policyText(task) {
  if (!task) return ['未绑定任务：内置的生产写入和远程 git 写入仍然被拒绝；其他一切走宿主自身的权限流程。', ...LIMITS].join('\n')
  const one = (x) => (Array.isArray(x) ? x.join(' ') : Array.isArray(x?.argv) ? x.argv.join(' ') + (x.check ? ' (check)' : '') : String(x))
  const fmt = (xs) => (xs?.length ? xs.map((x) => sanitize(one(x), 200)).join('; ') : 'none')
  return [
    `任务 ${task.id} · 策略版本 ${task.policyVersion ?? 1}`,
    ...(task.recordMissing ? ['绑定的任务记录缺失：工作树内的读取以外一切操作都会被拒绝。请重新设置任务。'] : []),
    `Worktree: ${sanitize(task.worktree, 200)}`,
    `Edits: ${(task.allow ?? []).includes('edit') ? `allowed in ${fmt(task.editRoots ?? ['.'])}` : 'not allowed'}`,
    `Forbidden (task): ${fmt(task.forbid)} · plus the built-in production-write and remote-git-write classes`,
    `Authorized executors: ${fmt(task.executors)}`,
    `Needs a person: ${fmt(task.needsUser)}`,
    `Other tools allowed: ${fmt(task.tools)}`,
    '其余一切走宿主自身的权限流程（或 auto 模式）：本模组不对其分类。',
    '尽力而为：本模组只读取每次工具调用，不读取脚本内容或它启动的命令。',
    ...LIMITS,
  ].join('\n')
}

export function eventsText(decisions, n, now) {
  const list = (decisions ?? []).slice(-n)
  if (!list.length) return '本会话未记录任何决定。'
  return list.map((d) => `${Math.max(0, Math.round((now - d.at) / 1000))} 秒前 · ${d.outcome} · ${d.tool} · ${sanitize(d.requested, 160)} · ${sanitize(d.rule, 160)}`).join('\n')
}
