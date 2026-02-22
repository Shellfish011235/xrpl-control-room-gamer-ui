/**
 * Bender chat — connect your OpenAI Custom GPT "Bender" to the dashboard.
 * Uses OpenAI Chat Completions API with your GPT's instructions as the system message.
 *
 * Setup:
 * 1. In ChatGPT: My GPTs → Bender → Configure → copy the "Instructions" text.
 * 2. In .env set VITE_OPENAI_API_KEY=sk-... and optionally VITE_BENDER_INSTRUCTIONS="<paste here>".
 *    Or paste instructions in the Bender tab (saved in browser).
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const STORAGE_KEY = 'bender-instructions';
const MESSAGES_STORAGE_KEY = 'bender-messages';
const DEFAULT_INSTRUCTIONS =
  'You are Bender, a helpful and witty assistant. You help users with the XRPL Control Room dashboard, XRP Ledger, and general questions. Stay in character.';

function getApiKey(): string {
  const key =
    typeof import.meta !== 'undefined' &&
    typeof (import.meta as { env?: Record<string, string> }).env?.VITE_OPENAI_API_KEY === 'string'
      ? (import.meta as { env: Record<string, string> }).env.VITE_OPENAI_API_KEY.trim()
      : '';
  return key;
}

/** Get Bender's system prompt: localStorage override → env → default. */
export function getBenderInstructions(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim();
  } catch {
    // ignore
  }
  const env =
    typeof import.meta !== 'undefined' &&
    typeof (import.meta as { env?: Record<string, string> }).env?.VITE_BENDER_INSTRUCTIONS === 'string'
      ? (import.meta as { env: Record<string, string> }).env.VITE_BENDER_INSTRUCTIONS.trim()
      : '';
  return env || DEFAULT_INSTRUCTIONS;
}

/** Save instructions to localStorage (used when user pastes in the Bender tab). */
export function setBenderInstructions(instructions: string): void {
  try {
    if (instructions.trim()) {
      localStorage.setItem(STORAGE_KEY, instructions.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/** Persist conversation in sessionStorage so it survives refresh. */
export function getBenderMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        m != null &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant' || m.role === 'system') &&
        typeof (m as ChatMessage).content === 'string'
    );
  } catch {
    return [];
  }
}

export function setBenderMessages(messages: ChatMessage[]): void {
  try {
    const toStore = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
    sessionStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

export function clearBenderMessages(): void {
  try {
    sessionStorage.removeItem(MESSAGES_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BenderChatResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Send a message to Bender (OpenAI) and return the assistant reply.
 * Builds messages as [system, ...history, user].
 */
export async function sendBenderMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<BenderChatResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not set. Add VITE_OPENAI_API_KEY to .env or paste instructions in Bender tab.',
    };
  }

  const systemContent = getBenderInstructions();
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemContent },
    ...conversationHistory
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      let errMsg = `${res.status} ${res.statusText}`;
      try {
        const j = JSON.parse(errBody) as { error?: { message?: string } };
        if (j?.error?.message) errMsg = j.error.message;
      } catch {
        if (errBody) errMsg = errBody.slice(0, 200);
      }
      return { success: false, error: errMsg };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string }; content?: string }>;
    };
    const content =
      data.choices?.[0]?.message?.content ?? data.choices?.[0]?.content ?? '';
    return { success: true, message: content };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

export function isBenderConfigured(): boolean {
  return getApiKey().length > 0;
}
