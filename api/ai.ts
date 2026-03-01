/**
 * Vercel serverless function: /api/ai
 * Proxies to OpenAI so the Builder Agent (and Orchestrator) get real AI responses.
 * Set in Vercel: OPENAI_API_KEY, OPENAI_MODEL (e.g. gpt-4.1-mini).
 * Client .env: VITE_AI_API_URL=/api/ai (no key needed; server uses OPENAI_API_KEY).
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ReqBody {
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    if (!apiKey?.trim()) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not set in Vercel environment' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let body: ReqBody = {};
    try {
      body = (await request.json()) as ReqBody;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = body.prompt ?? (Array.isArray(body.messages) ? body.messages.map((m) => m.content).join('\n') : '');
    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing prompt or messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content:
          'You are an XRPL Control Room Builder Agent. Respond with valid JSON only: { "analysis": "short summary; you may include PATCH blocks as PATCH path <<< ... >>>", "codeSuggestions": ["bullet strings"], "uiUpdates": {} }. For ledger/amendment tasks include "neonImpactScore": 0-100.',
      },
      { role: 'user', content: prompt },
    ];

    try {
      const res = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.4 }),
      });

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string }; content?: string }>;
        error?: { message?: string };
      };

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data?.error?.message || `OpenAI ${res.status}` }),
          { status: res.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const raw = data.choices?.[0]?.message?.content ?? data.choices?.[0]?.content ?? '';
      if (!raw) {
        return new Response(
          JSON.stringify({ analysis: 'No response from model.', codeSuggestions: [], uiUpdates: {} }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // If the model returned JSON, pass it through; otherwise wrap in analysis
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (typeof parsed.analysis === 'string') {
          return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch {
        // not JSON
      }
      return new Response(
        JSON.stringify({ analysis: raw, codeSuggestions: [], uiUpdates: {} }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'OpenAI request failed';
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
