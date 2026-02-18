import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ClubsList = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await api.get('/events/clubs/list');
      setClubs(response.data.clubs);
    } catch (error) {
      toast.error('Failed to fetch clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (clubId) => {
    try {
      const response = await api.post(`/participant/follow/${clubId}`);
      toast.success(response.data.message);
      fetchClubs();
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (loading) return <Layout><div className="loading">Loading clubs...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <h1>Clubs & Organizers</h1>
        <p style={{ color: '#7f8c8d', marginTop: '10px' }}>Follow your favorite clubs to stay updated</p>

        <div className="grid grid-3" style={{ marginTop: '30px' }}>
          {clubs.map(club => (
            <div key={club._id} className="card">
              <h3>{club.organizerName}</h3>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: '10px 0' }}>{club.category}</p>
              <p style={{ fontSize: '0.9rem' }}>{club.description.substring(0, 100)}...</p>
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <Link to={`/clubs/${club._id}`} className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                  View
                </Link>
                <button
                  onClick={() => handleFollow(club._id)}
                  className={`btn ${club.isFollowed ? 'btn-secondary' : 'btn-success'}`}
                  style={{ fontSize: '0.9rem' }}
                >
                  {club.isFollowed ? 'Unfollow' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ClubsList;
