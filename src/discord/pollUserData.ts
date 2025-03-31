import { Client, GatewayIntentBits, Collection, Message, Guild, TextChannel, DMChannel } from "discord.js";
import { config } from "dotenv";

config(); // Load environment variables

const DISCORD_TOKEN = process.env.DISCORD_TOKEN as string;
const FETCH_MODE = process.env.FETCH_MODE as string; // "guild" or "dm"
const GUILD_ID = process.env.GUILD_ID as string;
const CHANNEL_ID = process.env.CHANNEL_ID as string;
const USER_ID = process.env.USER_ID as string;

export async function pollUserData(): Promise<string[] | null> {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages // Enable DM access
        ],
    });

    return new Promise((resolve) => {
        client.once("ready", async () => {
            console.log(`Logged in as ${client.user?.tag}`);
            console.log(`Using DISCORD_TOKEN: ${DISCORD_TOKEN.substring(0, 10)}...`);
            console.log(`Using FETCH_MODE: ${FETCH_MODE}`);

            try {
                if (FETCH_MODE === "guild") {
                    // Log all accessible guilds
                    console.log("Accessible guilds:");
                    client.guilds.cache.forEach((guild) => {
                        console.log(`- ${guild.name} (${guild.id})`);
                    });

                    // Log the GUILD_ID being used
                    console.log(`Attempting to fetch guild with ID: ${GUILD_ID}`);

                    // Fetch the guild dynamically if not found in the cache
                    let guild: Guild | null = client.guilds.cache.get(GUILD_ID) || null;
                    if (!guild) {
                        console.log(`Guild not found in cache. Attempting to fetch guild with ID: ${GUILD_ID}`);
                        guild = await client.guilds.fetch(GUILD_ID).catch((error) => {
                            console.error(`Failed to fetch guild: ${error.message}`);
                            return null;
                        });
                    }

                    if (!guild) {
                        console.error("Guild not found! Ensure the bot is added to the guild and the GUILD_ID is correct.");
                        client.destroy();
                        resolve(null);
                        return;
                    }

                    console.log(`Guild found: ${guild.name} (${guild.id})`);

                    const channel = guild.channels.cache.get(CHANNEL_ID) as TextChannel;
                    if (!channel) {
                        console.error(`Channel not found! Ensure the CHANNEL_ID is correct and the bot has access to the channel.`);
                        client.destroy();
                        resolve(null);
                        return;
                    }

                    if (channel.type !== 0) { // 0 corresponds to a text channel
                        console.error(`Channel is not a text channel. Channel type: ${channel.type}`);
                        client.destroy();
                        resolve(null);
                        return;
                    }

                    console.log(`Channel found: ${channel.name} (${channel.id})`);

                    let allMessages: string[] = [];
                    let lastMessageId: string | undefined = undefined;

                    while (true) {
                        const messages: Collection<string, Message> = await channel.messages.fetch({ limit: 100, before: lastMessageId });
                        if (messages.size === 0) break;

                        const filteredMessages = messages.filter((msg: Message) => msg.author.id === USER_ID);
                        filteredMessages.forEach((msg: Message) => {
                            allMessages.push(`${msg.createdAt.toISOString()} - ${msg.content}`);
                        });

                        lastMessageId = messages.last()?.id;
                    }

                    console.log("Fetched messages from guild:", allMessages);
                    resolve(allMessages);
                } else if (FETCH_MODE === "dm") {
                    // Fetch messages from a DM channel
                    const user = await client.users.fetch(USER_ID);
                    if (!user) {
                        console.error("User not found! Ensure the USER_ID is correct.");
                        client.destroy();
                        resolve(null);
                        return;
                    }

                    console.log(`User found: ${user.tag} (${user.id})`);

                    const dmChannel = await user.createDM();
                    if (!dmChannel) {
                        console.error("Failed to create or access DM channel.");
                        client.destroy();
                        resolve(null);
                        return;
                    }

                    console.log(`DM channel accessed with user: ${user.tag}`);

                    let allMessages: string[] = [];
                    let lastMessageId: string | undefined = undefined;

                    while (true) {
                        const messages: Collection<string, Message> = await dmChannel.messages.fetch({ limit: 100, before: lastMessageId });
                        if (messages.size === 0) {
                            console.log("No more messages to fetch from the DM channel.");
                            break;
                        }

                        messages.forEach((msg: Message) => {
                            allMessages.push(`${msg.createdAt.toISOString()} - ${msg.content}`);
                        });

                        lastMessageId = messages.last()?.id;
                    }

                    if (allMessages.length === 0) {
                        console.log("No messages were found in the DM channel. The channel might be empty or the bot cannot access older messages.");
                    } else {
                        console.log("Fetched messages from DM:", allMessages);
                    }

                    resolve(allMessages);
                } else {
                    console.error(`Invalid FETCH_MODE: ${FETCH_MODE}. Use "guild" or "dm".`);
                    resolve(null);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                resolve(null);
            } finally {
                client.destroy();
            }
        });

        client.login(DISCORD_TOKEN).catch((error) => {
            console.error("Failed to log in:", error);
            resolve(null);
        });
    });
}
