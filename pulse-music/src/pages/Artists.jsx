import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/artists.css';

function Artists() {
  const [artists, setArtists] = useState([
    {
      id: 1,
      name: "DJ Cool",
      genre: "Electronic",
      followers: "1.2M",
      image: "https://source.unsplash.com/random/300x300?artist=1",
      topTracks: ["Summer Vibes", "Night Groove", "Electric Dreams"]
    },
    {
      id: 2,
      name: "Luna",
      genre: "Pop",
      followers: "850K",
      image: "https://source.unsplash.com/random/300x300?artist=2",
      topTracks: ["Midnight Dreams", "Starlight", "Moonlit Path"]
    },
    {
      id: 3,
      name: "The Groove",
      genre: "Hip Hop",
      followers: "2.1M",
      image: "https://source.unsplash.com/random/300x300?artist=3",
      topTracks: ["Urban Beats", "City Lights", "Street Flow"]
    },
    {
      id: 4,
      name: "Nomad",
      genre: "World",
      followers: "650K",
      image: "https://source.unsplash.com/random/300x300?artist=4",
      topTracks: ["Desert Wind", "Caravan", "Oasis"]
    },
    {
      id: 5,
      name: "Aqua",
      genre: "Ambient",
      followers: "450K",
      image: "https://source.unsplash.com/random/300x300?artist=5",
      topTracks: ["Ocean Waves", "Deep Blue", "Tidal Flow"]
    },
    {
      id: 6,
      name: "Summit",
      genre: "Rock",
      followers: "1.5M",
      image: "https://source.unsplash.com/random/300x300?artist=6",
      topTracks: ["Mountain Echo", "Peak View", "Cliff Edge"]
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  const filteredArtists = artists.filter(artist => {
    const matchesSearch = artist.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || artist.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="artists-page">
      <div className="artists-header">
        <h1>Featured Artists</h1>
        <div className="artists-filters">
          <input
            type="text"
            placeholder="Search artists..."
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
          </select>
        </div>
      </div>

      <div className="artists-grid">
        {filteredArtists.map(artist => (
          <Link to={`/artist/${artist.id}`} key={artist.id} className="artist-card">
            <div className="artist-image">
              <img src={artist.image} alt={artist.name} />
            </div>
            <div className="artist-info">
              <h3>{artist.name}</h3>
              <p className="artist-genre">{artist.genre}</p>
              <p className="artist-followers">{artist.followers} followers</p>
              <div className="top-tracks">
                <h4>Top Tracks</h4>
                <ul>
                  {artist.topTracks.map((track, index) => (
                    <li key={index}>{track}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Artists; 