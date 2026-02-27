import { Chat } from './components/chat';
import { AgentActivity } from './components/agent-activity';
import { KillSwitch } from './components/kill-switch';
import { PaymentStatus } from './components/payment-status';

export default function Home() {
  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* Left panel: Chat (60%) */}
      <div className="flex flex-col w-[60%] border-r border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm">
              🤖
            </div>
            <div>
              <h1 className="text-sm font-semibold">AP2 + Mollie</h1>
              <p className="text-xs text-zinc-500">
                Agent Payment Protocol &times; Mollie
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-2 py-1 rounded-md bg-zinc-800 text-xs font-mono text-zinc-400">
              AI SDK 6
            </div>
            <div className="px-2 py-1 rounded-md bg-emerald-900/30 text-xs font-mono text-emerald-400 border border-emerald-800/30">
              Mollie Live
            </div>
          </div>
        </div>

        {/* Chat */}
        <Chat />
      </div>

      {/* Right panel: Agent Dashboard (40%) */}
      <div className="flex flex-col w-[40%] bg-zinc-900/30">
        {/* Dashboard header */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Agent Dashboard
            </h2>
            <div className="text-xs text-zinc-600 font-mono">
              AP2 Protocol v1
            </div>
          </div>
        </div>

        {/* Agent Activity Feed */}
        <div className="flex-1 overflow-hidden">
          <AgentActivity />
        </div>

        {/* Payment Status */}
        <PaymentStatus />

        {/* Kill Switch */}
        <div className="p-4 border-t border-zinc-800">
          <KillSwitch />
        </div>
      </div>
    </div>
  );
}
