import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase.js';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [updatingExpired, setUpdatingExpired] = useState(false);

  // Function to check if booking is expired
  const isBookingExpired = (endDate) => {
    if (!endDate) return false;
    
    try {
      let end;
      if (endDate.seconds) {
        end = new Date(endDate.seconds * 1000);
      } else if (endDate.toDate) {
        end = endDate.toDate();
      } else {
        end = new Date(endDate);
      }
      
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset to start of day
      end.setHours(23, 59, 59, 999); // Set to end of day
      
      return now > end;
    } catch (error) {
      console.error('Error checking expiry:', error);
      return false;
    }
  };

  // Function to get booking status (active, expired, cancelled, etc.)
  const getBookingStatus = (order) => {
    const currentStatus = order.status?.toLowerCase();
    
    // If already cancelled or completed, return as is
    if (currentStatus === 'cancelled' || currentStatus === 'completed') {
      return currentStatus;
    }
    
    // Check if booking is expired
    if (isBookingExpired(order.endDate)) {
      return 'expired';
    }
    
    // Return current status or default
    return currentStatus || 'pending';
  };

  // Function to auto-update expired bookings
  const updateExpiredBookings = async () => {
    if (updatingExpired) return;
    
    setUpdatingExpired(true);
    try {
      const batch = writeBatch(db);
      let hasUpdates = false;
      
      orders.forEach(order => {
        const currentStatus = order.status?.toLowerCase();
        
        // Only update if not already cancelled/completed and is expired
        if (currentStatus !== 'cancelled' && 
            currentStatus !== 'completed' && 
            currentStatus !== 'expired' &&
            isBookingExpired(order.endDate)) {
          
          const orderRef = doc(db, 'orders', order.id);
          batch.update(orderRef, {
            status: 'expired',
            autoExpiredAt: new Date(),
            updatedAt: new Date()
          });
          hasUpdates = true;
        }
      });
      
      if (hasUpdates) {
        await batch.commit();
        console.log('Expired bookings updated successfully');
      }
    } catch (error) {
      console.error('Error updating expired bookings:', error);
    } finally {
      setUpdatingExpired(false);
    }
  };

  useEffect(() => {
    const fetchUsersAndOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch all users
        const usersQuery = collection(db, 'users');
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = {};
        
        usersSnapshot.forEach((doc) => {
          usersData[doc.id] = doc.data();
        });
        
        console.log('Fetched users:', usersData);
        setUsers(usersData);
        
        // Then, set up real-time listener for orders
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          const ordersData = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            ordersData.push({
              id: doc.id,
              ...data
            });
          });
          console.log('Fetched orders:', ordersData);
          setOrders(ordersData);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching orders:', error);
          setError('Failed to load orders. Please try again.');
          setLoading(false);
        });

        // Cleanup function to unsubscribe from the listener
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up orders listener:', error);
        setError('Failed to load orders. Please try again.');
        setLoading(false);
      }
    };

    fetchUsersAndOrders();
  }, []);

  // Auto-update expired bookings every minute
  useEffect(() => {
    if (orders.length > 0) {
      updateExpiredBookings();
      
      const interval = setInterval(() => {
        updateExpiredBookings();
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [orders]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-badge pending';
      case 'confirmed': return 'status-badge confirmed';
      case 'delivered': return 'status-badge delivered';
      case 'completed': return 'status-badge completed';
      case 'cancelled': return 'status-badge cancelled';
      case 'expired': return 'status-badge expired';
      default: return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'delivered': return 'Delivered';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return status || 'Unknown';
    }
  };

  // Function to calculate days between two dates
  const calculateTotalDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    try {
      let start, end;
      
      // Handle Firestore Timestamp objects
      if (startDate.seconds) {
        start = new Date(startDate.seconds * 1000);
      } else if (startDate.toDate) {
        start = startDate.toDate();
      } else {
        start = new Date(startDate);
      }
      
      if (endDate.seconds) {
        end = new Date(endDate.seconds * 1000);
      } else if (endDate.toDate) {
        end = endDate.toDate();
      } else {
        end = new Date(endDate);
      }
      
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff > 0 ? daysDiff : 1;
    } catch (error) {
      console.error('Error calculating days:', error);
      return 0;
    }
  };

  // Function to get user display name from users collection
  const getUserDisplayName = (order) => {
    if (order.userId && users[order.userId]) {
      const user = users[order.userId];
      const possibleNames = [
        user.fullName,
        user.name,
        user.userName,
        user.displayName,
        user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null
      ];
      
      const name = possibleNames.find(n => n && n.trim() !== '');
      if (name) return name;
    }
    
    const possibleNames = [
      order.userName,
      order.fullName,
      order.user?.name,
      order.user?.fullName,
      order.customerName,
      order.name
    ];
    
    const name = possibleNames.find(n => n && n.trim() !== '');
    return name || 'Unknown User';
  };

  // Function to get user email
  const getUserEmail = (order) => {
    if (order.userId && users[order.userId]) {
      const user = users[order.userId];
      if (user.email) return user.email;
    }
    
    const possibleEmails = [
      order.userEmail,
      order.email,
      order.user?.email,
      order.customerEmail
    ];
    
    const email = possibleEmails.find(e => e && e.trim() !== '');
    return email || 'No email';
  };

  // Function to handle license image view
  const handleViewLicense = (base64Image) => {
    if (base64Image) {
      const newWindow = window.open();
      newWindow.document.write(`
        <html>
          <head>
            <title>Driving License</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
              img { max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
            </style>
          </head>
          <body>
            <img src="data:image/jpeg;base64,${base64Image}" alt="Driving License" />
          </body>
        </html>
      `);
    }
  };

  const filteredOrders = orders.filter(order => {
    const userName = getUserDisplayName(order);
    const userEmail = getUserEmail(order);
    const bookingStatus = getBookingStatus(order);
    
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.carName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && ['pending', 'confirmed', 'delivered'].includes(bookingStatus)) ||
      (filterStatus === 'expired' && bookingStatus === 'expired') ||
      bookingStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        console.log('Order deleted successfully');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  // Calculate statistics properly
  const getOrderStats = () => {
    const stats = {
      pending: 0,
      confirmed: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      expired: 0,
      active: 0
    };
    
    orders.forEach(order => {
      const bookingStatus = getBookingStatus(order);
      if (stats.hasOwnProperty(bookingStatus)) {
        stats[bookingStatus]++;
      }
      
      // Count active bookings
      if (['pending', 'confirmed', 'delivered'].includes(bookingStatus)) {
        stats.active++;
      }
    });
    
    console.log('Order stats:', stats, 'Total orders:', orders.length);
    return stats;
  };

  const stats = getOrderStats();

  // Function to get days remaining or expired
  const getDaysStatus = (endDate) => {
    if (!endDate) return 'N/A';
    
    try {
      let end;
      if (endDate.seconds) {
        end = new Date(endDate.seconds * 1000);
      } else if (endDate.toDate) {
        end = endDate.toDate();
      } else {
        end = new Date(endDate);
      }
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      const timeDiff = end.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff < 0) {
        return `Expired ${Math.abs(daysDiff)} days ago`;
      } else if (daysDiff === 0) {
        return 'Expires today';
      } else if (daysDiff === 1) {
        return 'Expires tomorrow';
      } else {
        return `${daysDiff} days remaining`;
      }
    } catch (error) {
      console.error('Error calculating days status:', error);
      return 'N/A';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <h2>Loading orders...</h2>
          <p>Please wait while we fetch your orders.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <style jsx>{`
        .status-badge {
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          display: inline-block;
          min-width: 70px;
          text-align: center;
        }
        
        .status-badge.pending {
          background-color: #ff9800;
          color: #fff;
          border: 1px solid #f57c00;
        }
        
        .status-badge.confirmed {
          background-color: #4caf50;
          color: #fff;
          border: 1px solid #388e3c;
        }
        
        .status-badge.delivered {
          background-color: #2196f3;
          color: #fff;
          border: 1px solid #1976d2;
        }
        
        .status-badge.completed {
          background-color: #9c27b0;
          color: #fff;
          border: 1px solid #7b1fa2;
        }
        
        .status-badge.cancelled {
          background-color: #f44336;
          color: #fff;
          border: 1px solid #d32f2f;
        }
        
        .status-badge.expired {
          background-color: #ff5722;
          color: #fff;
          border: 1px solid #d84315;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .expired-row {
          background-color: #fff3e0;
          border-left: 4px solid #ff5722;
        }
        
        .expires-soon {
          color: #ff9800;
          font-weight: bold;
        }
        
        .expired-text {
          color: #f44336;
          font-weight: bold;
        }
        
        .days-remaining {
          color: #4caf50;
          font-weight: bold;
        }
        
        .stat-card {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .stat-icon {
          font-size: 24px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-icon.pending {
          background-color: #fff3e0;
        }
        
        .stat-icon.confirmed {
          background-color: #e8f5e8;
        }
        
        .stat-icon.delivered {
          background-color: #e3f2fd;
        }
        
        .stat-icon.active {
          background-color: #f3e5f5;
        }
        
        .stat-icon.expired {
          background-color: #ffebee;
        }
        
        .stat-icon.cancelled {
          background-color: #ffebee;
        }
        
        .stat-info h3 {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        
        .stat-info p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .price {
          font-weight: bold;
          color: #4caf50;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .edit-btn {
          background-color: #2196f3;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 12px;
        }
        
        .delete-btn {
          background-color: #f44336;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 12px;
        }
        
        .update-status {
          background-color: #ff9800;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          margin-left: 10px;
        }
        
        .update-status:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .license-image {
          max-width: 40px;
          max-height: 40px;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid #ddd;
          object-fit: cover;
        }
        
        .license-image:hover {
          border-color: #2196f3;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        
        .license-status {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .license-verified {
          color: #4caf50;
          font-size: 12px;
        }
        
        .license-unverified {
          color: #ff9800;
          font-size: 12px;
        }
        
        .license-not-uploaded {
          color: #f44336;
          font-size: 12px;
        }
        
        .view-license-btn {
          background-color: #2196f3;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          border: none;
          cursor: pointer;
          font-size: 10px;
          margin-top: 2px;
        }
        
        .view-license-btn:hover {
          background-color: #1976d2;
        }
      `}</style>
      
      <div className="page-header">
        <h1>Orders Management</h1>
        <p>View and manage all reservation orders</p>
        {updatingExpired && (
          <div style={{ color: '#ff9800', fontSize: '14px', marginTop: '10px' }}>
            🔄 Updating expired bookings...
          </div>
        )}
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Orders List ({filteredOrders.length})</h2>
          <div className="table-tools">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Bookings</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={updateExpiredBookings}
              disabled={updatingExpired}
              className="update-status"
            >
              {updatingExpired ? 'Updating...' : 'Update Expired'}
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <h3>No orders found</h3>
            <p>No orders match your search criteria.</p>
          </div>
        ) : (
          <div className="recent-orders-container">
            <table className="data-table recent-orders">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Car</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total Days</th>
                  <th>Days Status</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>License</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const displayName = getUserDisplayName(order);
                  const displayEmail = getUserEmail(order);
                  const bookingStatus = getBookingStatus(order);
                  const isExpired = bookingStatus === 'expired';
                  
                  // Calculate total days
                  let totalDays = 0;
                  if (order.totalDays && order.totalDays > 0) {
                    totalDays = order.totalDays;
                  } else if (order.days && order.days > 0) {
                    totalDays = order.days;
                  } else if (order.startDate && order.endDate) {
                    totalDays = calculateTotalDays(order.startDate, order.endDate);
                  }
                  
                  const daysStatus = getDaysStatus(order.endDate);
                  
                  return (
                    <tr key={order.id} className={isExpired ? 'expired-row' : ''}>
                      <td>
                        <strong>{displayName}</strong><br />
                        <small>{displayEmail}</small>
                      </td>
                      <td>{order.carName || order.car?.name || 'Unknown Car'}</td>
                      <td>
                        {order.startDate ? 
                          new Date(order.startDate.seconds ? order.startDate.seconds * 1000 : order.startDate).toLocaleDateString() 
                          : 'N/A'
                        }
                      </td>
                      <td>
                        {order.endDate ? 
                          new Date(order.endDate.seconds ? order.endDate.seconds * 1000 : order.endDate).toLocaleDateString() 
                          : 'N/A'
                        }
                      </td>
                      <td>{totalDays > 0 ? `${totalDays} days` : 'N/A'}</td>
                      <td>
                        <span className={
                          daysStatus.includes('Expired') ? 'expired-text' :
                          daysStatus.includes('today') || daysStatus.includes('tomorrow') ? 'expires-soon' :
                          'days-remaining'
                        }>
                          {daysStatus}
                        </span>
                      </td>
                      <td className="price">${order.totalPrice || order.price || '0'}</td>
                      <td>
                        <span className={getStatusBadgeClass(bookingStatus)}>
                          {getStatusText(bookingStatus)}
                        </span>
                      </td>
                      <td>
                        <div className="license-status">
                          {order.licenseImageBase64 ? (
                            <div>
                              <img 
                                src={`data:image/jpeg;base64,${order.licenseImageBase64}`}
                                alt="License"
                                className="license-image"
                                onClick={() => handleViewLicense(order.licenseImageBase64)}
                                title="Click to view full image"
                              />
                              <div>
                                <span className={order.licenseVerified ? 'license-verified' : 'license-unverified'}>
                                  {order.licenseVerified ? '✓ Verified' : '⚠ Unverified'}
                                </span>
                              </div>
                              <button 
                                className="view-license-btn"
                                onClick={() => handleViewLicense(order.licenseImageBase64)}
                              >
                                View
                              </button>
                            </div>
                          ) : (
                            <span className="license-not-uploaded">
                              ❌ Not uploaded
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {order.createdAt ? 
                          new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString() 
                          : 'N/A'
                        }
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/edit-order/${order.id}`} className="edit-btn">Edit</Link>
                          <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active">🔥</div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Active Bookings</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">📋</div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon confirmed">✅</div>
          <div className="stat-info">
            <h3>{stats.confirmed}</h3>
            <p>Confirmed Orders</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon expired">⏰</div>
          <div className="stat-info">
            <h3>{stats.expired}</h3>
            <p>Expired Bookings</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon cancelled">❌</div>
          <div className="stat-info">
            <h3>{stats.cancelled}</h3>
            <p>Cancelled Orders</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
//ce code vrai mias sans colone image driving license
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { 
//   collection, 
//   getDocs, 
//   deleteDoc, 
//   doc, 
//   onSnapshot, 
//   query, 
//   orderBy,
//   where,
//   updateDoc,
//   writeBatch
// } from 'firebase/firestore';
// import { db } from '../firebase.js';

// const OrdersList = () => {
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [users, setUsers] = useState({});
//   const [updatingExpired, setUpdatingExpired] = useState(false);

//   // Function to check if booking is expired
//   const isBookingExpired = (endDate) => {
//     if (!endDate) return false;
    
//     try {
//       let end;
//       if (endDate.seconds) {
//         end = new Date(endDate.seconds * 1000);
//       } else if (endDate.toDate) {
//         end = endDate.toDate();
//       } else {
//         end = new Date(endDate);
//       }
      
//       const now = new Date();
//       now.setHours(0, 0, 0, 0); // Reset to start of day
//       end.setHours(23, 59, 59, 999); // Set to end of day
      
//       return now > end;
//     } catch (error) {
//       console.error('Error checking expiry:', error);
//       return false;
//     }
//   };

//   // Function to get booking status (active, expired, cancelled, etc.)
//   const getBookingStatus = (order) => {
//     const currentStatus = order.status?.toLowerCase();
    
//     // If already cancelled or completed, return as is
//     if (currentStatus === 'cancelled' || currentStatus === 'completed') {
//       return currentStatus;
//     }
    
//     // Check if booking is expired
//     if (isBookingExpired(order.endDate)) {
//       return 'expired';
//     }
    
//     // Return current status or default
//     return currentStatus || 'pending';
//   };

//   // Function to auto-update expired bookings
//   const updateExpiredBookings = async () => {
//     if (updatingExpired) return;
    
//     setUpdatingExpired(true);
//     try {
//       const batch = writeBatch(db);
//       let hasUpdates = false;
      
//       orders.forEach(order => {
//         const currentStatus = order.status?.toLowerCase();
        
//         // Only update if not already cancelled/completed and is expired
//         if (currentStatus !== 'cancelled' && 
//             currentStatus !== 'completed' && 
//             currentStatus !== 'expired' &&
//             isBookingExpired(order.endDate)) {
          
//           const orderRef = doc(db, 'orders', order.id);
//           batch.update(orderRef, {
//             status: 'expired',
//             autoExpiredAt: new Date(),
//             updatedAt: new Date()
//           });
//           hasUpdates = true;
//         }
//       });
      
//       if (hasUpdates) {
//         await batch.commit();
//         console.log('Expired bookings updated successfully');
//       }
//     } catch (error) {
//       console.error('Error updating expired bookings:', error);
//     } finally {
//       setUpdatingExpired(false);
//     }
//   };

//   useEffect(() => {
//     const fetchUsersAndOrders = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         // First, fetch all users
//         const usersQuery = collection(db, 'users');
//         const usersSnapshot = await getDocs(usersQuery);
//         const usersData = {};
        
//         usersSnapshot.forEach((doc) => {
//           usersData[doc.id] = doc.data();
//         });
        
//         console.log('Fetched users:', usersData);
//         setUsers(usersData);
        
//         // Then, set up real-time listener for orders
//         const ordersQuery = query(
//           collection(db, 'orders'),
//           orderBy('createdAt', 'desc')
//         );

//         const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
//           const ordersData = [];
//           snapshot.forEach((doc) => {
//             const data = doc.data();
//             ordersData.push({
//               id: doc.id,
//               ...data
//             });
//           });
//           console.log('Fetched orders:', ordersData);
//           setOrders(ordersData);
//           setLoading(false);
//         }, (error) => {
//           console.error('Error fetching orders:', error);
//           setError('Failed to load orders. Please try again.');
//           setLoading(false);
//         });

//         // Cleanup function to unsubscribe from the listener
//         return () => unsubscribe();
//       } catch (error) {
//         console.error('Error setting up orders listener:', error);
//         setError('Failed to load orders. Please try again.');
//         setLoading(false);
//       }
//     };

//     fetchUsersAndOrders();
//   }, []);

//   // Auto-update expired bookings every minute
//   useEffect(() => {
//     if (orders.length > 0) {
//       updateExpiredBookings();
      
//       const interval = setInterval(() => {
//         updateExpiredBookings();
//       }, 60000); // Check every minute
      
//       return () => clearInterval(interval);
//     }
//   }, [orders]);

//   const getStatusBadgeClass = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'pending': return 'status-badge pending';
//       case 'confirmed': return 'status-badge confirmed';
//       case 'delivered': return 'status-badge delivered';
//       case 'completed': return 'status-badge completed';
//       case 'cancelled': return 'status-badge cancelled';
//       case 'expired': return 'status-badge expired';
//       default: return 'status-badge';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'pending': return 'Pending';
//       case 'confirmed': return 'Confirmed';
//       case 'delivered': return 'Delivered';
//       case 'completed': return 'Completed';
//       case 'cancelled': return 'Cancelled';
//       case 'expired': return 'Expired';
//       default: return status || 'Unknown';
//     }
//   };

//   // Function to calculate days between two dates
//   const calculateTotalDays = (startDate, endDate) => {
//     if (!startDate || !endDate) return 0;
    
//     try {
//       let start, end;
      
//       // Handle Firestore Timestamp objects
//       if (startDate.seconds) {
//         start = new Date(startDate.seconds * 1000);
//       } else if (startDate.toDate) {
//         start = startDate.toDate();
//       } else {
//         start = new Date(startDate);
//       }
      
//       if (endDate.seconds) {
//         end = new Date(endDate.seconds * 1000);
//       } else if (endDate.toDate) {
//         end = endDate.toDate();
//       } else {
//         end = new Date(endDate);
//       }
      
//       const timeDiff = end.getTime() - start.getTime();
//       const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
//       return daysDiff > 0 ? daysDiff : 1;
//     } catch (error) {
//       console.error('Error calculating days:', error);
//       return 0;
//     }
//   };

//   // Function to get user display name from users collection
//   const getUserDisplayName = (order) => {
//     if (order.userId && users[order.userId]) {
//       const user = users[order.userId];
//       const possibleNames = [
//         user.fullName,
//         user.name,
//         user.userName,
//         user.displayName,
//         user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null
//       ];
      
//       const name = possibleNames.find(n => n && n.trim() !== '');
//       if (name) return name;
//     }
    
//     const possibleNames = [
//       order.userName,
//       order.fullName,
//       order.user?.name,
//       order.user?.fullName,
//       order.customerName,
//       order.name
//     ];
    
//     const name = possibleNames.find(n => n && n.trim() !== '');
//     return name || 'Unknown User';
//   };

//   // Function to get user email
//   const getUserEmail = (order) => {
//     if (order.userId && users[order.userId]) {
//       const user = users[order.userId];
//       if (user.email) return user.email;
//     }
    
//     const possibleEmails = [
//       order.userEmail,
//       order.email,
//       order.user?.email,
//       order.customerEmail
//     ];
    
//     const email = possibleEmails.find(e => e && e.trim() !== '');
//     return email || 'No email';
//   };

//   const filteredOrders = orders.filter(order => {
//     const userName = getUserDisplayName(order);
//     const userEmail = getUserEmail(order);
//     const bookingStatus = getBookingStatus(order);
    
//     const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.carName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesFilter = filterStatus === 'all' || 
//       (filterStatus === 'active' && ['pending', 'confirmed', 'delivered'].includes(bookingStatus)) ||
//       (filterStatus === 'expired' && bookingStatus === 'expired') ||
//       bookingStatus === filterStatus;
    
//     return matchesSearch && matchesFilter;
//   });

//   const handleDeleteOrder = async (orderId) => {
//     if (window.confirm('Are you sure you want to delete this order?')) {
//       try {
//         await deleteDoc(doc(db, 'orders', orderId));
//         console.log('Order deleted successfully');
//       } catch (error) {
//         console.error('Error deleting order:', error);
//         alert('Failed to delete order. Please try again.');
//       }
//     }
//   };

//   // Calculate statistics properly
//   const getOrderStats = () => {
//     const stats = {
//       pending: 0,
//       confirmed: 0,
//       delivered: 0,
//       completed: 0,
//       cancelled: 0,
//       expired: 0,
//       active: 0
//     };
    
//     orders.forEach(order => {
//       const bookingStatus = getBookingStatus(order);
//       if (stats.hasOwnProperty(bookingStatus)) {
//         stats[bookingStatus]++;
//       }
      
//       // Count active bookings
//       if (['pending', 'confirmed', 'delivered'].includes(bookingStatus)) {
//         stats.active++;
//       }
//     });
    
//     console.log('Order stats:', stats, 'Total orders:', orders.length);
//     return stats;
//   };

//   const stats = getOrderStats();

//   // Function to get days remaining or expired
//   const getDaysStatus = (endDate) => {
//     if (!endDate) return 'N/A';
    
//     try {
//       let end;
//       if (endDate.seconds) {
//         end = new Date(endDate.seconds * 1000);
//       } else if (endDate.toDate) {
//         end = endDate.toDate();
//       } else {
//         end = new Date(endDate);
//       }
      
//       const now = new Date();
//       now.setHours(0, 0, 0, 0);
//       end.setHours(23, 59, 59, 999);
      
//       const timeDiff = end.getTime() - now.getTime();
//       const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
//       if (daysDiff < 0) {
//         return `Expired ${Math.abs(daysDiff)} days ago`;
//       } else if (daysDiff === 0) {
//         return 'Expires today';
//       } else if (daysDiff === 1) {
//         return 'Expires tomorrow';
//       } else {
//         return `${daysDiff} days remaining`;
//       }
//     } catch (error) {
//       console.error('Error calculating days status:', error);
//       return 'N/A';
//     }
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="page-container">
//         <div className="loading-container">
//           <h2>Loading orders...</h2>
//           <p>Please wait while we fetch your orders.</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="page-container">
//         <div className="error-container">
//           <h2>Error</h2>
//           <p>{error}</p>
//           <button onClick={() => window.location.reload()}>Retry</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       <style jsx>{`
//         .status-badge {
//           padding: 6px 12px;
//           border-radius: 12px;
//           font-size: 11px;
//           font-weight: bold;
//           text-transform: uppercase;
//           display: inline-block;
//           min-width: 70px;
//           text-align: center;
//         }
        
//         .status-badge.pending {
//           background-color: #ff9800;
//           color: #fff;
//           border: 1px solid #f57c00;
//         }
        
//         .status-badge.confirmed {
//           background-color: #4caf50;
//           color: #fff;
//           border: 1px solid #388e3c;
//         }
        
//         .status-badge.delivered {
//           background-color: #2196f3;
//           color: #fff;
//           border: 1px solid #1976d2;
//         }
        
//         .status-badge.completed {
//           background-color: #9c27b0;
//           color: #fff;
//           border: 1px solid #7b1fa2;
//         }
        
//         .status-badge.cancelled {
//           background-color: #f44336;
//           color: #fff;
//           border: 1px solid #d32f2f;
//         }
        
//         .status-badge.expired {
//           background-color: #ff5722;
//           color: #fff;
//           border: 1px solid #d84315;
//           animation: pulse 2s infinite;
//         }
        
//         @keyframes pulse {
//           0% { opacity: 1; }
//           50% { opacity: 0.7; }
//           100% { opacity: 1; }
//         }
        
//         .expired-row {
//           background-color: #fff3e0;
//           border-left: 4px solid #ff5722;
//         }
        
//         .expires-soon {
//           color: #ff9800;
//           font-weight: bold;
//         }
        
//         .expired-text {
//           color: #f44336;
//           font-weight: bold;
//         }
        
//         .days-remaining {
//           color: #4caf50;
//           font-weight: bold;
//         }
        
//         .stat-card {
//           background: #fff;
//           border-radius: 8px;
//           padding: 20px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//           display: flex;
//           align-items: center;
//           gap: 15px;
//         }
        
//         .stat-icon {
//           font-size: 24px;
//           width: 50px;
//           height: 50px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
        
//         .stat-icon.pending {
//           background-color: #fff3e0;
//         }
        
//         .stat-icon.confirmed {
//           background-color: #e8f5e8;
//         }
        
//         .stat-icon.delivered {
//           background-color: #e3f2fd;
//         }
        
//         .stat-icon.active {
//           background-color: #f3e5f5;
//         }
        
//         .stat-icon.expired {
//           background-color: #ffebee;
//         }
        
//         .stat-icon.cancelled {
//           background-color: #ffebee;
//         }
        
//         .stat-info h3 {
//           margin: 0;
//           font-size: 24px;
//           font-weight: bold;
//           color: #333;
//         }
        
//         .stat-info p {
//           margin: 0;
//           color: #666;
//           font-size: 14px;
//         }
        
//         .stats-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//           gap: 20px;
//           margin-top: 20px;
//         }
        
//         .price {
//           font-weight: bold;
//           color: #4caf50;
//         }
        
//         .action-buttons {
//           display: flex;
//           gap: 8px;
//         }
        
//         .edit-btn {
//           background-color: #2196f3;
//           color: white;
//           padding: 4px 8px;
//           border-radius: 4px;
//           text-decoration: none;
//           font-size: 12px;
//         }
        
//         .delete-btn {
//           background-color: #f44336;
//           color: white;
//           padding: 4px 8px;
//           border-radius: 4px;
//           border: none;
//           cursor: pointer;
//           font-size: 12px;
//         }
        
//         .update-status {
//           background-color: #ff9800;
//           color: white;
//           padding: 8px 16px;
//           border-radius: 4px;
//           border: none;
//           cursor: pointer;
//           font-size: 12px;
//           margin-left: 10px;
//         }
        
//         .update-status:disabled {
//           background-color: #ccc;
//           cursor: not-allowed;
//         }
//       `}</style>
      
//       <div className="page-header">
//         <h1>Orders Management</h1>
//         <p>View and manage all reservation orders</p>
//         {updatingExpired && (
//           <div style={{ color: '#ff9800', fontSize: '14px', marginTop: '10px' }}>
//             🔄 Updating expired bookings...
//           </div>
//         )}
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>Orders List ({filteredOrders.length})</h2>
//           <div className="table-tools">
//             <input
//               type="text"
//               placeholder="Search orders..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="status-filter"
//             >
//               <option value="all">All Statuses</option>
//               <option value="active">Active Bookings</option>
//               <option value="pending">Pending</option>
//               <option value="confirmed">Confirmed</option>
//               <option value="delivered">Delivered</option>
//               <option value="completed">Completed</option>
//               <option value="expired">Expired</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//             <button
//               onClick={updateExpiredBookings}
//               disabled={updatingExpired}
//               className="update-status"
//             >
//               {updatingExpired ? 'Updating...' : 'Update Expired'}
//             </button>
//           </div>
//         </div>

//         {filteredOrders.length === 0 ? (
//           <div className="no-orders">
//             <h3>No orders found</h3>
//             <p>No orders match your search criteria.</p>
//           </div>
//         ) : (
//           <div className="recent-orders-container">
//             <table className="data-table recent-orders">
//               <thead>
//                 <tr>
//                   <th>User</th>
//                   <th>Car</th>
//                   <th>Start Date</th>
//                   <th>End Date</th>
//                   <th>Total Days</th>
//                   <th>Days Status</th>
//                   <th>Total Price</th>
//                   <th>Status</th>
//                   <th>Order Date</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrders.map(order => {
//                   const displayName = getUserDisplayName(order);
//                   const displayEmail = getUserEmail(order);
//                   const bookingStatus = getBookingStatus(order);
//                   const isExpired = bookingStatus === 'expired';
                  
//                   // Calculate total days
//                   let totalDays = 0;
//                   if (order.totalDays && order.totalDays > 0) {
//                     totalDays = order.totalDays;
//                   } else if (order.days && order.days > 0) {
//                     totalDays = order.days;
//                   } else if (order.startDate && order.endDate) {
//                     totalDays = calculateTotalDays(order.startDate, order.endDate);
//                   }
                  
//                   const daysStatus = getDaysStatus(order.endDate);
                  
//                   return (
//                     <tr key={order.id} className={isExpired ? 'expired-row' : ''}>
//                       <td>
//                         <strong>{displayName}</strong><br />
//                         <small>{displayEmail}</small>
//                       </td>
//                       <td>{order.carName || order.car?.name || 'Unknown Car'}</td>
//                       <td>
//                         {order.startDate ? 
//                           new Date(order.startDate.seconds ? order.startDate.seconds * 1000 : order.startDate).toLocaleDateString() 
//                           : 'N/A'
//                         }
//                       </td>
//                       <td>
//                         {order.endDate ? 
//                           new Date(order.endDate.seconds ? order.endDate.seconds * 1000 : order.endDate).toLocaleDateString() 
//                           : 'N/A'
//                         }
//                       </td>
//                       <td>{totalDays > 0 ? `${totalDays} days` : 'N/A'}</td>
//                       <td>
//                         <span className={
//                           daysStatus.includes('Expired') ? 'expired-text' :
//                           daysStatus.includes('today') || daysStatus.includes('tomorrow') ? 'expires-soon' :
//                           'days-remaining'
//                         }>
//                           {daysStatus}
//                         </span>
//                       </td>
//                       <td className="price">${order.totalPrice || order.price || '0'}</td>
//                       <td>
//                         <span className={getStatusBadgeClass(bookingStatus)}>
//                           {getStatusText(bookingStatus)}
//                         </span>
//                       </td>
//                       <td>
//                         {order.createdAt ? 
//                           new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString() 
//                           : 'N/A'
//                         }
//                       </td>
//                       <td>
//                         <div className="action-buttons">
//                           <Link to={`/edit-order/${order.id}`} className="edit-btn">Edit</Link>
//                           <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn">Delete</button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon active">🔥</div>
//           <div className="stat-info">
//             <h3>{stats.active}</h3>
//             <p>Active Bookings</p>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon pending">📋</div>
//           <div className="stat-info">
//             <h3>{stats.pending}</h3>
//             <p>Pending Orders</p>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon confirmed">✅</div>
//           <div className="stat-info">
//             <h3>{stats.confirmed}</h3>
//             <p>Confirmed Orders</p>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon expired">⏰</div>
//           <div className="stat-info">
//             <h3>{stats.expired}</h3>
//             <p>Expired Bookings</p>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon cancelled">❌</div>
//           <div className="stat-info">
//             <h3>{stats.cancelled}</h3>
//             <p>Cancelled Orders</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrdersList;


//code vari mais sans de automatiqule canceld le order if ddata a terminer
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { 
//   collection, 
//   getDocs, 
//   deleteDoc, 
//   doc, 
//   onSnapshot, 
//   query, 
//   orderBy,
//   where 
// } from 'firebase/firestore';
// import { db } from '../firebase.js';

// const OrdersList = () => {
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [users, setUsers] = useState({});

//   useEffect(() => {
//     const fetchUsersAndOrders = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         // First, fetch all users
//         const usersQuery = collection(db, 'users');
//         const usersSnapshot = await getDocs(usersQuery);
//         const usersData = {};
        
//         usersSnapshot.forEach((doc) => {
//           usersData[doc.id] = doc.data();
//         });
        
//         console.log('Fetched users:', usersData); // Debug log
//         setUsers(usersData);
        
//         // Then, set up real-time listener for orders
//         const ordersQuery = query(
//           collection(db, 'orders'),
//           orderBy('createdAt', 'desc')
//         );

//         const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
//           const ordersData = [];
//           snapshot.forEach((doc) => {
//             const data = doc.data();
//             ordersData.push({
//               id: doc.id,
//               ...data
//             });
//           });
//           console.log('Fetched orders:', ordersData); // Debug log
//           setOrders(ordersData);
//           setLoading(false);
//         }, (error) => {
//           console.error('Error fetching orders:', error);
//           setError('Failed to load orders. Please try again.');
//           setLoading(false);
//         });

//         // Cleanup function to unsubscribe from the listener
//         return () => unsubscribe();
//       } catch (error) {
//         console.error('Error setting up orders listener:', error);
//         setError('Failed to load orders. Please try again.');
//         setLoading(false);
//       }
//     };

//     fetchUsersAndOrders();
//   }, []);

//   const getStatusBadgeClass = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'pending': return 'status-badge pending';
//       case 'confirmed': return 'status-badge confirmed';
//       case 'delivered': return 'status-badge delivered';
//       case 'cancelled': return 'status-badge cancelled';
//       default: return 'status-badge';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'pending': return 'Pending';
//       case 'confirmed': return 'Confirmed';
//       case 'delivered': return 'Delivered';
//       case 'cancelled': return 'Cancelled';
//       default: return status || 'Unknown';
//     }
//   };

//   // Function to calculate days between two dates
//   const calculateTotalDays = (startDate, endDate) => {
//     if (!startDate || !endDate) return 0;
    
//     try {
//       let start, end;
      
//       // Handle Firestore Timestamp objects
//       if (startDate.seconds) {
//         start = new Date(startDate.seconds * 1000);
//       } else if (startDate.toDate) {
//         start = startDate.toDate();
//       } else {
//         start = new Date(startDate);
//       }
      
//       if (endDate.seconds) {
//         end = new Date(endDate.seconds * 1000);
//       } else if (endDate.toDate) {
//         end = endDate.toDate();
//       } else {
//         end = new Date(endDate);
//       }
      
//       const timeDiff = end.getTime() - start.getTime();
//       const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
//       return daysDiff > 0 ? daysDiff : 1; // Minimum 1 day
//     } catch (error) {
//       console.error('Error calculating days:', error);
//       return 0;
//     }
//   };

//   // Function to get user display name from users collection
//   const getUserDisplayName = (order) => {
//     // First try to get user from users collection using userId
//     if (order.userId && users[order.userId]) {
//       const user = users[order.userId];
//       const possibleNames = [
//         user.fullName,
//         user.name,
//         user.userName,
//         user.displayName,
//         user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : null
//       ];
      
//       const name = possibleNames.find(n => n && n.trim() !== '');
//       if (name) return name;
//     }
    
//     // Fallback to order fields if user not found
//     const possibleNames = [
//       order.userName,
//       order.fullName,
//       order.user?.name,
//       order.user?.fullName,
//       order.customerName,
//       order.name
//     ];
    
//     const name = possibleNames.find(n => n && n.trim() !== '');
//     return name || 'Unknown User';
//   };

//   // Function to get user email
//   const getUserEmail = (order) => {
//     // First try to get email from users collection using userId
//     if (order.userId && users[order.userId]) {
//       const user = users[order.userId];
//       if (user.email) return user.email;
//     }
    
//     // Fallback to order email field
//     const possibleEmails = [
//       order.userEmail,
//       order.email,
//       order.user?.email,
//       order.customerEmail
//     ];
    
//     const email = possibleEmails.find(e => e && e.trim() !== '');
//     return email || 'No email';
//   };

//   const filteredOrders = orders.filter(order => {
//     const userName = getUserDisplayName(order);
//     const userEmail = getUserEmail(order);
    
//     const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.carName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       userEmail.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || order.status?.toLowerCase() === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const handleDeleteOrder = async (orderId) => {
//     if (window.confirm('Are you sure you want to delete this order?')) {
//       try {
//         await deleteDoc(doc(db, 'orders', orderId));
//         console.log('Order deleted successfully');
//       } catch (error) {
//         console.error('Error deleting order:', error);
//         alert('Failed to delete order. Please try again.');
//       }
//     }
//   };

//   // Calculate statistics properly
//   const getOrderStats = () => {
//     const stats = {
//       pending: 0,
//       confirmed: 0,
//       delivered: 0,
//       cancelled: 0
//     };
    
//     orders.forEach(order => {
//       const status = order.status?.toLowerCase();
//       if (stats.hasOwnProperty(status)) {
//         stats[status]++;
//       }
//     });
    
//     console.log('Order stats:', stats, 'Total orders:', orders.length); // Debug log
//     return stats;
//   };

//   const stats = getOrderStats();

//   // Loading state
//   if (loading) {
//     return (
//       <div className="page-container">
//         <div className="loading-container">
//           <h2>Loading orders...</h2>
//           <p>Please wait while we fetch your orders.</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="page-container">
//         <div className="error-container">
//           <h2>Error</h2>
//           <p>{error}</p>
//           <button onClick={() => window.location.reload()}>Retry</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       <style jsx>{`
//         .status-badge {
//           padding: 6px 12px;
//           border-radius: 12px;
//           font-size: 11px;
//           font-weight: bold;
//           text-transform: uppercase;
//           display: inline-block;
//           min-width: 70px;
//           text-align: center;
//         }
        
//         .status-badge.pending {
//           background-color: #ff9800;
//           color: #fff;
//           border: 1px solid #f57c00;
//         }
        
//         .status-badge.confirmed {
//           background-color: #4caf50;
//           color: #fff;
//           border: 1px solid #388e3c;
//         }
        
//         .status-badge.delivered {
//           background-color: #2196f3;
//           color: #fff;
//           border: 1px solid #1976d2;
//         }
        
//         .status-badge.cancelled {
//           background-color: #f44336;
//           color: #fff;
//           border: 1px solid #d32f2f;
//         }
        
//         .stat-card {
//           background: #fff;
//           border-radius: 8px;
//           padding: 20px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//           display: flex;
//           align-items: center;
//           gap: 15px;
//         }
        
//         .stat-icon {
//           font-size: 24px;
//           width: 50px;
//           height: 50px;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
        
//         .stat-icon.pending {
//           background-color: #fff3e0;
//         }
        
//         .stat-icon.confirmed {
//           background-color: #e8f5e8;
//         }
        
//         .stat-icon.delivered {
//           background-color: #e3f2fd;
//         }
        
//         .stat-icon.cancelled {
//           background-color: #ffebee;
//         }
        
//         .stat-info h3 {
//           margin: 0;
//           font-size: 24px;
//           font-weight: bold;
//           color: #333;
//         }
        
//         .stat-info p {
//           margin: 0;
//           color: #666;
//           font-size: 14px;
//         }
        
//         .stats-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
//           gap: 20px;
//           margin-top: 20px;
//         }
        
//         .price {
//           font-weight: bold;
//           color: #4caf50;
//         }
        
//         .action-buttons {
//           display: flex;
//           gap: 8px;
//         }
        
//         .edit-btn {
//           background-color: #2196f3;
//           color: white;
//           padding: 4px 8px;
//           border-radius: 4px;
//           text-decoration: none;
//           font-size: 12px;
//         }
        
//         .delete-btn {
//           background-color: #f44336;
//           color: white;
//           padding: 4px 8px;
//           border-radius: 4px;
//           border: none;
//           cursor: pointer;
//           font-size: 12px;
//         }
//       `}</style>
      
//       <div className="page-header">
//         <h1>Orders Management</h1>
//         <p>View and manage all reservation orders</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>Orders List ({filteredOrders.length})</h2>
//           <div className="table-tools">
//             <input
//               type="text"
//               placeholder="Search orders..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="status-filter"
//             >
//               <option value="all">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="confirmed">Confirmed</option>
//               <option value="delivered">Delivered</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//           </div>
//         </div>

//         {filteredOrders.length === 0 ? (
//           <div className="no-orders">
//             <h3>No orders found</h3>
//             <p>No orders match your search criteria.</p>
//           </div>
//         ) : (
//           <div className="recent-orders-container">
//             <table className="data-table recent-orders">
//               <thead>
//                 <tr>
//                   <th>User</th>
//                   <th>Car</th>
//                   <th>Start Date</th>
//                   <th>End Date</th>
//                   <th>Total Days</th>
//                   <th>Total Price</th>
//                   <th>Status</th>
//                   <th>Order Date</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrders.map(order => {
//                   const displayName = getUserDisplayName(order);
//                   const displayEmail = getUserEmail(order);
                  
//                   // Calculate total days with multiple fallbacks
//                   let totalDays = 0;
//                   if (order.totalDays && order.totalDays > 0) {
//                     totalDays = order.totalDays;
//                   } else if (order.days && order.days > 0) {
//                     totalDays = order.days;
//                   } else if (order.startDate && order.endDate) {
//                     totalDays = calculateTotalDays(order.startDate, order.endDate);
//                   }
                  
//                   return (
//                     <tr key={order.id}>
//                       <td>
//                         <strong>{displayName}</strong><br />
//                         <small>{displayEmail}</small>
//                       </td>
//                       <td>{order.carName || order.car?.name || 'Unknown Car'}</td>
//                       <td>
//                         {order.startDate ? 
//                           new Date(order.startDate.seconds ? order.startDate.seconds * 1000 : order.startDate).toLocaleDateString() 
//                           : 'N/A'
//                         }
//                       </td>
//                       <td>
//                         {order.endDate ? 
//                           new Date(order.endDate.seconds ? order.endDate.seconds * 1000 : order.endDate).toLocaleDateString() 
//                           : 'N/A'
//                         }
//                       </td>
//                       <td>{totalDays > 0 ? `${totalDays} days` : 'N/A'}</td>
//                       <td className="price">${order.totalPrice || order.price || '0'}</td>
//                       <td>
//                         <span className={getStatusBadgeClass(order.status)}>
//                           {getStatusText(order.status)}
//                         </span>
//                       </td>
//                       <td>
//                         {order.createdAt ? 
//                           new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString() 
//                           : 'N/A'
//                         }
//                       </td>
//                       <td>
//                         <div className="action-buttons">
//                           <Link to={`/edit-order/${order.id}`} className="edit-btn">Edit</Link>
//                           <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn">Delete</button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon pending">📋</div>
//           <div className="stat-info">
//             <h3>{stats.pending}</h3>
//             <p>Pending Orders</p>
//           </div>
//         </div>
        
//         <div className="stat-card">
//           <div className="stat-icon confirmed">✅</div>
//           <div className="stat-info">
//             <h3>{stats.confirmed}</h3>
//             <p>Confirmed Orders</p>
//           </div>
//         </div>
        
//         {/* <div className="stat-card">
//           <div className="stat-icon delivered">🚗</div>
//           <div className="stat-info">
//             <h3>{stats.delivered}</h3>
//             <p>Delivered Orders</p>
//           </div>
//         </div> */}
        
//         <div className="stat-card">
//           <div className="stat-icon cancelled">❌</div>
//           <div className="stat-info">
//             <h3>{stats.cancelled}</h3>
//             <p>Cancelled Orders</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrdersList;

// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { 
//   collection, 
//   getDocs, 
//   deleteDoc, 
//   doc, 
//   onSnapshot, 
//   query, 
//   orderBy,
//   where 
// } from 'firebase/firestore';
// import { db } from '../firebase.js';
// // import { db } from '../firebase/config'; // Adjust path according to your Firebase config file
// //import './OrdersList.css';

// const OrdersList = () => {
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         // Create a query to get orders ordered by creation date (newest first)
//         const ordersQuery = query(
//           collection(db, 'orders'),
//           orderBy('createdAt', 'desc')
//         );

//         // Set up real-time listener
//         const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
//           const ordersData = [];
//           snapshot.forEach((doc) => {
//             ordersData.push({
//               id: doc.id,
//               ...doc.data()
//             });
//           });
//           setOrders(ordersData);
//           setLoading(false);
//         }, (error) => {
//           console.error('Error fetching orders:', error);
//           setError('Failed to load orders. Please try again.');
//           setLoading(false);
//         });

//         // Cleanup function to unsubscribe from the listener
//         return () => unsubscribe();
//       } catch (error) {
//         console.error('Error setting up orders listener:', error);
//         setError('Failed to load orders. Please try again.');
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//   }, []);

//   const getStatusBadgeClass = (status) => {
//     switch (status) {
//       case 'pending': return 'status-badge pending';
//       case 'confirmed': return 'status-badge confirmed';
//       case 'delivered': return 'status-badge delivered';
//       case 'cancelled': return 'status-badge cancelled';
//       default: return 'status-badge';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'pending': return 'Pending';
//       case 'confirmed': return 'Confirmed';
//       case 'delivered': return 'Delivered';
//       case 'cancelled': return 'Cancelled';
//       default: return status;
//     }
//   };

//   const filteredOrders = orders.filter(order => {
//     const matchesSearch = order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.carName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const handleDeleteOrder = async (orderId) => {
//     if (window.confirm('Are you sure you want to delete this order?')) {
//       try {
//         await deleteDoc(doc(db, 'orders', orderId));
//         // The onSnapshot listener will automatically update the orders state
//         console.log('Order deleted successfully');
//       } catch (error) {
//         console.error('Error deleting order:', error);
//         alert('Failed to delete order. Please try again.');
//       }
//     }
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="page-container">
//         <div className="loading-container">
//           <h2>Loading orders...</h2>
//           <p>Please wait while we fetch your orders.</p>
//         </div>
//       </div>
//     );
//   }

//   // Error state
//   if (error) {
//     return (
//       <div className="page-container">
//         <div className="error-container">
//           <h2>Error</h2>
//           <p>{error}</p>
//           <button onClick={() => window.location.reload()}>Retry</button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Orders Management</h1>
//         <p>View and manage all reservation orders</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>Orders List ({filteredOrders.length})</h2>
//           <div className="table-tools">
//             <input
//               type="text"
//               placeholder="Search orders..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="status-filter"
//             >
//               <option value="all">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="confirmed">Confirmed</option>
//               <option value="delivered">Delivered</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//           </div>
//         </div>

//         {filteredOrders.length === 0 ? (
//           <div className="no-orders">
//             <h3>No orders found</h3>
//             <p>No orders match your search criteria.</p>
//           </div>
//         ) : (
//           <div className="recent-orders-container">
//             <table className="data-table recent-orders">
//               <thead>
//                 <tr>
//                   <th>User</th>
//                   <th>Car</th>
//                   <th>Start Date</th>
//                   <th>End Date</th>
//                   <th>Total Days</th>
//                   <th>Total Price</th>
//                   <th>Status</th>
//                   <th>Order Date</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrders.map(order => (
//                   <tr key={order.id}>
//                     <td>
//                       <strong>{order.userName}</strong><br />
//                       <small>{order.userEmail}</small>
//                     </td>
//                     <td>{order.carName}</td>
//                     <td>{order.startDate ? new Date(order.startDate.seconds ? order.startDate.seconds * 1000 : order.startDate).toLocaleDateString() : 'N/A'}</td>
//                     <td>{order.endDate ? new Date(order.endDate.seconds ? order.endDate.seconds * 1000 : order.endDate).toLocaleDateString() : 'N/A'}</td>
//                     <td>{order.totalDays} days</td>
//                     <td className="price">${order.totalPrice}</td>
//                     <td>
//                       <span className={getStatusBadgeClass(order.status)}>
//                         {getStatusText(order.status)}
//                       </span>
//                     </td>
//                     <td>{order.createdAt ? new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString() : 'N/A'}</td>
//                     <td>
//                       <div className="action-buttons">
//                         <Link to={`/edit-order/${order.id}`} className="edit-btn">Edit</Link>
//                         <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn">Delete</button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <div className="stats-grid">
//         {['pending', 'confirmed', 'delivered', 'cancelled'].map(status => (
//           <div className="stat-card" key={status}>
//             <div className={`stat-icon ${status}`}>
//               {status === 'pending' ? '📋' : status === 'confirmed' ? '✅' : status === 'delivered' ? '🚗' : '❌'}
//             </div>
//             <div className="stat-info">
//               <h3>{orders.filter(o => o.status === status).length}</h3>
//               <p>{getStatusText(status)} Orders</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default OrdersList;


// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// //import './OrdersList.css'; // <-- Make sure this CSS file includes the necessary styles

// const OrdersList = () => {
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   useEffect(() => {
//     const mockOrders = [
//       {
//         id: '1', userName: 'Ahmed Mohamed', userEmail: 'ahmed@example.com', carName: 'Toyota Camry 2023', startDate: '2024-12-15', endDate: '2024-12-20', totalDays: 5, totalPrice: 250, status: 'confirmed', createdAt: '2024-12-10'
//       },
//       {
//         id: '2', userName: 'Fatima Ali', userEmail: 'fatima@example.com', carName: 'Hyundai Elantra 2022', startDate: '2024-12-18', endDate: '2024-12-25', totalDays: 7, totalPrice: 315, status: 'pending', createdAt: '2024-12-12'
//       },
//       {
//         id: '3', userName: 'Khalid Salem', userEmail: 'khalid@example.com', carName: 'Nissan Altima 2023', startDate: '2024-12-22', endDate: '2024-12-28', totalDays: 6, totalPrice: 360, status: 'delivered', createdAt: '2024-12-14'
//       },
//       {
//         id: '4', userName: 'Mariam Hassan', userEmail: 'mariam@example.com', carName: 'Kia Cerato 2022', startDate: '2024-12-20', endDate: '2024-12-24', totalDays: 4, totalPrice: 180, status: 'cancelled', createdAt: '2024-12-11'
//       }
//     ];
//     setOrders(mockOrders);
//   }, []);

//   const getStatusBadgeClass = (status) => {
//     switch (status) {
//       case 'pending': return 'status-badge pending';
//       case 'confirmed': return 'status-badge confirmed';
//       case 'delivered': return 'status-badge delivered';
//       case 'cancelled': return 'status-badge cancelled';
//       default: return 'status-badge';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'pending': return 'Pending';
//       case 'confirmed': return 'Confirmed';
//       case 'delivered': return 'Delivered';
//       case 'cancelled': return 'Cancelled';
//       default: return status;
//     }
//   };

//   const filteredOrders = orders.filter(order => {
//     const matchesSearch = order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.carName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const handleDeleteOrder = (orderId) => {
//     if (window.confirm('Are you sure you want to delete this order?')) {
//       setOrders(orders.filter(order => order.id !== orderId));
//     }
//   };

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Orders Management</h1>
//         <p>View and manage all reservation orders</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>Orders List ({filteredOrders.length})</h2>
//           <div className="table-tools">
//             <input
//               type="text"
//               placeholder="Search orders..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="search-input"
//             />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               className="status-filter"
//             >
//               <option value="all">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="confirmed">Confirmed</option>
//               <option value="delivered">Delivered</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//           </div>
//         </div>

//         {filteredOrders.length === 0 ? (
//           <div className="no-orders">
//             <h3>No orders found</h3>
//             <p>No orders match your search criteria.</p>
//           </div>
//         ) : (
//           <div className="recent-orders-container">
//             <table className="data-table recent-orders">
//               <thead>
//                 <tr>
//                   <th>User</th>
//                   <th>Car</th>
//                   <th>Start Date</th>
//                   <th>End Date</th>
//                   <th>Total Days</th>
//                   <th>Total Price</th>
//                   <th>Status</th>
//                   <th>Order Date</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredOrders.map(order => (
//                   <tr key={order.id}>
//                     <td>
//                       <strong>{order.userName}</strong><br />
//                       <small>{order.userEmail}</small>
//                     </td>
//                     <td>{order.carName}</td>
//                     <td>{new Date(order.startDate).toLocaleDateString()}</td>
//                     <td>{new Date(order.endDate).toLocaleDateString()}</td>
//                     <td>{order.totalDays} days</td>
//                     <td className="price">${order.totalPrice}</td>
//                     <td>
//                       <span className={getStatusBadgeClass(order.status)}>
//                         {getStatusText(order.status)}
//                       </span>
//                     </td>
//                     <td>{new Date(order.createdAt).toLocaleDateString()}</td>
//                     <td>
//                       <div className="action-buttons">
//                         <Link to={`/edit-order/${order.id}`} className="edit-btn">Edit</Link>
//                         <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn">Delete</button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <div className="stats-grid">
//         {['pending', 'confirmed', 'delivered', 'cancelled'].map(status => (
//           <div className="stat-card" key={status}>
//             <div className={`stat-icon ${status}`}>{status === 'pending' ? '📋' : status === 'confirmed' ? '✅' : status === 'delivered' ? '🚗' : '❌'}</div>
//             <div className="stat-info">
//               <h3>{orders.filter(o => o.status === status).length}</h3>
//               <p>{getStatusText(status)} Orders</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default OrdersList;
//**************************************************************** */





















// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// const OrdersList = () => {
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   useEffect(() => {
//     // Simulate fetching orders from Firebase
//     const mockOrders = [
//       {
//         id: '1',
//         userName: 'Ahmed Mohamed',
//         userEmail: 'ahmed@example.com',
//         carName: 'Toyota Camry 2023',
//         startDate: '2024-12-15',
//         endDate: '2024-12-20',
//         totalDays: 5,
//         totalPrice: 250,
//         status: 'confirmed',
//         createdAt: '2024-12-10'
//       },
//       {
//         id: '2',
//         userName: 'Fatima Ali',
//         userEmail: 'fatima@example.com',
//         carName: 'Hyundai Elantra 2022',
//         startDate: '2024-12-18',
//         endDate: '2024-12-25',
//         totalDays: 7,
//         totalPrice: 315,
//         status: 'pending',
//         createdAt: '2024-12-12'
//       },
//       {
//         id: '3',
//         userName: 'Khalid Salem',
//         userEmail: 'khalid@example.com',
//         carName: 'Nissan Altima 2023',
//         startDate: '2024-12-22',
//         endDate: '2024-12-28',
//         totalDays: 6,
//         totalPrice: 360,
//         status: 'delivered',
//         createdAt: '2024-12-14'
//       },
//       {
//         id: '4',
//         userName: 'Mariam Hassan',
//         userEmail: 'mariam@example.com',
//         carName: 'Kia Cerato 2022',
//         startDate: '2024-12-20',
//         endDate: '2024-12-24',
//         totalDays: 4,
//         totalPrice: 180,
//         status: 'cancelled',
//         createdAt: '2024-12-11'
//       }
//     ];
//     setOrders(mockOrders);
//   }, []);

//   const getStatusBadgeClass = (status) => {
//     switch (status) {
//       case 'pending': return 'status-badge pending';
//       case 'confirmed': return 'status-badge confirmed';
//       case 'delivered': return 'status-badge delivered';
//       case 'cancelled': return 'status-badge cancelled';
//       default: return 'status-badge';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'pending': return 'Pending';
//       case 'confirmed': return 'Confirmed';
//       case 'delivered': return 'Delivered';
//       case 'cancelled': return 'Cancelled';
//       default: return status;
//     }
//   };

//   const filteredOrders = orders.filter(order => {
//     const matchesSearch = order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          order.carName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const handleDeleteOrder = (orderId) => {
//     if (window.confirm('Are you sure you want to delete this order?')) {
//       setOrders(orders.filter(order => order.id !== orderId));
//     }
//   };

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Orders Management</h1>
//         <p>View and manage all reservation orders</p>
//       </div>

//       {/* Search and Filter Section */}
//       <div className="table-container">
//         <div className="table-header">
//           <h2>Orders List ({filteredOrders.length})</h2>
//           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
//             <input
//               type="text"
//               placeholder="Search orders..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{
//                 padding: '8px 12px',
//                 border: '2px solid #e0e0e0',
//                 borderRadius: '5px',
//                 fontSize: '0.9rem',
//                 width: '200px'
//               }}
//             />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               style={{
//                 padding: '8px 12px',
//                 border: '2px solid #e0e0e0',
//                 borderRadius: '5px',
//                 fontSize: '0.9rem'
//               }}
//             >
//               <option value="all">All Statuses</option>
//               <option value="pending">Pending</option>
//               <option value="confirmed">Confirmed</option>
//               <option value="delivered">Delivered</option>
//               <option value="cancelled">Cancelled</option>
//             </select>
//           </div>
//         </div>

//         {filteredOrders.length === 0 ? (
//           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
//             <h3>No orders found</h3>
//             <p>No orders match your search criteria.</p>
//           </div>
//         ) : (
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>User</th>
//                 <th>Car</th>
//                 <th>Start Date</th>
//                 <th>End Date</th>
//                 <th>Total Days</th>
//                 <th>Total Price</th>
//                 <th>Status</th>
//                 <th>Order Date</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredOrders.map(order => (
//                 <tr key={order.id}>
//                   <td>
//                     <div>
//                       <strong>{order.userName}</strong>
//                       <br />
//                       <small style={{color: '#666'}}>{order.userEmail}</small>
//                     </div>
//                   </td>
//                   <td>{order.carName}</td>
//                   <td>{new Date(order.startDate).toLocaleDateString()}</td>
//                   <td>{new Date(order.endDate).toLocaleDateString()}</td>
//                   <td>{order.totalDays} days</td>
//                   <td style={{fontWeight: 'bold', color: '#28a745'}}>${order.totalPrice}</td>
//                   <td>
//                     <span className={getStatusBadgeClass(order.status)}>
//                       {getStatusText(order.status)}
//                     </span>
//                   </td>
//                   <td>{new Date(order.createdAt).toLocaleDateString()}</td>
//                   <td>
//                     <div className="action-buttons">
//                       <Link to={`/edit-order/${order.id}`} className="edit-btn">
//                         Edit
//                       </Link>
//                       <button 
//                         onClick={() => handleDeleteOrder(order.id)}
//                         className="delete-btn"
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

//       {/* Summary Cards */}
//       <div className="stats-grid" style={{marginTop: '30px'}}>
//         <div className="stat-card">
//           <div className="stat-icon pending">📋</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'pending').length}</h3>
//             <p>Pending Orders</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon confirmed">✅</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'confirmed').length}</h3>
//             <p>Confirmed Orders</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon delivered">🚗</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
//             <p>Delivered Orders</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon cancelled">❌</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'cancelled').length}</h3>
//             <p>Cancelled Orders</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrdersList;

// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// const OrdersList = () => {
//   const [orders, setOrders] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');

//   useEffect(() => {
//     // Simulate fetching orders from Firebase
//     const mockOrders = [
//       {
//         id: '1',
//         userName: 'أحمد محمد',
//         userEmail: 'ahmed@example.com',
//         carName: 'تويوتا كامري 2023',
//         startDate: '2024-12-15',
//         endDate: '2024-12-20',
//         totalDays: 5,
//         totalPrice: 250,
//         status: 'confirmed',
//         createdAt: '2024-12-10'
//       },
//       {
//         id: '2',
//         userName: 'فاطمة علي',
//         userEmail: 'fatima@example.com',
//         carName: 'هيونداي إلانترا 2022',
//         startDate: '2024-12-18',
//         endDate: '2024-12-25',
//         totalDays: 7,
//         totalPrice: 315,
//         status: 'pending',
//         createdAt: '2024-12-12'
//       },
//       {
//         id: '3',
//         userName: 'خالد سالم',
//         userEmail: 'khalid@example.com',
//         carName: 'نيسان التيما 2023',
//         startDate: '2024-12-22',
//         endDate: '2024-12-28',
//         totalDays: 6,
//         totalPrice: 360,
//         status: 'delivered',
//         createdAt: '2024-12-14'
//       },
//       {
//         id: '4',
//         userName: 'مريم حسن',
//         userEmail: 'mariam@example.com',
//         carName: 'كيا سيراتو 2022',
//         startDate: '2024-12-20',
//         endDate: '2024-12-24',
//         totalDays: 4,
//         totalPrice: 180,
//         status: 'cancelled',
//         createdAt: '2024-12-11'
//       }
//     ];
//     setOrders(mockOrders);
//   }, []);

//   const getStatusBadgeClass = (status) => {
//     switch (status) {
//       case 'pending': return 'status-badge pending';
//       case 'confirmed': return 'status-badge confirmed';
//       case 'delivered': return 'status-badge delivered';
//       case 'cancelled': return 'status-badge cancelled';
//       default: return 'status-badge';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status) {
//       case 'pending': return 'في الانتظار';
//       case 'confirmed': return 'مؤكد';
//       case 'delivered': return 'مسلم';
//       case 'cancelled': return 'ملغي';
//       default: return status;
//     }
//   };

//   const filteredOrders = orders.filter(order => {
//     const matchesSearch = order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          order.carName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
//     return matchesSearch && matchesFilter;
//   });

//   const handleDeleteOrder = (orderId) => {
//     if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
//       setOrders(orders.filter(order => order.id !== orderId));
//     }
//   };

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>إدارة الطلبات</h1>
//         <p>عرض وإدارة جميع طلبات الحجز</p>
//       </div>

//       {/* Search and Filter Section */}
//       <div className="table-container">
//         <div className="table-header">
//           <h2>قائمة الطلبات ({filteredOrders.length})</h2>
//           <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
//             <input
//               type="text"
//               placeholder="البحث في الطلبات..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{
//                 padding: '8px 12px',
//                 border: '2px solid #e0e0e0',
//                 borderRadius: '5px',
//                 fontSize: '0.9rem',
//                 width: '200px'
//               }}
//             />
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value)}
//               style={{
//                 padding: '8px 12px',
//                 border: '2px solid #e0e0e0',
//                 borderRadius: '5px',
//                 fontSize: '0.9rem'
//               }}
//             >
//               <option value="all">جميع الحالات</option>
//               <option value="pending">في الانتظار</option>
//               <option value="confirmed">مؤكد</option>
//               <option value="delivered">مسلم</option>
//               <option value="cancelled">ملغي</option>
//             </select>
//           </div>
//         </div>

//         {filteredOrders.length === 0 ? (
//           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
//             <h3>لا توجد طلبات</h3>
//             <p>لم يتم العثور على أي طلبات تطابق البحث.</p>
//           </div>
//         ) : (
//           <table className="data-table">
//             <thead>
//               <tr>
//                 <th>المستخدم</th>
//                 <th>السيارة</th>
//                 <th>تاريخ البداية</th>
//                 <th>تاريخ النهاية</th>
//                 <th>عدد الأيام</th>
//                 <th>السعر الكلي</th>
//                 <th>الحالة</th>
//                 <th>تاريخ الطلب</th>
//                 <th>الإجراءات</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredOrders.map(order => (
//                 <tr key={order.id}>
//                   <td>
//                     <div>
//                       <strong>{order.userName}</strong>
//                       <br />
//                       <small style={{color: '#666'}}>{order.userEmail}</small>
//                     </div>
//                   </td>
//                   <td>{order.carName}</td>
//                   <td>{new Date(order.startDate).toLocaleDateString('ar')}</td>
//                   <td>{new Date(order.endDate).toLocaleDateString('ar')}</td>
//                   <td>{order.totalDays} أيام</td>
//                   <td style={{fontWeight: 'bold', color: '#28a745'}}>${order.totalPrice}</td>
//                   <td>
//                     <span className={getStatusBadgeClass(order.status)}>
//                       {getStatusText(order.status)}
//                     </span>
//                   </td>
//                   <td>{new Date(order.createdAt).toLocaleDateString('ar')}</td>
//                   <td>
//                     <div className="action-buttons">
//                       <Link to={`/edit-order/${order.id}`} className="edit-btn">
//                         تعديل
//                       </Link>
//                       <button 
//                         onClick={() => handleDeleteOrder(order.id)}
//                         className="delete-btn"
//                       >
//                         حذف
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Summary Cards */}
//       <div className="stats-grid" style={{marginTop: '30px'}}>
//         <div className="stat-card">
//           <div className="stat-icon pending">📋</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'pending').length}</h3>
//             <p>طلبات في الانتظار</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon confirmed">✅</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'confirmed').length}</h3>
//             <p>طلبات مؤكدة</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon delivered">🚗</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
//             <p>طلبات مسلمة</p>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon cancelled">❌</div>
//           <div className="stat-info">
//             <h3>{orders.filter(o => o.status === 'cancelled').length}</h3>
//             <p>طلبات ملغية</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OrdersList;