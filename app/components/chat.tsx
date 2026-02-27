'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const TOOL_LABELS: Record<string, { icon: string; label: string; agent: string }> = {
  shopping: { icon: '🛒', label: 'Shopping Agent', agent: 'Zoekt & vergelijkt producten' },
  mandate: { icon: '📜', label: 'Mandate Agent', agent: 'AP2 mandate chain' },
  payment: { icon: '💳', label: 'Payment Agent', agent: 'Mollie betaling' },
  getSystemStatus: { icon: '📊', label: 'System Status', agent: 'Status overzicht' },
};

function ToolInvocation({ part }: { part: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);

  const toolName = (part.toolName as string) || (part.type as string).replace('tool-', '');
  const state = part.state as string;
  const input = part.input as Record<string, unknown> | undefined;
  const output = part.output as unknown;
  const isDone = state === 'output-available';
  const isRunning = state === 'input-streaming' || state === 'input-available';

  const toolInfo = TOOL_LABELS[toolName];
  const icon = toolInfo?.icon || '⚙';
  const label = toolInfo?.label || toolName;
  const agentDesc = toolInfo?.agent || '';

  return (
    <div className="mt-2 rounded-lg border border-zinc-700 text-xs font-mono overflow-hidden">
      {/* Header — clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-emerald-400 font-semibold">{label}</span>
          {agentDesc && (
            <span className="text-zinc-600 font-normal">{agentDesc}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              actief
            </span>
          )}
          {isDone && (
            <span className="text-emerald-500">✓</span>
          )}
          <span className={`transition-transform duration-200 text-zinc-500 ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-800">
          {/* Input */}
          {input && (
            <div className="px-3 py-2 border-b border-zinc-800/50">
              <div className="text-zinc-500 mb-1">Input:</div>
              <div className="text-zinc-300 bg-zinc-950 rounded p-2 max-h-40 overflow-y-auto">
                {typeof input === 'object' && 'task' in input ? (
                  // Sub-agent delegation — show the task description
                  <span className="text-blue-300">&quot;{String(input.task)}&quot;</span>
                ) : (
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(input, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Output */}
          {isDone && output != null && (
            <div className="px-3 py-2">
              <div className="text-zinc-500 mb-1">Output:</div>
              <div className="text-zinc-300 bg-zinc-950 rounded p-2 max-h-60 overflow-y-auto">
                {typeof output === 'string' ? (
                  <div className="whitespace-pre-wrap">{output}</div>
                ) : (
                  <pre className="whitespace-pre-wrap break-all text-[11px]">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {isRunning && (
            <div className="px-3 py-3 text-zinc-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Agent is bezig...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Chat() {
  const { messages, sendMessage, stop, status } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  function getMessageText(message: UIMessage): string {
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-20">
            <div className="text-4xl mb-4">🤖💰</div>
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">
              AP2 + Mollie Agent
            </h2>
            <p className="text-sm max-w-md mx-auto">
              Eerste AP2 (Agent Payment Protocol) integratie met een echte
              betaalprovider. Vraag me iets te kopen!
            </p>
            <div className="mt-6 space-y-2 text-xs text-zinc-600">
              <p>Probeer: &quot;Ik wil een laptop kopen onder de 1200 euro&quot;</p>
              <p>Of: &quot;Zoek een goede laptop voor studie&quot;</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="text-xs text-zinc-500 mb-1 font-mono">
                  CFO Agent
                </div>
              )}

              {/* Render parts */}
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  // User messages: plain text. Assistant messages: rendered markdown.
                  if (message.role === 'user') {
                    return (
                      <div key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
                        {part.text}
                      </div>
                    );
                  }
                  return (
                    <div key={i} className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none
                      prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                      prose-p:text-zinc-200 prose-p:my-1.5
                      prose-strong:text-white prose-strong:font-semibold
                      prose-em:text-zinc-300
                      prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:text-zinc-200
                      prose-code:text-emerald-400 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-lg prose-pre:my-2
                      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                      prose-table:border-collapse prose-th:border prose-th:border-zinc-600 prose-th:bg-zinc-900 prose-th:px-3 prose-th:py-1.5 prose-th:text-zinc-200 prose-th:text-left prose-th:text-xs
                      prose-td:border prose-td:border-zinc-700 prose-td:px-3 prose-td:py-1.5 prose-td:text-zinc-300 prose-td:text-xs
                      prose-hr:border-zinc-700 prose-hr:my-3
                    ">
                      <ReactMarkdown>{part.text}</ReactMarkdown>
                    </div>
                  );
                }

                // Tool invocation parts
                if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                  return (
                    <ToolInvocation
                      key={i}
                      part={part as unknown as Record<string, unknown>}
                    />
                  );
                }

                return null;
              })}

              {/* Fallback for user messages */}
              {message.role === 'user' && message.parts.length === 0 && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {getMessageText(message)}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3 border border-zinc-700">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div
                    className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>
                <span className="text-xs text-zinc-500">
                  Agents aan het werk...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Vraag me iets te kopen..."
            className="flex-1 bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm border border-zinc-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-zinc-500"
            disabled={isLoading}
          />
          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Verstuur
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
