import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🍽️ Dish It Out!
        </Link>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link 
              to="/" 
              className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>
          <li className="navbar-item">
            <Link 
              to="/recipe-search" 
              className={`navbar-link ${location.pathname === '/recipe-search' ? 'active' : ''}`}
            >
              Search
            </Link>
          </li>
          <li className="navbar-item">
            <Link 
              to="/history" 
              className={`navbar-link ${location.pathname === '/history' ? 'active' : ''}`}
            >
              History
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
