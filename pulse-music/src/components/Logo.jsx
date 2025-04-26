import { Link } from 'react-router-dom';
import '../styles/logo.css';

function Logo({ size = 'medium' }) {
  return (
    <Link to="/" className={`logo logo-${size}`}>
      <div className="logo-icon">
        <div className="pulse-circle"></div>
        <div className="pulse-wave"></div>
      </div>
      <span className="logo-text">Tune-Genie</span>
    </Link>
  );
}

export default Logo; 