import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/playlists.css';

function Playlists() {
  const [playlists, setPlaylists] = useState([
    {
      id: 1,
      name: 'Chill Vibes',
      description: 'Relaxing tunes for your day',
      coverImage: 'https://source.unsplash.com/random/300x300?music',
      songCount: 25,
      duration: '1h 30m'
    },
    {
      id: 2,
      name: 'Workout Mix',
      description: 'High-energy tracks to keep you motivated',
      coverImage: 'https://source.unsplash.com/random/300x300?fitness',
      songCount: 18,
      duration: '1h 15m'
    },
    {
      id: 3,
      name: 'Focus Flow',
      description: 'Instrumental music for deep work',
      coverImage: 'https://source.unsplash.com/random/300x300?study',
      songCount: 32,
      duration: '2h 10m'
    },
    {
      id: 4,
      name: 'Party Time',
      description: 'Upbeat tracks for your next gathering',
      coverImage: 'https://source.unsplash.com/random/300x300?party',
      songCount: 22,
      duration: '1h 45m'
    },
    {
      id: 5,
      name: 'Acoustic Sessions',
      description: 'Unplugged versions of your favorites',
      coverImage: 'https://source.unsplash.com/random/300x300?acoustic',
      songCount: 15,
      duration: '1h 5m'
    },
    {
      id: 6,
      name: 'Indie Discoveries',
      description: 'Hidden gems from independent artists',
      coverImage: 'https://source.unsplash.com/random/300x300?indie',
      songCount: 28,
      duration: '1h 50m'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="playlists-page">
      <div className="playlists-header">
        <h1>Your Playlists</h1>
        <div className="playlists-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="playlists-grid">
        {filteredPlaylists.map(playlist => (
          <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="playlist-card">
            <div className="playlist-cover">
              <img src={playlist.coverImage} alt={playlist.name} />
            </div>
            <div className="playlist-info">
              <h3>{playlist.name}</h3>
              <p className="playlist-description">{playlist.description}</p>
              <div className="playlist-meta">
                <span>{playlist.songCount} songs</span>
                <span>{playlist.duration}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Playlists; 