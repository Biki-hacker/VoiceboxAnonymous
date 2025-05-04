// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';

Chart.register(ArcElement, CategoryScale, LinearScale, BarElement);

const AdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [stats, setStats] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const navigate = useNavigate();

  const adminId = localStorage.getItem('adminId');

  useEffect(() => {
    if (!adminId) return;
    api.get(`/organizations/admin/${adminId}`)
      .then(res => {
        const sortedOrgs = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrganizations(sortedOrgs);
        if (sortedOrgs.length > 0) selectOrganization(sortedOrgs[0]);
      })
      .catch(err => console.error("Error loading organizations:", err));
  }, [adminId]);

  const selectOrganization = (org) => {
    setSelectedOrg(org);
    fetchStats(org._id);
    fetchPosts(org._id);
  };

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

  const filteredPosts = posts.filter(post => {
    const matchType = selectedType === 'all' || post.postType === selectedType;
    const matchRegion = selectedRegion === 'all' || post.region === selectedRegion;
    const matchDepartment = selectedDepartment === 'all' || post.department === selectedDepartment;
    return matchType && matchRegion && matchDepartment;
  });

  const uniqueRegions = [...new Set(posts.map(p => p.region).filter(Boolean))];
  const uniqueDepartments = [...new Set(posts.map(p => p.department).filter(Boolean))];

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
      <h2>Admin Dashboard</h2>

      <button
        style={{ margin: '1rem 0', padding: '0.5rem 1rem', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '5px' }}
        onClick={() => navigate('/add-organization')}
      >
        ➕ Add Company
      </button>

      <h3>Your Organizations</h3>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {organizations.map(org => (
          <li
            key={org._id}
            onClick={() => selectOrganization(org)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '5px',
              marginBottom: '0.5rem',
              backgroundColor: selectedOrg?._id === org._id ? '#e0f7fa' : '#fff',
              cursor: 'pointer'
            }}
          >
            {org.name}
          </li>
        ))}
      </ul>

      {selectedOrg && (
        <>
          <div style={{ marginTop: '2rem' }}>
            <h3>Organization: {selectedOrg.name}</h3>
            <p>Verification Parameters:</p>
            <ul>
              {(selectedOrg.verificationFields || []).map((param, i) => (
                <li key={i}>{param}</li>
              ))}
            </ul>
          </div>

          <h3>Post Statistics</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ width: '400px' }}><Bar data={chartData} /></div>
            <div style={{ width: '400px' }}><Pie data={chartData} /></div>
          </div>

          <h3>Filter Posts</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="all">All Types</option>
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="public">Public Discussion</option>
            </select>

            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="all">All Regions</option>
              {uniqueRegions.map(region => <option key={region} value={region}>{region}</option>)}
            </select>

            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ padding: '0.5rem' }}>
              <option value="all">All Departments</option>
              {uniqueDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>

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
                <p><strong>Region:</strong> {post.region || 'N/A'} | <strong>Department:</strong> {post.department || 'N/A'}</p>
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
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
