import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

const SpocSettings: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/spoc/settings');
        setName(res.data.spoc_name);
        setPhone(res.data.phone || '');
        setCollege(res.data.college);
      } catch (err) {
        showToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/spoc/settings', {
        full_name: name.trim(),
        phone: phone.trim()
      });
      showToast('Profile configuration updated!', 'success');
    } catch (err) {
      showToast('Failed to update settings', 'error');
    }
  };

  if (loading) return <div>Retrieving profile settings...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Account Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Configure your SPOC name and contact details.
        </p>
      </div>

      <div className="card" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Associated Institution</label>
            <input type="text" className="form-control" value={college} readOnly style={{ background: '#f1f5f9' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default SpocSettings;
