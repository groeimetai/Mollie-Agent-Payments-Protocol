import { createAgentUIStreamResponse } from 'ai';
import { orchestrator } from '@/agents/orchestrator';

export const maxDuration = 120;

export async function POST(request: Request) {
  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: orchestrator,
    uiMessages: messages,
  });
}
