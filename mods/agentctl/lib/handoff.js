// Model-free hand-over (requirements FR-15, UC-6; tech spec § 3.4). Pure: built only from records.
// It answers the eight questions and keeps three sources apart: what the user confirmed (the task),
// what tools observed (operations, evidence), and what Claude only claimed (never stored as a fact,
// so the hand-over says plainly that nothing claimed is shown as verified).

import { CAPS, sanitize } from './sanitize.js'
import { HARD_FORBIDDEN } from './policy.js'
import { evidenceCurrent } from './view.js'

const s = (x, n = 200) => sanitize(x, n)

// Each section is { heading, items, fixed }: headings and `fixed` lines always appear; `items` fill the
// remaining budget in order and the rest is counted, so the size cap never drops a heading or the
// limits disclosure (INV-005) the way truncating the finished text would.
function assemble(head, sections, cap) {
  const fixedText = [...head, ...sections.flatMap((x) => ['', x.heading, ...x.fixed])].join('\n')
  const omitLine = (n) => `- … 另有 ${n} 条因交接长度限制省略`
  let budget = cap - fixedText.length - sections.length * omitLine(99999).length
  const out = [...head]
  for (const x of sections) {
    out.push('', x.heading)
    let shown = 0
    for (const it of x.items) {
      if (it.length + 1 > budget) break
      out.push(it); budget -= it.length + 1; shown++
    }
    if (shown < x.items.length) out.push(omitLine(x.items.length - shown))
    out.push(...x.fixed)
  }
  return out.join('\n')
}

export function handoff({ task, state, evidence, fingerprint, decisions, now, sessionId }) {
  // When the last tree reading was taken: the hand-over starts no process, so it never re-reads.
  const seenAt = typeof fingerprint?.at === 'number' ? `，截至 ${new Date(fingerprint.at).toISOString()}` : ''
  const head = [
    `# 交接 — ${task ? s(task.goal, 120) : '未绑定任务'}`,
    '',
    `由结构化记录生成于 ${new Date(now).toISOString()}（会话 ${s(sessionId, 60)}）；未调用模型。`,
  ]
  const sec = []
  sec.push({ heading: '## 1. 目标', items: [], fixed: [task ? s(task.goal, 500) : '本会话未声明任务。'] })
  const scope = []
  if (task) {
    scope.push(`- 工作树：${s(task.worktree)}`)
    scope.push(`- 编辑：${(task.allow ?? []).includes('edit') ? `允许于 ${(task.editRoots ?? ['.']).map((r) => s(r)).join(', ')}` : '不允许'}`)
    scope.push(`- 授权执行器：${(task.executors ?? []).map((e) => s(e.argv.join(' '))).join('; ') || '无'}`)
    scope.push(`- Forbidden: ${(task.forbid ?? []).map((f) => s(Array.isArray(f) ? f.join(' ') : f)).join('; ') || 'none'}, plus ${[...new Set(HARD_FORBIDDEN.map((h) => h.rule))].join(', ')}`)
    if (task.acceptance?.length) scope.push(`- 验收条件：${task.acceptance.map((a) => s(a)).join('; ')}`)
  }
  sec.push({ heading: '## 2. 允许与禁止的范围', items: scope, fixed: task ? [] : ['- 未声明范围。'] })
  const ops = Object.entries(state.ops ?? {})
  const edits = ops.filter(([, o]) => ['Write', 'Edit', 'NotebookEdit', 'MultiEdit'].includes(o.tool) && o.outcome === 'ok')
  sec.push({ heading: '## 3. 变更内容', items: [], fixed: [
    fingerprint ? `- 代码树：HEAD ${s(fingerprint.head, 60)}，${fingerprint.changedCount ?? '?'} 个已修改或未跟踪路径（${fingerprint.coverage}）${seenAt ? `，读取于${seenAt}` : ''}` : '- 代码树：本次交接未读取',
    // Only the edit tools are counted here; a file changed through Bash shows in the tree line above
    // (found in an uncoached run: "Edits observed: 0" beside a changed README read as "nothing changed").
    `- 本会话编辑工具调用：${edits.length}（通过 Bash 做的修改不计入此处；以代码树行记录为准）`,
  ] })
  const ev = Object.values(evidence ?? {})
  const matches = (e) => fingerprint && e.after && e.before && e.before.value === e.after.value && e.after.value === fingerprint.value && e.outcome === 'ok'
  // Partial coverage is never "verified": what a reading did not cover may have changed — the
  // before, the after and the last reading must each be complete. The same rule `/agentctl` uses.
  const current = (e) => evidenceCurrent(e, fingerprint)
  const verified = ev.filter(current).map((e) => `- ${s(e.requested)} — 未报告错误，与最后一次代码树读取一致${seenAt}（${e.coverage}）`)
  sec.push({ heading: '## 4. 已验证（最后一次代码树读取上的执行证据）', items: verified, fixed: verified.length ? [] : ['- 无。'] })
  const notVerified = ev.filter((e) => !current(e)).map((e) => {
    const why = e.outcome === 'backgrounded' ? '已启动，未观察到完成' : e.outcome !== 'ok' ? `outcome ${e.outcome}` : !e.after || !e.before ? '证据不可用' : e.before.value !== e.after.value ? '运行期间代码树已变化' : matches(e) ? '部分覆盖 — 代码树有一部分未读取' : '已过期 — 此后代码树有变化'
    return `- ${s(e.requested)} — ${why}`
  })
  sec.push({ heading: '## 5. 未验证', items: notVerified, fixed: ['- Claude 声称已完成、已通过或已修复但没有上述证据记录的内容，仅为它自己的判断。'] })
  const open = ops.filter(([, o]) => o.endedAt === undefined && o.outcome !== 'refused')
  const bg = Object.entries(state.background ?? {}).filter(([, b]) => b.status === 'started' || b.status === 'in-flight')
  const running = [
    ...open.map(([id, o]) => `- ${s(o.requested)} (${o.tool}, ${o.outcome}) — ${id}`),
    ...bg.map(([id, b]) => `- 后台 ${s(id, 60)} — ${b.status}${b.asOf ? `，截至 ${new Date(b.asOf).toISOString()}` : ''}`),
  ]
  sec.push({ heading: '## 6. 仍在运行或未知', items: running, fixed: running.length ? [] : ['- 未观察到仍在运行的内容。未跟踪的进程无法确认状态。'] })
  const iv = Object.keys(state.interventions ?? {})
  sec.push({ heading: '## 7. 下一步', items: [], fixed: [iv.length ? `- 需解决：${iv.map((x) => s(x, 60)).join(', ')}` : '- 未记录。请根据第 4–6 节决定。'] })
  const refused = (decisions ?? []).filter((d) => d.outcome === 'deny' || d.outcome === 'unknown' || d.outcome === 'needs-user-refused')
  sec.push({ heading: '## 8. 仍不允许', items: [], fixed: [
    ...(refused.length ? refused.slice(-10).map((d) => `- ${s(d.requested)} — ${s(d.rule)}`) : ['- 本会话没有调用被拒绝；第 2 节的禁止范围仍然有效。']),
    '- 之前的批准不会延续：恢复时每个调用都会重新分类，宿主也会再次询问。',
    // INV-005: what this mod cannot refuse is disclosed here as in /agentctl policy, never silent.
    '- 限制：如果宿主跳过本模组的 hook（进程崩溃、模组停用），这里不会拒绝任何操作；其他模组可以在 tool.check 时改变结果。硬性规则应放在 permissions.deny 中。',
  ] })
  return assemble(head, sec, CAPS.handoff)
}
