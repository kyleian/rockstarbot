import { startBot } from "../discord/bot";
import { pollUserData } from "../discord/pollUserData";
import { analyzeMessages, generateMessage } from "./ai/openai";
import { getUserMessages } from "../utils/userMessageUtils";
import * as fs from "fs";
import * as path from "path";
import { config } from '../config';
import { maskId } from '../utils/maskData';

const ENABLE_BOT = false; // Disable the bot for this dev run
const ENABLE_USER_POLL = true; // Enable user polling
const ENABLE_OPENAI_ANALYSIS = true; // Enable OpenAI analysis for this dev run

async function main() {
    if (ENABLE_BOT) {
        startBot();
        return;
    }

    if (ENABLE_USER_POLL) {
        console.log("Fetching messages (will use cache if available)...");
        
        const userId = config.userId;
        const guildId = config.guildId;
        
        // Just poll general guild data if we're running in service mode
        const allMessages = await pollUserData(undefined, guildId);
        
        if (allMessages.length > 0) {
            // Ensure the output directory exists
            const outputDir = path.resolve(__dirname, "../../output");
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
                console.log(`Created output directory at ${outputDir}`);
            }

            // Generate a unique output file for the user
            const outputPath = path.join(outputDir, `${maskId(userId)}_messages.json`);
            fs.writeFileSync(outputPath, JSON.stringify({ messages: allMessages }, null, 2), "utf-8");
            console.log(`User messages saved to ${outputPath}`);

            if (ENABLE_OPENAI_ANALYSIS) {
                try {
                    // Use a smaller sample of messages if there are too many
                    let analysisContents = allMessages.map(msg => msg.content);
                    if (analysisContents.length > 500) {
                        console.log(`Too many messages for analysis (${analysisContents.length}), using the most recent 500`);
                        analysisContents = analysisContents.slice(0, 500);
                    }
                    
                    const analysis = await analyzeMessages(analysisContents);
                    console.log("OpenAI Analysis:", analysis);

                    // Generate example using a smaller sample
                    const exampleSample = analysisContents.slice(0, 100);
                    const exampleMessage = await generateMessage(exampleSample, 'You are a skilled mimic that can imitate a person\'s writing style based on examples.');
                    console.log("Example User Message:", exampleMessage);

                    // Save the example message to a file
                    const exampleOutputPath = path.join(outputDir, `${maskId(userId)}_example.json`);
                    fs.writeFileSync(exampleOutputPath, JSON.stringify({ exampleMessage }, null, 2), "utf-8");
                    console.log(`Example message saved to ${exampleOutputPath}`);
                } catch (error: unknown) {
                    console.error("Skipping OpenAI analysis due to error:", error);
                }
            }
        } else {
            console.log("No messages were collected.");
        }
    }
}

main().catch((error: unknown) => {
    console.error("Error in service:", error);
});
