'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { Toaster } from 'react-hot-toast';

export default function ChatPage() {
  const { user, setUser } = useStore();
  const router = useRouter();

  useEffect(() => {
    // Try to load user from localStorage if not in store
    if (!user) {
      const savedUser = localStorage.getItem('sensayUser');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (err) {
          // Invalid data, redirect to home
          console.error('Error parsing user data:', err);
          localStorage.removeItem('sensayUser');
          router.push('/');
        }
      } else {
        // No user data, redirect to home
        router.push('/');
      }
    }
  }, [user, setUser, router]);

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-900 items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Toaster position="top-right" />
      <Sidebar />
      <ChatInterface />
    </div>
  );
}