import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { MdPlayArrow, MdPause, MdShuffle, MdSkipPrevious, MdSkipNext, MdRepeat, MdRepeatOne, MdVolumeUp, MdVolumeDown, MdVolumeOff } from 'react-icons/md';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles/musicPlayer.css';

const MusicPlayer = forwardRef((props, ref) => {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none');
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [shuffleHistory, setShuffleHistory] = useState([]);
  const [shuffleIndex, setShuffleIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const playbackStateRef = useRef({ isPlaying: false, currentTime: 0 });
  const visibilityTimeoutRef = useRef(null);

  // Fetch user-generated tracks from Firestore
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isMounted) return;
      setIsLoading(true);
      if (user) {
        fetchPlaylist(user);
      } else {
        setError('Please sign in to access your music.');
        setPlaylist([]);
        setCurrentTrackIndex(-1);
        setShuffleHistory([]);
        setShuffleIndex(-1);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const fetchPlaylist = async (user) => {
    try {
      const sessionsRef = collection(db, 'users', user.uid, 'sessions');
      const sessionsQuery = query(sessionsRef);
      const sessionsSnapshot = await getDocs(sessionsQuery);
      console.log('Firestore playlist sessions fetched:', sessionsSnapshot.docs.length);

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
                cover: 'https://source.unsplash.com/random/300x300?music=generated', // Fixed cover to use dynamic Unsplash URL for neon music theme
                timestamp: data.timestamp || 0,
              });
            });
          }
        });
      });

      console.log('Playlist tracks:', musicTracks);
      setPlaylist(musicTracks.sort((a, b) => b.timestamp - a.timestamp));
      setError(null);
    } catch (err) {
      console.error('Fetch playlist error:', err.code, err.message);
      setError('Failed to load playlist: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose playTrack function
  useImperativeHandle(ref, () => ({
    playTrack: async (index) => {
      console.log('playTrack called with index:', index);
      if (index < 0 || index >= playlist.length || !audioRef.current) {
        setError('Invalid track or audio not ready.');
        return;
      }

      const newTrack = playlist[index];
      if (audioRef.current.src === newTrack.url && !audioRef.current.ended && !audioRef.current.paused) {
        // Track is already playing
        return;
      }

      setCurrentTrackIndex(index);
      setIsPlaying(true);
      playbackStateRef.current.isPlaying = true;
      playbackStateRef.current.currentTime = 0;

      // Load and play new track
      audioRef.current.src = newTrack.url;
      audioRef.current.load();

      try {
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            audioRef.current.oncanplay = null;
            audioRef.current.onerror = null;
            resolve();
          };
          const onError = () => {
            audioRef.current.oncanplay = null;
            audioRef.current.onerror = null;
            reject(new Error('Failed to load audio.'));
          };
          audioRef.current.oncanplay = onCanPlay;
          audioRef.current.onerror = onError;
          setTimeout(() => {
            audioRef.current.oncanplay = null;
            audioRef.current.onerror = null;
            reject(new Error('Audio load timeout.'));
          }, 5000);
        });
        audioRef.current.play().catch((err) => {
          console.error('Play error:', err.message);
          setError('Failed to play track: ' + err.message);
        });
        setError(null); // Clear error on success
      } catch (err) {
        console.error('Load error:', err.message);
        setError('Failed to load track: ' + err.message);
      }
    },
  }));

  // Handle visibility with debounce
  useEffect(() => {
    if (visibilityTimeoutRef.current) {
      clearTimeout(visibilityTimeoutRef.current);
    }
    visibilityTimeoutRef.current = setTimeout(() => {
      setVisible(location.pathname !== '/chat');
    }, 100);

    return () => {
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, [location]);

  // Audio event listeners
  useEffect(() => {
    if (!visible || !audioRef.current || currentTrackIndex < 0 || !playlist[currentTrackIndex]) return;

    const audio = audioRef.current;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      console.log('Audio ended, repeatMode:', repeatMode);
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch((err) => setError('Playback failed: ' + err.message));
      } else {
        skipNext();
      }
    };
    const handleError = (e) => {
      console.error('Audio error:', e);
      setError('Failed to load audio track. Check if the audio URL is valid.');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [visible, currentTrackIndex, playlist, volume, isMuted, repeatMode]);

  const togglePlay = () => {
    if (!audioRef.current || currentTrackIndex < 0) return;
    if (isPlaying) {
      audioRef.current.pause();
      console.log('Paused audio');
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Toggle play error:', err.message);
        setError('Playback failed: ' + err.message);
      });
      console.log('Playing audio, src:', audioRef.current.src);
    }
    setIsPlaying(!isPlaying);
    playbackStateRef.current.isPlaying = !isPlaying;
  };

  const handleProgressClick = (e) => {
    if (!progressBarRef.current || !audioRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, clickPosition * duration));
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
    playbackStateRef.current.currentTime = newTime;
  };

  const handleVolumeDrag = (e, isTouch = false) => {
    if (!volumeBarRef.current || !audioRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clickPosition = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newVolume = clickPosition;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    audioRef.current.volume = newVolume;
  };

  const handleVolumeMouseDown = (e) => {
    handleVolumeDrag(e);
    const onMouseMove = (moveEvent) => handleVolumeDrag(moveEvent);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleVolumeTouchStart = (e) => {
    handleVolumeDrag(e, true);
    const onTouchMove = (moveEvent) => handleVolumeDrag(moveEvent, true);
    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    setIsMuted(!isMuted);
    audioRef.current.volume = isMuted ? volume : 0;
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    if (!isShuffle) {
      setShuffleHistory([currentTrackIndex]);
      setShuffleIndex(0);
    } else {
      setShuffleHistory([]);
      setShuffleIndex(-1);
    }
  };

  const toggleRepeat = () => {
    const modes = ['none', 'one', 'all'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
    if (audioRef.current) {
      audioRef.current.loop = nextMode === 'one';
    }
  };

  const skipPrevious = async () => {
    if (!playlist.length || currentTrackIndex < 0) return;
    let newIndex;
    if (isShuffle && shuffleIndex > 0) {
      newIndex = shuffleHistory[shuffleIndex - 1];
      setShuffleIndex(shuffleIndex - 1);
    } else if (isShuffle) {
      newIndex = Math.floor(Math.random() * playlist.length);
      setShuffleHistory([...shuffleHistory.slice(0, shuffleIndex + 1), newIndex]);
      setShuffleIndex(shuffleIndex + 1);
    } else {
      newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1;
    }
    console.log('Skipping to previous, newIndex:', newIndex);
    setCurrentTrackIndex(newIndex);
    await ref.current.playTrack(newIndex);
  };

  const skipNext = async () => {
    if (!playlist.length || currentTrackIndex < 0) return;
    let newIndex;
    if (isShuffle && shuffleIndex < shuffleHistory.length - 1) {
      newIndex = shuffleHistory[shuffleIndex + 1];
      setShuffleIndex(shuffleIndex + 1);
    } else if (isShuffle) {
      newIndex = Math.floor(Math.random() * playlist.length);
      setShuffleHistory([...shuffleHistory.slice(0, shuffleIndex + 1), newIndex]);
      setShuffleIndex(shuffleIndex + 1);
    } else if (repeatMode === 'all' && currentTrackIndex === playlist.length - 1) {
      newIndex = 0;
    } else {
      newIndex = currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0;
    }
    console.log('Skipping to next, newIndex:', newIndex);
    setCurrentTrackIndex(newIndex);
    await ref.current.playTrack(newIndex);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTrack = playlist[currentTrackIndex] || null;

  if (!visible) return null;

  return (
    <div className="music-player slide-up">
      {(error || isLoading) && (
        <div className={error ? 'error-message' : 'loading-message'}>
          {error || 'Loading your music...'}
        </div>
      )}
      <audio ref={audioRef} />
      <div className="player-container">
        <div className="track-info">
          <img
            src={currentTrack?.cover || 'https://source.unsplash.com/random/56x56?neon,music'} // Updated fallback to neon music-themed image
            alt={`${currentTrack?.title || 'No Track'} cover`}
            className="track-cover"
            onError={(e) => { e.target.src = 'https://source.unsplash.com/random/56x56?neon,music'; }} // Added onError to ensure fallback image loads
          />
          <div className="track-details">
            <Link to={`/track/${currentTrack?.id || ''}`} className="track-title">
              {currentTrack?.title || 'No Track Selected'}
            </Link>
            <Link to={`/artist/${currentTrack?.artist || ''}`} className="track-artist">
              {currentTrack?.artist || 'Unknown Artist'}
            </Link>
          </div>
        </div>

        <div className="player-controls">
          <div className="control-buttons">
            <button
              className={`control-button ${isShuffle ? 'active' : ''}`}
              onClick={toggleShuffle}
              aria-label="Toggle shuffle"
              tabIndex={0}
              disabled={isLoading}
            >
              <MdShuffle size={20} />
            </button>
            <button
              className="control-button"
              onClick={skipPrevious}
              aria-label="Previous track"
              tabIndex={0}
              disabled={isLoading || !currentTrack}
            >
              <MdSkipPrevious size={24} />
            </button>
            <button
              className="play-button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              tabIndex={0}
              disabled={isLoading || !currentTrack}
            >
              {isPlaying ? <MdPause size={24} /> : <MdPlayArrow size={24} />}
            </button>
            <button
              className="control-button"
              onClick={skipNext}
              aria-label="Next track"
              tabIndex={0}
              disabled={isLoading || !currentTrack}
            >
              <MdSkipNext size={24} />
            </button>
            <button
              className={`control-button ${repeatMode !== 'none' ? 'active' : ''}`}
              onClick={toggleRepeat}
              aria-label={`Repeat mode: ${repeatMode}`}
              tabIndex={0}
              disabled={isLoading}
            >
              {repeatMode === 'one' ? <MdRepeatOne size={20} /> : <MdRepeat size={20} />}
            </button>
          </div>
          <div className="progress-container">
            <span className="time">{formatTime(currentTime)}</span>
            <div
              className="progress-bar"
              ref={progressBarRef}
              onClick={handleProgressClick}
              role="slider"
              aria-label="Seek track"
            >
              <div className="progress" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
            </div>
            <span className="time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume-control">
          <button
            className="volume-button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            tabIndex={0}
            disabled={isLoading}
          >
            {isMuted ? <MdVolumeOff size={20} /> : volume > 0.5 ? <MdVolumeUp size={20} /> : <MdVolumeDown size={20} />}
          </button>
          <div
            className="volume-bar"
            ref={volumeBarRef}
            onClick={handleVolumeDrag}
            onMouseDown={handleVolumeMouseDown}
            onTouchStart={handleVolumeTouchStart}
            role="slider"
            aria-label="Adjust volume"
          >
            <div className="volume-progress" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default MusicPlayer;