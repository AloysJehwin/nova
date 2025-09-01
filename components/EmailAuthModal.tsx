'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailAuthModal({ isOpen, onClose }: EmailAuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setIsLoading(true);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      // Use consistent user check/create flow (skip sync due to API limitations)
      console.log('🔍 AUTH: Checking/creating user with consistent ID generation:', email);
      const checkResponse = await fetch('/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error('Failed to process request');
      }

      // Create or get user from Sensay API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checkData.user.id,
          email: email,
        }),
      });

      const userData = await response.json();

      // Store user data with the correct ID
      const userInfo = {
        id: checkData.user.id,
        email: email,
        emailVerified: true,
        linkedAccounts: userData.linkedAccounts || [],
        createdAt: checkData.user.createdAt || new Date()
      };

      localStorage.setItem('sensayUser', JSON.stringify(userInfo));
      localStorage.setItem('userEmail', email); // Store email separately for easy access
      setUser(userInfo);

      if (checkData.exists) {
        toast.success(`Welcome back, ${email}!`);
      } else {
        toast.success('Account created successfully!');
      }

      onClose();
      router.push('/chat');
    } catch (error) {
      console.error('Authentication error:', error);
      setError('Failed to authenticate. Please try again.');
      toast.error('Failed to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Sign In / Sign Up</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300 font-medium">Simple & Secure</p>
                <p className="text-xs text-gray-400 mt-1">
                  No password needed. Your email is your account. All your chatbots and conversations are securely stored and linked to your email address.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}