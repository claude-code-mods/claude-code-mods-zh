import type { BannerView } from '../../hooks/banners'
import { READING_TEXT } from '../../hooks/banners'
import { helpVersionText } from '../../hooks/help'
import { sessionView } from '../../hooks/session-view'
import type { SessionView } from '../../hooks/session-view'
import type { SettledState } from '../../hooks/rows'
import { SETTLED_MS, nextFoldAt, timedChangeAt } from '../../hooks/timing'
import type { Holds } from '../../hooks/timing'
import type { Block } from './blocks'
import { chrome, rowWaits, tabBlocks, tabCells, undoPlaceEndsAt } from './draw'
import type { RowWait } from '../../hooks/action-plan'
import type { LookUi, TabCell } from './draw'
import type { ReadSession } from './files'
import type { Followed } from './follow'
import { drawOuts } from './out'
import type { PressQueue } from './press-queue'

/** What the look shows in place of an inbox, as the case of the terminal it follows says. */
export type Message = { title: string; hint: string | null; isError: boolean }

type Screen =
  | { is: 'message'; message: Message }
  | {
      is: 'inbox'
      view: SessionView
      tabs: TabCell[]
      banners: BannerView[]
      /** Says the host left out older closed items, or null when the session is whole. */
      trimmedNote: string | null
      blocks: Block[]
      /** The host's inbox build as Help names it, or null when its file says none. */
      helpVersion: string | null
      /** The tab's rows, in order, and whether each waits on the person. */
      waits: RowWait[]
      /** When a settled row folds, so the look draws again then. Null when none comes due on the clock. */
      foldAt: number | null
      /** When a queued row next drops its spent Undo's place, so the look draws again then. See `undoPlaceEndsAt`. */
      undoPlaceEndsAt: number | null
      /** When a press changes with the clock alone, as a PR hand-off's button ends its wait for a fetch. See `timedChangeAt`. */
      timedChangeAt: number | null
    }

const TRIMMED_NOTE = '此会话过大，无法完整显示，因此较早的已关闭条目被省略。'

const message = (title: string, hint: string | null, isError = false): Screen => ({
  is: 'message',
  message: { title, hint, isError },
})

/** The message for a terminal that shows no inbox, or for a session file the look could not use. */
function messageOf(followed: Followed, read: ReadSession | null): Screen | null {
  if (followed.is === 'no-terminal')
    return message('此标签页没有终端', '在此标签页中打开带收件箱的智能体即可看到。')
  if (followed.is === 'no-inbox')
    return message(
      '此终端中没有收件箱',
      followed.program
        ? `此处运行的 ${followed.program} 未带收件箱。`
        : '在此启动带收件箱的智能体，即可查看它的问题和发现。',
    )
  if (followed.is === 'ended') return message('会话已结束', '此终端已返回 shell。')
  if (read === null) return message(READING_TEXT, null)
  if (read.is === 'missing')
    return message('正在等待收件箱', '智能体将在下次回复后在此发布其收件箱。')
  if (read.is === 'torn') return message(READING_TEXT, null)
  if (read.is === 'newer')
    return message(
      '此面板已过期',
      `智能体以格式 ${read.format} 写入收件箱。请更新收件箱以读取。`,
      true,
    )
  if (read.is === 'refused') return message('无法读取此收件箱', `其文件存在以下问题：${read.reason}。`, true)

  return null
}

/** What the look holds besides the session: rows held in place, and its presses with the notes and lines they left. */
type LookPresses = {
  holds: Holds
  queue: Pick<PressQueue, 'outs' | 'notes' | 'lines'>
}

/** What the look draws now for the terminal it follows, with the session it read for it. */
export function screenOf(
  followed: Followed,
  read: ReadSession | null,
  ui: LookUi,
  o: { now: number } & LookPresses,
): Screen {
  const shown = messageOf(followed, read)
  if (shown !== null || read?.is !== 'read') return shown ?? message(READING_TEXT, null)
  const { holds } = o
  const view = sessionView(read.session, o.now, SETTLED_MS, holds, o.queue.notes)
  const screen = {
    view,
    agent: read.envelope.agent,
    now: o.now,
    shownSince: holds.shownSince ?? o.now,
    isGhMissing: read.session.prViews.isGhMissing === true,
    isFetchingPrs: read.isFetchingPrs,
  }
  const rows = [...view.needsYou.questions, ...view.needsYou.tasks, ...view.findings.rows]
  const settled = rows.flatMap(r => (r.state.is === 'settled' ? [r.state] : []))
  const placing = {
    lastTypedMessageAt: read.session.presence.lastTypedMessageAt,
    listInput: holds.listInput,
    now: o.now,
    settleWindowMs: SETTLED_MS,
  }

  return {
    is: 'inbox',
    view,
    tabs: tabCells(screen, ui.tab),
    ...chrome(screen, ui.tab),
    trimmedNote: read.isTrimmed ? TRIMMED_NOTE : null,
    helpVersion: read.envelope.version
      ? helpVersionText(read.envelope.version, read.envelope.isNextBuild === true)
      : null,
    blocks: drawOuts(tabBlocks(screen, ui), o.queue.outs, o.queue.lines, o.now),
    waits: rowWaits(screen, ui.tab),
    foldAt: nextFoldAt(settled, placing),
    undoPlaceEndsAt: nextUndoPlaceEnd(settled, o.now),
    timedChangeAt: timedChangeAt(view.lastActions, o.now),
  }
}

function nextUndoPlaceEnd(settled: SettledState[], now: number): number | null {
  const ends = settled
    .filter(s => s.offersUndo && s.delivery === 'queued')
    .map(undoPlaceEndsAt)
    .filter(at => at > now)

  return ends.length > 0 ? Math.min(...ends) : null
}
