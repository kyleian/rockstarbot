import { OpenAI } from 'openai';
import { config } from '../../config';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeMessages(messages: string[]): Promise<string> {
  try {
    const prompt = `Analyze these messages from a Discord user:\n${messages.join('\n')}`;
    
    const response = await openai.chat.completions.create({
      model: config.openaiAnalysisModel,
      messages: [
        { role: 'system', content: 'You are an AI assistant that analyzes text patterns and user behavior.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || 'No analysis available';
  } catch (error) {
    console.error('Error during OpenAI analysis:', error);
    throw new Error(`Error during OpenAI analysis: ${(error as Error).message}`);
  }
}

export async function generateMessage(messages: string[], systemPrompt: string): Promise<string> {
  try {
    const prompt = `
      Based on the following user messages, generate an example message that reflects how the user would typically behave or communicate:
      ${messages.join("\n")}
    `;
    
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
    console.error('Error during OpenAI message generation:', error);
    throw new Error(`Error during message generation: ${(error as Error).message}`);
  }
}