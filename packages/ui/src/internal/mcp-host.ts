// The view side of the MCP Apps protocol (the `ui/*` JSON-RPC methods over
// postMessage, spec 2026-01-26), for <randsum-mcp-app>. Hand-written rather
// than imported from @modelcontextprotocol/ext-apps, whose App class brings
// the MCP SDK and Zod with it: this page needs five messages, not a client.
// Not a public entry.

/** The protocol version this view speaks; hosts answer with theirs. */
export const MCP_APPS_PROTOCOL = '2026-01-26'

export type HostTheme = 'light' | 'dark'

/** The parts of the host's context this view reads. */
export interface HostContext {
  readonly toolInfo?: { readonly tool?: { readonly name?: string } }
  readonly theme?: HostTheme
  readonly styles?: {
    readonly variables?: Readonly<Record<string, string | undefined>>
    readonly css?: { readonly fonts?: string }
  }
}

/** A `tools/call` result as the host forwards it. */
export interface ToolResult {
  readonly content?: readonly unknown[]
  readonly structuredContent?: Readonly<Record<string, unknown>>
  readonly _meta?: Readonly<Record<string, unknown>>
  readonly isError?: boolean
}

export interface HostHandlers {
  readonly context: (context: HostContext) => void
  readonly input: (args: Readonly<Record<string, unknown>>) => void
  readonly result: (result: ToolResult) => void
  readonly cancelled: () => void
}

/** The host's window, or anything that can stand in for it. */
export interface HostFrame {
  postMessage(message: unknown, targetOrigin: string): void
}

interface Pending {
  readonly resolve: (value: unknown) => void
  readonly reject: (reason: Error) => void
}

type Message = Readonly<Record<string, unknown>>

function isRecord(value: unknown): value is Message {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function record(value: unknown): Message {
  return isRecord(value) ? value : {}
}

/**
 * One connection to the host frame. `connect()` runs the `ui/initialize`
 * handshake; after it, the host's notifications reach `handlers` and
 * `callTool` asks the host to call one of this server's tools.
 */
export class McpHost {
  readonly #target: HostFrame
  readonly #handlers: HostHandlers
  readonly #pending = new Map<number, Pending>()
  #next = 1

  constructor(target: HostFrame, handlers: HostHandlers) {
    this.#target = target
    this.#handlers = handlers
    window.addEventListener('message', this.#onMessage)
  }

  /** Initializes, reports the initial context, and starts sending sizes. */
  async connect(): Promise<void> {
    const result = record(
      await this.#request('ui/initialize', {
        appInfo: { name: 'randsum-mcp-app', version: '1.0.0' },
        appCapabilities: { availableDisplayModes: ['inline'] },
        protocolVersion: MCP_APPS_PROTOCOL
      })
    )
    this.#handlers.context(record(result['hostContext']))
    this.#notify('ui/notifications/initialized', {})
    this.#watchSize()
  }

  async callTool(name: string, args: Readonly<Record<string, unknown>>): Promise<ToolResult> {
    return record(await this.#request('tools/call', { name, arguments: args }))
  }

  /**
   * Tells the model what the view now shows. The host sends it with the next
   * user message, and each update replaces the last.
   */
  async updateModelContext(text: string): Promise<void> {
    await this.#request('ui/update-model-context', { content: [{ type: 'text', text }] })
  }

  #request(method: string, params: Message): Promise<unknown> {
    const id = this.#next++
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject })
      this.#target.postMessage({ jsonrpc: '2.0', id, method, params }, '*')
    })
  }

  #notify(method: string, params: Message): void {
    this.#target.postMessage({ jsonrpc: '2.0', method, params }, '*')
  }

  #reply(id: unknown, body: Message): void {
    this.#target.postMessage({ jsonrpc: '2.0', id, ...body }, '*')
  }

  // The host sizes the frame to whatever this reports, so an inline card
  // never scrolls inside itself.
  #watchSize(): void {
    if (typeof ResizeObserver === 'undefined') return
    const sizes = { width: 0, height: 0 }
    const send = (): void => {
      const root = document.documentElement
      const width = Math.ceil(window.innerWidth)
      const height = Math.ceil(root.getBoundingClientRect().height)
      if (width === sizes.width && height === sizes.height) return
      sizes.width = width
      sizes.height = height
      this.#notify('ui/notifications/size-changed', { width, height })
    }
    send()
    new ResizeObserver(send).observe(document.documentElement)
  }

  readonly #onMessage = (event: MessageEvent): void => {
    if (event.source !== this.#target || !isRecord(event.data)) return
    const message = event.data
    if (message['jsonrpc'] !== '2.0') return
    const { id, method } = message
    if (typeof method !== 'string') {
      this.#settle(id, message)
      return
    }
    const params = record(message['params'])
    if (id !== undefined) {
      // Host requests: teardown and ping need only an empty answer.
      if (method === 'ui/resource-teardown' || method === 'ping') this.#reply(id, { result: {} })
      else this.#reply(id, { error: { code: -32601, message: `Method not found: ${method}` } })
      return
    }
    if (method === 'ui/notifications/tool-input') this.#handlers.input(record(params['arguments']))
    else if (method === 'ui/notifications/tool-result') this.#handlers.result(params)
    else if (method === 'ui/notifications/tool-cancelled') this.#handlers.cancelled()
    else if (method === 'ui/notifications/host-context-changed') this.#handlers.context(params)
  }

  #settle(id: unknown, message: Message): void {
    if (typeof id !== 'number') return
    const pending = this.#pending.get(id)
    if (pending === undefined) return
    this.#pending.delete(id)
    const error = message['error']
    if (error === undefined) pending.resolve(message['result'])
    else pending.reject(new Error(String(record(error)['message'] ?? 'Host request failed')))
  }
}

/** Applies the host's theme, style variables and fonts to the document. */
export function applyHostContext(context: HostContext): void {
  const root = document.documentElement
  if (context.theme !== undefined) {
    root.dataset['theme'] = context.theme
    root.style.colorScheme = context.theme
  }
  for (const [name, value] of Object.entries(context.styles?.variables ?? {})) {
    if (value !== undefined) root.style.setProperty(name, value)
  }
  const fonts = context.styles?.css?.fonts
  if (fonts !== undefined && document.getElementById('rsui-host-fonts') === null) {
    const style = document.createElement('style')
    style.id = 'rsui-host-fonts'
    style.textContent = fonts
    document.head.append(style)
  }
}
