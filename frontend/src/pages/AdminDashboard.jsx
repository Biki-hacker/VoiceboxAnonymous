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
      navigate('/signin', { state: { message: 'Admin access required' } });
      return;
    }
    
    // Set user data from localStorage
    setUserData({ email: storedEmail, role: storedRole });
    
    // Verify user with our backend using auth/verify-status
    api.get('/auth/verify-status', { params: { email: storedEmail } })
      .then(res => {
        if (!res.data.success || res.data.role !== 'admin') {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Error</h2>
          <p className="text-red-400 text-center">{error}</p>
          <div className="flex justify-center mt-4">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

        <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
          <div>
            <button
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mr-2"
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
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
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
                className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded mr-2"
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
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 bg-gray-800 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4">Your Organizations</h3>
            
            {loading && organizations.length === 0 ? (
              <div className="text-center py-4">
                <p>Loading organizations...</p>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-600 rounded-lg">
                <p>You don't have any organizations yet.</p>
                <p className="text-sm text-gray-400 mt-2">Click "Add Company" to create your first organization.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {organizations.map(org => (
                  <li
                    key={org._id}
                    onClick={() => selectOrganization(org)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedOrg?._id === org._id ? 'bg-blue-900 border-blue-700' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {org.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-3 bg-gray-800 rounded-lg p-4">
            {loading && selectedOrg ? (
              <div className="text-center py-12">
                <p className="text-lg">Loading organization data...</p>
              </div>
            ) : selectedOrg ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedOrg.name}</h3>
                    <p className="text-gray-400">ID: <code className="bg-gray-700 px-1 rounded text-xs">{selectedOrg._id}</code></p>
                    <p className="text-gray-400">Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm"
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
                
                <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-2">Employee Verification Parameters:</h4>
                  {selectedOrg.verificationFields && selectedOrg.verificationFields.length > 0 ? (
                    <>
                      <ul className="list-disc pl-5 mb-2">
                        {selectedOrg.verificationFields.map((param, i) => (
                          <li key={i}>{param}</li>
                        ))}
                      </ul>
                      <p className="text-sm text-gray-400">These fields are required for employee verification during registration.</p>
                    </>
                  ) : (
                    <>
                      <p>No verification parameters set.</p>
                      <p className="text-sm text-gray-400">Employees can register without verification. Click "Edit Verification Parameters" to add requirements.</p>
                    </>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-4">Post Statistics</h3>
                {stats.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-600 rounded-lg mb-6">
                    <p>No post statistics available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <Pie data={chartData} options={chartOptions} />
                    </div>
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-4">Filter Posts</h3>
                <div className="flex flex-wrap gap-4 mb-6">
                  <select
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded p-2"
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
                    className="bg-gray-700 border border-gray-600 rounded p-2"
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
                    className="bg-gray-700 border border-gray-600 rounded p-2"
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

                <div>
                  {filteredPosts.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-600 rounded-lg">
                      <p>No posts found matching your filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredPosts.map((post, i) => (
                        <div
                          key={i}
                          className="border border-gray-600 rounded-lg p-4 bg-gray-700"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                              post.postType === 'feedback' ? 'bg-green-600' :
                              post.postType === 'complaint' ? 'bg-red-600' :
                              post.postType === 'suggestion' ? 'bg-blue-600' : 'bg-orange-600'
                            }`}>
                              {post.postType.toUpperCase()}
                            </span>
                            
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
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          
                          <div className="text-sm text-gray-400 mb-3">
                            <p>
                              <span className="font-medium">Posted by:</span> {post.createdBy || 'Anonymous'} | {' '}
                              <span className="font-medium">Date:</span> {new Date(post.createdAt).toLocaleString()} | {' '}
                              <span className="font-medium">Region:</span> {post.region || 'N/A'} | {' '}
                              <span className="font-medium">Department:</span> {post.department || 'N/A'}
                            </p>
                          </div>
                          
                          <div className="bg-gray-800 p-3 rounded-lg mb-2">
                            <p>{post.content}</p>
                          </div>
                          
                          {post.mediaUrl && (
                            <div className="mt-2">
                              {post.mediaUrl.match(/\.(jpe?g|png|gif)$/i) ? (
                                <img
                                  src={post.mediaUrl}
                                  alt="Post media"
                                  className="max-w-xs max-h-40 object-contain"
                                />
                              ) : (
                                <a
                                  href={post.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline"
                                >
                                  View Media
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg">Select an organization or create a new one to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;