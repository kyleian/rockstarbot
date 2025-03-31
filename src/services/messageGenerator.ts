import { config } from '../config';
import { generateWithClaude } from './ai/claude';
import { generateMessage } from './ai/openai';

export async function generateExampleMessage(messages: string[]): Promise<string> {
  const systemPrompt = 'You are a skilled mimic that can imitate a person\'s writing style based on examples. Create output that matches their typical tone, vocabulary, and speech patterns.';
  
  try {
    if (config.useClaudeModel) {
      return await generateWithClaude(messages.join("\n"), systemPrompt);
    }

    return await generateMessage(messages, systemPrompt);
  } catch (error) {
    console.error('Error generating example message:', error);
    throw new Error(`Error generating example message: ${(error as Error).message}`);
  }
}
