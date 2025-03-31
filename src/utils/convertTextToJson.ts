import * as fs from "fs";
import * as path from "path";

/**
 * Converts a text file containing messages to a structured JSON format
 * @param inputFilePath Path to the text file
 * @param outputFilePath Optional custom output path
 */
export function convertTextToJson(
  inputFilePath: string, 
  outputFilePath?: string
): string {
  // Validate input file
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`Input file not found at ${inputFilePath}`);
  }

  const lines = fs.readFileSync(inputFilePath, "utf-8")
    .split("\n")
    .filter(line => line.trim() !== "");
  
  // Generate default output path if not provided
  if (!outputFilePath) {
    const inputFileName = path.basename(inputFilePath, path.extname(inputFilePath));
    outputFilePath = path.resolve(
      path.dirname(inputFilePath), 
      `../output/user_messages_${inputFileName}.json`
    );
  }

  // Create messages with timestamps
  const messages = lines.map((content, index) => ({
    timestamp: generateTimestamp(index),
    content: content.trim(),
  }));

  const output = { messages };
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(outputFilePath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Conversion complete. JSON saved to ${outputFilePath}`);
  
  return outputFilePath;
}

/**
 * Generate a timestamp for each message (most recent to oldest)
 */
function generateTimestamp(index: number): string {
  const baseDate = new Date("2025-03-30T23:59:00.000Z");
  baseDate.setMinutes(baseDate.getMinutes() - index);
  return baseDate.toISOString();
}

// Run as script if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Error: No input file provided");
    console.log("Usage: npx ts-node src/utils/convertTextToJson.ts <input-file> [output-file]");
    process.exit(1);
  }

  try {
    convertTextToJson(args[0], args[1]);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
