import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🍽️ Dish It Out!
        </Link>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <Link to="/" className="navbar-link">
              Home
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/search" className="navbar-link">
              Search
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/timeline" className="navbar-link">
              Timeline
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
