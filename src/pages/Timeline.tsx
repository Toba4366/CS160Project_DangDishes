import './Timeline.css';

function Timeline() {
  const placeholderEntries = [
    {
      id: 1,
      date: 'Coming Soon',
      dish: 'Your First Recipe',
      icon: '📝',
      description: 'Start cooking and your timeline will populate here!'
    },
    {
      id: 2,
      date: 'Future',
      dish: 'Your Cooking Journey',
      icon: '🚀',
      description: 'Track all your culinary adventures and achievements'
    },
    {
      id: 3,
      date: 'Upcoming',
      dish: 'Favorite Dishes',
      icon: '⭐',
      description: 'Keep track of recipes you love and want to make again'
    }
  ];

  return (
    <div className="timeline">
      <h1>Your Cooking Timeline 📅</h1>
      <p className="timeline-intro">
        Track your cooking journey and see all the amazing dishes you've created!
      </p>

      <div className="timeline-container">
        {placeholderEntries.map((entry) => (
          <div key={entry.id} className="timeline-entry">
            <div className="timeline-marker">
              <div className="timeline-icon">{entry.icon}</div>
            </div>
            <div className="timeline-content">
              <div className="timeline-date">{entry.date}</div>
              <h3>{entry.dish}</h3>
              <p>{entry.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="timeline-empty-state">
        <div className="empty-state-icon">🍽️</div>
        <h2>Your timeline is ready!</h2>
        <p>Start searching for recipes and cooking to build your personal cooking history.</p>
      </div>
    </div>
  );
}

export default Timeline;
