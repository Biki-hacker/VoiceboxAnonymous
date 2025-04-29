import React, { useEffect, useState } from 'react';
import { api } from '../api/axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';

Chart.register(ArcElement, CategoryScale, LinearScale, BarElement);

const AdminDashboard = () => {
  const [org, setOrg] = useState(null);
  const [params, setParams] = useState([]);
  const [stats, setStats] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  const adminId = localStorage.getItem('adminId');

  useEffect(() => {
    if (!adminId) return;

    api.get(`/organizations/admin/${adminId}`)
      .then(res => {
        setOrg(res.data);
        setParams(res.data.verificationParams || []);
        fetchStats(res.data._id);
        fetchPosts(res.data._id);
      })
      .catch(err => console.error("Error loading organization:", err));
  }, [adminId]);

  const fetchStats = (orgId) => {
    api.get(`/posts/stats/${orgId}`)
      .then(res => setStats(res.data))
      .catch(err => console.error("Error fetching stats:", err));
  };

  const fetchPosts = (orgId) => {
    api.get(`/posts/${orgId}`)
      .then(res => setPosts(res.data))
      .catch(err => console.error("Error fetching posts:", err));
  };

  const filteredPosts = selectedType === 'all'
    ? posts
    : posts.filter(post => post.postType === selectedType);

  const chartData = {
    labels: stats.map(s => s._id),
    datasets: [
      {
        label: 'Post Count',
        data: stats.map(s => s.count),
        backgroundColor: ['#4caf50', '#f44336', '#2196f3', '#ff9800']
      }
    ]
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Admin Dashboard</h2>

      {org && (
        <div style={{ marginBottom: '2rem' }}>
          <h3>Organization: {org.name}</h3>
          <p>Verification Parameters:</p>
          <ul>
            {params.map((param, i) => (
              <li key={i}>{param}</li>
            ))}
          </ul>
        </div>
      )}

      <h3>Post Statistics</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ width: '400px' }}>
          <Bar data={chartData} />
        </div>
        <div style={{ width: '400px' }}>
          <Pie data={chartData} />
        </div>
      </div>

      <h3>View Posts by Type</h3>
      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem' }}
      >
        <option value="all">All</option>
        <option value="feedback">Feedback</option>
        <option value="complaint">Complaint</option>
        <option value="suggestion">Suggestion</option>
        <option value="public">Public Discussion</option>
      </select>

      <div style={{ marginTop: '1rem' }}>
        {filteredPosts.map((post, i) => (
          <div key={i} style={{
            border: '1px solid #ccc',
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: '#fafafa'
          }}>
            <h4>{post.postType.toUpperCase()}</h4>
            <p>{post.content}</p>
            {post.mediaUrl && (
              <div style={{ marginTop: '0.5rem' }}>
                {post.mediaUrl.endsWith('.jpg') || post.mediaUrl.endsWith('.png') ? (
                  <img src={post.mediaUrl} alt="Post media" width="200" />
                ) : (
                  <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">View Media</a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
