import type { RowSpec } from './rows'

export type ShortcutKey = { key: string; label: string; terminal?: true }
export type ShortcutGroup = { title: string; keys: ShortcutKey[] }

const GROUPS: readonly ShortcutGroup[] = [
  {
    title: '移动',
    keys: [
      { key: 'j / k', label: '向下 / 向上' },
      { key: 'h / l', label: '折叠或前往父目录 / 展开' },
      { key: 'o, Enter', label: '打开文件或展开/折叠文件夹' },
      { key: 'z', label: '跳转到文件夹' },
      { key: 'Space', label: 'macOS 上的快速查看', terminal: true },
    ],
  },
  {
    title: '搜索',
    keys: [
      { key: 's', label: '聚焦搜索框' },
      { key: 'i', label: '在光标所在的文件夹中搜索' },
      { key: 'c / r', label: '区分大小写 / 正则表达式' },
      { key: 'q', label: '搜索文件内容而不是文件名' },
    ],
  },
  {
    title: '文件与操作',
    keys: [
      { key: 'd', label: '差异比较' },
      { key: 'click', label: '选中一行' },
      { key: 'ctrl+click', label: '添加或取消选中一行；macOS 上为 alt+click' },
      { key: 'shift+click', label: '从锚点选择范围' },
      { key: 'shift+j / k', label: '向下 / 向上扩展选择' },
      { key: 'v / V', label: '添加或取消该行 / 清除标记' },
      { key: 'y / Y', label: '复制相对 / 绝对路径' },
      { key: 'u', label: '复制文件名' },
      { key: 't', label: '在 tmux 或 herdr 窗格中打开终端' },
      { key: 'x', label: "防止 Claude 修改" },
      { key: 'w', label: '仓库外写入的文件' },
    ],
  },
  {
    title: '视图',
    keys: [
      { key: 'p', label: '预览或树状图', terminal: true },
      { key: 'f / b', label: '预览翻页', terminal: true },
      { key: '[ / ]', label: '上一页 / 下一页 PDF 或 Word 页面', terminal: true },
      { key: 'a', label: '自动折叠' },
      { key: 'n / g / m', label: '按名称 / Git 状态 / 大小排序' },
    ],
  },
  {
    title: '面板',
    keys: [
      { key: '?', label: '显示或隐藏此列表', terminal: true },
      { key: 'ctrl+x tab', label: '将键盘焦点交给面板', terminal: true },
      { key: 'alt+l', label: '将键盘焦点交给文件树', terminal: true },
      { key: 'alt+h', label: '返回输入框', terminal: true },
      { key: '/filetree keys', label: '设置 alt+l 和 alt+h', terminal: true },
      { key: 'Esc', label: '返回输入框', terminal: true },
    ],
  },
]

export const SCROLL_KEYS: ReadonlySet<string> = new Set(['up', 'down', 'j', 'k', 'pageup', 'pagedown', 'f', 'b', 'home', 'end'])

export function shortcutGroups(desktop: boolean): ShortcutGroup[] {
  return GROUPS.map(g => ({ title: g.title, keys: g.keys.filter(k => !desktop || !k.terminal) })).filter(g => g.keys.length > 0)
}

export function shortcutRows(accent: string, muted: string): RowSpec[] {
  const groups = shortcutGroups(false)
  const width = Math.max(...groups.flatMap(g => g.keys.map(k => k.key.length))) + 2
  const rows: RowSpec[] = [{ id: '', left: [{ t: ' 快捷键', b: true, c: accent }], right: [{ t: '? 关闭 ', c: muted }] }]
  for (const g of groups) {
    rows.push({ id: '', left: [{ t: ' ' }], right: [] })
    rows.push({ id: '', left: [{ t: ` ${g.title}`, b: true }], right: [] })
    for (const k of g.keys) rows.push({ id: '', left: [{ t: `   ${k.key.padEnd(width)}`, c: accent }, { t: k.label }], right: [] })
  }
  return rows
}
