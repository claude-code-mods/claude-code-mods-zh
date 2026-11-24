import type { EngineInterface } from 'claude-code'

export type KeyWant = { readonly context: string; readonly key: string; readonly action: string; readonly shadows?: readonly string[] }

export const FOCUS_KEYS: readonly KeyWant[] = [
  { context: 'Chat', key: 'meta+l', action: 'abovePrompt:focus', shadows: ['Global'] },
  { context: 'Pane', key: 'meta+h', action: 'abovePrompt:leave' },
  { context: 'PaneField', key: 'meta+h', action: 'abovePrompt:leave' },
]

type Block = { context: string; bindings: Record<string, unknown> }

const shown = (v: unknown): string => typeof v === 'string' ? v : JSON.stringify(v)

export type KeyClash = KeyWant & { readonly where: string; readonly spelled: string; readonly bound: string }

export type KeyPlan =
  | { readonly kind: 'invalid'; readonly reason: string }
  | { readonly kind: 'done' }
  | { readonly kind: 'change'; readonly add: readonly KeyWant[]; readonly clash: readonly KeyClash[]; readonly merge: (replace: boolean) => string }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

const ALIASES: Record<string, string> = { alt: 'meta', option: 'meta', opt: 'meta', control: 'ctrl' }

export const sameKey = (a: string, b: string): boolean => {
  const norm = (k: string) =>
    k
      .toLowerCase()
      .split(' ')
      .map(chord => {
        const parts = chord.split('+').map(p => ALIASES[p] ?? p)
        const last = parts.pop() ?? ''
        return [...parts.sort(), last].join('+')
      })
      .join(' ')
  return norm(a) === norm(b)
}

export const indentOf = (text: string | undefined): string | number => {
  const lead = /\n([ \t]+)\S/.exec(text ?? '')?.[1]
  if (!lead) return 2
  return lead.startsWith('\t') ? '\t' : lead.length
}

const boundIn = (blocks: readonly Block[], context: string, key: string): [string, unknown] | undefined =>
  blocks
    .filter(b => b.context === context)
    .flatMap(b => Object.entries(b.bindings).filter(([k]) => sameKey(k, key)))
    .pop()

export const planKeys = (text: string | undefined, wants: readonly KeyWant[] = FOCUS_KEYS): KeyPlan => {
  let doc: Record<string, unknown> = {}
  if (text !== undefined && text.trim() !== '') {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      return { kind: 'invalid', reason: `JSON 无效（${err instanceof Error ? err.message : String(err)}）` }
    }
    if (!isRecord(parsed)) return { kind: 'invalid', reason: '顶层不是 JSON 对象' }
    doc = parsed
  }
  const raw = doc.bindings ?? []
  if (!Array.isArray(raw)) return { kind: 'invalid', reason: '"bindings" 不是数组' }
  if (!raw.every(b => isRecord(b) && typeof b.context === 'string' && isRecord(b.bindings))) return { kind: 'invalid', reason: 'a "bindings" 条目缺少字符串 "context" 或 "bindings" 对象' }
  const blocks = raw as Block[]
  const add: KeyWant[] = []
  const clash: KeyClash[] = []
  for (const want of wants) {
    const own = boundIn(blocks, want.context, want.key)
    if (own) {
      if (own[1] !== want.action) clash.push({ ...want, where: want.context, spelled: own[0], bound: own[1] === null ? 'null（未绑定）' : shown(own[1]) })
      continue
    }
    const shadow = (want.shadows ?? []).map(context => ({ context, found: boundIn(blocks, context, want.key) })).find(s => s.found && s.found[1] !== null && s.found[1] !== want.action)
    if (shadow?.found) clash.push({ ...want, where: shadow.context, spelled: shadow.found[0], bound: shown(shadow.found[1]) })
    else add.push(want)
  }
  if (add.length === 0 && clash.length === 0) return { kind: 'done' }
  const merge = (replace: boolean): string => {
    const next = blocks.map(b => ({ ...b, bindings: { ...b.bindings } }))
    for (const want of [...add, ...(replace ? clash : [])]) {
      for (const b of next) if (b.context === want.context) for (const k of Object.keys(b.bindings)) if (sameKey(k, want.key)) delete b.bindings[k]
      const home = next.filter(b => b.context === want.context).pop()
      if (home) home.bindings[want.key] = want.action
      else next.push({ context: want.context, bindings: { [want.key]: want.action } })
    }
    return `${JSON.stringify({ ...doc, bindings: next }, null, indentOf(text))}\n`
  }
  return { kind: 'change', add, clash, merge }
}

type Place = { readonly path: string; readonly atomic: boolean }

async function placeKeys($: EngineInterface, path: string): Promise<Place | { readonly refused: string }> {
  const own = await $.fs.stat(path, { resolve: true }).catch(() => undefined)
  if (!own) return { path, atomic: false }
  const target = own.realPath
  if (!target) return { refused: `无法确定 ${path} 指向何处` }
  if (own.kind !== 'file') return { refused: `${target} 不是普通文件` }
  if ((await $.env.get('OS')) === 'Windows_NT') return { path: target, atomic: false }
  if ((await $.process.run(['test', '-w', target])).exitCode !== 0) return { refused: `${target} 为只读` }
  return { path: target, atomic: true }
}

async function writeKeys($: EngineInterface, place: Place, text: string): Promise<string | undefined> {
  if (!place.atomic) {
    await $.fs.write(place.path, text)
    return undefined
  }
  const tmp = `${place.path}.filetree-${Date.now()}.tmp`
  try {
    await $.fs.write(tmp, text)
    await $.process.run(['chmod', '--reference', place.path, tmp]).catch(() => undefined)
    const moved = await $.process.run(['mv', '-f', tmp, place.path])
    return moved.exitCode === 0 ? undefined : `无法替换 ${place.path}：${moved.stderr.trim()}`
  } finally {
    await $.process.run(['rm', '-f', tmp]).catch(() => undefined)
  }
}

const KEEP = '保留我的绑定'
const REPLACE = '替换'
const FREE = '仅添加未占用的绑定'
const ADD = '添加'

export async function bindKeys($: EngineInterface, home: string): Promise<string> {
  const dir = (await $.env.get('CLAUDE_CONFIG_DIR')) || `${home}/.claude`
  const path = `${dir.replace(/[\\/]+$/, '')}/keybindings.json`
  const text = (await $.fs.exists(path)) ? await $.fs.read(path).catch(() => null) : undefined
  if (text === null) return `无法读取 ${path}；未做任何更改。`
  const plan = planKeys(text)
  if (plan.kind === 'invalid') return `${path}：${plan.reason}；请修复后重新运行 /filetree keys。未做任何更改。`
  if (plan.kind === 'done') return '已设置：在终端中，alt+l 将按键交给文件树，alt+h（或 Escape）交还给输入框。桌面应用不读取 keybindings.json；请直接点击文件树。'
  const place = await placeKeys($, path)
  if ('refused' in place) return `未写入：${place.refused}。未做任何更改。`
  const adds = plan.add.map(w => `${w.context} ${w.key}`).join(', ')
  const ask = async (q: string, o: string[]) => $.ui.ask(q, { header: 'filetree', options: o }).catch(() => '')
  let replace = false
  if (plan.clash.length > 0) {
    const clashes = plan.clash.map(w => `${w.where} ${w.spelled} is ${w.bound}`).join(', ')
    const pick = await ask(`${clashes}。是否用文件树快捷键替换${adds ? `并添加 ${adds}` : ''}（位于 ${path}）？`, adds ? [REPLACE, KEEP, FREE] : [REPLACE, KEEP])
    if (pick === REPLACE) replace = true
    else if (!(adds && pick === FREE)) return `保留了你的绑定；${path} 未更改。`
  } else {
    const pick = await ask(`是否将 ${adds} 添加到 ${path}，以便 alt+l 将按键交给文件树、alt+h 交还给输入框？`, [ADD, '取消'])
    if (pick !== ADD) return `已取消；${path} 未更改。`
  }
  const now = (await $.fs.exists(path)) ? await $.fs.read(path).catch(() => null) : undefined
  if (now !== text) return `询问期间 ${path} 发生了变化；请重新运行 /filetree keys。未做任何更改。`
  const refused = await writeKeys($, place, plan.merge(replace)).catch((err: unknown) => (err instanceof Error ? err.message : String(err)))
  if (refused) return `未写入：${refused}。`
  return `已写入 ${path}：在终端中，alt+l 将按键交给文件树，alt+h（或 Escape）交还给输入框；桌面应用不读取 keybindings.json。Claude Code 会在约 3 秒内生效。`
}
