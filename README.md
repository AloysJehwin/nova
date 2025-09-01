# Sensay AI Chatbot Platform

A modern, responsive web application for creating and managing AI chatbots powered by multiple LLM models including GPT-4, Claude, Gemini, and more.

## Features

- **Multiple AI Models**: Choose from GPT-4, Claude, Gemini, DeepSeek, Grok, and other cutting-edge models
- **Custom Bot Creation**: Create bots with unique personalities and system prompts
- **Real-time Chat Interface**: Beautiful, responsive chat interface with markdown support
- **User Management**: Automatic user creation and authentication
- **Bot Management**: Create, customize, and manage multiple bots per user
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Theme**: Modern dark theme with purple gradient accents

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **API Integration**: Sensay API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Sensay API credentials (already configured in `.env.local`)

### Installation

1. Navigate to the project directory:
```bash
cd sensay-chatbot-app
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating Your First Bot

1. **Sign Up**: Enter your email on the landing page
2. **Create Bot**: Click "Create New Bot" in the sidebar
3. **Customize**: 
   - Choose a name and description
   - Select an AI model (GPT-4, Claude, etc.)
   - Pick a personality preset or create custom
   - Set greeting message
4. **Start Chatting**: Select your bot and start conversing!

### Available AI Models

- **GPT-4 Optimized** - OpenAI's most capable model
- **GPT-4 Mini** - Faster, lighter version
- **Claude Haiku/Sonnet** - Anthropic's AI models
- **Gemini Flash/Pro** - Google's AI models
- **DeepSeek Chat** - Specialized for conversations

## Deployment

Build the production version:
```bash
npm run build
npm start
```
