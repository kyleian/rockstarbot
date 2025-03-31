import { Anthropic } from '@anthropic-ai/sdk';
import { config } from '../config';

const anthropic = new Anthropic({
  apiKey: config.claudeApiKey,
});

export async function generateWithClaude(prompt: string, systemPrompt: string): Promise<string> {
  try {
    const completion = await anthropic.completions.create({
      model: config.claudeModel,
      max_tokens_to_sample: 1000,
      prompt: `\n\nHuman: ${systemPrompt}\n\n${prompt}\n\nAssistant: `,
    });

    return completion.completion;
  } catch (error) {
    console.error('Error generating with Claude:', error);
    throw error;
  }
}
