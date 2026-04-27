import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <div className="hero-section">
        <h1 className="hero-title">Share Food, Share Hope</h1>
        <p className="hero-subtitle">
          Connect excess food with those who need it most. Join our community of donors and receivers to reduce waste and fight hunger.
        </p>
        <div style={{display: 'flex', justifyContent: 'center', gap: '1rem'}}>
          <Link to="/register" className="btn btn-primary" style={{fontSize: '1.125rem'}}>Get Started</Link>
          <Link to="/login" className="btn btn-outline" style={{fontSize: '1.125rem', backgroundColor: 'white'}}>Login to your account</Link>
        </div>
      </div>
      
      <div className="grid-cards" style={{marginTop: '4rem'}}>
        <div className="card" style={{padding: '2rem', textAlign: 'center'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🤝</div>
          <h3 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>For Donors</h3>
          <p style={{color: 'var(--text-light)'}}>Have excess food from an event or restaurant? List it here and help someone in need.</p>
        </div>
        <div className="card" style={{padding: '2rem', textAlign: 'center'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🍽️</div>
          <h3 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>For Receivers</h3>
          <p style={{color: 'var(--text-light)'}}>Find available food donations in your area and request to pick them up easily.</p>
        </div>
        <div className="card" style={{padding: '2rem', textAlign: 'center'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🌍</div>
          <h3 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>For The Planet</h3>
          <p style={{color: 'var(--text-light)'}}>Reducing food waste helps lower greenhouse gas emissions and protects our environment.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
