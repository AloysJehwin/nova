'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

export default function ChatInterface() {
  const { currentReplica, messages, addMessage, user, loadChatHistory } = useStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when replica changes or on first load
  useEffect(() => {
    if (currentReplica && user?.id && !historyLoaded.has(currentReplica.uuid)) {
      console.log('Auto-loading chat history for:', currentReplica.name);
      loadChatHistory(currentReplica.uuid, user.id);
      setHistoryLoaded(prev => new Set([...prev, currentReplica.uuid]));
    }
  }, [currentReplica, user, loadChatHistory, historyLoaded]);

  const sendMessage = async () => {
    if (!input.trim() || !currentReplica || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: 'user' as const,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replicaUUID: currentReplica.uuid,
          content: input,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.content) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          content: data.content,
          role: 'assistant' as const,
          timestamp: new Date(),
        };
        addMessage(botMessage);
      } else {
        toast.error(data.error || 'Failed to get response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentReplica) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="text-center">
          <Bot className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Bot Selected</h2>
          <p className="text-gray-400">Select a bot from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{currentReplica.name}</h2>
            <p className="text-sm text-gray-400">{currentReplica.shortDescription}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {currentReplica.llm.model}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="bg-gray-800/50 rounded-lg p-6 max-w-md mx-auto">
              <Bot className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <p className="text-gray-300 mb-4">{currentReplica.greeting}</p>
              {currentReplica.suggestedQuestions && currentReplica.suggestedQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Try asking:</p>
                  {currentReplica.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInput(q)}
                      className="block w-full text-left text-sm text-purple-400 hover:text-purple-300 bg-gray-700/50 p-2 rounded transition-colors"
                    >
                      &ldquo;{q}&rdquo;
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
                <p className="text-xs opacity-50 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}