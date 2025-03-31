import { OpenAI } from 'openai';
import { config } from '../config';

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
