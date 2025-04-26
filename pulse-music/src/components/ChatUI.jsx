import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/chatUI.css';



function ChatUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const lastScrollY = useRef(window.scrollY);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    document.body.classList.add('chat-route');
    if (isNavbarHidden) {
      document.body.classList.add('navbar-hidden');
    } else {
      document.body.classList.remove('navbar-hidden');
    }
    return () => {
      document.body.classList.remove('chat-route', 'navbar-hidden');
    };
  }, [isNavbarHidden]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current && isNavbarHidden) {
        setIsNavbarHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isNavbarHidden]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(true);
      if (user) {
        fetchChatHistory(user);
      } else {
        setError('Please sign in to view chat history.');
        setChatHistory([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchChatHistory = async (user) => {
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions');
      const sessionsQuery = query(sessionsRef);
      const sessionsSnapshot = await getDocs(sessionsQuery);
      console.log('Firestore sessions fetched:', sessionsSnapshot.docs.length);
      const history = sessionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          sessionId: doc.id,
          timestamp: data.timestamp || 0,
          firstMessage: data.messages?.[0]?.text?.slice(0, 30) || 'No messages',
        };
      });
      setChatHistory(history.sort((a, b) => b.timestamp - a.timestamp));
      setError('');
    } catch (err) {
      console.error('Fetch chat history error:', err.code, err.message);
      setError('Failed to load chat history: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId('');
    setIsTyping(false);
    setIsNavbarHidden(false);
    setError('');
  };

  const handleLoadChat = async (sessionId) => {
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to view chat history.');
      return;
    }

    try {
      const sessionDocRef = doc(db, 'users', user.uid, 'sessions', sessionId);
      const sessionDoc = await getDoc(sessionDocRef);
      if (!sessionDoc.exists()) {
        setError('Chat session not found.');
        return;
      }

      const sessionData = sessionDoc.data();
      console.log('Loaded session:', sessionData);
      setMessages(sessionData.messages || []);
      setSessionId(sessionId);
      setError('');
    } catch (err) {
      console.error('Load chat error:', err.code, err.message);
      setError('Failed to load chat: ' + err.message);
    }
  };

  const handleDeleteChat = async (sessionId) => {
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to delete chat history.');
      return;
    }

    try {
      const sessionDocRef = doc(db, 'users', user.uid, 'sessions', sessionId);
      await deleteDoc(sessionDocRef);
      console.log('Deleted session:', sessionId);
      setChatHistory((prev) => prev.filter((item) => item.sessionId !== sessionId));
      if (sessionId === sessionId) {
        setMessages([]);
        setSessionId('');
      }
      setError('');
    } catch (err) {
      console.error('Delete chat error:', err.code, err.message);
      setError('Failed to delete chat: ' + err.message);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to send messages.');
      return;
    }

    const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setIsNavbarHidden(true);
    setSessionId(currentSessionId);

    try {
      await setDoc(doc(db, 'users', user.uid, 'sessions', currentSessionId), {
        messages: updatedMessages,
        timestamp: Date.now(),
      });
      console.log('Saved session:', currentSessionId);
    } catch (err) {
      console.error('Save chat error:', err.code, err.message);
      setError('Failed to save chat: ' + err.message);
    }

    try {
      const response = await axios.post('http://localhost:8000/api/generate/', {
        scene: input,
        session_id: currentSessionId,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;
      let aiText = '';
      if (data.explanation) {
        aiText += `${data.explanation}\n`;
      }
      if (data.audio_urls && data.audio_urls.length > 0) {
        aiText += '🎧 Audio Outputs:\n';
        data.audio_urls.forEach((url, index) => {
          aiText += `Audio ${index + 1}:<br> <audio controls><source src="http://localhost:8000${url}" type="audio/wav"></audio>\n`;
        });
      }
      if (data.raw_response) {
        aiText += `${data.raw_response}`;
      }

      const aiMessage = {
        text: aiText,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);

      await setDoc(doc(db, 'users', user.uid, 'sessions', currentSessionId), {
        messages: newMessages,
        timestamp: Date.now(),
      });

      setChatHistory((prev) => {
        const updatedHistory = prev.filter((item) => item.sessionId !== currentSessionId);
        return [
          {
            sessionId: currentSessionId,
            timestamp: Date.now(),
            firstMessage: userMessage.text.slice(0, 30),
          },
          ...updatedHistory,
        ].sort((a, b) => b.timestamp - a.timestamp);
      });
    } catch (error) {
      console.error('API error:', error);
      const errorMessage = {
        text: `❌ Error: ${error.response?.data?.error || error.message}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const newMessages = [...updatedMessages, errorMessage];
      setMessages(newMessages);

      await setDoc(doc(db, 'users', user.uid, 'sessions', currentSessionId), {
        messages: newMessages,
        timestamp: Date.now(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-container">
      <aside className="chat-sidebar glass">
        <h2>🎵 Music Chat</h2>
        <p>Talk to your AI Composer</p>
        <button className="new-chat-button" onClick={handleNewChat}>
          New Chat
        </button>
        <Link to="/" className="home-link">Back to Home</Link>
        <div className="chat-history">
          <h3>Chat History</h3>
          {isLoading && <p>Loading chat history...</p>}
          {error && <p className="error-message">{error}</p>}
          {!isLoading && chatHistory.length > 0 ? (
            <ul>
              {chatHistory.map((session) => (
                <li key={session.sessionId} className="history-item">
                  <span
                    className="history-text"
                    onClick={() => handleLoadChat(session.sessionId)}
                  >
                    {session.firstMessage} ({new Date(session.timestamp).toLocaleDateString()})
                  </span>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteChat(session.sessionId)}
                    title="Delete chat"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && <p>No chat history yet.</p>
          )}
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.sender === 'user' ? 'user' : 'ai'} glass`}
            >
              <div
                className="message-content"
                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }}
              />
              <span className="message-timestamp">{msg.timestamp}</span>
            </div>
          ))}
          {isTyping && (
            <div className="message ai glass typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area glass">
          <input
            type="text"
            className="chat-input"
            placeholder="Describe your mood, genre, or vibe..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-button" onClick={handleSend} disabled={!input.trim()}>
            Send
          </button>
        </div>
      </section>
    </div>
  );
}

export default ChatUI;