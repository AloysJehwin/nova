'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Plus, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Replica } from '@/types';
import CreateBotModal from './CreateBotModal';
import UserSettingsModal from './UserSettingsModal';
import { signOut } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, replicas, setReplicas, currentReplica, setCurrentReplica, setUser, loadChatHistory } = useStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchReplicas = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/replicas?ownerID=${user.id}`);
      const data = await response.json();
      
      if (data.items) {
        setReplicas(data.items);
      }
    } catch (err) {
      console.error('Failed to fetch bots:', err);
      toast.error('Failed to fetch bots');
    } finally {
      setIsLoading(false);
    }
  }, [user, setReplicas]);

  useEffect(() => {
    fetchReplicas();
  }, [fetchReplicas]);

  const selectBot = async (replica: Replica) => {
    setCurrentReplica(replica);
    setIsMobileMenuOpen(false);
    
    // Load chat history for the selected replica
    if (user?.id && replica.uuid) {
      console.log('Loading chat history for:', replica.name, replica.uuid);
      await loadChatHistory(replica.uuid, user.id);
    }
  };

  const SidebarContent = () => (
    <>
      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white truncate">
              {user?.email || 'Guest User'}
            </p>
            <p className="text-xs text-gray-400">
              {replicas.length} bot{replicas.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Create Bot Button */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Create New Bot
        </button>
      </div>

      {/* Bots List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Your Bots
        </h3>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : replicas.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No bots yet</p>
            <p className="text-gray-500 text-xs mt-1">Create your first bot to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {replicas.map((replica) => (
              <motion.button
                key={replica.uuid}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectBot(replica)}
                className={`w-full p-3 rounded-lg transition-all text-left ${
                  currentReplica?.uuid === replica.uuid
                    ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {replica.name}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">
                      {replica.shortDescription}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                        {replica.llm.model}
                      </span>
                      {replica.chat_history_count && (
                        <span className="text-xs text-gray-500">
                          {replica.chat_history_count} chats
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button 
          type="button" 
          onClick={() => setIsUserSettingsOpen(true)}
          title="Open user settings"
          className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button 
          type="button"
          onClick={async () => {
            try {
              // Clear local storage
              localStorage.removeItem('sensayUser');
              localStorage.removeItem('userEmail');
              
              // Clear user from store
              setUser(null);
              
              // Sign out from NextAuth
              await signOut({ callbackUrl: '/' });
              
              toast.success('Signed out successfully');
            } catch (error) {
              console.error('Sign out error:', error);
              toast.error('Failed to sign out');
            }
          }}
          className="w-full px-3 py-2 text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 bg-gray-900 border-r border-gray-700 flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: -320 }}
        animate={{ x: isMobileMenuOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="lg:hidden fixed inset-y-0 left-0 w-80 bg-gray-900 border-r border-gray-700 flex flex-col z-40"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <CreateBotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userId={user?.id || ''}
        onBotCreated={fetchReplicas}
      />

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
      />
    </>
  );
}