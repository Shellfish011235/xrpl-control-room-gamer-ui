/**
 * Optional voice (browser TTS) and Telegram forwarding for the secure payment agent.
 */

function stripForSpeech(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/`+/g, '')
    .replace(/\n+/g, '. ')
    .trim();
}

/** Speak agent text using the Web Speech API (no-op if unavailable). */
export function speakAgentMessage(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const plain = stripForSpeech(text);
  if (!plain) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(plain);
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

/** Stop any in-progress speech. */
export function stopAgentVoice(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/** Forward plain text to a Telegram chat (bot must be allowed to message the chat). */
export async function sendAgentMessageToTelegram(
  text: string,
  opts: { botToken: string; chatId: string }
): Promise<void> {
  const botToken = opts.botToken?.trim();
  const chatId = opts.chatId?.trim();
  if (!botToken || !chatId) return;

  const body = text.length > 3500 ? `${text.slice(0, 3497)}...` : text;

  const url = `https://api.telegram.org/bot${encodeURIComponent(botToken)}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: body,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const desc = typeof err === 'object' && err && 'description' in err ? String((err as { description?: string }).description) : res.statusText;
    throw new Error(desc || `Telegram HTTP ${res.status}`);
  }
}
