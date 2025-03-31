# RockstarBot

A Discord bot that processes and analyzes message patterns using natural language processing.

## Overview

RockstarBot connects to Discord servers, processes message data, and leverages OpenAI's language models to analyze communication patterns for technical demonstrations and research purposes.

## Features

- **Discord Integration**: Connect to Discord servers and process message data
- **Message Analysis**: Analyze messages using OpenAI's language models
- **Pattern Recognition**: Identify communication patterns in message content
- **Technical Demonstrations**: Create example outputs based on pattern analysis
- **Batch Processing**: Handle large message volumes with automatic chunking
- **Report Generation**: Create analytical reports from message data

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Discord Bot Token (for Discord integration)
- OpenAI API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rockstarbot.git
cd rockstarbot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```
DISCORD_TOKEN=your_discord_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Usage

#### Running the Discord Bot

To start the Discord bot:

```bash
npm start
```

#### Testing with Message Files

You can process existing message files to test the analysis functionality:

```bash
npx ts-node src/utils/testWithFile.ts output/user_messages_user.json
```

#### Converting Text Files to Message Format

To convert a text file (like user.txt) into the proper JSON message format:

```bash
npx ts-node src/utils/processMessageFile.ts user.txt
```

## Project Structure

- `src/`: Main source code
  - `service/`: Core service functionality
  - `openai/`: OpenAI integration and message analysis
  - `discord/`: Discord bot functionality
  - `utils/`: Utility functions and testing tools
- `scripts/`: Helper scripts for development
- `output/`: Output files from message analysis

## File Processing Flow

1. Input text file is converted to JSON message format
2. Messages are analyzed using OpenAI
3. Analysis results are saved to output file

## How It Works

1. **Data Collection**: The bot collects messages from Discord users
2. **Processing**: Messages are formatted into a standardized JSON structure
3. **Analysis**: OpenAI's language models analyze the message content
4. **Pattern Recognition**: Identify communication patterns in message content
5. **Technical Demonstrations**: Create example outputs based on pattern analysis
6. **Insights**: The system generates insights about user behavior and communication patterns
7. **Reporting**: Analysis results and generated messages are saved and can be viewed by administrators