/**
 * Agent Voice (TTS) + Telegram bridge for the Secure Payment Agent.
 * - speakAgentMessage: Web Speech API TTS so the agent "talks" to the user.
 * - sendAgentMessageToTelegram: forward agent replies to Telegram (same bot/chat as Alerts).
 */

/** Strip markdown for TTS: remove **, `code`, [text](url), emoji-ish, collapse newlines. */
export function stripMarkdownForTts(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let out = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Optional: remove common emoji for cleaner speech (keep optional)
  out = out.replace(/[🔒🔐✅❌🤔📤📍⏳]/g, '');
  return out;
}

let speechSynth: SpeechSynthesis | null = null;

function getSpeechSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  if (!speechSynth) speechSynth = window.speechSynthesis;
  return speechSynth;
}

/** Speak text using the browser's TTS. Cancels any ongoing utterance. */
export function speakAgentMessage(text: string, options?: { rate?: number; volume?: number }): void {
  const plain = stripMarkdownForTts(text);
  if (!plain) return;
  const synth = getSpeechSynth();
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(plain);
  u.rate = options?.rate ?? 0.95;
  u.volume = options?.volume ?? 1;
  const voices = synth.getVoices();
  const en = voices.find((v) => v.lang.startsWith('en'));
  if (en) u.voice = en;
  synth.speak(u);
}

/** Stop any current TTS. */
export function stopAgentVoice(): void {
  const synth = getSpeechSynth();
  if (synth) synth.cancel();
}

export interface TelegramAgentConfig {
  botToken: string;
  chatId: string;
}

/** Send a plain-text message to Telegram (agent reply). Uses same API as alert notifications. */
export async function sendAgentMessageToTelegram(
  text: string,
  config: TelegramAgentConfig
): Promise<{ ok: boolean; error?: string }> {
  const plain = stripMarkdownForTts(text);
  if (!plain.trim()) return { ok: true };
  if (!config.botToken?.trim() || !config.chatId?.trim()) return { ok: false, error: 'Bot token and Chat ID required' };
  const url = `https://api.telegram.org/bot${config.botToken.trim()}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId.trim(),
        text: `🤖 Agent: ${plain.slice(0, 4000)}`,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || !data.ok) return { ok: false, error: data.description || `HTTP ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Request failed' };
  }
}
