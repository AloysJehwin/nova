import { create } from 'zustand';
import { User, Replica, Message } from '@/types';

interface AppState {
  user: User | null;
  replicas: Replica[];
  currentReplica: Replica | null;
  messages: Message[];
  isLoading: boolean;
  chatHistory: Record<string, Message[]>; // Store chat history per replica UUID
  
  setUser: (user: User | null) => void;
  setReplicas: (replicas: Replica[]) => void;
  setCurrentReplica: (replica: Replica | null) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  loadChatHistory: (replicaUUID: string, userId: string) => Promise<void>;
  setChatHistory: (replicaUUID: string, messages: Message[]) => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  replicas: [],
  currentReplica: null,
  messages: [],
  isLoading: false,
  chatHistory: {},
  
  setUser: (user) => set({ user }),
  setReplicas: (replicas) => set({ replicas }),
  
  setCurrentReplica: (replica) => {
    const state = get();
    
    // Save current messages to chat history if switching replicas
    if (state.currentReplica && state.messages.length > 0) {
      const updatedHistory = {
        ...state.chatHistory,
        [state.currentReplica.uuid]: state.messages
      };
      set({ chatHistory: updatedHistory });
    }
    
    // Load messages for the new replica from history
    const savedMessages = replica ? state.chatHistory[replica.uuid] || [] : [];
    set({ 
      currentReplica: replica, 
      messages: savedMessages 
    });
  },
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  setChatHistory: (replicaUUID, messages) => set((state) => ({
    chatHistory: {
      ...state.chatHistory,
      [replicaUUID]: messages
    }
  })),
  
  loadChatHistory: async (replicaUUID: string, userId: string) => {
    try {
      console.log('🚀 STORE: Loading chat history for replica:', replicaUUID, 'user:', userId);
      const url = `/api/chat/history?replicaUUID=${replicaUUID}&userId=${userId}`;
      console.log('🔗 Fetching URL:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          console.log(`✅ STORE: Loaded ${data.messages.length} messages from history for replica ${replicaUUID}`);
          
          // Update chat history for this replica
          set((state) => ({
            chatHistory: {
              ...state.chatHistory,
              [replicaUUID]: data.messages
            },
            // If this is the current replica, also update current messages
            messages: state.currentReplica?.uuid === replicaUUID ? data.messages : state.messages
          }));
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ STORE: Failed to load chat history:', response.status, errorData);
      }
    } catch (error) {
      console.error('💥 STORE: Error loading chat history:', error);
    }
  },
}));