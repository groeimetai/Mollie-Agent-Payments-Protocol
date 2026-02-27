'use client';

import { useChat, type UIMessage } from '@ai-sdk/react';
import { useRef, useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatProps {
  variant?: 'standalone' | 'popup';
  cartContext?: string;
  cartTotal?: number;
  brandColor?: string;
  brandName?: string;
  activeCategory?: string;
}

const TOOL_LABELS: Record<string, { icon: string; label: string; agent: string }> = {
  shopping: { icon: '🛒', label: 'Shopping Agent', agent: 'Zoekt & vergelijkt producten' },
  mandate: { icon: '📜', label: 'Mandate Agent', agent: 'AP2 mandate chain' },
  payment: { icon: '💳', label: 'Payment Agent', agent: 'Mollie betaling' },
  getSystemStatus: { icon: '📊', label: 'System Status', agent: 'Status overzicht' },
};

const BRAND_SUGGESTIONS: Record<string, { icon: string; prompt: string }[]> = {
  laptop: [
    { icon: '💻', prompt: 'Koop een laptop onder €1200' },
    { icon: '💼', prompt: 'Zoek een goede laptophoes' },
    { icon: '⚡', prompt: 'Reken mijn cart af via iDEAL' },
    { icon: '🔍', prompt: 'Vergelijk laptops op prijs' },
  ],
  sneakers: [
    { icon: '👟', prompt: 'Zoek witte sneakers onder €150' },
    { icon: '🧴', prompt: 'Ik zoek een beschermspray' },
    { icon: '⚡', prompt: 'Reken mijn cart af via iDEAL' },
    { icon: '🔍', prompt: 'Vergelijk sneakers op prijs' },
  ],
  boodschappen: [
    { icon: '🍕', prompt: 'Bestel een maaltijdpakket voor 4' },
    { icon: '🥤', prompt: 'Voeg drinken toe aan mijn bestelling' },
    { icon: '⚡', prompt: 'Reken mijn cart af via iDEAL' },
    { icon: '🔍', prompt: 'Wat is het goedkoopste pakket?' },
  ],
  hotel: [
    { icon: '🏨', prompt: 'Boek een hotel in Amsterdam' },
    { icon: '⭐', prompt: 'Wat is het best beoordeelde hotel?' },
    { icon: '⚡', prompt: 'Reken mijn cart af via iDEAL' },
    { icon: '💰', prompt: 'Hotels onder €200 per nacht' },
  ],
};

function ToolInvocation({ part, variant }: { part: Record<string, unknown>; variant: 'standalone' | 'popup' }) {
  const [expanded, setExpanded] = useState(false);
  const isPopup = variant === 'popup';

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
    <div className={`mt-2 rounded-lg border text-xs font-mono overflow-hidden ${
      isPopup ? 'border-gray-200' : 'border-zinc-700'
    }`}>
      {/* Header — clickable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 py-2 transition-colors text-left ${
          isPopup
            ? 'bg-gray-50 hover:bg-gray-100'
            : 'bg-zinc-900 hover:bg-zinc-800/80'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className={isPopup ? 'text-blue-600 font-semibold' : 'text-emerald-400 font-semibold'}>
            {label}
          </span>
          {agentDesc && (
            <span className={isPopup ? 'text-gray-400 font-normal' : 'text-zinc-600 font-normal'}>
              {agentDesc}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <span className={`flex items-center gap-1 ${isPopup ? 'text-orange-500' : 'text-amber-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPopup ? 'bg-orange-500' : 'bg-amber-400'}`} />
              actief
            </span>
          )}
          {isDone && (
            <span className={isPopup ? 'text-green-600' : 'text-emerald-500'}>✓</span>
          )}
          <span className={`transition-transform duration-200 ${isPopup ? 'text-gray-400' : 'text-zinc-500'} ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className={`border-t ${isPopup ? 'border-gray-200' : 'border-zinc-800'}`}>
          {/* Input */}
          {input && (
            <div className={`px-3 py-2 border-b ${isPopup ? 'border-gray-100' : 'border-zinc-800/50'}`}>
              <div className={isPopup ? 'text-gray-400 mb-1' : 'text-zinc-500 mb-1'}>Input:</div>
              <div className={`rounded p-2 max-h-40 overflow-y-auto ${
                isPopup ? 'text-gray-700 bg-gray-50' : 'text-zinc-300 bg-zinc-950'
              }`}>
                {typeof input === 'object' && 'task' in input ? (
                  <span className={isPopup ? 'text-blue-600' : 'text-blue-300'}>&quot;{String(input.task)}&quot;</span>
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
              <div className={isPopup ? 'text-gray-400 mb-1' : 'text-zinc-500 mb-1'}>Output:</div>
              <div className={`rounded p-2 max-h-60 overflow-y-auto ${
                isPopup ? 'text-gray-700 bg-gray-50' : 'text-zinc-300 bg-zinc-950'
              }`}>
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
            <div className={`px-3 py-3 flex items-center gap-2 ${isPopup ? 'text-gray-400' : 'text-zinc-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPopup ? 'bg-orange-500' : 'bg-amber-400'}`} />
              Agent is bezig...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Chat({ variant = 'standalone', cartContext, cartTotal, brandColor, brandName, activeCategory }: ChatProps) {
  const { messages, sendMessage, stop, status } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSent = useRef(false);

  const isPopup = variant === 'popup';
  const isLoading = status === 'streaming' || status === 'submitted';
  const color = brandColor || '#0000C4';
  const name = brandName || 'bol.com';
  const suggestions = BRAND_SUGGESTIONS[activeCategory || 'laptop'] || BRAND_SUGGESTIONS.laptop;

  // Custom markdown components — render Mollie payment links as styled buttons
  const mdComponents = useMemo(() => ({
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
      const isMollieLink = href && (href.includes('mollie.com') || href.includes('payscreen') || href.includes('checkout'));
      if (isMollieLink) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="my-3 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white font-semibold text-sm no-underline hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
            style={{ backgroundColor: isPopup ? color : '#3b82f6' }}
          >
            <span className="text-xl">💳</span>
            <span className="flex-1">{children}</span>
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  }), [color, isPopup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-send cart context in popup mode
  useEffect(() => {
    if (isPopup && cartContext && messages.length === 0 && !autoSent.current) {
      autoSent.current = true;
      sendMessage({ text: cartContext });
    }
  }, [isPopup, cartContext, messages.length, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isPopup ? 'bg-gray-50' : ''}`}>
        {messages.length === 0 && (
          isPopup ? (
            /* Popup empty state */
            <div className="text-center text-gray-400 mt-6">
              <div className="text-3xl mb-2">🤖</div>
              <h2 className="text-base font-semibold text-gray-700 mb-1">
                {name} Checkout Agent
              </h2>
              <p className="text-xs max-w-sm mx-auto mb-4 text-gray-500">
                Hoi! Ik kan je helpen met shoppen en afrekenen.
                Vraag me iets te kopen of voeg een product toe aan je winkelwagen.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto text-left">
                {suggestions.map((uc) => (
                  <button
                    key={uc.prompt}
                    onClick={() => setInput(uc.prompt)}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-left"
                  >
                    <span className="text-sm">{uc.icon}</span>
                    <div className="text-xs text-gray-600 mt-1 leading-tight">
                      {uc.prompt}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Standalone empty state (original) */
            <div className="text-center text-zinc-500 mt-8">
              <div className="text-4xl mb-3">🤖💰</div>
              <h2 className="text-xl font-semibold text-zinc-300 mb-1">
                AP2 + Mollie Agent
              </h2>
              <p className="text-sm max-w-lg mx-auto mb-6 text-zinc-500">
                Eerste werkende AP2 (Agent Payment Protocol) integratie met een echte betaalprovider.
                Jouw AI agent koopt autonoom bij 60.000+ Mollie merchants.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                {[
                  {
                    icon: '💻',
                    title: 'Electronics',
                    merchant: 'bol.com',
                    prompt: 'Ik wil een laptop kopen onder de 1200 euro',
                  },
                  {
                    icon: '👟',
                    title: 'Fashion',
                    merchant: 'Nike',
                    prompt: 'Ik zoek witte sneakers, budget tot 150 euro',
                  },
                  {
                    icon: '🍕',
                    title: 'Eten & Drinken',
                    merchant: 'Thuisbezorgd',
                    prompt: 'Doe boodschappen voor pasta carbonara voor 4 personen',
                  },
                  {
                    icon: '🏨',
                    title: 'Reizen',
                    merchant: 'Booking.com',
                    prompt: 'Boek een hotel in Amsterdam voor 2 nachten onder 200 euro per nacht',
                  },
                  {
                    icon: '⚡',
                    title: 'Auto-Checkout',
                    merchant: 'Recurring via Mollie',
                    prompt: 'Stel auto-checkout in met iDEAL en koop sneakers',
                  },
                ].map((useCase) => (
                  <button
                    key={useCase.title}
                    onClick={() => setInput(useCase.prompt)}
                    className="group p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-600 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg">{useCase.icon}</span>
                      <span className="text-sm font-semibold text-zinc-200 group-hover:text-white">
                        {useCase.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-600 mb-2 font-mono">
                      {useCase.merchant}
                    </div>
                    <div className="text-xs text-zinc-400 group-hover:text-zinc-300 leading-relaxed">
                      &quot;{useCase.prompt}&quot;
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 max-w-xl mx-auto">
                <div className="flex items-center gap-2 justify-center text-[11px] text-zinc-700 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Elke use case = echte Mollie transactie via AP2 protocol
                </div>
              </div>
            </div>
          )
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
                  ? isPopup
                    ? 'text-white'
                    : 'bg-blue-600 text-white'
                  : isPopup
                    ? 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                    : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
              }`}
              style={message.role === 'user' && isPopup ? { backgroundColor: color } : undefined}
            >
              {message.role === 'assistant' && (
                <div className={`text-xs mb-1 font-mono ${isPopup ? 'text-gray-400' : 'text-zinc-500'}`}>
                  {isPopup ? `${name} Agent` : 'Checkout Agent'}
                </div>
              )}

              {/* Render parts */}
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  if (message.role === 'user') {
                    return (
                      <div key={i} className="whitespace-pre-wrap text-sm leading-relaxed">
                        {part.text}
                      </div>
                    );
                  }
                  return (
                    <div key={i} className={`text-sm leading-relaxed max-w-none ${
                      isPopup
                        ? 'prose prose-sm prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:text-gray-700 prose-p:my-1.5 prose-strong:text-gray-900 prose-strong:font-semibold prose-em:text-gray-600 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:text-gray-700 prose-code:text-blue-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg prose-pre:my-2 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-table:border-collapse prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-1.5 prose-th:text-gray-700 prose-th:text-left prose-th:text-xs prose-td:border prose-td:border-gray-200 prose-td:px-3 prose-td:py-1.5 prose-td:text-gray-600 prose-td:text-xs prose-hr:border-gray-200 prose-hr:my-3'
                        : 'prose prose-invert prose-sm prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1 prose-p:text-zinc-200 prose-p:my-1.5 prose-strong:text-white prose-strong:font-semibold prose-em:text-zinc-300 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:text-zinc-200 prose-code:text-emerald-400 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-lg prose-pre:my-2 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-table:border-collapse prose-th:border prose-th:border-zinc-600 prose-th:bg-zinc-900 prose-th:px-3 prose-th:py-1.5 prose-th:text-zinc-200 prose-th:text-left prose-th:text-xs prose-td:border prose-td:border-zinc-700 prose-td:px-3 prose-td:py-1.5 prose-td:text-zinc-300 prose-td:text-xs prose-hr:border-zinc-700 prose-hr:my-3'
                    }`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{part.text}</ReactMarkdown>
                    </div>
                  );
                }

                if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                  return (
                    <ToolInvocation
                      key={i}
                      part={part as unknown as Record<string, unknown>}
                      variant={variant}
                    />
                  );
                }

                return null;
              })}

              {message.role === 'user' && message.parts.length === 0 && (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.parts
                    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                    .map((p) => p.text)
                    .join('')}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className={`rounded-2xl px-4 py-3 ${
              isPopup
                ? 'bg-white border border-gray-200 shadow-sm'
                : 'bg-zinc-800 border border-zinc-700'
            }`}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={isPopup ? { backgroundColor: color } : undefined}
                  />
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${!isPopup ? 'bg-emerald-400' : ''}`}
                    style={{ animationDelay: '0.1s', ...(isPopup ? { backgroundColor: color } : {}) }}
                  />
                  <div
                    className={`w-2 h-2 rounded-full animate-bounce ${!isPopup ? 'bg-emerald-400' : ''}`}
                    style={{ animationDelay: '0.2s', ...(isPopup ? { backgroundColor: color } : {}) }}
                  />
                </div>
                <span className={`text-xs ${isPopup ? 'text-gray-400' : 'text-zinc-500'}`}>
                  Agents aan het werk...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 ${isPopup ? 'border-t border-gray-200 bg-white' : 'border-t border-zinc-800'}`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isPopup ? 'Stel een vraag...' : 'Vraag me iets te kopen...'}
            className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 ${
              isPopup
                ? 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400'
                : 'bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 focus:ring-blue-500 placeholder-zinc-500'
            }`}
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
              className={`px-4 py-3 text-white rounded-xl text-sm font-medium transition-colors hover:opacity-90 ${
                isPopup
                  ? 'disabled:bg-gray-300 disabled:text-gray-500'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500'
              }`}
              style={isPopup && input.trim() ? { backgroundColor: color } : undefined}
            >
              Verstuur
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
