'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, Zap, Brain, MessageSquare, Shield, Rocket, Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import EmailAuthModal from '@/components/EmailAuthModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setUser } = useStore();
  const router = useRouter();

  // Check for existing user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sensayUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        router.push('/chat');
      } catch {
        localStorage.removeItem('sensayUser');
      }
    }
  }, [setUser, router]);

  const handleGetStarted = () => {
    setIsModalOpen(true);
  };

  const features = [
    {
      icon: Brain,
      title: 'Multiple AI Models',
      description: 'Choose from GPT-4, Claude, Gemini, and more cutting-edge models',
    },
    {
      icon: Sparkles,
      title: 'Custom Personalities',
      description: 'Create bots with unique personalities tailored to your needs',
    },
    {
      icon: MessageSquare,
      title: 'Smart Conversations',
      description: 'Natural, context-aware conversations with memory',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Instant responses powered by optimized infrastructure',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations and data are always protected',
    },
    {
      icon: Rocket,
      title: 'Easy Integration',
      description: 'Deploy your bots anywhere with simple API access',
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20" />
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl">
                  <Bot className="w-16 h-16 text-white" />
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Build Your Own
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Assistant
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Create, customize, and deploy intelligent chatbots powered by the latest AI models. 
                No coding required.
              </p>
              
              <div className="max-w-lg mx-auto mb-8">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium flex items-center justify-center gap-2 mx-auto"
                >
                  <Mail className="w-5 h-5" />
                  Get Started with Email
                </button>
                
                <p className="text-sm text-gray-400 mt-4">
                  Simple email authentication - no password needed
                </p>
              </div>
              
              <p className="text-sm text-gray-400">
                Free to start • No credit card required • Unlimited bots
              </p>
            </motion.div>
          </div>
        </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Everything You Need to Build Amazing Bots
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

      {/* Models Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl p-8 border border-purple-700/50"
          >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Powered by Leading AI Models
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['GPT-4', 'Claude', 'Gemini', 'DeepSeek', 'Grok'].map((model) => (
                <div
                  key={model}
                  className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <span className="text-white font-medium">{model}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Create Your First AI Bot?
            </h2>
            <p className="text-gray-300 mb-8">
              Join thousands of users building the next generation of AI assistants
            </p>
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium text-lg"
            >
              Start Building Now
            </button>
          </motion.div>
        </div>
      </div>

      {/* Email Auth Modal */}
      <EmailAuthModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}