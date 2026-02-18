import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const ClubDetails = () => {
  const { clubId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    try {
      const response = await api.get(`/events/clubs/${clubId}`);
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load club details');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/participant/follow/${clubId}`);
      fetchClubDetails();
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h1>{data.club.organizerName}</h1>
            <p style={{ color: '#7f8c8d' }}>{data.club.category}</p>
          </div>
          <button onClick={handleFollow} className={`btn ${data.isFollowed ? 'btn-secondary' : 'btn-success'}`}>
            {data.isFollowed ? 'Unfollow' : 'Follow'}
          </button>
        </div>

        <div className="card" style={{ marginTop: '30px' }}>
          <p>{data.club.description}</p>
          <p style={{ marginTop: '15px' }}><strong>Contact:</strong> {data.club.contactEmail}</p>
        </div>

        <h2 style={{ marginTop: '40px' }}>Upcoming Events</h2>
        <div className="grid grid-3" style={{ marginTop: '20px' }}>
          {data.upcomingEvents.map(event => (
            <div key={event._id} className="card">
              <h3>{event.eventName}</h3>
              <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                {new Date(event.eventStartDate).toLocaleDateString()}
              </p>
              <Link to={`/events/${event._id}`} className="btn btn-primary" style={{ marginTop: '10px' }}>
                View Event
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ClubDetails;
