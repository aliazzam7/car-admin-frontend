import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { updatePassword, getAuth } from 'firebase/auth';
import { db } from '../firebase.js';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState(null);
  const [ordersCount, setOrdersCount] = useState({});

  // States for editing user
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [updatingForm, setUpdatingForm] = useState(false);

  useEffect(() => {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('fullName', 'asc')
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      async (snapshot) => {
        const usersData = [];
        snapshot.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        setUsers(usersData);
        
        // Fetch orders count for each user
        await fetchOrdersCount(usersData);
        
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching users:', error);
        setError('Error loading users data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const fetchOrdersCount = async (usersData) => {
    const ordersCountMap = {};
    
    for (const user of usersData) {
      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.id)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        ordersCountMap[user.id] = ordersSnapshot.size;
      } catch (error) {
        console.error(`Error fetching orders for user ${user.id}:`, error);
        ordersCountMap[user.id] = 0;
      }
    }
    
    setOrdersCount(ordersCountMap);
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      setUpdating(userId);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, {
        status: newStatus,
        updatedAt: new Date()
      });

      alert('User status updated successfully!');
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setFormData({ 
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      newPassword: '' 
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateUser = async () => {
    try {
      setUpdatingForm(true);
      
      // Validation des données
      if (!formData.fullName || !formData.email) {
        alert('Please fill in all required fields (Full Name and Email)');
        return;
      }

      console.log('Updating user with ID:', selectedUser.id);
      console.log('Form data:', formData);
      
      const userDocRef = doc(db, 'users', selectedUser.id);
      
      // Prepare update data
      const updateData = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone ? formData.phone.trim() : '',
        role: formData.role,
        updatedAt: new Date()
      };

      // Add password to update data if provided
      if (formData.newPassword && formData.newPassword.trim() !== '') {
        updateData.password = formData.newPassword;
        updateData.passwordUpdatedAt = new Date();
      }

      console.log('Update data being sent:', updateData);

      // Update user data in Firestore
      await updateDoc(userDocRef, updateData);

      alert('User updated successfully!');
      setSelectedUser(null);
      setFormData({});
      
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      
      // More specific error message
      if (error.code === 'permission-denied') {
        alert('Permission denied. Check your Firestore security rules.');
      } else if (error.code === 'not-found') {
        alert('User not found. Please refresh the page and try again.');
      } else if (error.code === 'invalid-argument') {
        alert('Invalid data provided. Please check your input.');
      } else {
        alert(`Failed to update user: ${error.message}`);
      }
    } finally {
      setUpdatingForm(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Try Again
        </button>
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
            <h3>{searchTerm ? 'No users found' : 'No users available'}</h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search terms or add a new user.'
                : 'Start by adding your first user.'}
            </p>
            {!searchTerm && (
              <Link
                to="/add-user"
                className="add-btn"
                style={{
                  marginTop: '20px',
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px'
                }}
              >
                + Add First User
              </Link>
            )}
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
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>
                        {user.fullName || 'Unknown User'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {user.email || 'No email provided'}
                      </div>
                    </div>
                  </td>
                  <td>{user.phone || 'Not provided'}</td>
                  <td>
                    <span className={`status-badge ${user.role === 'admin' ? 'confirmed' : 'pending'}`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '600' }}>
                    {ordersCount[user.id] !== undefined ? ordersCount[user.id] : 0}
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'active' ? 'available' : 'unavailable'}`}>
                      {user.status || 'inactive'}
                    </span>
                  </td>
                  <td>{formatDate(user.joinDate || user.createdAt)}</td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="view-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          marginRight: '5px',
                          cursor: 'pointer'
                        }}
                        title="View/Edit User"
                      >
                        Edit
                      </button>
                      <button
                        className={user.status === 'active' ? 'cancel-btn' : 'submit-btn'}
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        disabled={updating === user.id}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: updating === user.id ? 'not-allowed' : 'pointer',
                          backgroundColor: user.status === 'active' ? '#dc3545' : '#28a745',
                          color: 'white',
                          marginRight: '5px',
                          opacity: updating === user.id ? 0.6 : 1
                        }}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {updating === user.id
                          ? 'Updating...'
                          : user.status === 'active'
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
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

      {selectedUser && (
        <div
          style={{
            padding: '20px',
            marginTop: '30px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: '#f9f9f9'
          }}
        >
          <h3>Edit User: {selectedUser.fullName}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Full Name:</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label>Phone:</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <label>Role:</label>
              <select
                name="role"
                value={formData.role || 'user'}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label>New Password (leave empty to keep current):</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword || ''}
                onChange={handleInputChange}
                placeholder="Enter new password"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
            <button
              onClick={handleUpdateUser}
              disabled={updatingForm}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: updatingForm ? 'not-allowed' : 'pointer'
              }}
            >
              {updatingForm ? 'Updating...' : 'Update User'}
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;


// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   collection,
//   getDocs,
//   deleteDoc,
//   doc,
//   onSnapshot,
//   orderBy,
//   query,
//   updateDoc
// } from 'firebase/firestore';
// import { db } from '../firebase.js';

// const UsersList = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [updating, setUpdating] = useState(null);

//   // States for editing user
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [formData, setFormData] = useState({});
//   const [updatingForm, setUpdatingForm] = useState(false);

//   useEffect(() => {
//     const usersQuery = query(
//       collection(db, 'users'),
//       orderBy('fullName', 'asc')
//     );

//     const unsubscribe = onSnapshot(
//       usersQuery,
//       (snapshot) => {
//         const usersData = [];
//         snapshot.forEach((doc) => {
//           usersData.push({ id: doc.id, ...doc.data() });
//         });
//         setUsers(usersData);
//         setLoading(false);
//         setError(null);
//       },
//       (error) => {
//         console.error('Error fetching users:', error);
//         setError('Error loading users data');
//         setLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, []);

//   const handleDeleteUser = async (userId, userName) => {
//     if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
//       try {
//         await deleteDoc(doc(db, 'users', userId));
//         alert('User deleted successfully!');
//       } catch (error) {
//         console.error('Error deleting user:', error);
//         alert('Error deleting user. Please try again.');
//       }
//     }
//   };

//   const toggleUserStatus = async (userId, currentStatus) => {
//     try {
//       setUpdating(userId);
//       const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

//       const userDoc = doc(db, 'users', userId);
//       await updateDoc(userDoc, {
//         status: newStatus,
//         updatedAt: new Date()
//       });

//       alert('User status updated successfully!');
//     } catch (error) {
//       console.error('Error updating user status:', error);
//       alert('Error updating user status. Please try again.');
//     } finally {
//       setUpdating(null);
//     }
//   };

//   const handleViewUser = (user) => {
//     setSelectedUser(user);
//     setFormData({ ...user });
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleUpdateUser = async () => {
//     try {
//       setUpdatingForm(true);
//       const userDocRef = doc(db, 'users', selectedUser.id);
//       await updateDoc(userDocRef, {
//         ...formData,
//         updatedAt: new Date()
//       });
//       alert('User updated successfully!');
//       setSelectedUser(null);
//     } catch (error) {
//       console.error('Error updating user:', error);
//       alert('Failed to update user.');
//     } finally {
//       setUpdatingForm(false);
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return 'N/A';
//     if (date.toDate && typeof date.toDate === 'function') {
//       return date.toDate().toLocaleDateString();
//     }
//     return new Date(date).toLocaleDateString();
//   };

//   const filteredUsers = users.filter(
//     (user) =>
//       (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
//       (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading users...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="error-container">
//         <h3>Error</h3>
//         <p>{error}</p>
//         <button onClick={() => window.location.reload()} className="retry-btn">
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="page-header">
//         <h1>Users Management</h1>
//         <p>Manage user accounts and permissions</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>All Users ({filteredUsers.length})</h2>
//           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
//             <input
//               type="text"
//               placeholder="Search users..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{
//                 padding: '8px 12px',
//                 border: '1px solid #ddd',
//                 borderRadius: '5px',
//                 fontSize: '0.9rem'
//               }}
//             />
//             <Link to="/add-user" className="add-btn">
//               + Add User
//             </Link>
//           </div>
//         </div>

//         {filteredUsers.length === 0 ? (
//           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
//             <h3>{searchTerm ? 'No users found' : 'No users available'}</h3>
//             <p>
//               {searchTerm
//                 ? 'Try adjusting your search terms or add a new user.'
//                 : 'Start by adding your first user.'}
//             </p>
//             {!searchTerm && (
//               <Link
//                 to="/add-user"
//                 className="add-btn"
//                 style={{
//                   marginTop: '20px',
//                   display: 'inline-block',
//                   padding: '10px 20px',
//                   backgroundColor: '#28a745',
//                   color: 'white',
//                   textDecoration: 'none',
//                   borderRadius: '4px'
//                 }}
//               >
//                 + Add First User
//               </Link>
//             )}
//           </div>
//         ) : (
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>User</th>
//                 <th>Contact</th>
//                 <th>Role</th>
//                 <th>Orders</th>
//                 <th>Status</th>
//                 <th>Join Date</th>
//                 <th>Last Login</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredUsers.map((user) => (
//                 <tr key={user.id}>
//                   <td>
//                     <div>
//                       <div style={{ fontWeight: '600', color: '#333' }}>
//                         {user.fullName || 'Unknown User'}
//                       </div>
//                       <div style={{ fontSize: '0.85rem', color: '#666' }}>
//                         {user.email || 'No email provided'}
//                       </div>
//                     </div>
//                   </td>
//                   <td>{user.phone || 'Not provided'}</td>
//                   <td>
//                     <span className={`status-badge ${user.role === 'admin' ? 'confirmed' : 'pending'}`}>
//                       {user.role || 'user'}
//                     </span>
//                   </td>
//                   <td style={{ textAlign: 'center', fontWeight: '600' }}>{user.totalOrders || 0}</td>
//                   <td>
//                     <span className={`status-badge ${user.status === 'active' ? 'available' : 'unavailable'}`}>
//                       {user.status || 'inactive'}
//                     </span>
//                   </td>
//                   <td>{formatDate(user.joinDate || user.createdAt)}</td>
//                   <td>{formatDate(user.lastLogin)}</td>
//                   <td>
//                     <div className="action-buttons">
//                       <button
//                         onClick={() => handleViewUser(user)}
//                         className="view-btn"
//                         style={{
//                           padding: '6px 12px',
//                           fontSize: '0.8rem',
//                           backgroundColor: '#17a2b8',
//                           color: 'white',
//                           border: 'none',
//                           borderRadius: '3px',
//                           marginRight: '5px',
//                           cursor: 'pointer'
//                         }}
//                         title="View Details"
//                       >
//                         View
//                       </button>
//                       <button
//                         className={user.status === 'active' ? 'cancel-btn' : 'submit-btn'}
//                         onClick={() => toggleUserStatus(user.id, user.status)}
//                         disabled={updating === user.id}
//                         style={{
//                           padding: '6px 12px',
//                           fontSize: '0.8rem',
//                           border: 'none',
//                           borderRadius: '3px',
//                           cursor: updating === user.id ? 'not-allowed' : 'pointer',
//                           backgroundColor: user.status === 'active' ? '#dc3545' : '#28a745',
//                           color: 'white',
//                           marginRight: '5px',
//                           opacity: updating === user.id ? 0.6 : 1
//                         }}
//                         title={user.status === 'active' ? 'Deactivate' : 'Activate'}
//                       >
//                         {updating === user.id
//                           ? 'Updating...'
//                           : user.status === 'active'
//                           ? 'Deactivate'
//                           : 'Activate'}
//                       </button>
//                       <button
//                         className="delete-btn"
//                         onClick={() => handleDeleteUser(user.id, user.fullName)}
//                         style={{
//                           padding: '6px 12px',
//                           fontSize: '0.8rem',
//                           backgroundColor: '#dc3545',
//                           color: 'white',
//                           border: 'none',
//                           borderRadius: '3px',
//                           cursor: 'pointer'
//                         }}
//                         title="Delete User"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {selectedUser && (
//         <div
//           style={{
//             padding: '20px',
//             marginTop: '30px',
//             border: '1px solid #ccc',
//             borderRadius: '8px',
//             background: '#f9f9f9'
//           }}
//         >
//           <h3>Edit User: {selectedUser.fullName}</h3>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
//             <div>
//               <label>Full Name:</label>
//               <input
//                 type="text"
//                 name="fullName"
//                 value={formData.fullName || ''}
//                 onChange={handleInputChange}
//                 style={{ width: '100%', padding: '8px' }}
//               />
//             </div>
//             <div>
//               <label>Email:</label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email || ''}
//                 onChange={handleInputChange}
//                 style={{ width: '100%', padding: '8px' }}
//               />
//             </div>
//             <div>
//               <label>Phone:</label>
//               <input
//                 type="text"
//                 name="phone"
//                 value={formData.phone || ''}
//                 onChange={handleInputChange}
//                 style={{ width: '100%', padding: '8px' }}
//               />
//             </div>
//             <div>
//               <label>Role:</label>
//               <select
//                 name="role"
//                 value={formData.role || 'user'}
//                 onChange={handleInputChange}
//                 style={{ width: '100%', padding: '8px' }}
//               >
//                 <option value="user">User</option>
//                 <option value="admin">Admin</option>
//               </select>
//             </div>
//           </div>
//           <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
//             <button
//               onClick={handleUpdateUser}
//               disabled={updatingForm}
//               style={{
//                 padding: '10px 20px',
//                 backgroundColor: '#007bff',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '4px',
//                 cursor: updatingForm ? 'not-allowed' : 'pointer'
//               }}
//             >
//               {updatingForm ? 'Updating...' : 'Update User'}
//             </button>
//             <button
//               onClick={() => setSelectedUser(null)}
//               style={{
//                 padding: '10px 20px',
//                 backgroundColor: '#6c757d',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '4px'
//               }}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UsersList;


//code vrai avec backend mais button view il ne travail pas
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { 
//   collection, 
//   getDocs, 
//   deleteDoc, 
//   doc, 
//   onSnapshot,
//   orderBy,
//   query,
//   updateDoc
// } from 'firebase/firestore';
// import { db } from '../firebase.js'; // Make sure the path is correct

// const UsersList = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [updating, setUpdating] = useState(null); // Track which user is being updated

//   useEffect(() => {
//     // Listen to real-time changes from Firestore
//     const usersQuery = query(
//       collection(db, 'users'),
//       orderBy('fullName', 'asc')
//     );

//     const unsubscribe = onSnapshot(
//       usersQuery,
//       (snapshot) => {
//         const usersData = [];
//         snapshot.forEach((doc) => {
//           usersData.push({
//             id: doc.id,
//             ...doc.data()
//           });
//         });
//         setUsers(usersData);
//         setLoading(false);
//         setError(null);
//       },
//       (error) => {
//         console.error('Error fetching users:', error);
//         setError('Error loading users data');
//         setLoading(false);
//       }
//     );

//     // Cleanup listener on component unmount
//     return () => unsubscribe();
//   }, []);

//   const handleDeleteUser = async (userId, userName) => {
//     if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
//       try {
//         await deleteDoc(doc(db, 'users', userId));
//         alert('User deleted successfully!');
//       } catch (error) {
//         console.error('Error deleting user:', error);
//         alert('Error deleting user. Please try again.');
//       }
//     }
//   };

//   const toggleUserStatus = async (userId, currentStatus) => {
//     try {
//       setUpdating(userId);
//       const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
//       const userDoc = doc(db, 'users', userId);
//       await updateDoc(userDoc, {
//         status: newStatus,
//         updatedAt: new Date()
//       });
      
//       alert('User status updated successfully!');
//     } catch (error) {
//       console.error('Error updating user status:', error);
//       alert('Error updating user status. Please try again.');
//     } finally {
//       setUpdating(null);
//     }
//   };

//   const formatDate = (date) => {
//     if (!date) return 'N/A';
    
//     // Handle Firebase Timestamp
//     if (date.toDate && typeof date.toDate === 'function') {
//       return date.toDate().toLocaleDateString();
//     }
    
//     // Handle regular Date or string
//     return new Date(date).toLocaleDateString();
//   };

//   const filteredUsers = users.filter(user =>
//     (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
//     (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading users...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="error-container">
//         <h3>Error</h3>
//         <p>{error}</p>
//         <button onClick={() => window.location.reload()} className="retry-btn">
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="page-header">
//         <h1>Users Management</h1>
//         <p>Manage user accounts and permissions</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>All Users ({filteredUsers.length})</h2>
//           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
//             <input
//               type="text"
//               placeholder="Search users..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{
//                 padding: '8px 12px',
//                 border: '1px solid #ddd',
//                 borderRadius: '5px',
//                 fontSize: '0.9rem'
//               }}
//             />
//             <Link to="/add-user" className="add-btn">
//               + Add User
//             </Link>
//           </div>
//         </div>

//         {filteredUsers.length === 0 ? (
//           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
//             <h3>{searchTerm ? 'No users found' : 'No users available'}</h3>
//             <p>
//               {searchTerm 
//                 ? 'Try adjusting your search terms or add a new user.' 
//                 : 'Start by adding your first user.'
//               }
//             </p>
//             {!searchTerm && (
//               <Link 
//                 to="/add-user" 
//                 className="add-btn" 
//                 style={{ 
//                   marginTop: '20px', 
//                   display: 'inline-block',
//                   padding: '10px 20px',
//                   backgroundColor: '#28a745',
//                   color: 'white',
//                   textDecoration: 'none',
//                   borderRadius: '4px'
//                 }}
//               >
//                 + Add First User
//               </Link>
//             )}
//           </div>
//         ) : (
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>User</th>
//                 <th>Contact</th>
//                 <th>Role</th>
//                 <th>Orders</th>
//                 <th>Status</th>
//                 <th>Join Date</th>
//                 <th>Last Login</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredUsers.map(user => (
//                 <tr key={user.id}>
//                   <td>
//                     <div>
//                       <div style={{ fontWeight: '600', color: '#333' }}>
//                         {user.fullName || 'Unknown User'}
//                       </div>
//                       <div style={{ fontSize: '0.85rem', color: '#666' }}>
//                         {user.email || 'No email provided'}
//                       </div>
//                     </div>
//                   </td>
//                   <td>
//                     <div style={{ fontSize: '0.9rem' }}>
//                       {user.phone || 'Not provided'}
//                     </div>
//                   </td>
//                   <td>
//                     <span className={`status-badge ${user.role === 'admin' ? 'confirmed' : 'pending'}`}>
//                       {user.role || 'user'}
//                     </span>
//                   </td>
//                   <td>
//                     <div style={{ textAlign: 'center', fontWeight: '600' }}>
//                       {user.totalOrders || 0}
//                     </div>
//                   </td>
//                   <td>
//                     <span className={`status-badge ${user.status === 'active' ? 'available' : 'unavailable'}`}>
//                       {user.status || 'inactive'}
//                     </span>
//                   </td>
//                   <td>
//                     <div style={{ fontSize: '0.9rem' }}>
//                       {formatDate(user.joinDate || user.createdAt)}
//                     </div>
//                   </td>
//                   <td>
//                     <div style={{ fontSize: '0.9rem' }}>
//                       {formatDate(user.lastLogin)}
//                     </div>
//                   </td>
//                   <td>
//                     <div className="action-buttons">
//                       <Link
//                         to={`/user-details/${user.id}`}
//                         className="view-btn"
//                         style={{
//                           padding: '6px 12px',
//                           fontSize: '0.8rem',
//                           backgroundColor: '#17a2b8',
//                           color: 'white',
//                           textDecoration: 'none',
//                           borderRadius: '3px',
//                           marginRight: '5px'
//                         }}
//                         title="View Details"
//                       >
//                         View
//                       </Link>
//                       <button
//                         className={user.status === 'active' ? 'cancel-btn' : 'submit-btn'}
//                         onClick={() => toggleUserStatus(user.id, user.status)}
//                         disabled={updating === user.id}
//                         style={{
//                           padding: '6px 12px',
//                           fontSize: '0.8rem',
//                           border: 'none',
//                           borderRadius: '3px',
//                           cursor: updating === user.id ? 'not-allowed' : 'pointer',
//                           backgroundColor: user.status === 'active' ? '#dc3545' : '#28a745',
//                           color: 'white',
//                           marginRight: '5px',
//                           opacity: updating === user.id ? 0.6 : 1
//                         }}
//                         title={user.status === 'active' ? 'Deactivate' : 'Activate'}
//                       >
//                         {updating === user.id 
//                           ? 'Updating...' 
//                           : (user.status === 'active' ? 'Deactivate' : 'Activate')
//                         }
//                       </button>
//                       <button
//                         className="delete-btn"
//                         onClick={() => handleDeleteUser(user.id, user.fullName)}
//                         style={{
//                           padding: '6px 12px',
//                           fontSize: '0.8rem',
//                           backgroundColor: '#dc3545',
//                           color: 'white',
//                           border: 'none',
//                           borderRadius: '3px',
//                           cursor: 'pointer'
//                         }}
//                         title="Delete User"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
//         <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>User Management Tips:</h4>
//         <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
//           <li>Deactivated users cannot log in but their data is preserved</li>
//           <li>Admin users have full system access - use carefully</li>
//           <li>View user details to see their complete reservation history</li>
//           <li>Contact information can be used for customer support</li>
//           <li>Real-time updates: Changes are reflected immediately across all sessions</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default UsersList;
//******************************************************************************************************** */










// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// const UsersList = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     // Simulate loading users from Firebase
//     const loadUsers = async () => {
//       try {
//         // Mock data - replace with actual Firebase call
//         const mockUsers = [
//           {
//             id: '1',
//             fullName: 'John Doe',
//             email: 'john.doe@email.com',
//             phone: '+1234567890',
//             role: 'user',
//             status: 'active',
//             totalOrders: 5,
//             joinDate: '2024-01-15',
//             lastLogin: '2024-06-01'
//           },
//           {
//             id: '2',
//             fullName: 'Jane Smith',
//             email: 'jane.smith@email.com',
//             phone: '+1234567891',
//             role: 'user',
//             status: 'active',
//             totalOrders: 3,
//             joinDate: '2024-02-20',
//             lastLogin: '2024-05-28'
//           },
//           {
//             id: '3',
//             fullName: 'Mike Johnson',
//             email: 'mike.johnson@email.com',
//             phone: '+1234567892',
//             role: 'admin',
//             status: 'active',
//             totalOrders: 0,
//             joinDate: '2024-01-01',
//             lastLogin: '2024-06-02'
//           },
//           {
//             id: '4',
//             fullName: 'Sarah Wilson',
//             email: 'sarah.wilson@email.com',
//             phone: '+1234567893',
//             role: 'user',
//             status: 'inactive',
//             totalOrders: 1,
//             joinDate: '2024-03-10',
//             lastLogin: '2024-04-15'
//           }
//         ];
        
//         setUsers(mockUsers);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error loading users:', error);
//         setLoading(false);
//       }
//     };

//     loadUsers();
//   }, []);

//   const handleDeleteUser = async (userId, userName) => {
//     if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
//       try {
//         // Here you would delete the user from Firebase
//         setUsers(users.filter(user => user.id !== userId));
//         alert('User deleted successfully!');
//       } catch (error) {
//         console.error('Error deleting user:', error);
//         alert('Error deleting user. Please try again.');
//       }
//     }
//   };

//   const toggleUserStatus = async (userId) => {
//     try {
//       setUsers(users.map(user => 
//         user.id === userId 
//           ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
//           : user
//       ));
//       alert('User status updated successfully!');
//     } catch (error) {
//       console.error('Error updating user status:', error);
//       alert('Error updating user status. Please try again.');
//     }
//   };

//   const filteredUsers = users.filter(user =>
//     user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     user.email.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="page-header">
//         <h1>Users Management</h1>
//         <p>Manage user accounts and permissions</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>All Users ({filteredUsers.length})</h2>
//           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
//             <input
//               type="text"
//               placeholder="Search users..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{
//                 padding: '8px 12px',
//                 border: '1px solid #ddd',
//                 borderRadius: '5px',
//                 fontSize: '0.9rem'
//               }}
//             />
//             <Link to="/add-user" className="add-btn">
//               + Add User
//             </Link>
//           </div>
//         </div>

//         {filteredUsers.length === 0 ? (
//           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
//             <h3>No users found</h3>
//             <p>Try adjusting your search terms or add a new user.</p>
//           </div>
//         ) : (
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>User</th>
//                 <th>Contact</th>
//                 <th>Role</th>
//                 <th>Orders</th>
//                 <th>Status</th>
//                 <th>Join Date</th>
//                 <th>Last Login</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredUsers.map(user => (
//                 <tr key={user.id}>
//                   <td>
//                     <div>
//                       <div style={{ fontWeight: '600', color: '#333' }}>
//                         {user.fullName}
//                       </div>
//                       <div style={{ fontSize: '0.85rem', color: '#666' }}>
//                         {user.email}
//                       </div>
//                     </div>
//                   </td>
//                   <td>
//                     <div style={{ fontSize: '0.9rem' }}>
//                       {user.phone || 'Not provided'}
//                     </div>
//                   </td>
//                   <td>
//                     <span className={`status-badge ${user.role === 'admin' ? 'confirmed' : 'pending'}`}>
//                       {user.role}
//                     </span>
//                   </td>
//                   <td>
//                     <div style={{ textAlign: 'center', fontWeight: '600' }}>
//                       {user.totalOrders}
//                     </div>
//                   </td>
//                   <td>
//                     <span className={`status-badge ${user.status === 'active' ? 'available' : 'unavailable'}`}>
//                       {user.status}
//                     </span>
//                   </td>
//                   <td>
//                     <div style={{ fontSize: '0.9rem' }}>
//                       {new Date(user.joinDate).toLocaleDateString()}
//                     </div>
//                   </td>
//                   <td>
//                     <div style={{ fontSize: '0.9rem' }}>
//                       {new Date(user.lastLogin).toLocaleDateString()}
//                     </div>
//                   </td>
//                   <td>
//                     <div className="action-buttons">
//                       <button
//                         className="view-btn"
//                         onClick={() => alert(`Viewing details for ${user.fullName}`)}
//                         title="View Details"
//                       >
//                         View
//                       </button>
//                       <button
//                         className={user.status === 'active' ? 'cancel-btn' : 'submit-btn'}
//                         onClick={() => toggleUserStatus(user.id)}
//                         style={{
//                           padding: '6px 12px',
//                           fontSize: '0.8rem',
//                           border: 'none',
//                           borderRadius: '3px',
//                           cursor: 'pointer'
//                         }}
//                         title={user.status === 'active' ? 'Deactivate' : 'Activate'}
//                       >
//                         {user.status === 'active' ? 'Deactivate' : 'Activate'}
//                       </button>
//                       <button
//                         className="delete-btn"
//                         onClick={() => handleDeleteUser(user.id, user.fullName)}
//                         title="Delete User"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
//         <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>User Management Tips:</h4>
//         <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
//           <li>Deactivated users cannot log in but their data is preserved</li>
//           <li>Admin users have full system access - use carefully</li>
//           <li>View user details to see their complete reservation history</li>
//           <li>Contact information can be used for customer support</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default UsersList;