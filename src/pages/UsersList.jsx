import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate loading users from Firebase
    const loadUsers = async () => {
      try {
        // Mock data - replace with actual Firebase call
        const mockUsers = [
          {
            id: '1',
            fullName: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+1234567890',
            role: 'user',
            status: 'active',
            totalOrders: 5,
            joinDate: '2024-01-15',
            lastLogin: '2024-06-01'
          },
          {
            id: '2',
            fullName: 'Jane Smith',
            email: 'jane.smith@email.com',
            phone: '+1234567891',
            role: 'user',
            status: 'active',
            totalOrders: 3,
            joinDate: '2024-02-20',
            lastLogin: '2024-05-28'
          },
          {
            id: '3',
            fullName: 'Mike Johnson',
            email: 'mike.johnson@email.com',
            phone: '+1234567892',
            role: 'admin',
            status: 'active',
            totalOrders: 0,
            joinDate: '2024-01-01',
            lastLogin: '2024-06-02'
          },
          {
            id: '4',
            fullName: 'Sarah Wilson',
            email: 'sarah.wilson@email.com',
            phone: '+1234567893',
            role: 'user',
            status: 'inactive',
            totalOrders: 1,
            joinDate: '2024-03-10',
            lastLogin: '2024-04-15'
          }
        ];
        
        setUsers(mockUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error loading users:', error);
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        // Here you would delete the user from Firebase
        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
          : user
      ));
      alert('User status updated successfully!');
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Users Management</h1>
        <p>Manage user accounts and permissions</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>All Users ({filteredUsers.length})</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '0.9rem'
              }}
            />
            <Link to="/add-user" className="add-btn">
              + Add User
            </Link>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <h3>No users found</h3>
            <p>Try adjusting your search terms or add a new user.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>
                        {user.fullName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>
                      {user.phone || 'Not provided'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.role === 'admin' ? 'confirmed' : 'pending'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ textAlign: 'center', fontWeight: '600' }}>
                      {user.totalOrders}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'active' ? 'available' : 'unavailable'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>
                      {new Date(user.joinDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.9rem' }}>
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => alert(`Viewing details for ${user.fullName}`)}
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        className={user.status === 'active' ? 'cancel-btn' : 'submit-btn'}
                        onClick={() => toggleUserStatus(user.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        title="Delete User"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>User Management Tips:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li>Deactivated users cannot log in but their data is preserved</li>
          <li>Admin users have full system access - use carefully</li>
          <li>View user details to see their complete reservation history</li>
          <li>Contact information can be used for customer support</li>
        </ul>
      </div>
    </div>
  );
};

export default UsersList;