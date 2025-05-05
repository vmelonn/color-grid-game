import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    profilePictureUrl: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        profilePictureUrl: user.profilePictureUrl || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) {
        setError('Authentication Error. Please log in again.');
        return;
    }

    const updatePayload: { username?: string; password?: string; profilePictureUrl?: string } = {};
    if (formData.username !== user.username) {
        updatePayload.username = formData.username;
    }
    if (formData.password) {
        updatePayload.password = formData.password;
    }
    if (formData.profilePictureUrl !== user.profilePictureUrl) {
        updatePayload.profilePictureUrl = formData.profilePictureUrl;
    }

    if (Object.keys(updatePayload).length === 0) {
        setSuccess('No changes detected.');
        return;
    }

    try {
        const response = await axios.put(
            '/api/users/profile',
            updatePayload, 
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const updatedUser = response.data; 
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setSuccess('Profile updated successfully! Reload or navigate to see changes everywhere.');
        setFormData(prev => ({ ...prev, password: '' }));
        
    } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    }
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <main className="profile-container">
      <h2>Update Profile</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">New Password (leave blank to keep current)</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profilePictureUrl">Profile Picture URL (optional)</label>
          <input
            type="url"
            id="profilePictureUrl"
            name="profilePictureUrl"
            value={formData.profilePictureUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <button type="submit" className="btn btn-primary">Save Changes</button>
      </form>
       <button onClick={() => navigate('/home')} className="back-button">Back to Home</button>
    </main>
  );
}; 