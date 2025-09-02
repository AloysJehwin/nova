'use client';

import { useEffect, useState } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail } from 'lucide-react';

interface ReownAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReownAuthModal({ isOpen, onClose }: ReownAuthModalProps) {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  useAppKitProvider('eip155');
  const { setUser } = useStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isConnected && address && !isProcessing) {
      handleAuthentication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const handleAuthentication = async () => {
    if (!address || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // For email auth, the address will be the email
      const email = address.includes('@') ? address : `${address.slice(0, 6)}...${address.slice(-4)}@wallet.user`;
      
      // Check if user exists
      const checkResponse = await fetch('/api/users/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error('Failed to process authentication');
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

      // Store user data
      const userInfo = {
        id: checkData.user.id,
        email: email,
        emailVerified: true,
        linkedAccounts: userData.linkedAccounts || [],
        createdAt: checkData.user.createdAt || new Date()
      };

      localStorage.setItem('sensayUser', JSON.stringify(userInfo));
      localStorage.setItem('userEmail', email);
      setUser(userInfo);

      if (checkData.exists) {
        toast.success(`Welcome back!`);
      } else {
        toast.success('Account created successfully!');
      }

      onClose();
      router.push('/chat');
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to authenticate. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openReownModal = () => {
    open({ view: 'Connect' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
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
            <h2 className="text-xl font-semibold text-white">Sign In with Reown</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={openReownModal}
              disabled={isProcessing || status === 'connecting'}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'connecting' || isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {status === 'connecting' ? 'Connecting...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Connect with Email
                </>
              )}
            </button>

            <p className="text-sm text-gray-400 text-center">
              Sign in securely with your email address using Reown authentication
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}