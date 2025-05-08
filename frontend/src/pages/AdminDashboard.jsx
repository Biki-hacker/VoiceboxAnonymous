// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { Bar, Pie } from 'react-chartjs-2';
import { 
  Chart, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';

// Register all necessary Chart.js components
Chart.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [stats, setStats] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // State for user data
  const [userData, setUserData] = useState(null);
  
  // First useEffect to handle user data retrieval
  useEffect(() => {
    // Check localStorage for identification
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');
    
    if (!storedEmail || !storedRole) {
      navigate('/signin', { state: { message: 'Please sign in to continue' } });
      return;
    }
    
    // If user is not an admin, redirect
    if (storedRole !== 'admin') {
      navigate('/dashboard', { state: { message: 'Admin access required' } });
      return;
    }
    
    // Set user data from localStorage
    setUserData({ email: storedEmail, role: storedRole });
    
    // Verify user with MongoDB Atlas
    api.get('/users/verify', { params: { email: storedEmail } })
      .then(res => {
        if (res.data.role !== 'admin') {
          // User is not an admin in the database
          localStorage.removeItem('email');
          localStorage.removeItem('role');
          navigate('/signin', { state: { message: 'Admin access required' } });
          return;
        }
      })
      .catch(err => {
        console.error('User verification failed:', err);
        // User not found or other error
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        navigate('/signin', { state: { message: 'Please sign in again' } });
      });
  }, [navigate]);

  // Second useEffect to load organizations after user is confirmed
  useEffect(() => {
    // Only proceed if user data is available
    if (!userData || userData.role !== 'admin') {
      return;
    }

    setLoading(true);
    
    api
      .get('/organizations/by-admin', { 
        params: { email: userData.email }
      })
      .then(res => {
        const sortedOrgs = res.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrganizations(sortedOrgs);
        if (sortedOrgs.length > 0) {
          selectOrganization(sortedOrgs[0]);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error loading organizations:', err);
        setError('Failed to load organizations. Please try again later.');
        setLoading(false);
      });
  }, [userData, navigate]);

  const selectOrganization = (org) => {
    setSelectedOrg(org);
    setLoading(true);
    
    // Use Promise.all to fetch both resources in parallel
    Promise.all([
      api.get(`/posts/stats/${org._id}`),
      api.get(`/posts/${org._id}`)
    ])
      .then(([statsRes, postsRes]) => {
        setStats(statsRes.data);
        setPosts(postsRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching organization data:', err);
        setError('Failed to load organization data. Please try again.');
        setLoading(false);
      });
  };

  const filteredPosts = posts.filter(post => {
    const matchType = selectedType === 'all' || post.postType === selectedType;
    const matchRegion = selectedRegion === 'all' || post.region === selectedRegion;
    const matchDepartment =
      selectedDepartment === 'all' || post.department === selectedDepartment;
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
        backgroundColor: ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0', '#795548'],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Post Distribution'
      },
      tooltip: {
        enabled: true
      }
    }
  };

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Admin Dashboard</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            style={{
              margin: '1rem 0',
              padding: '0.5rem 1rem',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '0.5rem'
            }}
            onClick={() => {
              const name = prompt('Enter organization name:');
              if (!name) return;
              
              api.post('/organizations', {
                name,
                adminEmail: userData.email
              })
              .then(res => {
                alert('Organization created successfully!');
                // Add the new org to the state
                const newOrg = res.data;
                setOrganizations(prev => [newOrg, ...prev]);
                selectOrganization(newOrg);
              })
              .catch(err => {
                console.error('Error creating organization:', err);
                alert('Failed to create organization. ' + (err.response?.data?.message || 'Please try again.'));
              });
            }}
          >
            ➕ Add Company
          </button>
          
          {selectedOrg && (
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
              onClick={() => {
                const currentFields = selectedOrg.verificationFields || [];
                const fieldsStr = prompt('Enter employee verification parameters (comma-separated):', currentFields.join(', '));
                
                if (fieldsStr === null) return; // User cancelled
                
                const fields = fieldsStr.split(',').map(f => f.trim()).filter(Boolean);
                
                api.patch(`/organizations/${selectedOrg._id}`, {
                  verificationFields: fields
                })
                .then(res => {
                  alert('Verification parameters updated successfully!');
                  // Update the org in state
                  setSelectedOrg({...selectedOrg, verificationFields: fields});
                  // Update in organizations list
                  setOrganizations(orgs => 
                    orgs.map(o => o._id === selectedOrg._id ? {...o, verificationFields: fields} : o)
                  );
                })
                .catch(err => {
                  console.error('Error updating verification parameters:', err);
                  alert('Failed to update verification parameters. Please try again.');
                });
              }}
            >
              Edit Verification Parameters
            </button>
          )}
        </div>

        <div>
          {selectedOrg && (
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
              onClick={() => {
                const postType = prompt('Enter post type (feedback, complaint, suggestion, public):', 'feedback');
                if (!postType || !['feedback', 'complaint', 'suggestion', 'public'].includes(postType)) {
                  alert('Invalid post type');
                  return;
                }
                
                const content = prompt('Enter post content:');
                if (!content) return;
                
                const region = prompt('Enter region (optional):');
                const department = prompt('Enter department (optional):');
                
                api.post('/posts', {
                  organizationId: selectedOrg._id,
                  postType,
                  content,
                  region: region || undefined,
                  department: department || undefined,
                  createdBy: userData.email
                })
                .then(res => {
                  alert('Post created successfully!');
                  // Add the new post to the state
                  setPosts(prev => [res.data, ...prev]);
                  // Refresh stats
                  api.get(`/posts/stats/${selectedOrg._id}`).then(statsRes => {
                    setStats(statsRes.data);
                  });
                })
                .catch(err => {
                  console.error('Error creating post:', err);
                  alert('Failed to create post. Please try again.');
                });
              }}
            >
              Add Test Post
            </button>
          )}
          
          <button
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => {
              // Just clear localStorage and redirect
              localStorage.removeItem('email');
              localStorage.removeItem('role');
              navigate('/signin');
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {loading && organizations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading organizations...</p>
        </div>
      ) : (
        <>
          <h3>Your Organizations</h3>
          {organizations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #ccc', borderRadius: '5px' }}>
              <p>You don't have any organizations yet.</p>
              <p>Click "Add Company" to create your first organization.</p>
            </div>
          ) : (
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
                    backgroundColor:
                      selectedOrg?._id === org._id ? '#e0f7fa' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {org.name}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {loading && selectedOrg ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading organization data...</p>
        </div>
      ) : selectedOrg ? (
        <>
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3>Organization: {selectedOrg.name}</h3>
                <p>Organization ID: <code>{selectedOrg._id}</code></p>
                <p>Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (!window.confirm(`Are you sure you want to delete "${selectedOrg.name}"? This action cannot be undone.`)) {
                      return;
                    }
                    
                    api.delete(`/organizations/${selectedOrg._id}`)
                    .then(() => {
                      alert('Organization deleted successfully');
                      // Remove from state
                      setOrganizations(prev => prev.filter(o => o._id !== selectedOrg._id));
                      setSelectedOrg(null);
                      setPosts([]);
                      setStats([]);
                    })
                    .catch(err => {
                      console.error('Error deleting organization:', err);
                      alert('Failed to delete organization. Please try again.');
                    });
                  }}
                >
                  Delete Organization
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
              <h4>Employee Verification Parameters:</h4>
              {selectedOrg.verificationFields && selectedOrg.verificationFields.length > 0 ? (
                <>
                  <ul>
                    {selectedOrg.verificationFields.map((param, i) => (
                      <li key={i}>{param}</li>
                    ))}
                  </ul>
                  <p><small>These fields are required for employee verification during registration.</small></p>
                </>
              ) : (
                <>
                  <p>No verification parameters set.</p>
                  <p><small>Employees can register without verification. Click "Edit Verification Parameters" to add requirements.</small></p>
                </>
              )}
            </div>
          </div>

          <h3>Post Statistics</h3>
          {stats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #ccc', borderRadius: '5px' }}>
              <p>No post statistics available.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2rem',
                marginBottom: '2rem'
              }}
            >
              <div style={{ width: '400px', height: '300px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
              <div style={{ width: '400px', height: '300px' }}>
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          <h3>Filter Posts</h3>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              style={{ padding: '0.5rem' }}
            >
              <option value="all">All Types</option>
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="public">Public Discussion</option>
            </select>

            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              style={{ padding: '0.5rem' }}
              disabled={uniqueRegions.length === 0}
            >
              <option value="all">All Regions</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>

            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              style={{ padding: '0.5rem' }}
              disabled={uniqueDepartments.length === 0}
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map(dep => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            {filteredPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', border: '1px dashed #ccc', borderRadius: '5px' }}>
                <p>No posts found matching your filters.</p>
              </div>
            ) : (
              filteredPosts.map((post, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid #ccc',
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 
                        post.postType === 'feedback' ? '#4caf50' :
                        post.postType === 'complaint' ? '#f44336' :
                        post.postType === 'suggestion' ? '#2196f3' : '#ff9800',
                      color: 'white',
                      borderRadius: '4px',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {post.postType.toUpperCase()}
                    </h4>
                    
                    <button
                      onClick={() => {
                        if (!window.confirm('Are you sure you want to delete this post?')) {
                          return;
                        }
                        
                        api.delete(`/posts/${post._id}`)
                        .then(() => {
                          // Remove from state
                          setPosts(prev => prev.filter(p => p._id !== post._id));
                          // Refresh stats
                          api.get(`/posts/stats/${selectedOrg._id}`).then(statsRes => {
                            setStats(statsRes.data);
                          });
                        })
                        .catch(err => {
                          console.error('Error deleting post:', err);
                          alert('Failed to delete post. Please try again.');
                        });
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#f44336',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                    <p>
                      <strong>Posted by:</strong> {post.createdBy || 'Anonymous'} | {' '}
                      <strong>Date:</strong> {new Date(post.createdAt).toLocaleString()} | {' '}
                      <strong>Region:</strong> {post.region || 'N/A'} | {' '}
                      <strong>Department:</strong> {post.department || 'N/A'}
                    </p>
                  </div>
                  
                  <div style={{ 
                    padding: '0.75rem', 
                    backgroundColor: 'white', 
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    marginBottom: '0.5rem'
                  }}>
                    <p>{post.content}</p>
                  </div>
                  
                  {post.mediaUrl && (
                    <div style={{ marginTop: '0.5rem' }}>
                      {post.mediaUrl.match(/\.(jpe?g|png|gif)$/i) ? (
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                        />
                      ) : (
                        <a
                          href={post.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Media
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard;