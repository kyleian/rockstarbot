import { OpenAI } from 'openai';
import { config } from '../config';
import { generateWithClaude } from '../services/claude';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Generate an example message based on user's previous messages
 */
export async function generateExampleMessage(messages: string[]): Promise<string> {
  const prompt = `
    Based on the following user messages, generate an example message that reflects how the user would typically behave or communicate:
    ${messages.join("\n")}
  `;

  const systemPrompt = 'You are a skilled mimic that can imitate a person\'s writing style based on examples. Create output that matches their typical tone, vocabulary, and speech patterns.';
  
  try {
    if (config.useClaudeModel) {
      return await generateWithClaude(prompt, systemPrompt);
    }

    const response = await openai.chat.completions.create({
      model: config.openaiSimulationModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
    });

    return response.choices[0]?.message?.content || 'Could not generate a message';
  } catch (error) {
    console.error('Error generating example message:', error);
    throw new Error(`Error generating example message: ${(error as Error).message}`);
  }
}
