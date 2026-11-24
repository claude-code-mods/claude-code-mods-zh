/**
 * The command the mod answers, and the fixed texts it prints.
 *
 * The name is namespaced by the plugin (`shunt` + `commands/usage.md`), which
 * is what keeps it off the built-in `/usage`: `$.command.register` takes a
 * bare global name and refuses `usage` outright ("it is the built-in /usage"),
 * while a plugin's markdown command lists as `shunt:usage` and is free.
 */
export const COMMAND_NAME = 'shunt:usage'

/**
 * The path `[server.usage]` registers on the gateway.
 */
export const USAGE_PATH = '/usage'

export const NO_BASE_URL_TEXT =
  '没有可查询的网关 —— SHUNT_BASE_URL 和 ANTHROPIC_BASE_URL 都未 ' +
  '设置，因此本会话正在直连 Anthropic。请将 Claude Code 指向 ' +
  '你的网关（export ANTHROPIC_BASE_URL=http://127.0.0.1:3001），然后重新运行 ' +
  '/shunt:usage。'

export const NO_TOKEN_TEXT =
  '没有可用于认证的凭据 —— SHUNT_TOKEN、' +
  'ANTHROPIC_AUTH_TOKEN 和 ANTHROPIC_API_KEY 均未设置，也没有 shunt ' +
  'gateway token apiKeyHelper 可用于读取网关登录凭凭。请使用 ' +
  'shunt gateway login 登录，或向网关管理员索取客户端 token。'

export const NOT_ENABLED_TEXT =
  '网关有应答，但未在其上启用 GET /usage。请在网关配置中添加 ' +
  '[server.usage] 表并重启；该表无需任何键，但同时需要设置 ' +
  '[server.auth]（客户端 token）或 [server.gateway]（网关登录）。'

export const REFUSED_TEXT =
  '网关拒绝了本会话使用的凭据。SHUNT_TOKEN、ANTHROPIC_AUTH_TOKEN、' +
  'ANTHROPIC_API_KEY 以及 shunt gateway token helper 中 ' +
  '第一个已设置的会被发送，其余均被忽略。客户端 token 必须是网关的 ' +
  '[server.auth] 接受的 token；网关登录可能已过期或被吊销，请用 ' +
  'shunt gateway login 重新登录。'

export const HOOK_FAILED_TEXT =
  '无法读取池用量 —— 回答此命令的钩子 ' +
  '失败或超出了时间预算。请重新运行 /shunt:usage；如果仍然 ' +
  '失败，请检查网关是否已启动且可访问。'

export const NO_POOL_TEXT =
  '网关未报告任何池化提供方，因此没有可显示的共享配额。' +
  '当某个提供方配置了池化账户 ' +
  '（认证模式为 oauth 或 chatgpt）后，就会显示池用量。'
