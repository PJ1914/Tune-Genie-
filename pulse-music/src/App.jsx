import { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Music from './pages/Music';
import Playlists from './pages/Playlists';
import Artists from './pages/Artists';
import About from './pages/About';
import Contact from './pages/Contact';
import MusicPlayer from './components/MusicPlayer';
import ChatUI from './components/ChatUI';
import Login from './pages/Login';
import './styles/global.css';
import './config/firebase';

function App() {
  const musicPlayerRef = useRef(null);

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/music" element={<Music playerRef={musicPlayerRef} />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/chat" element={<ChatUI />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
        <MusicPlayer ref={musicPlayerRef} />
      </div>
    </Router>
  );
}

export default App;