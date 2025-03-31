import { OpenAI } from "openai";
import { config } from "dotenv";

config(); // Load environment variables

const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in the .env file.");
    process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testApiKey() {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Test the OpenAI API key." },
                { role: "user", content: "Is this API key valid?" },
            ],
        });

        console.log("API Key is valid. Response:", response.choices[0].message.content);
    } catch (error: any) {
        if (error.code === "insufficient_quota") {
            console.error("Error: Insufficient quota. Retrying in 1 minute...");
            await delay(60000); // Wait for 1 minute before retrying
            return testApiKey();
        } else if (error.code === "invalid_api_key") {
            console.error("Error: The provided API key is invalid.");
        } else if (error.code === "rate_limit_exceeded") {
            console.error("Error: Rate limit exceeded. Please try again later.");
        } else {
            console.error("Error testing API key:", error.message || error);
        }
    }
}

testApiKey();
