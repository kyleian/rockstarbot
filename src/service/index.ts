import { startBot, pollUserData } from "../discord";
import { analyzeMessages } from "../openai/analyzeMessages";
import { getUserMessages } from "../utils/userMessageUtils";
import { generateExampleMessage } from "./messageGenerator";
import * as fs from "fs";
import * as path from "path";
import { config } from '../config';  // Use unified config

const ENABLE_BOT = false; // Disable the bot for this dev run
const ENABLE_USER_POLL = true; // Enable user polling
const ENABLE_OPENAI_ANALYSIS = true; // Enable OpenAI analysis for this dev run

function maskUserId(userId: string): string {
    return `user_${userId.substring(0, 4)}`;
}

async function main() {
    if (ENABLE_BOT) {
        startBot();
    }

    if (ENABLE_USER_POLL) {
        console.log("Fetching messages (will use cache if available)...");
        
        const userId = config.userId;
        const guildId = config.guildId;
        const channelId = config.channelId;
        
        // First check if we already have user-specific cached messages
        let messages = getUserMessages(userId, guildId, channelId, 3);
        
        // If no user-specific messages found, fetch all and separate
        if (!messages) {
            const allMessages = await pollUserData();
            // The separation happens inside getUserMessages after pollUserData creates the guild cache
            messages = getUserMessages(userId, guildId, channelId, 3) || [];
        }
        
        const messageContents = messages.map(msg => msg.content);
        
        if (messages && messages.length > 0) {
            // Ensure the output directory exists
            const outputDir = path.resolve(__dirname, "../../output");
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`Created output directory at ${outputDir}`);
            }

            // Generate a unique output file for the user
            const userId = process.env.USER_ID || "unknown_user";
            const outputPath = path.join(outputDir, `${maskUserId(userId)}_messages.json`);
            fs.writeFileSync(outputPath, JSON.stringify({ messages }, null, 2), "utf-8");
            console.log(`User messages saved to ${outputPath}`);

            if (ENABLE_OPENAI_ANALYSIS) {
                try {
                    // Use a smaller sample of messages if there are too many
                    let analysisContents = messageContents;
                    if (messageContents.length > 500) {
                        console.log(`Too many messages for analysis (${messageContents.length}), using the most recent 500`);
                        analysisContents = messageContents.slice(0, 500);
                    }
                    
                    const analysis = await analyzeMessages(analysisContents);
                    console.log("OpenAI Analysis:", analysis);

                    // Generate example using a smaller sample
                    const exampleSample = analysisContents.slice(0, 100);
                    const exampleMessage = await generateExampleMessage(exampleSample);
                    console.log("Example User Message:", exampleMessage);

                    // Save the example message to a file
                    const exampleOutputPath = path.join(outputDir, `${maskUserId(userId)}_example.json`);
                    fs.writeFileSync(exampleOutputPath, JSON.stringify({ exampleMessage }, null, 2), "utf-8");
                    console.log(`Example message saved to ${exampleOutputPath}`);
                } catch (error: unknown) {
                    const err = error as any; // Explicitly cast error to any
                    console.error("Skipping OpenAI analysis due to error:", err.message || err);
                }
            }
        } else {
            console.log("No messages were collected or found in cache.");
        }
    }
}

main().catch((error: unknown) => {
    const err = error as any; // Explicitly cast error to any
    console.error("Error in service:", err.message || err);
});
