/**
 * Bender chat panel — talk to your OpenAI Custom GPT "Bender" from the dashboard.
 * Paste Bender's instructions from ChatGPT (My GPTs → Bender → Configure) to match behavior.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Settings2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import {
  sendBenderMessage,
  getBenderInstructions,
  setBenderInstructions,
  getBenderMessages,
  setBenderMessages,
  clearBenderMessages,
  isBenderConfigured,
  type ChatMessage,
} from '../services/benderChat';

export function BenderChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getBenderMessages());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsEdit, setInstructionsEdit] = useState(getBenderInstructions());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setBenderMessages(messages);
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setLoading(true);

    const result = await sendBenderMessage(text, messages);

    setLoading(false);
    if (result.success && result.message) {
      setMessages((prev) => [...prev, { role: 'assistant', content: result.message! }]);
    } else {
      setError(result.error || 'Something went wrong');
    }
  };

  const handleSaveInstructions = () => {
    setBenderInstructions(instructionsEdit);
    setShowInstructions(false);
  };

  const handleClearChat = () => {
    clearBenderMessages();
    setMessages([]);
    setError(null);
  };

  const configured = isBenderConfigured();

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Optional: paste Bender instructions (from ChatGPT GPT editor) */}
      <div className="shrink-0 border-b border-cyber-border/60">
        <div className="flex items-center justify-between px-4 py-2 gap-2">
          <button
            type="button"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2 text-left text-xs text-cyber-muted hover:text-cyber-text"
          >
            <Settings2 size={14} />
            <span className="font-cyber text-cyber-yellow">Bender instructions</span>
            {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-cyber-muted hover:text-cyber-red hover:bg-cyber-red/10 border border-transparent hover:border-cyber-red/30 shrink-0"
            >
              <Trash2 size={12} />
              Clear chat
            </button>
          )}
        </div>
        {showInstructions && (
          <div className="px-4 pb-3 space-y-2">
            <p className="text-[10px] text-cyber-muted">
              Copy from your GPT: <a href="https://chatgpt.com/g/g-a42hoKe9k-bender-s-hook-2-0" target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:underline">Bender&apos;s Hook 2.0</a> → Configure → Instructions. Paste below and Save to use the same personality here.
            </p>
            <textarea
              value={instructionsEdit}
              onChange={(e) => setInstructionsEdit(e.target.value)}
              placeholder="You are Bender..."
              rows={4}
              className="w-full px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-xs text-cyber-text placeholder:text-cyber-muted resize-y"
            />
            <button
              type="button"
              onClick={handleSaveInstructions}
              className="px-3 py-1.5 rounded bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow text-xs hover:bg-cyber-yellow/30"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {!configured && (
        <div className="px-4 py-3 bg-cyber-yellow/10 border-b border-cyber-yellow/30 text-[11px] text-cyber-yellow">
          Add <code className="bg-cyber-darker px-1 rounded">VITE_OPENAI_API_KEY</code> to your <code className="bg-cyber-darker px-1 rounded">.env</code> to
          enable Bender. Get a key at platform.openai.com.
        </div>
      )}

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {messages.length === 0 && !loading && (
          <p className="text-cyber-muted text-xs">
            Say something to Bender&apos;s Hook 2.0. Ask about XRPL, the dashboard, or anything else.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                m.role === 'user'
                  ? 'bg-cyber-cyan/20 border border-cyber-cyan/40 text-cyber-text'
                  : 'bg-cyber-dark border border-cyber-border text-cyber-text'
              }`}
            >
              {m.role === 'user' && <span className="text-cyber-muted mr-1">You:</span>}
              {m.role === 'assistant' && <span className="text-cyber-cyan mr-1">Bender&apos;s Hook:</span>}
              <span className="whitespace-pre-wrap break-words">{m.content}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 bg-cyber-dark border border-cyber-border flex items-center gap-2 text-cyber-muted text-xs">
              <Loader size={14} className="animate-spin" />
              Bender&apos;s Hook is typing...
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-lg px-3 py-2 bg-cyber-red/10 border border-cyber-red/40 text-cyber-red text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-cyber-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Message Bender's Hook..."
            disabled={!configured || loading}
            className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-border rounded text-sm text-cyber-text placeholder:text-cyber-muted disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading || !configured}
            className="px-4 py-2 rounded bg-cyber-cyan/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default BenderChatPanel;
