'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Sparkles, Brain, Zap } from 'lucide-react';
import { LLMModel } from '@/types';
import toast from 'react-hot-toast';

interface CreateBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onBotCreated: () => void;
}

const models: { value: LLMModel; label: string; icon: any }[] = [
  { value: 'gpt-4o', label: 'GPT-4 Optimized', icon: Zap },
  { value: 'gpt-5', label: 'GPT-5', icon: Sparkles },
  { value: 'claude-3-5-haiku-latest', label: 'Claude Haiku', icon: Brain },
  { value: 'claude-3-7-sonnet-latest', label: 'Claude Sonnet', icon: Brain },
  { value: 'deepseek-chat', label: 'DeepSeek Chat', icon: Bot },
  { value: 'gemini-2.5-flash', label: 'Gemini Flash', icon: Sparkles },
  { value: 'gemini-2.5-pro', label: 'Gemini Pro', icon: Zap },
];

const personalities = [
  { value: 'friendly', label: 'Friendly & Helpful', prompt: 'Be warm, friendly, and eager to help. Show empathy and understanding.' },
  { value: 'professional', label: 'Professional', prompt: 'Be professional, concise, and formal. Focus on accuracy and clarity.' },
  { value: 'creative', label: 'Creative & Fun', prompt: 'Be creative, playful, and entertaining. Use humor when appropriate.' },
  { value: 'teacher', label: 'Educational', prompt: 'Be patient, explanatory, and educational. Break down complex topics.' },
  { value: 'technical', label: 'Technical Expert', prompt: 'Be technical, precise, and detailed. Use technical terminology when appropriate.' },
  { value: 'custom', label: 'Custom', prompt: '' },
];

export default function CreateBotModal({ isOpen, onClose, userId, onBotCreated }: CreateBotModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    greeting: 'Hello! How can I help you today?',
    type: 'character' as 'character' | 'individual' | 'brand',
    model: 'gpt-4o' as LLMModel,
    personality: 'friendly',
    customPrompt: '',
    tags: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const selectedPersonality = personalities.find(p => p.value === formData.personality);
    const systemMessage = formData.personality === 'custom' 
      ? formData.customPrompt 
      : selectedPersonality?.prompt || '';
    
    try {
      // First, ensure the user exists in Sensay
      console.log('Verifying user exists in Sensay before bot creation:', userId);
      
      const userEmail = localStorage.getItem('userEmail') || '';
      const verifyResponse = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          email: userEmail,
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok && verifyResponse.status !== 409) {
        console.error('Failed to verify/create user:', verifyData);
        toast.error('Failed to verify user. Please try signing in again.');
        setIsLoading(false);
        return;
      }
      
      console.log('User verified/created, proceeding with bot creation');
      
      // Now create the bot
      const response = await fetch('/api/replicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          shortDescription: formData.shortDescription,
          greeting: formData.greeting,
          type: formData.type,
          ownerID: userId,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
          llm: {
            model: formData.model,
            systemMessage,
          },
          tags: formData.tags,
        }),
      });

      const data = await response.json();
      
      if (response.ok || data.success) {
        toast.success('Bot created successfully!');
        onBotCreated();
        onClose();
        setFormData({
          name: '',
          shortDescription: '',
          greeting: 'Hello! How can I help you today?',
          type: 'character',
          model: 'gpt-4o',
          personality: 'friendly',
          customPrompt: '',
          tags: [],
        });
      } else {
        console.error('Bot creation failed:', data);
        if (data.needsReauth || (data.error && data.error.includes('Owner') && data.error.includes('does not exist'))) {
          toast.error('User verification failed. Please sign out and sign in again.');
          // Clear user data to force re-authentication
          localStorage.removeItem('sensayUser');
          localStorage.removeItem('userEmail');
          window.location.href = '/';
        } else {
          toast.error(data.error || 'Failed to create bot');
        }
      }
    } catch (error) {
      console.error('Bot creation exception:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bot className="w-6 h-6 text-purple-400" />
                Create Your AI Assistant
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="e.g., Tech Support Bot"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  required
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="A helpful assistant for technical questions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Greeting Message
                </label>
                <textarea
                  value={formData.greeting}
                  onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  rows={2}
                  placeholder="Hello! How can I help you today?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bot Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['character', 'individual', 'brand'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type as any })}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        formData.type === type
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {models.map((model) => {
                    const Icon = model.icon;
                    return (
                      <button
                        key={model.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, model: model.value })}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          formData.model === model.value
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{model.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Personality
                </label>
                <select
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {personalities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.personality === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Custom System Prompt
                  </label>
                  <textarea
                    value={formData.customPrompt}
                    onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    rows={3}
                    placeholder="Define your bot's personality and behavior..."
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Bot'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}