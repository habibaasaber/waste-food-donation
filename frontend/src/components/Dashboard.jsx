import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Dashboard({ user }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal] = useState({ open: false, donationId: null, rating: 5, comment: '' });

  const fetchDonations = async () => {
    try {
      setLoading(true);
      let query = `/donations?search=${search}&status=${statusFilter}`;
      const res = await api.get(query);
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [search, statusFilter]);

  const handleRequest = async (id) => {
    if (!window.confirm("Are you sure you want to request this donation?")) return;
    try {
      await api.post(`/donations/${id}/request`);
      fetchDonations(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.msg || 'Error requesting donation');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.post(`/donations/${id}/complete`);
      fetchDonations(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.msg || 'Error completing donation');
    }
  };

  const submitReview = async () => {
    try {
      await api.post(`/donations/${reviewModal.donationId}/rate`, {
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      alert('Review submitted! Thank you.');
      setReviewModal({ open: false, donationId: null, rating: 5, comment: '' });
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to submit review');
    }
  };

  return (
    <div className="container" style={{paddingTop: '2rem'}}>
      <div className="page-header">
        <div>
          <h1 style={{fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem'}}>Donations Feed</h1>
          <p style={{color: 'var(--text-light)'}}>Discover available food donations or check your contributions.</p>
        </div>
        {user.role === 'donor' && (
          <Link to="/donate" className="btn btn-primary">+ Add Donation</Link>
        )}
      </div>

      <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
        <input 
          type="text" 
          placeholder="Search by title or description..." 
          className="form-input" 
          style={{flex: 1}}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="form-select" 
          style={{width: '200px'}}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="requested">Requested</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div style={{textAlign: 'center', padding: '4rem', color: 'var(--text-light)'}}>Loading...</div>
      ) : donations.length === 0 ? (
        <div style={{textAlign: 'center', padding: '4rem', color: 'var(--text-light)', background: 'var(--surface)', borderRadius: '12px'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🍽️</div>
          <h3>No donations found</h3>
          <p>Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {donations.map((d) => (
            <div key={d.id} className="card">
              <div className="card-img-wrapper">
                {d.image_url ? (
                  <img src={d.image_url} alt={d.title} className="card-img" />
                ) : (
                  <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#cbd5e1'}}>🍔</div>
                )}
              </div>
              <div className="card-content">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <h3 className="card-title">{d.title}</h3>
                  <span className={`badge badge-${d.status}`}>{d.status}</span>
                </div>
                <div className="card-meta">
                  <span>📍 {d.location} 
                    {d.latitude && d.longitude && ` (Lat: ${d.latitude.toFixed(2)}, Lng: ${d.longitude.toFixed(2)})`}
                  </span>
                  {d.expiry_date && <span>⏳ Expires: {new Date(d.expiry_date).toLocaleString()}</span>}
                  <span>📦 Qty: {d.quantity}</span>
                  <span>👤 Donor: {d.donor.username}</span>
                  {d.is_safe && <span style={{color: '#166534', fontWeight: 'bold'}}>🛡️ Food Safety Verified</span>}
                </div>
                <p className="card-desc">{d.description}</p>
                
                <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem', flexDirection: 'column'}}>
                  {user.role === 'receiver' && d.status === 'available' && (
                    <button className="btn btn-primary" onClick={() => handleRequest(d.id)}>
                      Request Food
                    </button>
                  )}
                  {user.role === 'receiver' && d.status === 'requested' && (
                    <button className="btn btn-outline" disabled>
                      Requested by You/Others
                    </button>
                  )}
                  {user.role === 'donor' && user.username === d.donor.username && d.status === 'requested' && (
                    <button className="btn btn-primary" onClick={() => handleComplete(d.id)}>
                      Mark as Completed
                    </button>
                  )}
                  {user.role === 'receiver' && d.status === 'completed' && (
                    <button className="btn btn-outline" onClick={() => setReviewModal({...reviewModal, open: true, donationId: d.id})}>
                      Leave a Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewModal.open && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}}>
          <div className="glass-panel" style={{padding: '2rem', width: '100%', maxWidth: '400px', background: 'white'}}>
            <h2 style={{marginBottom: '1rem'}}>Rate your experience</h2>
            <div className="form-group">
              <label className="form-label">Rating (1-5)</label>
              <input type="number" min="1" max="5" className="form-input" value={reviewModal.rating} onChange={e => setReviewModal({...reviewModal, rating: parseInt(e.target.value)})} />
            </div>
            <div className="form-group">
              <label className="form-label">Comments</label>
              <textarea className="form-textarea" rows="3" value={reviewModal.comment} onChange={e => setReviewModal({...reviewModal, comment: e.target.value})}></textarea>
            </div>
            <div style={{display: 'flex', gap: '1rem'}}>
              <button className="btn btn-primary" style={{flex: 1}} onClick={submitReview}>Submit</button>
              <button className="btn btn-outline" style={{flex: 1}} onClick={() => setReviewModal({...reviewModal, open: false})}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
