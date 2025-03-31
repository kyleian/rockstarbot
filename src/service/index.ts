import { startBot, pollUserData } from "../discord";
import { analyzeMessages } from "../openai/analyzeMessages";
import * as fs from "fs";
import * as path from "path";

const ENABLE_BOT = false; // Disable the bot for this dev run
const ENABLE_USER_POLL = true; // Enable user polling
const ENABLE_OPENAI_ANALYSIS = true; // Enable OpenAI analysis for this dev run

async function main() {
    if (ENABLE_BOT) {
        startBot();
    }

    if (ENABLE_USER_POLL) {
        const messages = await pollUserData();
        if (messages) {
            // Ensure the output directory exists
            const outputDir = path.resolve(__dirname, "../../output");
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`Created output directory at ${outputDir}`);
            }

            // Generate a unique output file for the user
            const userId = process.env.USER_ID || "unknown_user";
            const outputPath = path.join(outputDir, `user_messages_${userId}.json`);
            fs.writeFileSync(outputPath, JSON.stringify({ messages }, null, 2), "utf-8");
            console.log(`User messages saved to ${outputPath}`);

            if (ENABLE_OPENAI_ANALYSIS) {
                try {
                    const analysis = await analyzeMessages(messages);
                    console.log("OpenAI Analysis:", analysis);

                    // Generate an example message based on user behavior
                    const exampleMessage = await generateExampleMessage(messages);
                    console.log("Example User Message:", exampleMessage);

                    // Save the example message to a file
                    const exampleOutputPath = path.join(outputDir, `example_message_${userId}.json`);
                    fs.writeFileSync(exampleOutputPath, JSON.stringify({ exampleMessage }, null, 2), "utf-8");
                    console.log(`Example message saved to ${exampleOutputPath}`);
                } catch (error: unknown) {
                    const err = error as any; // Explicitly cast error to any
                    console.error("Skipping OpenAI analysis due to error:", err.message || err);
                }
            }
        } else {
            console.log("No messages were collected.");
        }
    }
}

async function generateExampleMessage(messages: string[]): Promise<string> {
    const prompt = `
        Based on the following user messages, generate an example message that reflects how the user would typically behave or communicate:
        ${messages.join("\n")}
    `;
    const response = await analyzeMessages([prompt]);
    return response;
}

main().catch((error: unknown) => {
    const err = error as any; // Explicitly cast error to any
    console.error("Error in service:", err.message || err);
});
