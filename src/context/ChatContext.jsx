import React, { createContext, useContext, useReducer, useRef } from 'react';
import { findResponse } from '../data/mockChatResponses';
import { streamChat, checkHealth } from '../services/geminiService';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';

const ChatContext = createContext(null);

const initialState = {
  messages: [],
  isStreaming: false,
  orderConfirmOpen: false,
  aiMode: 'auto', // 'live' | 'mock' | 'auto' (auto = try live, fall back to mock)
  backendStatus: null, // null | { status, gemini, newsApi }
  currentSessionId: null,
  sessions: [],
};

function chatReducer(state, action) {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        streamError: false,
        messages: [...state.messages, { id: Date.now(), role: 'user', content: action.payload, timestamp: new Date() }],
      };
    case 'ADD_AI_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, { id: action.id, role: 'ai', content: '', card: null, timestamp: new Date(), streaming: true, isLive: action.isLive }],
        isStreaming: true,
      };
    case 'APPEND_TOKEN':
      return {
        ...state,
        messages: state.messages.map(m => m.id === action.id ? { ...m, content: m.content + action.token } : m),
      };
    case 'SET_CARD':
      return {
        ...state,
        messages: state.messages.map(m => m.id === action.id ? { ...m, card: action.card } : m),
      };
    case 'END_STREAM':
      return {
        ...state,
        messages: state.messages.map(m => m.id === action.id ? { ...m, streaming: false } : m),
        isStreaming: false,
      };
    case 'CLEAR':
      return { ...state, messages: [] };
    case 'OPEN_ORDER_CONFIRM':
      return { ...state, orderConfirmOpen: true };
    case 'CLOSE_ORDER_CONFIRM':
      return { ...state, orderConfirmOpen: false };
    case 'SET_BACKEND_STATUS':
      return { ...state, backendStatus: action.payload };
    case 'LOAD_HISTORY':
      return { ...state, messages: action.payload };
    case 'SET_SESSION':
      return { ...state, currentSessionId: action.payload };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_STREAM_ERROR':
      return { ...state, streamError: action.payload };
    default:
      return state;
  }
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const streamRef = useRef(null);
  const backendChecked = useRef(false);
  const { currentUser } = useAuth();
  
  const stateRef = useRef(state);
  React.useEffect(() => { stateRef.current = state; }, [state]);

  // Check backend health once on mount
  React.useEffect(() => {
    if (backendChecked.current) return;
    backendChecked.current = true;
    checkHealth().then(status => {
      dispatch({ type: 'SET_BACKEND_STATUS', payload: status });
    });
  }, []);

  // Fetch sessions on mount
  React.useEffect(() => {
    if (!currentUser) return;
    if (currentUser.isDemo) {
      const stored = localStorage.getItem('finagent_chat_sessions');
      if (stored) {
        dispatch({ type: 'SET_SESSIONS', payload: JSON.parse(stored) });
      }
      return;
    }

    async function fetchSessions() {
      try {
        const q = query(collection(db, 'investors', currentUser.uid, 'chatSessions'), orderBy('updatedAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        dispatch({ type: 'SET_SESSIONS', payload: sessions });
      } catch (err) {
        console.error('Failed to fetch sessions', err);
      }
    }
    fetchSessions();
  }, [currentUser]);

  async function saveSession() {
    const currentState = stateRef.current;
    if (!currentUser || currentState.messages.length === 0) return;

    let sessionId = currentState.currentSessionId;
    const msgs = currentState.messages;
    const isNew = !sessionId;

    if (!sessionId) {
      sessionId = Date.now().toString();
      dispatch({ type: 'SET_SESSION', payload: sessionId });
    }
    
    const firstUserMsg = msgs.find(m => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '') : 'New Chat';
    
    const sessionData = {
      title,
      updatedAt: new Date().toISOString(),
      messageCount: msgs.length,
      messages: msgs
    };

    if (currentUser.isDemo) {
      let sessions = [...currentState.sessions];
      if (isNew) {
        sessions = [{ id: sessionId, ...sessionData }, ...sessions];
      } else {
        sessions = sessions.map(s => s.id === sessionId ? { id: sessionId, ...sessionData } : s);
      }
      sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
      localStorage.setItem('finagent_chat_sessions', JSON.stringify(sessions));
      return;
    }

    try {
      const docRef = doc(db, 'investors', currentUser.uid, 'chatSessions', sessionId);
      await setDoc(docRef, sessionData, { merge: true });
      
      let sessions = [...currentState.sessions];
      if (isNew) {
        sessions = [{ id: sessionId, ...sessionData }, ...sessions];
      } else {
        sessions = sessions.map(s => s.id === sessionId ? { ...s, ...sessionData } : s);
      }
      sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    } catch (err) {
      console.error('Failed to save session', err);
    }
  }

  async function loadSession(id) {
    const session = stateRef.current.sessions.find(s => s.id === id);
    if (session) {
      dispatch({ type: 'LOAD_HISTORY', payload: session.messages });
      dispatch({ type: 'SET_SESSION', payload: id });
    }
  }

  function newSession() {
    dispatch({ type: 'CLEAR' });
    dispatch({ type: 'SET_SESSION', payload: null });
  }

  async function deleteSession(id) {
    if (currentUser && currentUser.isDemo) {
      const sessions = stateRef.current.sessions.filter(s => s.id !== id);
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
      localStorage.setItem('finagent_chat_sessions', JSON.stringify(sessions));
      if (stateRef.current.currentSessionId === id) {
        newSession();
      }
      return;
    }

    try {
      await deleteDoc(doc(db, 'investors', currentUser?.uid, 'chatSessions', id));
      const sessions = stateRef.current.sessions.filter(s => s.id !== id);
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
      if (stateRef.current.currentSessionId === id) {
        newSession();
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  }

  async function sendMessage(userText, portfolioContext = {}) {
    if (stateRef.current.isStreaming) return;
    dispatch({ type: 'ADD_USER_MESSAGE', payload: userText });

    const msgId = Date.now() + 1;
    const currentState = stateRef.current;
    const backendAvailable = currentState.backendStatus?.status === 'ok' && currentState.backendStatus?.gemini;

    // Try live Gemini first, fall back to mock if backend isn't running
    if (backendAvailable) {
      await sendLiveMessage(userText, msgId, portfolioContext);
    } else {
      await sendMockMessage(userText, msgId);
    }
    
    await saveSession();
  }

  // ── Live Gemini streaming ──
  async function sendLiveMessage(userText, msgId, portfolioContext) {
    dispatch({ type: 'ADD_AI_MESSAGE', id: msgId, isLive: true });

    // Build message history for context
    const history = stateRef.current.messages
      .filter(m => m.role === 'user' || m.role === 'ai')
      .slice(-6) // last 3 exchanges
      .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.content }));

    history.push({ role: 'user', content: userText });

    try {
      await streamChat(
        history,
        portfolioContext,
        (token) => dispatch({ type: 'APPEND_TOKEN', id: msgId, token }),
      );

      // Check if response mentions "order" or "buy" or "sell" → show order confirm
      const fullMsg = stateRef.current.messages.find(m => m.id === msgId)?.content || '';
      if (/\b(order|buy|sell|execute|place)\b/i.test(userText)) {
        await delay(600);
        dispatch({ type: 'OPEN_ORDER_CONFIRM' });
      }

    } catch (err) {
      console.warn('[Live AI failed]', err.message);
      // add an AI message bubble showing error
      dispatch({ type: 'SET_STREAM_ERROR', payload: true });
      dispatch({ 
        type: 'APPEND_TOKEN', 
        id: msgId, 
        token: `I'm having trouble connecting right now. Please try again in a moment.` 
      });
      dispatch({ type: 'SET_CARD', id: msgId, card: { type: 'retry_error', originalText: userText } });
    }

    dispatch({ type: 'END_STREAM', id: msgId });
  }

  // ── Mock streaming (existing behavior) ──
  async function sendMockMessage(userText, msgId) {
    const response = findResponse(userText);
    dispatch({ type: 'ADD_AI_MESSAGE', id: msgId, isLive: false });

    for (const chunk of response.chunks) {
      await delay(80 + Math.random() * 60);
      for (let i = 0; i < chunk.length; i++) {
        await delay(8 + Math.random() * 6);
        dispatch({ type: 'APPEND_TOKEN', id: msgId, token: chunk[i] });
      }
    }

    if (response.card) {
      dispatch({ type: 'SET_CARD', id: msgId, card: response.card });
      await delay(400);
    }

    if (response.trailing_chunks) {
      for (const chunk of response.trailing_chunks) {
        await delay(60 + Math.random() * 40);
        for (let i = 0; i < chunk.length; i++) {
          await delay(7 + Math.random() * 5);
          dispatch({ type: 'APPEND_TOKEN', id: msgId, token: chunk[i] });
        }
      }
    }

    dispatch({ type: 'END_STREAM', id: msgId });
  }

  async function fallbackStream(userText, msgId) {
    const response = findResponse(userText);
    const allChunks = [...(response.chunks || []), ...(response.trailing_chunks || [])];
    for (const chunk of allChunks) {
      for (let i = 0; i < chunk.length; i++) {
        await delay(7 + Math.random() * 5);
        dispatch({ type: 'APPEND_TOKEN', id: msgId, token: chunk[i] });
      }
    }
  }

  return (
    <ChatContext.Provider value={{ 
      state, 
      dispatch, 
      sendMessage,
      sessions: state.sessions,
      currentSessionId: state.currentSessionId,
      loadSession,
      newSession,
      deleteSession
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
