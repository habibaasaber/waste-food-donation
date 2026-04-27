import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';

// Fix for default leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

function CreateDonation({ user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    quantity: '', 
    location: '',
    expiry_date: '',
    is_safe: false
  });
  const [position, setPosition] = useState(null); // {lat, lng}
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.is_safe) {
      setError("You must guarantee the food meets safety standards.");
      return;
    }
    if (!position) {
      setError("Please pin the pickup location on the map.");
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('quantity', formData.quantity);
      data.append('location', formData.location);
      data.append('latitude', position.lat);
      data.append('longitude', position.lng);
      
      // format date to ISO
      if (formData.expiry_date) {
        data.append('expiry_date', new Date(formData.expiry_date).toISOString());
      }
      data.append('is_safe', formData.is_safe);

      if (image) {
        data.append('image', image);
      }
      
      await api.post('/donations', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred while creating donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{paddingTop: '2rem', maxWidth: '800px', paddingBottom: '4rem'}}>
      <div className="glass-panel" style={{padding: '2.5rem', background: 'var(--surface)'}}>
        <h1 style={{fontSize: '2rem', fontWeight: '700', marginBottom: '2rem'}}>List a Food Donation</h1>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 5 Boxes of Margherita Pizza"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea 
              className="form-textarea" 
              rows="3"
              placeholder="Any details about the food, condition, heating instructions, etc."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>
          
          <div style={{display: 'flex', gap: '1.5rem', flexWrap: 'wrap'}}>
            <div className="form-group" style={{flex: '1 1 200px'}}>
              <label className="form-label">Quantity</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. 10 kg, 20 servings"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>
            <div className="form-group" style={{flex: '1 1 200px'}}>
              <label className="form-label">Expiry Date</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">General Location Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Downtown 5th Ave (Hide exact numbers for safety)"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Pin Pickup Location</label>
            <div style={{height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)'}}>
              <MapContainer center={[30.0444, 31.2357]} zoom={12} style={{height: '100%', width: '100%'}}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            <small style={{color: 'var(--text-light)'}}>Click on the map to drop a pin.</small>
          </div>

          <div className="form-group">
            <label className="form-label">Upload Image (Optional)</label>
            <input 
              type="file" 
              className="form-input" 
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </div>

          <div className="form-group" style={{display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: '#fef2f2', padding: '1rem', borderLeft: '4px solid #ef4444', borderRadius: '4px'}}>
            <input 
              type="checkbox" 
              id="safetyCheckbox" 
              checked={formData.is_safe}
              onChange={(e) => setFormData({...formData, is_safe: e.target.checked})}
              style={{marginTop: '0.25rem', transform: 'scale(1.2)'}}
            />
            <label htmlFor="safetyCheckbox" style={{fontWeight: '500', color: '#7f1d1d', cursor: 'pointer'}}>
              I declare that this food complies with national and local food safety laws and is safe for human consumption.
            </label>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{marginTop: '1rem'}} disabled={loading}>
            {loading ? 'Publishing...' : 'Publish Donation'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateDonation;
