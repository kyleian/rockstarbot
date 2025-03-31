import * as fs from "fs";
import * as path from "path";
import { analyzeMessageFile } from "./analyzeMessageFile";

interface GeneratedMessage {
  userId: string;
  timestamp: string;
  content: string;
  metadata: {
    analysisTime: string;
    messagesAnalyzed: number;
    processingDuration: string;
    chunkCount: number;
  };
}

/**
 * Test the message analysis and display the generated example message
 * @param filePath Path to the JSON file containing messages
 */
async function testWithFile(filePath: string): Promise<void> {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at ${filePath}`);
      process.exit(1);
    }

    console.log(`Testing file: ${filePath}`);
    
    // Process the file through our analysis pipeline
    const outputPath = await analyzeMessageFile(filePath);
    
    // Get the generated message file path
    const userId = path.basename(filePath, '.json').replace('user_messages_', '');
    const messageOutputPath = path.join(path.dirname(filePath), `example_message_${userId}.json`);
    
    // Check if the generated message file exists
    if (fs.existsSync(messageOutputPath)) {
      // Read and parse the generated message
      const messageContent = fs.readFileSync(messageOutputPath, 'utf-8');
      const generatedMessage: GeneratedMessage = JSON.parse(messageContent);
      
      // Display the generated message with some formatting
      console.log('\n' + '='.repeat(80));
      console.log(`GENERATED EXAMPLE MESSAGE FOR USER "${generatedMessage.userId}":`);
      console.log('='.repeat(80));
      console.log(generatedMessage.content);
      console.log('='.repeat(80));
      console.log(`Generated at: ${generatedMessage.timestamp}`);
      console.log(`Based on analysis of ${generatedMessage.metadata.messagesAnalyzed} messages`);
      console.log(`Processing time: ${generatedMessage.metadata.processingDuration}`);
    } else {
      console.log('\nNo generated message found.');
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error during test:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: No file path provided.');
    console.log('Usage: npx ts-node src/utils/testWithFile.ts <path-to-json-file>');
    console.log('Example: npx ts-node src/utils/testWithFile.ts output/user_messages_roaming.json');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  await testWithFile(filePath);
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}

export { testWithFile };
