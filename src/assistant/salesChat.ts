import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  type Content,
  type FunctionDeclaration,
  type FunctionCall,
} from '@google/genai'

import type { StatsOrder } from '@/engine/stats'

import { STATS_TOOL_DECLARATIONS, runStatsTool } from './statsTools'

export const SALES_ASSISTANT_SYSTEM = `You are a sales assistant for a breakfast shop. You may ONLY report numbers returned by tools — never invent amounts or names.
Format money as BDT (৳) by dividing integer poisha by 100 with two decimals.
If a tool says data is missing or unsupported, explain that clearly in plain English.
Do not guess customer names or identities.`

const MAX_TOOL_STEPS = 5

export type GeminiGenerateResult = {
  text?: string
  functionCalls?: FunctionCall[]
  /** Full model turn — required for thoughtSignature on later tool rounds. */
  modelContent?: Content
}

export type GeminiChatClient = {
  generate: (
    contents: Content[],
    tools: FunctionDeclaration[],
    signal?: AbortSignal,
  ) => Promise<GeminiGenerateResult>
}

export type SalesChatTurnResult = {
  text: string
  toolsCalled: string[]
}

function userContent(text: string): Content {
  return { role: 'user', parts: [{ text }] }
}

export async function runSalesChatTurn(
  client: GeminiChatClient,
  orders: StatsOrder[],
  question: string,
  prior: { role: 'user' | 'assistant'; text: string }[],
  signal?: AbortSignal,
): Promise<SalesChatTurnResult> {
  const contents: Content[] = []
  for (const m of prior) {
    contents.push(
      m.role === 'user'
        ? userContent(m.text)
        : { role: 'model', parts: [{ text: m.text }] },
    )
  }
  contents.push(userContent(question))

  const toolsCalled: string[] = []

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    if (signal?.aborted) {
      throw new DOMException('Chat aborted', 'AbortError')
    }

    const response = await client.generate(
      contents,
      STATS_TOOL_DECLARATIONS,
      signal,
    )

    if (response.functionCalls && response.functionCalls.length > 0) {
      if (response.modelContent?.parts?.length) {
        contents.push({
          ...response.modelContent,
          role: response.modelContent.role ?? 'model',
        })
      } else {
        contents.push({
          role: 'model',
          parts: response.functionCalls.map((fc) => ({
            functionCall: {
              name: fc.name ?? 'unknown',
              args: fc.args ?? {},
            },
          })),
        })
      }

      const responseParts = response.functionCalls.map((fc) => {
        const name = fc.name ?? 'unknown'
        toolsCalled.push(name)
        const args = (fc.args ?? {}) as Record<string, unknown>
        const result = runStatsTool(name, args, orders)
        return {
          functionResponse: {
            name,
            response: result as Record<string, unknown>,
          },
        }
      })

      contents.push({ role: 'user', parts: responseParts })
      continue
    }

    const text =
      response.text?.trim() ||
      'I could not find that in the order data. Try a more specific sales question.'

    return { text, toolsCalled }
  }

  return {
    text: 'I need a simpler question — too many steps to finish that request.',
    toolsCalled,
  }
}

/** Browser Gemini client wrapper */
export function createSalesGeminiClient(apiKey: string): GeminiChatClient {
  return {
    async generate(contents, tools, signal) {
      const ai = new GoogleGenAI({ apiKey })

      const response = await ai.models.generateContent({
        model: getGeminiModel(),
        contents,
        config: {
          abortSignal: signal,
          systemInstruction: SALES_ASSISTANT_SYSTEM,
          tools: [{ functionDeclarations: tools }],
          toolConfig: {
            functionCallingConfig: {
              mode: FunctionCallingConfigMode.AUTO,
            },
          },
        },
      })

      return {
        text: response.text ?? undefined,
        functionCalls: response.functionCalls,
        modelContent: response.candidates?.[0]?.content,
      }
    },
  }
}

export type GeminiErrorKind = 'missing_key' | 'invalid_key' | 'quota' | 'network' | 'unknown'

export function classifyGeminiError(err: unknown): {
  kind: GeminiErrorKind
  message: string
} {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { kind: 'unknown', message: 'Request cancelled.' }
  }
  const msg = geminiErrorMessage(err)

  if (
    /no longer available/i.test(msg) ||
    (/not.?found/i.test(msg) && /models\/gemini/i.test(msg))
  ) {
    return {
      kind: 'unknown',
      message: `Model "${getGeminiModel()}" is not available for your key. Set VITE_GEMINI_MODEL in .env.local (try gemini-3.5-flash-lite or gemini-2.5-flash-lite) and restart the dev server.`,
    }
  }

  if (/thought_signature|thought signature/i.test(msg)) {
    return {
      kind: 'unknown',
      message:
        'Gemini rejected the tool round-trip. Restart the dev server and retry; if it persists, keep VITE_GEMINI_MODEL=gemini-3.5-flash-lite.',
    }
  }

  if (
    /high demand|503|unavailable|overloaded|try again later/i.test(msg)
  ) {
    return {
      kind: 'quota',
      message: `Gemini is busy on "${getGeminiModel()}". Set VITE_GEMINI_MODEL=gemini-3.5-flash-lite in .env.local, restart dev, and retry.`,
    }
  }

  if (/api[_\s]?key/i.test(msg) || /401|403|invalid/i.test(msg)) {
    return {
      kind: 'invalid_key',
      message: 'Gemini API key looks invalid. Check VITE_GEMINI_API_KEY in .env.local.',
    }
  }
  if (/429|quota|rate/i.test(msg)) {
    return {
      kind: 'quota',
      message: 'Gemini quota exceeded (429). Try again later or use a new key.',
    }
  }
  if (/fetch|network|failed to fetch|ECONNREFUSED/i.test(msg)) {
    return {
      kind: 'network',
      message: 'Network error talking to Gemini. Check your connection and retry.',
    }
  }
  return { kind: 'unknown', message: msg }
}

export function getGeminiApiKey(): string | undefined {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (typeof key !== 'string' || key.trim().length === 0) return undefined
  return key.trim()
}

/** Brief default; override via VITE_GEMINI_MODEL for new Google AI Studio keys. */
export function getGeminiModel(): string {
  const raw = import.meta.env.VITE_GEMINI_MODEL
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  return 'gemini-3.5-flash-lite'
}

function geminiErrorMessage(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error'
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; code?: number }
    }
    if (parsed.error?.message) return parsed.error.message
  } catch {
    // not JSON
  }
  return raw
}