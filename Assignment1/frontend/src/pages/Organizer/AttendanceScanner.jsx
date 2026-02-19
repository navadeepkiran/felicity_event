import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';

const AttendanceScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEventAndStats();
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [eventId]);

  const fetchEventAndStats = async () => {
    try {
      const [eventRes, statsRes] = await Promise.all([
        api.get(`/organizer/events/${eventId}`),
        api.get(`/organizer/events/${eventId}/attendance/stats`)
      ]);
      setEvent(eventRes.data.event);
      setStats(statsRes.data.stats);
      setAttendanceList(statsRes.data.attendanceList);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    setScanning(true);
    
    // Wait for DOM to update before initializing scanner
    setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 20,
          qrbox: { width: 300, height: 300 },
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          videoConstraints: {
            facingMode: "environment"
          }
        },
        true // verbose logging
      );

      html5QrcodeScanner.render(onScanSuccess, onScanError);
      setScanner(html5QrcodeScanner);
    }, 100);
  };

  const stopScanner = () => {
    if (scanner) {
      try {
        scanner.clear();
      } catch (error) {
        console.log('Scanner cleanup error:', error);
      }
      setScanner(null);
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('✅ QR Code scanned successfully:', decodedText);
    
    // Stop scanner temporarily to prevent multiple scans
    if (scanner) {
      scanner.pause();
    }
    
    // Extract ticket ID from QR code
    let ticketId = decodedText;
    
    // If QR code is a JSON string, parse it
    try {
      const parsed = JSON.parse(decodedText);
      console.log('Parsed QR data:', parsed);
      if (parsed.ticketId) {
        ticketId = parsed.ticketId;
      }
    } catch (e) {
      console.log('QR code is not JSON, using raw value:', decodedText);
      // Not JSON, use as is
    }

    console.log('Using ticketId:', ticketId);
    await markAttendance(ticketId);
    
    // Resume scanner after a delay
    setTimeout(() => {
      if (scanner) {
        scanner.resume();
      }
    }, 2000);
  };

  const onScanError = (error) => {
    // Silent error handling - scanning errors are common
    // Only log non-repetitive errors
    if (!error.includes('NotFoundException')) {
      console.log('Scan error:', error);
    }
  };

  const markAttendance = async (ticketId) => {
    try {
      const response = await api.post(`/organizer/events/${eventId}/attendance/scan`, { ticketId });
      
      toast.success(
        <div>
          <strong>Attendance Marked!</strong>
          <br />
          {response.data.participant.name}
          <br />
          <small>{response.data.participant.email}</small>
        </div>,
        { autoClose: 3000 }
      );
      
      // Refresh stats
      fetchEventAndStats();
      
      // Play success sound
      const audio = new Audio('data:audio/wav;base64,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');
      audio.play().catch(() => {});
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMsg);
    }
  };

  const handleManualMark = async (ticketId) => {
    await markAttendance(ticketId);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-file');
      const decodedText = await html5QrCode.scanFile(file, true);
      
      console.log('✅ QR Code from file:', decodedText);
      
      // Extract ticket ID from QR code
      let ticketId = decodedText;
      
      // If QR code is a JSON string, parse it
      try {
        const parsed = JSON.parse(decodedText);
        console.log('Parsed QR data:', parsed);
        if (parsed.ticketId) {
          ticketId = parsed.ticketId;
        }
      } catch (e) {
        console.log('QR code is not JSON, using raw value:', decodedText);
      }

      console.log('Using ticketId:', ticketId);
      await markAttendance(ticketId);
      
      // Reset file input
      event.target.value = '';
      
    } catch (error) {
      console.error('File scan error:', error);
      toast.error('Failed to read QR code from file. Please try again or use camera scan.');
      event.target.value = '';
    }
  };

  const filteredList = attendanceList.filter(item => {
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'attended' && item.attended) ||
      (filterStatus === 'not-attended' && !item.attended);
    
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) return <Layout><div className="loading">Loading...</div></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
        {event && (
          <div style={{ marginBottom: '30px' }}>
            <button 
              onClick={() => navigate(`/organizer/events/${eventId}`)} 
              className="btn btn-secondary"
              style={{ marginBottom: '15px' }}
            >
              ← Back to Event
            </button>
            <h1>{event.eventName} - Attendance Scanner</h1>
            <p style={{ color: '#7f8c8d' }}>Scan QR codes to mark participant attendance</p>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <h3 style={{ fontSize: '2rem', color: '#3498db', marginBottom: '10px' }}>{stats.totalRegistrations}</h3>
              <p style={{ color: '#7f8c8d' }}>Total Registered</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <h3 style={{ fontSize: '2rem', color: '#27ae60', marginBottom: '10px' }}>{stats.totalAttended}</h3>
              <p style={{ color: '#7f8c8d' }}>Attended</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <h3 style={{ fontSize: '2rem', color: '#e74c3c', marginBottom: '10px' }}>{stats.totalNotAttended}</h3>
              <p style={{ color: '#7f8c8d' }}>Not Attended</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
              <h3 style={{ fontSize: '2rem', color: '#9b59b6', marginBottom: '10px' }}>{stats.attendancePercentage}%</h3>
              <p style={{ color: '#7f8c8d' }}>Attendance Rate</p>
            </div>
          </div>
        )}

        {/* QR Scanner */}
        <div className="card" style={{ marginBottom: '30px', padding: '20px' }}>
          <h3>QR Code Scanner</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
            Scan participant QR codes from their tickets to mark attendance
          </p>
          
          {!scanning ? (
            <div>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <button onClick={startScanner} className="btn btn-primary" style={{ fontSize: '1.1rem' }}>
                  📷 Start Camera Scanner
                </button>
                <label className="btn btn-success" style={{ fontSize: '1.1rem', cursor: 'pointer' }}>
                  📁 Upload QR Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              <div style={{ 
                marginTop: '15px', 
                padding: '15px', 
                background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-elevated) 100%)',
                borderRadius: '8px', 
                fontSize: '0.9rem',
                border: '1px solid var(--border-color)'
              }}>
                <strong style={{ color: 'var(--accent-cyan)' }}>📝 Scanning Options:</strong>
                <ul style={{ marginTop: '8px', marginLeft: '20px', color: 'var(--text-primary)' }}>
                  <li><strong>Camera Scanner:</strong> Use your device camera to scan QR codes in real-time</li>
                  <li><strong>Upload Image:</strong> Take a screenshot/photo of the QR code from participant's phone and upload it</li>
                  <li><strong>Manual Entry:</strong> Use the "Mark Present" button below if both methods fail</li>
                  <li>Open the console (F12) to see scan logs for debugging</li>
                </ul>
              </div>
              <div id="qr-reader-file" style={{ display: 'none' }}></div>
            </div>
          ) : (
            <div>
              <div id="qr-reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
              <button 
                onClick={stopScanner} 
                className="btn btn-danger" 
                style={{ marginTop: '20px', fontSize: '1rem' }}
              >
                Stop Scanner
              </button>
              <p style={{ marginTop: '15px', color: '#27ae60', textAlign: 'center' }}>
                ✓ Scanner active - Position QR code in the box above
              </p>
            </div>
          )}
        </div>

        {/* Attendance List */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3>Attendance List</h3>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, email, or ticket ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ minWidth: '250px' }}
              />
              <select
                className="form-input"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="all">All Participants</option>
                <option value="attended">Attended</option>
                <option value="not-attended">Not Attended</option>
              </select>
            </div>
          </div>

          <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
            Showing {filteredList.length} of {attendanceList.length} participants
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Ticket ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(item => (
                  <tr key={item.ticketId} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{item.ticketId}</td>
                    <td style={{ padding: '12px' }}>{item.name}</td>
                    <td style={{ padding: '12px' }}>{item.email}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {item.attended ? (
                        <span className="badge badge-success">✓ Attended</span>
                      ) : (
                        <span className="badge badge-danger">✗ Not Attended</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {!item.attended && (
                        <button
                          onClick={() => handleManualMark(item.ticketId)}
                          className="btn btn-primary"
                          style={{ fontSize: '12px', padding: '5px 10px' }}
                        >
                          Mark Present
                        </button>
                      )}
                      {item.attended && item.attendedAt && (
                        <small style={{ color: '#7f8c8d' }}>
                          {new Date(item.attendedAt).toLocaleString()}
                        </small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              No participants found
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceScanner;
