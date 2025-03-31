import { config as dotenvConfig } from 'dotenv';

// Load .env file
dotenvConfig();

export const config = {
  // Discord configuration
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || '',
  guildId: process.env.GUILD_ID || '',
  
  // Service configuration
  timeSpanMonths: parseInt(process.env.TIME_SPAN_MONTHS || '3', 10),
  cacheExpiryHours: parseInt(process.env.CACHE_EXPIRY_HOURS || '24', 10),
  
  // User filtering
  excludedUsers: (process.env.EXCLUDED_USERS || '')
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0),
  
  // OpenAI configuration
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Default model
  openaiAnalysisModel: process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_MODEL || 'gpt-3.5-turbo', // Model for analysis
  openaiSimulationModel: process.env.OPENAI_SIMULATION_MODEL || process.env.OPENAI_MODEL || 'gpt-4', // Model for user simulation
  
  // Claude configuration
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  useClaudeModel: process.env.USE_CLAUDE === 'true',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-2.1',
  
  // System paths
  cacheDir: process.env.CACHE_DIR || 'cache',
  outputDir: process.env.OUTPUT_DIR || 'output'
};

// Validate required configuration
if (!config.token) throw new Error('DISCORD_TOKEN is required');
if (!config.clientId) throw new Error('CLIENT_ID is required');
if (!config.guildId) throw new Error('GUILD_ID is required');
if (!config.openaiApiKey) throw new Error('OPENAI_API_KEY is required');

// Add Claude validation if enabled
if (config.useClaudeModel && !config.claudeApiKey) {
  throw new Error('CLAUDE_API_KEY is required when USE_CLAUDE is true');
}
