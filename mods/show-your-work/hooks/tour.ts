// The tour's stops, and how a press in the player ticks the one it asked for.
import { atom, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import { state } from './state'
import { act } from './telemetry'

// The settings pane's and the tour's redraws. Declared in each file that
// reads or updates it: the engine only reads an atom declared in the same file.
const welcome = atom({ plugin: 'show-your-work', key: 'welcome' } as const, 0)

// Each stop points at one real control (spot) with one short line (tag), and
// is done when the person uses it (goal: the act() name its button fires).
type Spot = 'play' | 'changes' | 'tabs' | 'history'
export type Stop = { tag: string; spot?: Spot; goal?: string; media?: 'splash' | 'recording' | 'compare' | 'history' }
export const STOPS: Stop[] = [
  { tag: '按“播放”观看', spot: 'play', goal: 'play', media: 'splash' },
  { tag: '点击变更项跳转到对应画面', spot: 'changes', goal: 'change_jump', media: 'recording' },
  { tag: '按“原始”查看修改前的效果', spot: 'tabs', goal: 'original', media: 'compare' },
  { tag: '打开“历史记录”，然后选择一个版本', spot: 'history', goal: 'version_pick', media: 'history' },
  { tag: '现在就让 Claude 展示它构建的内容' },
]

// A button press, heard: when it is what the stop asked for, it ticks; the
// person moves on with Next when they're ready.
export function tourHeard($: EngineInterface, action: string) {
  const s = STOPS[state.tourStop]
  if (!state.tourSite || state.isTourDone || state.isStopDone || !s?.goal || s.goal !== action) return
  state.isStopDone = true
  // Sent once per step, numbered from 0 like tour_next_N and tour_skip_N, so a
  // funnel can tell people who did the step from people who only pressed Next.
  act(`tour_step_done_${state.tourStop}`)
  void update($, welcome, n => n + 1)
}
