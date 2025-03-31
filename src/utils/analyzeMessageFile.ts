import * as fs from "fs";
import * as path from "path";
import { analyzeMessages } from "../openai/analyzeMessages";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MessageData {
  messages: Array<{
    timestamp: string;
    content: string;
  }>;
}

/**
 * Generate a message that mimics the user's communication style
 * @param analysisText The analysis of the user's messages
 * @param userId The user ID
 * @param sampleMessages A few sample messages from the user
 */
async function generateMimickedMessage(analysisText: string, userId: string, sampleMessages: string[]): Promise<string> {
  try {
    // Prepare a prompt that includes the analysis and sample messages
    const prompt = `
Based on this analysis of user "${userId}":
${analysisText.substring(0, 3000)}... [truncated]

And these sample messages from the user:
${sampleMessages.slice(0, 5).join('\n')}

Generate a new message that mimics this user's communication style, topics of interest, and typical message length. 
The message should sound natural and be representative of how this user typically writes.`;

    // Call OpenAI to generate the message
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an assistant that mimics writing styles based on message analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    return response.choices[0].message.content || "Could not generate a mimicked message.";
  } catch (error) {
    console.error("Error generating mimicked message:", error);
    return "Error generating mimicked message.";
  }
}

/**
 * Process a JSON file containing messages and analyze them with OpenAI
 * @param filePath Path to the JSON file containing messages
 * @param outputPath Optional custom output path for analysis results
 * @param concurrentChunks Number of chunks to process in parallel (default: 3)
 */
export async function analyzeMessageFile(
  filePath: string,
  outputPath?: string,
  concurrentChunks: number = 3
): Promise<string> {
  const startTime = Date.now();
  
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at ${filePath}`);
    }

    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData: MessageData = JSON.parse(fileContent);
    
    console.log(`Processing file: ${filePath}`);
    console.log(`Number of messages: ${jsonData.messages.length}`);
    
    // Validate message format
    if (!Array.isArray(jsonData.messages) || jsonData.messages.length === 0) {
      throw new Error('Invalid message format. Expected non-empty array of messages.');
    }

    // Extract message contents
    const messageContents = jsonData.messages.map(message => message.content);

    // Process in chunks to avoid token limits
    const chunkSize = 100;
    const chunks = [];
    
    for (let i = 0; i < messageContents.length; i += chunkSize) {
      chunks.push(messageContents.slice(i, i + chunkSize));
    }
    
    console.log(`Split into ${chunks.length} chunks of up to ${chunkSize} messages each`);
    console.log(`Processing up to ${concurrentChunks} chunks in parallel\n`);
    
    // Process chunks with controlled concurrency
    const allResults: string[] = [];
    const allAnalysis: string[] = [];
    
    // Create a queue of chunk indexes
    const chunkIndexes = Array.from({ length: chunks.length }, (_, i) => i);
    
    // Process chunks in batches
    while (chunkIndexes.length > 0) {
      const batchSize = Math.min(concurrentChunks, chunkIndexes.length);
      const batch = [];
      
      // Create a batch of promises to process chunks
      for (let i = 0; i < batchSize; i++) {
        const chunkIndex = chunkIndexes.shift()!;
        const chunk = chunks[chunkIndex];
        
        batch.push(
          (async () => {
            try {
              console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} messages)...`);
              const chunkResults = await analyzeMessages(chunk);
              console.log(`✅ Chunk ${chunkIndex + 1}/${chunks.length} analysis complete`);
              return { index: chunkIndex, results: chunkResults };
            } catch (error) {
              console.error(`❌ Error analyzing chunk ${chunkIndex + 1}/${chunks.length}:`, 
                error instanceof Error ? error.message : String(error));
              return { index: chunkIndex, results: `Error analyzing chunk ${chunkIndex + 1}: ${error}` };
            }
          })()
        );
      }
      
      // Wait for all chunks in this batch to complete
      const batchResults = await Promise.all(batch);
      
      // Store results in the correct order
      batchResults.forEach(({ index, results }) => {
        allResults[index] = results;
        allAnalysis[index] = results;
      });
    }
    
    // Combine results (filter out any undefined results)
    const combinedResults = allResults.filter(Boolean).join('\n\n---\n\n');
    const completeAnalysis = allAnalysis.filter(Boolean).join('\n\n');
    
    // Generate default output path if not provided
    if (!outputPath) {
      const baseFilename = path.basename(filePath, '.json');
      outputPath = path.join(path.dirname(filePath), `${baseFilename}_analysis.txt`);
    }
    
    // Save analysis results
    fs.writeFileSync(outputPath, combinedResults, 'utf-8');
    console.log(`\nAnalysis saved to: ${outputPath}`);
    
    // Generate a message that mimics the user's style
    console.log('\nGenerating user message based on analysis...');
    const userId = path.basename(filePath, '.json').replace('user_messages_', '');
    const messageOutputPath = path.join(path.dirname(filePath), `example_message_${userId}.json`);
    
    try {
      // Get a few sample messages for context
      const sampleMessages = messageContents.slice(0, 10);
      
      // Generate a message that mimics the user's style
      const mimickedMessage = await generateMimickedMessage(completeAnalysis, userId, sampleMessages);
      
      // Create the message object
      const userMessage = {
        userId: userId,
        timestamp: new Date().toISOString(),
        content: mimickedMessage,
        metadata: {
          analysisTime: new Date().toISOString(),
          messagesAnalyzed: jsonData.messages.length,
          processingDuration: `${(Date.now() - startTime) / 1000} seconds`,
          chunkCount: chunks.length
        }
      };
      
      fs.writeFileSync(messageOutputPath, JSON.stringify(userMessage, null, 2), 'utf-8');
      console.log(`User message generated and saved to: ${messageOutputPath}`);
    } catch (error) {
      console.error('Error generating user message:', error instanceof Error ? error.message : String(error));
    }
    
    return outputPath;
  } catch (error) {
    throw new Error(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run as script if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Error: No file path provided.');
    console.log('Usage: npx ts-node src/utils/analyzeMessageFile.ts <path-to-json-file> [output-path] [concurrent-chunks]');
    console.log('Example: npx ts-node src/utils/analyzeMessageFile.ts output/user_messages_roaming.json output/analysis.txt 3');
    process.exit(1);
  }

  const filePath = args[0];
  const outputPath = args.length > 1 ? args[1] : undefined;
  const concurrentChunks = args.length > 2 ? parseInt(args[2], 10) : 3;
  
  analyzeMessageFile(filePath, outputPath, concurrentChunks)
    .then(() => console.log('\nAnalysis complete'))
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}
