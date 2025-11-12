import './Search.css';

function Search() {
  return (
    <div className="search">
      <h1>Search Recipes 🔍</h1>
      
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search for recipes, ingredients, or cuisines..."
            className="search-input"
          />
          <button className="search-button">Search</button>
        </div>

        <div className="filters">
          <h3>Filter by:</h3>
          <div className="filter-group">
            <button className="filter-btn">All Cuisines</button>
            <button className="filter-btn">Italian</button>
            <button className="filter-btn">Asian</button>
            <button className="filter-btn">Mexican</button>
            <button className="filter-btn">Mediterranean</button>
          </div>
        </div>

        <div className="results-placeholder">
          <div className="placeholder-icon">🍳</div>
          <p>Start searching to discover amazing recipes!</p>
          <p className="placeholder-hint">Try searching for "pasta", "chicken", or "dessert"</p>
        </div>
      </div>
    </div>
  );
}

export default Search;
