import { Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";

config(); // Load environment variables

const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;

export function startBot() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent // Only include necessary intents
        ],
    });

    client.once("ready", () => {
        console.log(`Logged in as ${client.user?.tag}`);
    });

    client.login(DISCORD_TOKEN).catch((error) => {
        console.error("Failed to log in:", error);
    });
}
