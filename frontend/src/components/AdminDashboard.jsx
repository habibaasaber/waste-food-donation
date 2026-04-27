import { useState, useEffect } from 'react';
import api from '../api';

function AdminDashboard({ user }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/donations');
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDonations();
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete this listing representing a clear violation?")) return;
    try {
      await api.delete(`/admin/donations/${id}`);
      fetchDonations();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error deleting donation');
    }
  };

  if (user?.role !== 'admin') {
    return <div style={{textAlign: 'center', padding: '4rem'}}>Unauthorized. Admin access only.</div>;
  }

  return (
    <div className="container" style={{paddingTop: '2rem'}}>
      <h1 style={{fontSize: '2rem', fontWeight: '700', marginBottom: '1rem'}}>Admin Control Panel</h1>
      <p style={{color: 'var(--text-light)', marginBottom: '2rem'}}>Monitor compliance and remove violations.</p>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)'}}>
          <thead style={{background: '#f8fafc', borderBottom: '1px solid var(--border)'}}>
            <tr>
              <th style={{padding: '1rem'}}>ID</th>
              <th style={{padding: '1rem'}}>Title</th>
              <th style={{padding: '1rem'}}>Donor</th>
              <th style={{padding: '1rem'}}>Status</th>
              <th style={{padding: '1rem'}}>Safe Tag</th>
              <th style={{padding: '1rem'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {donations.map(d => (
              <tr key={d.id} style={{borderBottom: '1px solid var(--border)'}}>
                <td style={{padding: '1rem'}}>{d.id}</td>
                <td style={{padding: '1rem'}}>{d.title}</td>
                <td style={{padding: '1rem'}}>{d.donor.username}</td>
                <td style={{padding: '1rem'}}><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                <td style={{padding: '1rem'}}>{d.is_safe ? '✅ Yes' : '❌ No'}</td>
                <td style={{padding: '1rem'}}>
                  <button 
                    onClick={() => handleDelete(d.id)}
                    style={{padding: '0.25rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
                    Remove Violation
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;
