import { RANDOM_THEMES } from './theme'

export const HINT = [
  'Replies in this session are drawn by the prismantis mod, which runs inside Claude Code and is not a command or tool to call: when the user asks to show something with prismantis, write it as markdown in the reply.',
  'Markdown tables, GitHub alerts (> [!WARNING], > [!NOTE]), fenced code with a language tag, and ```mermaid blocks render as colored terminal graphics:',
  'flowcharts, sequence diagrams, xychart-beta bar or line charts (name each series for the legend: line "east" [..]), pie charts, gantt schedules, quadrantChart grids, mindmap trees, journey mood lines, kanban boards and gitGraph histories.',
  'When a reply carries a numeric series or a flow that is easier to see than read, add a small diagram or chart with short labels, not a second picture of what a figure already shows.',
  'Skip diagrams and pictures for short or simple answers.',
  'Put any command or snippet the user may run or copy in a fenced block with a language tag, never inline code: fenced blocks get a copy button, inline code does not.',
].join(' ')

export const showcaseText = (themes: readonly string[]): string => `
# prismantis

Colored markdown for Claude Code replies: **bold**, *italic*, ~~struck~~, \`inline code\`, a [link](https://github.com/NahumLitvin/prismantis) and a bare URL https://github.com/NahumLitvin/prismantis/issues, both clickable, numbers like 99.9% and 250ms, paths like ~/src/app.ts.

Paths like ~/src/app.ts, ./README.md and /tmp/app.ts open on click in a terminal that draws hyperlinks, and so does a local link that shows its own path, like [/tmp/notes.md](file:///tmp/notes.md), while slash commands like /config stay text. A local link with any other name, like [notes](file:///tmp/notes.md), draws as its name and target, so it cannot hide where a click goes.

Paths written without ./, like docs/guide/ or src/app.ts:42, and Windows paths like C:\\work\\plan.md link too, once a check finds them on disk; prose like and/or stays text. Set \`fullPaths\` in \`/config\` and each path that opens on click shows as its absolute path.

Programs and launchers stay plain text, so a click never runs one: ./install.sh, ~/Desktop/setup.command and /Applications/Calculator.app keep the path color without a link.

Obsidian links that open a note open on click, like [a note](obsidian://open?vault=notes&file=todo), while one that writes, like [a new note](obsidian://new?vault=notes&name=x&content=y), and other app links like [diagnostics](ms-msdt:/id) stay text.

Code-shaped prose stays as written: f(*args, **kwargs), a link with parentheses [Foo_(bar)](https://en.wikipedia.org/wiki/Foo_(bar)), a file link [\`render.tsx\`](https://github.com/NahumLitvin/prismantis/blob/main/hooks/render.tsx) and **bold with *italic* inside**.

## Commands

| Command | Does |
|---------|------|
| \`/prismantis\` | This screen |
| \`/prismantis theme <name>\` | Switch theme on the spot (\`/prismantis <name>\` works too), \`random\` for a new dark one now and each time the mod loads |
| \`/prismantis copy\` | Copy the last reply, or \`copy code\` for its last code block |
| \`/prismantis setup\` | Pick a theme and how prompts, replies, tables, code blocks and tool output look, from drawn samples; \`/prismantis setup more\` goes on to diffs, tool rows, headings, tasks, bubble labels, times, pie charts, the table extras and desktop app colors |
| \`/config\` | Edit any option |

> [!NOTE]
> ${themes.length} themes ship with it. \`mono\` uses no color, only bold and dim.

### Pick a theme

\`\`\`bash
/prismantis theme nord
/prismantis theme github-light
/prismantis theme random
\`\`\`

1. Dark: ${themes.filter(t => RANDOM_THEMES.includes(t)).join(', ')}
2. Light: ${themes.filter(t => /latte|light|dawn/.test(t)).join(', ')}
3. Plain
   - mono

In the desktop app, set \`desktopColors\` to \`match\` and the whole Code tab takes the theme too, in light mode for a light one (Claude Code 2.1.324+).

> [!TIP]
> Any color slot beats the theme. Set \`headingColor\` or \`numberColor\` to a hex value in \`/config\`.

## Everything it draws

### Copy tables

Use \`⧉ md\` for Markdown, \`⧉ art\` for chat, or \`⧉ html\` for a formatted table. \`⧉ html\` shows in a local macOS, Linux or Windows terminal and writes HTML and tab-separated plain text together; Linux needs CopyQ running. Pasted into Slack it makes a native table; Slack keeps cell text but drops bold, links and alignment. If that fails, it copies the plain text alone. \`▣ png\` puts a picture of the drawn table, diagram or chart on the clipboard in the theme's colors, ready to paste into Slack, docs or slides; it shows in a local macOS or Windows terminal. The buttons draw dim and light up under the pointer; set \`copyButtonStyle\` to \`inline\` in \`/config\` for the accent color, or to \`hover\` and each block shows a dim ⧉ instead: point at it for its buttons. Set \`textCopyButtons\` to \`false\` to keep only the buttons on code, tables, diagrams and the reply. Set \`sectionCopyButtons\` to \`true\` for a \`⧉ copy\` on each heading that copies its section, up to the next heading of its level.

| Item | Quantity[^count] | Status |
|:-----|---------:|:------:|
| **Apples** | 3 | *Ready* |
| Oranges | 5 | Pending |

### Very wide tables

Long paths and checksums never split mid-word, so a column cannot shrink below them. When those minimum widths no longer fit the reply, \`tableLayout\` \`auto\` and \`stacked\` draw the table as one card per row, and \`compact\` keeps the columns at their longest word:

| Scroll | Checksum |
|:-------|:---------|
| ~/jade-palace/noodle-scrolls/scrolls/scroll-07-training-notes.md | 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 |
| /srv/dojo/moves.md | 2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae |

### Status matrix

When a table has a status column — the one whose cells are things like ✓, passed, failed or pending — its cells draw in theme colors: green for a pass, red for a failure, amber for a warning, gray for a wait. \`statusMatrix\` \`summary\` adds a count line under the table and \`group\` reorders rows by status with a heavy rule where the status changes:

| Suite | Cases | Result |
|:------|------:|:-------|
| Unit | 412 | ✓ |
| Propagation | 88 | failed |
| Smoke | 24 | pending |
| Regression | 130 | ✓ |

### Test report

When a table draws a run — a status column of things like ✓ or failed next to durations like 120 ms — \`testMatrix\` \`report\` adds a line under the table with how much of the run passed, a count of every other kind of result and the time all of it took. The line reuses the status colors and replaces the \`statusMatrix\` count line when both draw. The default \`off\` keeps tables as written:

| Check | Time | Result |
|:------|-----:|:-------|
| parse | 120 ms | ✓ |
| draw | 4 s | ✓ |
| scan | 130 ms | failed |
| typeset | 2.6 s | pending |

### Benchmarks

When a table compares benchmarks - a column of changes like -10% or +3% beside two columns of runs - \`benchTable\` draws each change in theme colors, green for an improvement and red for a regression; timings read as lower is better unless a header speaks of req/s, throughput or a score. \`trend\` also draws a sparkline of the runs under the table, each step colored by whether it improved. The default \`off\` keeps tables as written:

| Benchmark | Before | After | Change |
|:----------|-------:|------:|:-------|
| parse | 12.4 ms | 11.1 ms | -10% |
| layout | 19.6 ms | 22.4 ms | +14% |
| paint | 2.1 ms | 0.8 ms | -62% |

### Schema

When a table describes a database schema — a column of fields beside a column of types — \`schemaTable\` draws the type cells by their family: text types like varchar in the string color, numeric types like int in the number color, booleans in the emphasis color, time types like timestamp in the link color. \`keys\` draws the constraint cells — PK in the accent color, FK in the link color, unique and index cells in gray — and \`full\` does both. The default \`off\` keeps tables as written:

| Column | Type | Key | Default |
|:-------|:-----|:----|:--------|
| id | uuid | PK | |
| email | varchar(255) | UNIQUE | |
| org_id | bigint | FK → orgs.id | |
| created_at | timestamp | | now() |

### Comparison

When a table compares options — a column of scores beside a column of ranks — \`compareTable\` draws the rank cells as a medal: 1 in the accent color, 2 and 3 in the link color, the same pairing the schema table's PK and FK use. \`pick\` draws the score cell of the top score in the improvement green, the hue \`benchTable\` gives an improvement, and bolds it so it stands out even in a theme where that green is also the number color, and \`full\` does both. The default \`off\` keeps tables as written:

| Option | Score | Rank |
|:-------|------:|-----:|
| mantis | 9.2 | 1 |
| origami | 7.8 | 2 |
| noodle | 6.1 | 3 |
| tofu | 4.4 | 4 |

### API

When a table documents an API — a method column whose cells read like HTTP verbs — \`apiTable\` draws the method cells by what the verb does: reads like GET in the link color, writes like POST in the string color, DELETE in the removed color, other verbs in gray. \`auth\` draws the scheme cells of an auth column — Bearer, OAuth, API key, JWT — in the accent color, and \`full\` does both. The default \`off\` keeps tables as written:

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| GET | /v1/scrolls | Bearer | List the scrolls |
| POST | /v1/scrolls | Bearer | Add a scroll |
| DELETE | /v1/scrolls/:id | API key | Remove a scroll |
| GET | /v1/health | none | Liveness check |

### Key-value

When a table lists configuration — a column of options beside columns of values, sources and defaults — \`kvTable\` draws the source cells by where it says the value comes from: env in the link color, config in the string color, default in gray. \`overrides\` draws the value cell in the accent color when the row's value differs from its default, and \`full\` does both. The default \`off\` keeps tables as written:

| Option | Value | Source | Default |
|:-------|:------|:-------|:--------|
| retries | 5 | env | 3 |
| format | json | config | json |
| timeout | 30s | default | 30s |
| token | abc123 | env | unset |

### Groups

When a table groups its rows — the first column whose cells repeat in runs, like a column of services or teams — \`groupTable\` draws each group once: \`merge\` labels the group in the accent color and blanks the repeats under it, \`count\` also adds the group's size to its label, and \`full\` also draws a heavy rule where one group ends and the next begins. A column of numbers never groups, and a table already grouped by status keeps its status grouping. The default \`off\` keeps tables as written:

| Service | Region | Requests | p99 |
|:--------|:-------|---------:|----:|
| api | us-east | 1.2M | 84 ms |
| api | us-west | 900k | 91 ms |
| worker | us-east | 2.4M | 120 ms |
| worker | us-west | 1.8M | 132 ms |
| cron | us-east | 96k | 40 ms |

### Alerts

> [!IMPORTANT]
> After updating the plugin, open sessions need \`/reload\`.

> [!WARNING]
> Terminals that copy on select (Warp) can turn a click on a copy button into a selection. Use the keyboard shortcut.
> Selecting a typeset formula copies blank cells. Its copy button copies the LaTeX.

> [!CAUTION]
> Claude Code refuses trees over 20000 nodes. A code block past about 500 highlighted lines falls back to plain text.

### Task lists

- [x] Parse the reply
- [x] Draw it
  - [x] Tables and code
  - [ ] Diagrams on the desktop app
- [ ] Ship the next release

Set \`listMarker\` to dash in \`/config\` and bullets draw as \`-\`, so a list you select with the mouse pastes as markdown.

### Your prompts

Scroll up: what you typed sits on the right under \`You ⬤\` and Claude's replies on the left under \`⬤ Claude\`, each in a bubble of its own, like a chat app. \`promptStyle\` switches to \`framed\`, \`wide\`, \`bar\`, \`chevron\` or \`off\` in \`/config\`, which also brings back the dot before Claude's replies; \`replyStyle\` picks \`solid\`, \`framed\` or \`off\` for Claude's side, and \`bubbleLabels\` draws both labels with a \`small\` dot or turns them \`off\`. Set \`clock\` to \`24h\` or \`12h\` and each prompt shows when you sent it, and each turn's last line when it finished. A paste of 4 lines or more draws in a double frame of its own, folded to one button that opens it as highlighted code.

### Tool rows

Tool calls draw as one line, dimmed on the right by default, and the file each one read or edited opens on click in a terminal that draws hyperlinks. Set \`toolStyle\` in \`/config\` to \`chat\`, \`tree-dim\`, \`tree-bold\` or \`classic\`. \`toolOutput: quiet\` in \`/config\` hides what Claude only read and says in plain words what each call did: \`Read src/app.ts lines 1–40\`, \`Searched src/ for "TODO"\`, and \`toolOutput: rows\` draws only the row of every call that worked. A call still running shows a still \`◌\`; \`runningDot: blink\` makes it a \`●\` that blinks every half second, and \`unreadPrompts\` keeps each prompt you send grey and blinking until Claude starts on it, so one queued mid-turn stands out.

Each edit draws as a diff card headed \`+N −M\`: code highlighted in the file's language, added and removed lines on a tint of the theme's own green and red with the changed words in a deeper tint, kept readable in every theme, long lines wrapped, the first 20 lines and a \`+K more lines\` button that opens the rest, as does a click anywhere on the card. Files a shell command changes (\`sed -i\`, a script) get the same card, one per file, headed by its path. Set \`diffStyle\` in \`/config\` for the look: \`card\`, \`full\`, \`marks\` or \`bar\`.

A file Write creates shows its first 10 lines as numbered code in the theme's colors with no diff marks, and a click on it or on \`+K more lines\` opens the rest. A file an Edit or a shell command creates shows its first 10 lines as added lines under \`Created\`. A file a shell command removes is one \`Deleted\` line that opens to its removed lines on a click, and a file moved unchanged is one \`Renamed old → new\` line.

### Quotes and rules

> A quote keeps its text when you copy it, without the \`> \` markers.
>
> It keeps its paragraphs and lists too:
> - **bold** and \`inline code\` stay styled
> - each item gets its own row
>
> > A nested quote draws inside the bar.

<summary>
A line that holds only a tag draws dim, so wrapper tags show the reply's structure.
</summary>

---

### Code

Set \`codeStyle\` in \`/config\` for the look: \`plain\`, \`framed\`, \`filled\` or \`card\`.

\`\`\`json
{ "theme": "dracula", "headingStyle": "banner", "mermaid": true }
\`\`\`

Blocks of 10 lines or more get line numbers. Past 30 lines they fold to the first 20 and a \`+M more lines\` button, \`show less\` folds them back; \`⧉ copy\` still copies the whole block. Set \`folds\` to \`open\` in \`/config\` and long blocks start whole instead, with \`show less\` to fold them again.

\`\`\`ts
type Item = { name: string; price: number; qty: number }

const basket: Item[] = [
  { name: 'apples', price: 1.2, qty: 3 },
  { name: 'oranges', price: 0.8, qty: 5 },
  { name: 'pears', price: 1.5, qty: 2 },
  { name: 'plums', price: 2.1, qty: 4 },
  { name: 'grapes', price: 3.4, qty: 1 },
  { name: 'lemons', price: 0.6, qty: 6 },
  { name: 'melons', price: 4.0, qty: 1 },
  { name: 'cherries', price: 5.5, qty: 2 },
  { name: 'figs', price: 2.8, qty: 3 },
  { name: 'limes', price: 0.5, qty: 8 },
  { name: 'peaches', price: 1.9, qty: 4 },
  { name: 'kiwis', price: 0.9, qty: 6 },
]

const total = (items: Item[]): number =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0)

const cheapest = (items: Item[]): Item | undefined =>
  [...items].sort((a, b) => a.price - b.price)[0]

const byName = (items: Item[]): Item[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name))

const receipt = (items: Item[]): string[] =>
  byName(items).map(item => \`\${item.name.padEnd(10)} \${item.qty} x \${item.price.toFixed(2)}\`)

console.log(receipt(basket).join('\\n'))
console.log('total', total(basket).toFixed(2))
console.log('cheapest', cheapest(basket)?.name)
\`\`\`

#### Math

$$
\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}
$$

#### Images

In kitty and Ghostty a PNG on a line of its own draws as a picture: a local path, \`~/\`, \`file://\` or a \`data:\` URL. Web images stay links, prismantis downloads nothing. Other terminals show the alt text in link color.

![prism band](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAAoCAIAAAAAIrR+AAACdElEQVR42u3TewcQBgAA8ZNkkkySJEmSJJOWrW3t/cyWJJlMkmQmSZIkSSaTJEmSJEmStLS0trX3smVLkiRJkiTJZCZJdrNvsP0xNu73Fc4hOBAfwyH4OA7HkTgax+J4nIiTcQpOw+k4A1/EV/FNfBtn41x8F9/DhbgY38eluBxX4mpci+vxQ/wIN+NW3I47cTfuxf14EA/jUTyOJ/EUfo3f44/4M57DC3gJr+A1vIG38A7+ir/hfXyIf/BIHsjvck/uym25KdflqlyWi3JezsoZOS3fyVfyuZyQY3JEDskB2Sd7ZJfskG2yRTbJRtkg62SNrJIVskw+kCWySBbIfJknc2SWzJQ35BV5QZ6Vp2SqPCGTZIKMkzEySkbIMBkqg2WQDPgrwAAchINxKA7DETgKx+A4nICT8Amcik/hM/g8voyv40ychXNwHs7HBbgIl+AHuAxX4Cpcg+twA27ETbgFt+EO3IV7cB8ewEN4BI/hCfwMv8Rv8TSewbN4Hi/iZbyK1/Em3sa7eA9/xwf4iD/kodyX3+RXuSO35IZckytySS7IOflFfpIf5Bs5JSfluByVw3JQ9ste2S07Zbtslc3ykXwo62WtrJaVslyWyvuyWBbKe/KuzJXZ8o68Ja/JSzJDpss0mSKTZaKMl7EyWkbKcHlchshjMvDvHvAkPo3P/TsHfIyf4Kf4xT88YABJ/rcaOGngJA2cpIGTBk7SwEkaOEkDJw2cpIGTNHDSwEkaOEkDJ2ngpIGTNHCSBk7SwEkDJ2ngJA2cNHCSBk7SwEkaOGngJA2cpIGTNHDSwEkaOEkDJw2cpIGTNHCSBk4aOMl/yZ8SRd1gPq93WQAAAABJRU5ErkJggg==)

#### Footnotes

Latency fell to 120ms[^lat] after the cache change[^cache].

Click a mark to see its note. Point at a note to light the marks that cite it. Both need Claude Code 2.1.295 or later.

[^count]: Counted at close.
[^lat]: Median of 50 runs.
[^cache]: Entries expire after 10m.

#### Diagrams

\`\`\`mermaid
flowchart LR
    R["<i>Reply</i>"] --> P["<b>Parse</b>"]
    P --> D["<u>Draw</u>"]
    D --> S["<s>Screen</s>"]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant U as You
    participant C as Claude
    participant P as prismantis
    U->>C: prompt
    C->>P: markdown
    P-->>U: colored reply
\`\`\`

\`\`\`mermaid
xychart-beta
    title "Color options per group"
    x-axis [text, head, num, code, diag]
    y-axis "options" 0 --> 8
    bar [7, 3, 2, 6, 2]
\`\`\`

Name each series and the legend says which line is which:

\`\`\`mermaid
xychart-beta
    title "Replies per hour"
    x-axis [09, 10, 11, 12, 13]
    y-axis 0 --> 40
    line "east" [30, 34, 22, 26, 31]
    line "west" [12, 18, 25, 20, 14]
\`\`\`

A pie draws round with a legend, as a smooth picture in kitty and Ghostty. Set \`pieStyle\` to \`bars\` in \`/config\` for one bar per slice:

\`\`\`mermaid
pie showData title Time per reply stage
    "Parse" : 3
    "Draw" : 9
    "Paint" : 5
\`\`\`

\`\`\`mermaid
gantt
    title Release week
    dateFormat YYYY-MM-DD
    section Build
    Parser   :p, 2026-10-05, 2d
    Renderer :r, after p, 3d
    section Ship
    Review   :after r, 2d
    Release  :milestone, 2026-10-12, 0d
\`\`\`

A quadrant chart numbers its points and lists them under the grid:

\`\`\`mermaid
quadrantChart
    title Feature priorities
    x-axis Low effort --> High effort
    y-axis Low impact --> High impact
    quadrant-1 Big bets
    quadrant-2 Do now
    quadrant-3 Fill-ins
    quadrant-4 Skip
    Reorder: [0.2, 0.85]
    Search: [0.8, 0.9]
    Dark mode: [0.3, 0.25]
    Localisation: [0.75, 0.4]
\`\`\`

A mind map grows from its root to the right, one color per branch:

\`\`\`mermaid
mindmap
    root((Release))
        Code
            Tests
            Review
        Docs
            Changelog
        Ship
            Tag
            Announce
\`\`\`

A user journey draws its mood line across the tasks, green when it goes well and red when it hurts:

\`\`\`mermaid
journey
    title First order
    section Find
        Search: 4: Shopper
        Compare: 3: Shopper
    section Buy
        Checkout: 1: Shopper
        Delivery: 5: Shopper, Courier
\`\`\`

A kanban board puts its columns side by side, each card with its owner, ticket and priority:

\`\`\`mermaid
kanban
    todo[To do]
        a[Fix login timeout]@{ assigned: 'Amy', priority: 'High' }
        b[Write release notes]@{ ticket: DOC-7 }
    doing[In progress]
        c[Dark mode]@{ assigned: 'Ken' }
    done[Done]
        d[Search filters]
\`\`\`

A git graph runs top to bottom, one colored lane per branch:

\`\`\`mermaid
gitGraph
    commit id: "init" tag: "v1.0"
    branch develop
    commit id: "login"
    commit id: "fix" type: HIGHLIGHT
    checkout main
    merge develop id: "release" tag: "v1.1"
\`\`\`

A diagram wider than the terminal stays source, with a dim line saying why:

\`\`\`mermaid
flowchart TD
    Q[Queue] --> W1[Worker 1] & W2[Worker 2] & W3[Worker 3] & W4[Worker 4] & W5[Worker 5] & W6[Worker 6] & W7[Worker 7] & W8[Worker 8] & W9[Worker 9] & W10[Worker 10] & W11[Worker 11] & W12[Worker 12] & W13[Worker 13] & W14[Worker 14] & W15[Worker 15] & W16[Worker 16]
\`\`\`

A figure draws as written, its markup colored by role:

\`\`\`figure
{dim:timeout at 10 s, handler books at 12 s, retry books again}
          {note:0 s}           {note:10 s}  {note:12 s}              {note:later}
          {accent:▏─────────────▏─────▏─────────────────▏}
Provider  {accent:██████████████}{warn:✗} timeout               {accent:█} retry
Handler   {ok:████████████████████} 200, nobody waits
Bookings  0                   {ok:1}                 {warn:2 twice}
\`\`\`

A box whose rows slip off its frame is lined up with its corner:

\`\`\`figure
{accent:┌─ queue ──────────┐}
{accent:│} {ok:● worker 1} {accent:│}
{accent:│} {warn:▲ worker 2 slow}      {accent:│}
{accent:└──────────────────┘}
\`\`\`
`

export const OPENCODE_CHARTS = ['xychart-beta', 'pie', 'quadrantChart', 'mindmap', 'journey', 'kanban', 'classDiagram', 'erDiagram']

export const opencodeShowcase = (themes: readonly string[]): string => {
  const full = showcaseText(themes)
  const diagrams = full
    .slice(full.indexOf('#### Diagrams') + 2)
    .replace(/A diagram wider than the terminal[^]*?```\n\n/, '')
    .replace(/<\/?[bius]>/g, '')
    .replace(/, as a smooth picture in kitty and Ghostty\. Set `pieStyle`[^:]*:/, ':')
    .replace(new RegExp(`\`\`\`mermaid\\n(?=(?:${OPENCODE_CHARTS.join('|')})\\b)`, 'g'), '```chart\n')
  return `
# prismantis in OpenCode

OpenCode draws the prose in the theme colors: **bold**, *italic*, \`inline code\`, [links](https://github.com/NahumLitvin/prismantis), lists, quotes, tables and code. Run \`/prismantis-themes\` to install ${themes.length} prismantis themes, then pick one in settings > Theme.

| Block | Drawn by |
|---|---|
| flowchart, sequenceDiagram, stateDiagram-v2, gantt, gitGraph, timeline | OpenCode |
| ${OPENCODE_CHARTS.join(', ')} | prismantis, in a chart block |
| figure | prismantis |

Copy buttons, tool rows, diff cards, alert boxes, footnotes, math, images and prompt styles draw in Claude Code only.

\`\`\`ts
const total = (items: { price: number; qty: number }[]) => items.reduce((sum, item) => sum + item.price * item.qty, 0)
\`\`\`

${diagrams}
Class and entity diagrams draw as boxes joined by their relations:

\`\`\`chart
classDiagram
    Reply <|-- Chart
    Reply : +text
    Chart : +draw()
\`\`\`

\`\`\`chart
erDiagram
    THEME ||--o{ COLOR : has
\`\`\`
`
}

export const helpText = (themes: readonly string[]): string => `
## Commands

| Command | Does |
|---------|------|
| \`/prismantis theme <name>\` | Switch theme on the spot (\`/prismantis <name>\` works too), \`random\` for a new dark one now and each time the mod loads |
| \`/prismantis copy\` | Copy the last reply, or \`copy code\` for its last code block |
| \`/prismantis setup\` | Pick a theme and how prompts, replies, tables, code blocks and tool output look, from drawn samples; \`/prismantis setup more\` goes on to diffs, tool rows, headings, tasks, bubble labels, times, pie charts, the table extras and desktop app colors |
| \`/prismantis demo\` | Full showcase, every element and diagram, plus a section in your language (Korean so far, or \`demo ko\`) |
| \`/prismantis demo-rtl\` | Hebrew right-to-left showcase |

### ${themes.length} themes

- Dark: ${themes.filter(t => RANDOM_THEMES.includes(t)).join(', ')}
- Light: ${themes.filter(t => /latte|light|dawn/.test(t)).join(', ')}
- Plain: mono, no color, only bold and dim
- Desktop app: set \`desktopColors\` to \`match\` and the Code tab takes the theme too (Claude Code 2.1.324+)

Docs and issues: https://github.com/NahumLitvin/prismantis

> [!TIP]
> Any color slot beats the theme. Set \`headingColor\` or \`numberColor\` to a hex value in \`/config\`.

### Task lists

- [x] Tables, diagrams and charts drawn in the terminal
- [x] Copy tables as Markdown, art or HTML (macOS/Linux), and tables, diagrams and charts as a PNG image (macOS/Windows)
- [ ] Pick a \`taskStyle\` in \`/config\`: checks, ticks, box or progress
- [ ] Set \`listMarker\` to dash so a list you select with the mouse pastes as markdown

\`\`\`mermaid
flowchart LR
    R[Reply] --> P[Parse]
    P --> D[Draw]
    D --> S[Screen]
\`\`\`

\`\`\`mermaid
xychart-beta
    title "Color options per group"
    x-axis [text, head, num, code, diag]
    y-axis "options" 0 --> 8
    bar [7, 3, 2, 6, 2]
\`\`\`

> [!CAUTION]
> Claude Code refuses trees over 20000 nodes. A code block past about 500 highlighted lines falls back to plain text.
`

export const rtlShowcaseText = (): string => `
# עברית מימין לשמאל

**שלום חברים**, זו הדגמה של עברית עם מונחים באנגלית כמו \`kubectl\`, מספרים כמו 99.9% ו-250ms, נתיב כמו ~/src/app.ts וגם [קישור](https://github.com/NahumLitvin/prismantis).

## רשימות

- פרוסים בשני אזורים (us-east ו-eu-west)
- Python מתאים גם לסקריפטים קצרים
- מחליפים ערכת נושא עם \`/prismantis theme nord\`

1. מתקינים את התוסף
2. שואלים שאלה בעברית

> עברית נקראת מימין לשמאל, גם בטרמינל בלי תמיכה בכיווניות

> [!TIP]
> כל ערכת נושא עובדת גם בעברית

| שירות | אזור | גרסה |
| :--- | :--- | ---: |
| שער | us-east | 2.14.0 |
| חיוב | eu-west | 1.8.3 |

\`\`\`bash
ls -la # רשימת הקבצים בתיקייה
\`\`\`

\`\`\`text
טיוטה להודעה: הגרסה עלתה ב-14:20
\`\`\`

\`\`\`mermaid
flowchart LR
  A[בקשה חדשה] --> B{האם יש cache?}
  B -->|כן| C[מחזירים מה-cache]
  B -->|לא| D[פונים לשרת]
\`\`\`
`

export const NARROW_PANE = 100

export const narrowHint = (columns: number): string =>
  `This terminal pane is ${columns} columns wide, and a diagram wider than the pane draws as its source. Keep diagrams narrow: flowchart TD, never LR, node and edge labels of 1 to 3 words, at most 3 boxes side by side, and at most 3 sequence diagram participants.`

export const KEY_POINT_HINT = 'This terminal draws **bold** text in a highlight color, so bold is how the user spots what matters. In each reply, put the key point or points in bold: the answer, the result, the decision, or what the user has to do. Bold a short phrase, not a whole sentence or paragraph, and usually no more than three per reply.'
export const ISSUE_HINT = 'If the user says prismantis drew something wrong, offer (ask first) a minimal repro issue at https://github.com/NahumLitvin/prismantis/issues.'
const KOREAN_SHOWCASE = `
## 한국어

**안녕하세요**, prismantis는 한국어 답변도 그대로 보여 줍니다. \`kubectl\` 같은 영문 명령어, 숫자 99.9%와 250ms, 경로 ~/src/app.ts도 함께 표시됩니다.

- 서울 리전과 도쿄 리전에 배포
- \`/prismantis theme nord\`로 테마 변경

| 서비스 | 리전 | 버전 |
| :--- | :--- | ---: |
| 게이트웨이 | ap-northeast-2 | 2.14.0 |
| 결제 | ap-northeast-1 | 1.8.3 |

\`\`\`figure
{accent:┌─ 빌드 ─────────────┐}
{accent:│} 이미지 생성 완료   {accent:│}
{accent:│} {ok:✓ 테스트 통과}      {accent:│}
{accent:│} {warn:▲ 배포 대기}        {accent:│}
{accent:└────────────────────┘}
\`\`\`

\`\`\`mermaid
flowchart LR
  A[새 요청] --> B{캐시 있음?}
  B -->|예| C[캐시에서 반환]
  B -->|아니오| D[서버 호출]
\`\`\`
`

export const languageShowcase = (lang: string): string => (/^ko/i.test(lang) ? KOREAN_SHOWCASE : '')

export type SetupStep = { name: string; key: 'theme' | 'tableStyle' | 'tableLayout' | 'statusMatrix' | 'testMatrix' | 'benchTable' | 'schemaTable' | 'compareTable' | 'apiTable' | 'kvTable' | 'groupTable' | 'taskStyle' | 'listMarker' | 'headingStyle' | 'copyButtonStyle' | 'promptStyle' | 'replyStyle' | 'bubbleLabels' | 'clock' | 'toolStyle' | 'toolOutput' | 'diffStyle' | 'codeStyle' | 'pieStyle' | 'desktopColors'; title: string; note: string; options: readonly string[]; sample: string }

export const setupSteps = (themes: readonly string[]): SetupStep[] => [
  { name: 'theme', key: 'theme', title: '主题', note: '每个主题绘制的内容相同。`random` 会在每次加载模组时随机选一个新的深色主题。', options: themes, sample: '**Bold**, `inline code`, 250ms and ~/src/app.ts.' },
  { name: 'prompts', key: 'promptStyle', title: '你的提问', note: '你输入的内容在对话记录中的显示方式。`bubble` 会像聊天应用一样把它放在右侧的 `You ⬤` 标签下，Claude 的回复则显示在自己的气泡中。`framed` 绘制方式相同但不填充。其他样式保持 Claude 的回复不变。`off` 保留 Claude Code 自带的外观。', options: ['bubble', 'framed', 'wide', 'bar', 'chevron', 'off'], sample: '' },
  { name: 'replies', key: 'replyStyle', title: 'Claude 的回复', note: 'Claude 的回复在对话记录中的显示方式。当你的提问使用 `bubble` 时，`auto` 也会以 `bubble` 绘制回复，使对话看起来像聊天；其他提问样式下则按 `off` 绘制。`bubble` 会在 `⬤ Claude` 下为每段回复加上圆角框，边框使用 Claude 的橙色，填充色比背景稍微偏移；`solid` 将填充延伸到边缘且不加边框；`framed` 保留边框但不填充。回复中若夹杂工具调用，每段文本会分别绘制一个气泡。`off` 只在首行前保留一个圆点。', options: ['auto', 'bubble', 'solid', 'framed', 'off'], sample: '' },
  { name: 'tables', key: 'tableStyle', title: '表格', note: 'Markdown 表格的显示方式。', options: ['box', 'rules', 'grid', 'minimal'], sample: '| Item | Qty |\n|:-----|----:|\n| Apples | 3 |\n| Pears | 5 |' },
  { name: 'code', key: 'codeStyle', title: '代码块', note: '代码块的显示方式。`plain` 没有边框，鼠标选中时只复制代码。`framed` 会添加圆角框，框线字符也会进入鼠标选区；复制按钮会排除这些字符。`filled` 添加背景色，在没有可填充颜色的主题中则添加边框。`card` 同时添加两者。', options: ['plain', 'framed', 'filled', 'card'], sample: '```ts\nconst retries = 3\n```' },
  { name: 'output', key: 'toolOutput', title: '工具输出', note: '工具调用显示多少内容。`full` 保留 Claude Code 在每一行下方显示的结果。`quiet` 用 shell 调用的功能为其命名，并在失败时只显示最后一行真实输出，而不是全部输出；它还会把读取、搜索和列目录显示为单独一行，并省略审批行。`rows` 是只绘制成功调用那一行的 `quiet`，因此 `npm test` 也不显示输出。所有模式都会保留编辑操作的差异。需要开启 `toolRows`。', options: ['full', 'quiet', 'rows'], sample: '' },
  { name: 'diffs', key: 'diffStyle', title: '差异', note: '编辑或新建文件的内容在其下方行的显示方式。`card` 用圆角框包围这些行，`full` 去掉边框并沿整行着色，`marks` 不着色，只给 `+` 和 `−` 标记上色，`bar` 在每行更改前放置彩色 `▌`。每种外观都会高亮代码和改动过的词。需要开启 `toolRows`。', options: ['card', 'full', 'marks', 'bar'], sample: '' },
  { name: 'tools', key: 'toolStyle', title: '工具行', note: '工具行如何排列在 Claude 的句子旁边。要把会话截图分享出去吗？`chat` 和 `tree-dim` 会把工具行绘制成暗灰色，图片缩小时它们最先模糊，因此请选择 `tree-bold` 或 `classic`。', options: ['chat', 'tree-dim', 'tree-bold', 'classic'], sample: '' },
  { name: 'headings', key: 'headingStyle', title: '标题', note: '`#` 和 `##` 标题的显示方式。终端只有一种字号，因此标题通过样式和颜色来突出。', options: ['banner', 'bold', 'underline', 'uppercase'], sample: '# Release notes\n\n## Fixes\n\nTables keep their width.' },
  { name: 'table-layout', key: 'tableLayout', title: '表格布局', note: 'Markdown 表格如何适应宽度。`classic` 保持当前外观：各列共享宽度并随终端收缩。当最长单词也放不下时，`auto` 像 `classic` 一样伸展，并把每行堆叠为标签和值。`compact` 让每列恰好容纳最长单词，长单元格换行，表格保持较窄。`stacked` 始终绘制标签和值对。桌面应用按回复宽度的一定比例排布表格，因此 auto 和 stacked 会保持该比例。示例的列不能窄于其最长单词，所以 `classic` 会换行单元格，而 `auto` 和 `stacked` 会绘制卡片。', options: ['classic', 'auto', 'compact', 'stacked'], sample: '| Scroll | Checksum |\n|:-------|:---------|\n| ~/jade-palace/noodle-scrolls/scrolls/scroll-07-training-notes.md | 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 |\n| /srv/dojo/moves.md | 2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae |' },
  { name: 'tasks', key: 'taskStyle', title: '任务', note: '`- [ ]` 和 `- [x]` 任务的显示方式。', options: ['checks', 'ticks', 'box', 'progress'], sample: '- [x] Parse the reply\n- [x] Draw it\n- [ ] Ship it' },
  { name: 'lists', key: 'listMarker', title: '列表符号', note: '列表项的显示方式。`dash` 会在每一级绘制 `-`，这样用鼠标选中的列表粘贴到 Slack、GitHub 或文档中时仍是 Markdown 列表。', options: ['dots', 'dash'], sample: '- Parse the reply\n  - Find the lists\n- Draw it' },
  { name: 'copy', key: 'copyButtonStyle', title: '复制按钮', note: '表格、代码、图表和回复上复制按钮的位置。`dim` 将它们显示为各代码块旁或上方的纯文字标签，鼠标或焦点未悬停时呈暗色。`inline` 用强调色绘制相同的按钮。`hover` 改为在每个块旁放置暗色 ⧉，仅当指针停在该 ⧉ 上时才显示按钮，因此不占行；ctrl+x Tab 无法到达隐藏的按钮，移动端应用则将其内联显示。需要开启 `copyButtons`。', options: ['dim', 'inline', 'hover'], sample: '' },
  { name: 'labels', key: 'bubbleLabels', title: '气泡标签', note: '提问上方的 `You ⬤` 标签和回复上方的 `⬤ Claude` 标签。`large` 像 Claude Code 一样绘制 ⬤，`small` 绘制圆点 ●，`off` 同时去掉两个标签并保留边框。使用 `You` 需要 `promptStyle: bubble` 或 `framed`，使用 `Claude` 需要 `replyStyle` 不为 `off`。', options: ['large', 'small', 'off'], sample: '' },
  { name: 'clock', key: 'clock', title: '时间', note: '是否显示提问的发送时间，以及每轮结束时的收尾行。跨天的时间会附上日期。', options: ['off', '24h', '12h'], sample: '' },
  { name: 'pies', key: 'pieStyle', title: '饼图', note: 'Mermaid `pie` 图表的绘制方式。`round` 在 kitty 和 Ghostty 中绘制平滑图形，其他终端绘制文本；在 ASCII 模式下，当扇区数多于主题可区分的颜色数（单色主题始终如此）或终端过窄时，会退化为条形图。', options: ['round', 'bars'], sample: '```mermaid\npie title Time per reply stage\n    "Draw" : 9\n    "Paint" : 5\n    "Parse" : 3\n```' },
  { name: 'status-matrix', key: 'statusMatrix', title: '状态矩阵', note: '表格中状态单元格的显示方式：即单元格内容为 ✓、通过、失败或等待之类的列。`off` 保持表格原样。`color` 用主题颜色绘制这些单元格，`summary` 在表格下方添加统计行，`group` 还会按状态重排行，并在状态变化处绘制粗分隔线。', options: ['color', 'summary', 'group', 'off'], sample: '| Suite | Cases | Result |\n|:------|------:|:-------|\n| Unit | 412 | ✓ |\n| Propagation | 88 | failed |\n| Smoke | 24 | pending |' },
  { name: 'test-report', key: 'testMatrix', title: '测试报告', note: '测试结果表格的汇总内容：状态列（如 ✓ 或失败）旁边是 120 ms 这样的耗时列。`off` 保持表格原样。`report` 在表格下方添加一行，显示通过比例、其他每种结果的计数以及总耗时。', options: ['report', 'off'], sample: '| Check | Time | Result |\n|:------|-----:|:-------|\n| parse | 120 ms | ✓ |\n| draw | 4 s | ✓ |\n| scan | 130 ms | failed |\n| typeset | 2.6 s | pending |' },
  { name: 'bench-table', key: 'benchTable', title: '基准测试', note: '基准测试对比表格的显示方式：变化列如 -10% 或 +3%。`off` 保持表格原样。`color` 用主题颜色绘制每个变化，改善为绿色，退步为红色；`trend` 还会在表格下方绘制各次运行的迷你走势图。', options: ['trend', 'color', 'off'], sample: '| Benchmark | Before | After | Change |\n|:----------|-------:|------:|:-------|\n| parse | 12.4 ms | 11.1 ms | -10% |\n| layout | 19.6 ms | 22.4 ms | +14% |\n| paint | 2.1 ms | 0.8 ms | -62% |' },
  { name: 'schema-table', key: 'schemaTable', title: '数据库结构', note: '描述数据库结构的表格的显示方式：字段列旁边是类型列。`off` 保持表格原样。`types` 按类型族用主题颜色绘制每个类型单元格：varchar 等文本类型用字符串色，int 等数值类型用数字色，布尔类型用强调色，timestamp 等时间类型用链接色。`keys` 绘制约束单元格：PK 用强调色，FK 用链接色，unique 和 index 用灰色。`full` 同时启用两者。', options: ['full', 'types', 'keys', 'off'], sample: '| Column | Type | Key | Default |\n|:-------|:-----|:----|:--------|\n| id | uuid | PK | |\n| email | varchar(255) | UNIQUE | |\n| org_id | bigint | FK → orgs.id | |\n| created_at | timestamp | | now() |' },
  { name: 'compare-table', key: 'compareTable', title: '对比', note: '选项对比表格的显示方式：分数列旁边是排名列。`off` 保持表格原样。`rank` 用主题颜色绘制排名单元格：第 1 名用强调色，第 2、3 名用链接色。`pick` 用代表改善的绿色和粗体绘制最高分的单元格，使其在绿色也用作数字色的主题中依然醒目。`full` 同时启用两者。', options: ['full', 'rank', 'pick', 'off'], sample: '| Option | Score | Rank |\n|:-------|------:|-----:|\n| mantis | 9.2 | 1 |\n| origami | 7.8 | 2 |\n| noodle | 6.1 | 3 |\n| tofu | 4.4 | 4 |' },
  { name: 'api-table', key: 'apiTable', title: 'API 参考', note: 'API 参考表格的显示方式：方法列的单元格形如 HTTP 动词。`off` 保持表格原样。`verbs` 根据动词含义绘制方法单元格：GET 等读取操作用链接色，POST 等写入操作用字符串色，DELETE 用表示删除的颜色，其他动词用灰色。`auth` 用强调色绘制认证列的方案单元格：Bearer、OAuth、API key 和 JWT。`full` 同时启用两者。', options: ['full', 'verbs', 'auth', 'off'], sample: '| Method | Endpoint | Auth | Description |\n|:-------|:---------|:-----|:------------|\n| GET | /v1/scrolls | Bearer | List the scrolls |\n| POST | /v1/scrolls | Bearer | Add a scroll |\n| DELETE | /v1/scrolls/:id | API key | Remove a scroll |\n| GET | /v1/health | none | Liveness check |' },
  { name: 'kv-table', key: 'kvTable', title: '键值对', note: '配置项表格的显示方式：选项列旁边是值、来源或默认值列。`off` 保持表格原样。`sources` 按值来源用主题颜色绘制来源单元格：env 用链接色，config 用字符串色，default 用灰色。当某行的值与默认值不同时，`overrides` 用强调色绘制该值单元格。`full` 同时启用两者。', options: ['full', 'sources', 'overrides', 'off'], sample: '| Option | Value | Source | Default |\n|:-------|:------|:-------|:--------|\n| retries | 5 | env | 3 |\n| format | json | config | json |\n| timeout | 30s | default | 30s |\n| token | abc123 | env | unset |' },
  { name: 'group-table', key: 'groupTable', title: '分组', note: '对行进行分组的表格的显示方式：第一列中连续重复的单元格，如服务或团队列。`off` 保持表格原样。`merge` 用强调色为分组标注一次，并将下方重复的单元格留空；`count` 还会在标签中加入分组大小；`full` 还会在一组结束、下一组开始处绘制粗分隔线。', options: ['full', 'count', 'merge', 'off'], sample: '| Service | Region | Requests | p99 |\n|:--------|:-------|---------:|----:|\n| api | us-east | 1.2M | 84 ms |\n| api | us-west | 900k | 91 ms |\n| worker | us-east | 2.4M | 120 ms |\n| worker | us-west | 1.8M | 132 ms |\n| cron | us-east | 96k | 40 ms |' },
  { name: 'desktop', key: 'desktopColors', title: '桌面应用配色', note: 'Claude Code 桌面应用（代码标签页）是否也采用该主题：背景、文本、边框和强调色。`match` 使用你选择的主题进行绘制，浅色主题使用浅色模式，需要 Claude Code 2.1.324 或更高版本。`off` 保持应用原样，切回时会恢复应用自身的外观。无论哪种设置，终端和 VS Code 都保留各自的颜色。', options: ['match', 'off'], sample: '**Bold**, `inline code` and a [link](https://example.com).' },
]

export const ESSENTIAL_STEPS = 6

export const SETUP_MORE = 'more'

export const SETUP_ESSENTIALS_DONE = `基础设置完成。\`/prismantis setup more\` 还会引导你设置 ${setupSteps([]).length - ESSENTIAL_STEPS} 项样式，从差异、标题到测试结果表格；所有选项都在 \`/config\` 中。`

export type SetupParts = { head: string; options: { value: string; text: string }[]; tail: string }

export const setupParts = (themes: readonly string[], at: number): SetupParts => {
  const steps = setupSteps(themes)
  const step = steps[at]!
  const next = at + 1 === ESSENTIAL_STEPS ? undefined : steps[at + 1]
  const tier = at < ESSENTIAL_STEPS ? `设置 ${at + 1}/${ESSENTIAL_STEPS}` : `更多样式 ${at + 1 - ESSENTIAL_STEPS}/${steps.length - ESSENTIAL_STEPS}`
  return {
    head: `## ${tier}: ${step.title}\n\n${step.note}`,
    options: step.options.map((value, i) => ({ value, text: `### ${i + 1}. ${value}${step.key === 'theme' && value !== 'mono' && !RANDOM_THEMES.includes(value) ? '（适用于浅色终端）' : ''}${step.sample ? `\n\n${step.sample}` : ''}` })),
    tail: `使用 \`/prismantis setup ${step.name} <编号或名称>\` 选择${step.key === 'theme' ? ' 或 \`random\`' : ''}.${next ? ` 使用 \`/prismantis setup ${next.name}\` 可跳过。` : ''} 随时可以停止，运行 \`/prismantis setup\` 会从头开始。`,
  }
}

export const setupText = (parts: SetupParts): string => [parts.head, ...parts.options.map(o => o.text), parts.tail].join('\n\n')

export const THEME_PREVIEW = [
  '#### 更新日志',
  '',
  '**Bold**, `inline code`, 250ms and ~/src/app.ts.',
  '',
  '| Service | Status | p95 |',
  '|:--|:--|--:|',
  '| api | healthy | 120ms |',
  '| billing | degraded | 840ms |',
  '',
  '```ts',
  'const total = items.reduce((sum, item) => sum + item.qty, 0)',
  '```',
].join('\n')

export const SETUP_PANE_OPENED = '设置已在面板中打开：↑↓ 或 Tab 可在各样式间移动并预览，Enter 保存并显示下一步，Esc 关闭面板。也可以使用 `/prismantis setup theme` 依次完成各步骤。'

export const SETUP_PANE_KEYS = '↑↓ 或 Tab 移动，Enter 保存并显示下一步，Esc 关闭。'

export const SETUP_DONE = '设置完成。随时可以再次运行 `/prismantis setup`，其他所有选项都在 `/config` 中。'

export const findSetup = (themes: readonly string[], text: string): { at: number; before: string; parts: SetupParts } | undefined => {
  for (let at = 0; at < setupSteps(themes).length; at++) {
    const parts = setupParts(themes, at)
    const whole = setupText(parts)
    if (text.endsWith(whole)) return { at, before: text.slice(0, -whole.length).trim(), parts }
  }
  return undefined
}
