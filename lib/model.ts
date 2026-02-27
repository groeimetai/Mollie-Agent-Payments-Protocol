import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

export function getModel() {
  const provider = process.env.AGENT_MODEL || 'anthropic';
  switch (provider) {
    case 'anthropic':
      return anthropic('claude-sonnet-4-6');
    case 'openai':
      return openai('gpt-4o');
    case 'google':
      return google('gemini-2.0-flash');
    default:
      return anthropic('claude-sonnet-4-6');
  }
}

export function getModelName(): string {
  const provider = process.env.AGENT_MODEL || 'anthropic';
  switch (provider) {
    case 'anthropic':
      return 'Claude Sonnet 4.6';
    case 'openai':
      return 'GPT-4o';
    case 'google':
      return 'Gemini 2.0 Flash';
    default:
      return 'Claude Sonnet 4.6';
  }
}
