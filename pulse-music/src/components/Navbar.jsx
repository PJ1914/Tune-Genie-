import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';
import '../styles/navbar.css';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Handle scroll for styling changes
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 30); // Trigger styling after 30px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get initial for fallback (first letter of displayName or email)
  const getInitial = (user) => {
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Logo size="medium" />
        
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <span className={`menu-icon ${isMenuOpen ? 'open' : ''}`}></span>
        </button>
        
        <div className={`nav-content ${isMenuOpen ? 'open' : ''}`}>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/music" className="nav-link">Music</Link>
            <Link to="/playlists" className="nav-link">Playlists</Link>
            <Link to="/chat" className="nav-link">Chat</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </div>
          
          <div className="nav-actions">
            <button className="search-btn">
              <span className="search-icon"></span>
            </button>
            {user ? (
              <div className="user-profile">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-initial">{getInitial(user)}</div>
                )}
                <div className="profile-menu">
                  <span className="user-name">
                    {user.displayName || user.email || 'User'}
                  </span>
                  <button className="logout-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="sign-in-btn">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;