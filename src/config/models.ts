/**
 * Available OpenAI models that can be used in the application
 */
export const AVAILABLE_MODELS = {
  // GPT-3.5 Models - Good general purpose models with lower cost
  GPT35: {
    DEFAULT: 'gpt-3.5-turbo',        // Latest GPT-3.5 model
    EXTENDED: 'gpt-3.5-turbo-16k',   // Extended context (16k tokens)
    SPECIFIC: 'gpt-3.5-turbo-1106'   // Specific version for consistency
  },
  
  // GPT-4 Models - Better quality, more advanced
  GPT4: {
    DEFAULT: 'gpt-4',                // Standard GPT-4
    EXTENDED: 'gpt-4-32k',           // Extended context (32k tokens)
    TURBO: 'gpt-4-turbo',            // Faster, cheaper GPT-4 version
    PREVIEW: 'gpt-4-1106-preview',   // Latest preview version
    VISION: 'gpt-4-vision-preview'   // Can analyze images (not used here)
  },
  
  // Claude Models - Alternative to GPT
  CLAUDE: {
    DEFAULT: 'claude-2.1',           // Latest Claude model
    OPUS: 'claude-2.1-opus',        // High-performance Claude
    SONNET: 'claude-2.1-sonnet',    // Balanced performance/cost
    HAIKU: 'claude-instant-1.2',    // Fast, efficient Claude
  },
  
  // Embedding models - For text vectorization (future use)
  EMBEDDINGS: {
    ADA: 'text-embedding-ada-002',   // Standard embedding model
    SMALL: 'text-embedding-3-small', // Smaller, cheaper embedding
    LARGE: 'text-embedding-3-large'  // Higher quality embedding
  }
};

/**
 * Recommended model configurations for different use cases
 */
export const RECOMMENDED_CONFIGS = {
  ANALYSIS: {
    ECONOMY: AVAILABLE_MODELS.GPT35.DEFAULT,
    BALANCED: AVAILABLE_MODELS.GPT35.EXTENDED,
    PREMIUM: AVAILABLE_MODELS.GPT4.DEFAULT,
    CLAUDE: AVAILABLE_MODELS.CLAUDE.DEFAULT
  },
  SIMULATION: {
    ECONOMY: AVAILABLE_MODELS.GPT35.DEFAULT,
    BALANCED: AVAILABLE_MODELS.GPT4.TURBO,
    PREMIUM: AVAILABLE_MODELS.GPT4.DEFAULT,
    CLAUDE: AVAILABLE_MODELS.CLAUDE.OPUS
  }
};
