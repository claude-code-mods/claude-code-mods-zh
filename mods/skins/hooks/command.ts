import type { CalmSnapshot, Prefs } from '../types'
import { SKINS } from './themes'

export const DEFAULT_PREFS: Prefs = {
  skin: 'noir',
  icons: 'unicode',
  prompt: 'left',
  words: 'skin',
  rail: true,
  tables: 'on',
  shimmer: true,
  band: true,
  countdown: false,
  clipOutput: false,
  markdown: true,
  quiet: false,
  charts: true,
  math: true,
  commands: true,
  shell: true,
  highlight: true,
  hints: true,
  links: true,
  copy: true,
  fold: true,
  expand: false,
  compact: true,
  calm: null,
}

// The on/off settings, by the word /skin and the settings pane use for each. Tables have a
// third state, `text`, so they are switched on their own.
export const TOGGLES = {
  rail: 'rail',
  shimmer: 'shimmer',
  band: 'band',
  countdown: 'countdown',
  clip: 'clipOutput',
  markdown: 'markdown',
  quiet: 'quiet',
  charts: 'charts',
  math: 'math',
  commands: 'commands',
  shell: 'shell',
  highlight: 'highlight',
  hints: 'hints',
  links: 'links',
  copy: 'copy',
  fold: 'fold',
  expand: 'expand',
  compact: 'compact',
} as const satisfies Record<string, keyof Prefs>

export type ToggleWord = keyof typeof TOGGLES

export type Outcome = {
  prefs: Prefs
  message: string
  // `row` prints a transcript line (listings, mistakes); `toast` confirms a change quietly.
  channel: 'row' | 'toast'
}

const flagOr = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

export const TABLE_MODES = ['on', 'text', 'off'] as const satisfies readonly Prefs['tables'][]

// Tables were on/off before `text`, so a stored boolean still reads.
export function tablesOr(value: unknown, fallback: Prefs['tables']): Prefs['tables'] {
  if (typeof value === 'boolean') {
    return value ? 'on' : 'off'
  }

  return TABLE_MODES.find(mode => mode === value) ?? fallback
}

// The settings pane's tables button steps through the modes in order.
export const nextTables = (mode: Prefs['tables']): Prefs['tables'] =>
  TABLE_MODES[(TABLE_MODES.indexOf(mode) + 1) % TABLE_MODES.length] ?? 'on'

// A stored calm snapshot, or null when it is not one: then calm reads as off.
function calmOf(value: unknown): CalmSnapshot | null {
  const saved = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

  return saved !== null && typeof saved.shimmer === 'boolean' && typeof saved.rail === 'boolean' && typeof saved.quiet === 'boolean'
    ? { shimmer: saved.shimmer, rail: saved.rail, quiet: saved.quiet }
    : null
}

// What the store hands back may be old, hand-edited or from another version.
export function parsePrefs(raw: unknown, names: readonly string[]): Prefs {
  const saved = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const skin = saved.skin

  return {
    skin:
      typeof skin === 'string' && (skin === 'off' || names.includes(skin))
        ? skin
        : DEFAULT_PREFS.skin,
    icons: saved.icons === 'ascii' ? 'ascii' : 'unicode',
    prompt: saved.prompt === 'right' || saved.prompt === 'plain' ? saved.prompt : 'left',
    words: saved.words === 'claude' ? 'claude' : 'skin',
    rail: flagOr(saved.rail, DEFAULT_PREFS.rail),
    tables: tablesOr(saved.tables, DEFAULT_PREFS.tables),
    shimmer: flagOr(saved.shimmer, DEFAULT_PREFS.shimmer),
    band: flagOr(saved.band, DEFAULT_PREFS.band),
    countdown: flagOr(saved.countdown, DEFAULT_PREFS.countdown),
    clipOutput: flagOr(saved.clipOutput, DEFAULT_PREFS.clipOutput),
    markdown: flagOr(saved.markdown, DEFAULT_PREFS.markdown),
    quiet: flagOr(saved.quiet, DEFAULT_PREFS.quiet),
    charts: flagOr(saved.charts, DEFAULT_PREFS.charts),
    math: flagOr(saved.math, DEFAULT_PREFS.math),
    commands: flagOr(saved.commands, DEFAULT_PREFS.commands),
    shell: flagOr(saved.shell, DEFAULT_PREFS.shell),
    highlight: flagOr(saved.highlight, DEFAULT_PREFS.highlight),
    hints: flagOr(saved.hints, DEFAULT_PREFS.hints),
    links: flagOr(saved.links, DEFAULT_PREFS.links),
    copy: flagOr(saved.copy, DEFAULT_PREFS.copy),
    fold: flagOr(saved.fold, DEFAULT_PREFS.fold),
    expand: flagOr(saved.expand, DEFAULT_PREFS.expand),
    compact: flagOr(saved.compact, DEFAULT_PREFS.compact),
    calm: calmOf(saved.calm),
  }
}

// /skin calm: no motion, one line per tool row, read-only output folded. What it changes is
// kept, so calm off puts back what was there before. Failures stay whole either way
// (register.tsx draws them past quiet while calm is on).
export function withCalm(current: Prefs, on: boolean): Prefs {
  if (on) {
    return current.calm !== null
      ? current
      : { ...current, calm: { shimmer: current.shimmer, rail: current.rail, quiet: current.quiet }, shimmer: false, rail: false, quiet: true }
  }

  return current.calm === null ? current : { ...current, ...current.calm, calm: null }
}

const changed = (prefs: Prefs, message: string): Outcome => ({ prefs, message, channel: 'toast' })

const refused = (prefs: Prefs, message: string): Outcome => ({ prefs, message, channel: 'row' })

const onOff = (on: boolean): string => (on ? 'on' : 'off')

// A markdown table, its columns padded so it lines up as plain text too.
export function markdownTable(head: readonly string[], rows: readonly (readonly string[])[]): string {
  const widths = head.map((title, column) => Math.max(title.length, ...rows.map(row => (row[column] ?? '').length)))
  const line = (cells: readonly string[]) => `| ${widths.map((width, column) => (cells[column] ?? '').padEnd(width)).join(' | ')} |`

  return [line(head), line(widths.map(width => '-'.repeat(width))), ...rows.map(line)].join('\n')
}

const isBuiltIn = (name: string): boolean => SKINS.some(skin => skin.name === name)

// /skin list: the skins, then every setting, laid out as skin-code lays out its list.
// `extra` adds rows to the settings that the command reads from elsewhere.
export function listing(current: Prefs, names: readonly string[], extra: readonly (readonly [string, string])[] = []): string {
  const mark = (name: string) => (name === current.skin ? `${name} (current)` : name)

  return [
    `皮肤 · 当前：${current.skin}`,
    '',
    markdownTable(
      ['皮肤', '类型'],
      [
        ...names.map(name => [mark(name), isBuiltIn(name) ? '内置' : '自定义']),
        [mark('off'), 'Claude Code 原生外观'],
      ],
    ),
    '',
    markdownTable(
      ['设置', '值'],
      [
        ['icons', current.icons],
        ['prompt', current.prompt],
        ['words', current.words],
        ['rail', onOff(current.rail)],
        ['tables', current.tables],
        ['shimmer', onOff(current.shimmer)],
        ['band', onOff(current.band)],
        ['clip', onOff(current.clipOutput)],
        ['markdown', onOff(current.markdown)],
        ['quiet', onOff(current.quiet)],
        ['charts', onOff(current.charts)],
        ['math', onOff(current.math)],
        ['commands', onOff(current.commands)],
        ['shell', onOff(current.shell)],
        ['highlight', onOff(current.highlight)],
        ['hints', onOff(current.hints)],
        ['links', onOff(current.links)],
        ['copy', onOff(current.copy)],
        ['fold', onOff(current.fold)],
        ['expand', onOff(current.expand)],
        ['compact', onOff(current.compact)],
        ['calm', onOff(current.calm !== null)],
        ...extra,
      ],
    ),
    '',
    '`/skin <name>` 选择皮肤。',
    '',
    '`/skin help` 查看所有命令。',
  ].join('\n')
}

// /skin help: every argument, laid out as skin-code lays out its help.
export const helpText = (): string =>
  [
    'skins 命令',
    '',
    markdownTable(
      ['命令', '作用'],
      [
        ['`/skin`', '打开设置'],
        ['`/skin <name>`', '切换到该皮肤'],
        ['`/skin list`', '列出所有皮肤和设置'],
        ['`/skin help`', '显示这些命令'],
        ['`/skin off`', '恢复 Claude Code 原生外观'],
        ['`/skin on`', '重新启用 skins'],
        ['`/skin gallery`', '编号展示皮肤绘制的每个元素'],
        ['`/skin calm [on/off]`', '关闭动画、工具行只占一行、折叠只读输出'],
        ['`/skin copy` · `copy code`', '复制上一条回复，或其最后一个代码块'],
        ['`/skin pin` · `unpin` · `share`', '为本文件夹设置独立外观、取消，或设为默认'],
        ['`/skin tables on/text/off`', '表格显示为卡片、可选文本，或使用 Claude Code 原生样式'],
        ['`/skin prompt left/right/plain`', '提示符轮廓在左侧还是右侧，或使用简单标记'],
        ['`/skin words claude/skin`', '转圈提示和回合页脚使用谁的文案'],
        ['`/skin icons unicode/ascii`', '图标字符集'],
        ['`/skin rail on/off`', '工具行旁边的彩色侧栏'],
        ['`/skin shimmer on/off`', '转圈文字上的流光效果'],
        ['`/skin band on/off`', '提示符上方的使用量状态带'],
        ['`/skin countdown on/off`', '状态带中每项额度的剩余时间'],
        ['`/skin clip on/off`', '将 Claude Code 原生终端输出截断为开头和结尾'],
        ['`/skin markdown on/off`', '绘制提示框和任务列表'],
        ['`/skin quiet on/off`', '将读取、搜索和只读命令折叠为一行'],
        ['`/skin charts on/off`', '将 Mermaid 代码块绘制为图表'],
        ['`/skin math on/off`', '数学公式排版'],
        ['`/skin commands on/off`', '将斜杠命令输出绘制为表格和卡片'],
        ['`/skin shell on/off`', '将终端输出绘制为卡片'],
        ['`/skin highlight on/off`', '用皮肤配色高亮代码块'],
        ['`/skin hints on/off`', '告诉 Claude 这里可以绘制图表'],
        ['`/skin links on/off`', '将网址和路径显示为链接'],
        ['`/skin copy on/off`', '在卡片上显示复制按钮'],
        ['`/skin fold on/off`', '长内容折叠到 `▾ 还有 N 行` 后面'],
        ['`/skin expand on/off`', '展开所有读取和搜索分组'],
        ['`/skin compact on/off`', '状态带中的压缩按钮'],
      ],
    ),
    '',
    '`/skin list` 列出所有皮肤和设置。',
    '',
    '`/skin` 打开设置。',
  ].join('\n')

const isToggle = (word: string): word is ToggleWord => Object.hasOwn(TOGGLES, word)

// Every argument but none: with none, /skin opens the settings pane instead.
export function runSkinCommand(args: string, current: Prefs, names: readonly string[]): Outcome {
  const [head = '', value] = args.trim().toLowerCase().split(/\s+/)

  if (isToggle(head)) {
    const field = TOGGLES[head]

    return value === 'on' || value === 'off'
      ? changed({ ...current, [field]: value === 'on' }, `${head} ${value}`)
      : refused(current, `usage: /skin ${head} on|off`)
  }

  switch (head) {
    case 'list':
      return refused(current, listing(current, names))
    case 'help':
      return refused(current, helpText())
    // `default` and `stock` are what people reach for when they want Claude Code's own look.
    case 'off':
    case 'default':
    case 'stock':
      return changed({ ...current, skin: 'off' }, 'skins 已关闭')
    case 'on':
      return current.skin === 'off'
        ? changed({ ...current, skin: DEFAULT_PREFS.skin }, `skin: ${DEFAULT_PREFS.skin}`)
        : changed(current, `skin: ${current.skin}`)
    case 'calm':
      return value === 'on' || value === undefined
        ? changed(withCalm(current, true), current.calm === null ? '静谧已开启' : '静谧已经开启')
        : value === 'off'
          ? changed(withCalm(current, false), current.calm === null ? '静谧已经关闭' : '静谧已关闭：你的设置已恢复')
          : refused(current, 'usage: /skin calm [on|off]')
    case 'tables':
      return value === 'on' || value === 'text' || value === 'off'
        ? changed({ ...current, tables: value }, `tables ${value}`)
        : refused(current, 'usage: /skin tables on|text|off')
    case 'prompt':
      return value === 'left' || value === 'right' || value === 'plain'
        ? changed({ ...current, prompt: value }, `prompt ${value}`)
        : refused(current, 'usage: /skin prompt left|right|plain')
    case 'words':
      return value === 'claude' || value === 'skin'
        ? changed({ ...current, words: value }, `words: ${value}`)
        : refused(current, 'usage: /skin words claude|skin')
    case 'icons':
      return value === 'unicode' || value === 'ascii'
        ? changed({ ...current, icons: value }, `icons: ${value}`)
        : refused(current, 'usage: /skin icons unicode|ascii')
    default:
      return names.includes(head)
        ? changed({ ...current, skin: head }, `skin: ${head}`)
        : refused(current, `unknown skin "${head}". /skin list shows them, /skin help the commands`)
  }
}
