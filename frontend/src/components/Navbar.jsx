import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data);
        } catch (e) {
          console.error("Failed fetching notifications");
        }
      };
      fetchNotifs();
      // Polling for MVP real-time effect
      const interval = setInterval(fetchNotifs, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="var(--primary-dark)">
            <path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        FoodShare
      </Link>
      <div className="nav-links" style={{position: 'relative'}}>
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-primary" style={{padding: '0.4rem 1rem'}}>Admin Panel</Link>
            )}
            <Link to="/dashboard" className="btn btn-outline" style={{padding: '0.4rem 1rem'}}>Dashboard</Link>
            {user.role === 'donor' && (
              <Link to="/donate" className="btn btn-primary" style={{padding: '0.4rem 1rem'}}>+ Donate</Link>
            )}
            
            <div style={{position: 'relative', cursor: 'pointer'}} onClick={() => setShowDropdown(!showDropdown)}>
              <span style={{fontSize: '1.25rem'}}>🔔</span>
              {unreadCount > 0 && (
                <span style={{position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold'}}>
                  {unreadCount}
                </span>
              )}
              {showDropdown && (
                <div style={{position: 'absolute', right: 0, top: '40px', width: '300px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 1000}}>
                  <div style={{padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 'bold'}}>Notifications</div>
                  <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                    {notifications.length === 0 ? (
                      <div style={{padding: '1rem', textAlign: 'center', color: 'var(--text-light)'}}>No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{padding: '1rem', borderBottom: '1px solid var(--border)', background: n.is_read ? 'white' : '#f0fdf4'}}>
                          <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{n.title}</div>
                          <div style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>{n.message}</div>
                          <div style={{fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px'}}>{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span style={{marginLeft: '1rem', color: 'var(--text-light)'}}>Hi, {user.username}</span>
            <button onClick={handleLogout} className="btn btn-outline" style={{padding: '0.4rem 1rem', border: 'none'}}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline" style={{padding: '0.4rem 1rem'}}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{padding: '0.4rem 1rem'}}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
