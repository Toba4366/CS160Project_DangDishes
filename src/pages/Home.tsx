import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Dish It Out! 🍽️</h1>
        <p className="hero-subtitle">
          Your personal cooking assistant for discovering and organizing delicious recipes
        </p>
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Search Recipes</h3>
          <p>Find recipes from thousands of options based on ingredients, cuisine, or dietary preferences</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Track Your Cooking</h3>
          <p>Keep a timeline of all the dishes you've made and plan your next culinary adventure</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⭐</div>
          <h3>Save Favorites</h3>
          <p>Bookmark your favorite recipes and create personalized collections</p>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to get started?</h2>
        <p>Begin your culinary journey today and discover amazing recipes!</p>
      </div>
    </div>
  );
}

export default Home;
