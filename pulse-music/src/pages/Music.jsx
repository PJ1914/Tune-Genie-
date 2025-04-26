import { useState, useEffect, forwardRef } from 'react';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/music.css';
import coverImg from '../assets/cover.jpeg'; // Updated import syntax

const Music = forwardRef(({ playerRef }, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [myMusic, setMyMusic] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch user-generated music from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoading(true);
      if (user) {
        fetchMyMusic(user);
      } else {
        setError('Please sign in to view your music.');
        setMyMusic([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchMyMusic = async (user) => {
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions');
      const sessionsQuery = query(sessionsRef);
      const sessionsSnapshot = await getDocs(sessionsQuery);
      console.log('Firestore my music sessions fetched:', sessionsSnapshot.docs.length);

      const musicTracks = [];
      sessionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const messages = data.messages || [];
        messages.forEach((message, index) => {
          if (message.sender === 'ai' && message.text.includes('<audio')) {
            const audioUrls = message.text.match(/src="([^"]+)"/g)?.map((match) => match.replace('src="', '').replace('"', '')) || [];
            audioUrls.forEach((url, urlIndex) => {
              musicTracks.push({
                id: `${doc.id}-${index}-${urlIndex}`,
                title: `Generated Track ${musicTracks.length + 1}`,
                artist: 'AI Composer',
                genre: 'Generated',
                url: url,
                cover: coverImg, // Use imported coverImg
                timestamp: data.timestamp || 0,
              });
            });
          }
        });
      });

      console.log('My Music tracks:', musicTracks);
      setMyMusic(musicTracks.sort((a, b) => b.timestamp - a.timestamp));
      setError('');
    } catch (err) {
      console.error('Fetch my music error:', err.code, err.message);
      if (err.code === 'unavailable') {
        setError('You are offline. Please check your internet connection.');
      } else {
        setError('Failed to load your music: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for music tracks
  const tracks = [
    // ... (unchanged, empty as provided)
  ];

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const filteredMyMusic = myMusic.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handlePlayTrack = (trackId) => {
    const index = myMusic.findIndex((track) => track.id === trackId);
    console.log('handlePlayTrack, trackId:', trackId, 'index:', index);
    if (index >= 0) {
      if (playerRef.current) {
        playerRef.current.playTrack(index);
      } else {
        console.error('playerRef.current is undefined');
        setError('Music player not ready. Please try again.');
      }
    } else {
      console.error('Track not found:', trackId);
      setError('Track not found.');
    }
  };

  return (
    <div className="music-page">
      <div className="music-header">
        <h1>Music Library</h1>
        <div className="music-filters">
          <input
            type="text"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="genre-select"
          >
            <option value="all">All Genres</option>
            <option value="Pop">Pop</option>
            <option value="Rock">Rock</option>
            <option value="Hip Hop">Hip Hop</option>
            <option value="Electronic">Electronic</option>
            <option value="Ambient">Ambient</option>
            <option value="World">World</option>
            <option value="Generated">Generated</option>
          </select>
        </div>
      </div>

      <div className="my-music-section">
        <h2>My Music</h2>
        {isLoading && <p>Loading your music...</p>}
        {error && <p className="error-message">{error}</p>}
        {!isLoading && filteredMyMusic.length > 0 ? (
          <div className="music-grid">
            {filteredMyMusic.map((track) => (
              <div key={track.id} className="music-card">
                <img src={track.cover} alt={track.title} className="music-cover" />
                <div className="music-info">
                  <h3 className="music-title">{track.title}</h3>
                  <p className="music-artist">{track.artist}</p>
                  <p className="music-genre">{track.genre}</p>
                  <div className="music-actions">
                    <button className="action-button" onClick={() => handlePlayTrack(track.id)}>
                      Play
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && <p>No generated music yet. Create some in the chat!</p>
        )}
      </div>

      <div className="general-music-section">
        <h2>Explore Music</h2>
        {filteredTracks.length > 0 ? (
          <div className="music-grid">
            {filteredTracks.map((track) => (
              <div key={track.id} className="music-card">
                <img src={track.coverImage} alt={track.title} className="music-cover" />
                <div className="music-info">
                  <h3 className="music-title">{track.title}</h3>
                  <p className="music-artist">{track.artist}</p>
                  <p className="music-genre">{track.genre}</p>
                  <div className="music-actions">
                    <button className="action-button">Play</button>
                    <button className="action-button">Add to Playlist</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No tracks available. Try adjusting your filters.</p>
        )}
      </div>
    </div>
  );
});

export default Music;