import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <h1>Dish It Out!</h1>
      
      <div className="button-container">
        <button 
          className="main-button"
          onClick={() => navigate('/generate-timeline')}
        >
          Enter New Recipe
        </button>

        <button 
          className="main-button"
          onClick={() => navigate('/recipe-search')}
        >
          Search Recipes
        </button>

        <button 
          className="main-button"
          onClick={() => navigate('/history')}
        >
          View History
        </button>
      </div>
    </div>
  );
}

export default Home;
