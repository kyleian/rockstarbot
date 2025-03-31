import { OpenAI } from "openai";
import { config } from "dotenv";

config(); // Load environment variables

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeMessages(messages: string[]): Promise<string> {
    const textData = messages.join("\n");
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Use the cheapest model
            messages: [
                { role: "system", content: "Analyze the following Discord messages from a specific user." },
                { role: "user", content: textData },
            ],
        });

        return response.choices[0].message.content || "No response from GPT.";
    } catch (error: any) {
        if (error.code === "rate_limit_exceeded" && error.headers?.["retry-after"]) {
            const retryAfter = parseInt(error.headers["retry-after"], 10) * 1000; // Convert seconds to milliseconds
            console.warn(`Rate limit hit. Retrying after ${retryAfter}ms...`);
            await delay(retryAfter);
            return analyzeMessages(messages); // Retry the request
        }

        if (error.code === "insufficient_quota") {
            console.error("OpenAI API quota exceeded. Skipping analysis.");
            return "OpenAI API quota exceeded.";
        }

        console.error("Error during OpenAI analysis:", error.message);
        throw error;
    }
}
