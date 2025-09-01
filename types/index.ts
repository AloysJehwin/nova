export interface User {
  id: string;
  email: string;
  linkedAccounts?: unknown[];
  emailVerified?: boolean;
  createdAt?: Date;
}

export interface Replica {
  uuid: string;
  name: string;
  shortDescription: string;
  greeting: string;
  type: 'individual' | 'character' | 'brand';
  ownerID: string;
  slug: string;
  profileImage?: string;
  suggestedQuestions?: string[];
  llm: {
    model: LLMModel;
    systemMessage: string;
    tools?: string[];
  };
  tags?: string[];
  private?: boolean;
  created_at?: string;
  chat_history_count?: number;
}

export type LLMModel = 
  | 'gpt-4o'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'claude-3-5-haiku-latest'
  | 'claude-3-7-sonnet-latest'
  | 'claude-4-sonnet-20250514'
  | 'grok-3-latest'
  | 'grok-4-latest'
  | 'deepseek-chat'
  | 'o3-mini'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'asi1-mini'
  | 'targon-gpt-oss-120b';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatSession {
  replicaUUID: string;
  messages: Message[];
  isLoading: boolean;
}