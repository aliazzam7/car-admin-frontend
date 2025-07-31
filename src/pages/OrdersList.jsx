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
      <div className="modern-page-container">
        <div className="loading-state">
          <div className="loader-spinner"></div>
          <h2 className="loading-title">Loading orders...</h2>
          <p className="loading-subtitle">Please wait while we fetch your orders.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="modern-page-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-page-container">
      <style jsx>{`
        .modern-page-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .page-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px;
          margin-bottom: 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .page-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
          background-size: 300% 100%;
          animation: gradient-shift 3s ease infinite;
        }

        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .page-header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header p {
          margin: 0;
          color: #666;
          font-size: 1.1rem;
          opacity: 0.8;
        }

        .update-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 500;
          margin-top: 15px;
          animation: pulse-glow 2s infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 152, 0, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 152, 0, 0.5); }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 25px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 30px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--card-color, #667eea), var(--card-color-end, #764ba2));
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        .stat-card.active { --card-color: #4caf50; --card-color-end: #8bc34a; }
        .stat-card.pending { --card-color: #ff9800; --card-color-end: #ffc107; }
        .stat-card.confirmed { --card-color: #4caf50; --card-color-end: #8bc34a; }
        .stat-card.expired { --card-color: #f44336; --card-color-end: #ff5722; }
        .stat-card.cancelled { --card-color: #9e9e9e; --card-color-end: #757575; }

        .stat-icon {
          font-size: 3rem;
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--card-color, #667eea), var(--card-color-end, #764ba2));
          color: white;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .stat-info h3 {
          margin: 0 0 5px 0;
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
        }

        .stat-info p {
          margin: 0;
          color: #666;
          font-size: 1rem;
          font-weight: 500;
        }

        .table-container {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }

        .table-header {
          padding: 30px 40px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .table-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
        }

        .table-tools {
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-input, .status-filter {
          padding: 12px 20px;
          border: 2px solid #e0e7ff;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }

        .search-input:focus, .status-filter:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .update-status {
          background: linear-gradient(135deg, #ff9800, #f57c00);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .update-status:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 152, 0, 0.3);
        }

        .update-status:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }

        .recent-orders-container {
          max-height: 70vh;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #667eea #f1f5f9;
        }

        .recent-orders-container::-webkit-scrollbar {
          width: 8px;
        }

        .recent-orders-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .recent-orders-container::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px;
        }

        .recent-orders-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8, #6b46c1);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
          padding: 20px 15px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          border-bottom: 2px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .data-table td {
          padding: 20px 15px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }

        .data-table tr {
          transition: all 0.2s ease;
        }

        .data-table tr:hover {
          background: rgba(102, 126, 234, 0.05);
        }

        .expired-row {
          background: linear-gradient(135deg, rgba(255, 87, 34, 0.1), rgba(255, 152, 0, 0.05)) !important;
          border-left: 4px solid #ff5722;
        }

        .status-badge {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
          min-width: 90px;
          text-align: center;
          letter-spacing: 0.5px;
        }
        
        .status-badge.pending {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #fff;
          box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
        }
        
        .status-badge.confirmed {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }
        
        .status-badge.delivered {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #fff;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }
        
        .status-badge.completed {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: #fff;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        
        .status-badge.cancelled {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: #fff;
          box-shadow: 0 4px 15px rgba(107, 114, 128, 0.3);
        }
        
        .status-badge.expired {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          animation: pulse-badge 2s infinite;
        }
        
        @keyframes pulse-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .expires-soon {
          color: #f59e0b;
          font-weight: 600;
        }
        
        .expired-text {
          color: #ef4444;
          font-weight: 600;
        }
        
        .days-remaining {
          color: #10b981;
          font-weight: 600;
        }

        .price {
          font-weight: 700;
          font-size: 16px;
          color: #059669;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .edit-btn, .delete-btn {
          padding: 8px 16px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .edit-btn {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .edit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .delete-btn {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
        }

        .delete-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }

        .license-image {
          max-width: 50px;
          max-height: 50px;
          border-radius: 8px;
          cursor: pointer;
          border: 2px solid #e5e7eb;
          object-fit: cover;
          transition: all 0.3s ease;
        }

        .license-image:hover {
          border-color: #3b82f6;
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .license-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .license-verified {
          color: #10b981;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .license-unverified {
          color: #f59e0b;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .license-not-uploaded {
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .view-license-btn {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 10px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .view-license-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .no-orders {
          text-align: center;
          padding: 60px 40px;
          color: #6b7280;
        }

        .no-orders h3 {
          font-size: 1.5rem;
          margin-bottom: 10px;
          color: #374151;
        }

        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }

        .loader-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-title, .error-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
          margin-bottom: 10px;
        }

        .loading-subtitle, .error-message {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
        }

        .error-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .retry-button {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          margin-top: 20px;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .modern-page-container {
            padding: 15px;
          }

          .page-header {
            padding: 25px 20px;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .stat-card {
            padding: 20px;
            gap: 15px;
          }

          .stat-icon {
            width: 60px;
            height: 60px;
            font-size: 2rem;
          }

          .stat-info h3 {
            font-size: 2rem;
          }

          .table-header {
            padding: 20px;
            flex-direction: column;
            align-items: stretch;
          }

          .table-tools {
            justify-content: stretch;
          }

          .search-input, .status-filter, .update-status {
            flex: 1;
            min-width: 0;
          }

          .recent-orders-container {
            max-height: 50vh;
          }

          .data-table {
            font-size: 12px;
          }

          .data-table th, .data-table td {
            padding: 12px 8px;
          }

          .action-buttons {
            flex-direction: column;
            gap: 4px;
          }

          .edit-btn, .delete-btn {
            font-size: 10px;
            padding: 6px 12px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            padding: 15px;
          }

          .table-container {
            margin: 0 -15px;
            border-radius: 0;
          }

          .recent-orders-container {
            max-height: 40vh;
          }
        }
      `}</style>
      
      <div className="page-header">
        <h1>🚗 Orders Management</h1>
        <p>View and manage all reservation orders with real-time updates</p>
        {updatingExpired && (
          <div className="update-indicator">
            <span>🔄</span>
            <span>Updating expired bookings...</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card active">
          <div className="stat-icon">🔥</div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Active Bookings</p>
          </div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        
        <div className="stat-card confirmed">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.confirmed}</h3>
            <p>Confirmed Orders</p>
          </div>
        </div>
        
        <div className="stat-card expired">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>{stats.expired}</h3>
            <p>Expired Bookings</p>
          </div>
        </div>
        
        <div className="stat-card cancelled">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{stats.cancelled}</h3>
            <p>Cancelled Orders</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>📊 Orders List ({filteredOrders.length})</h2>
          <div className="table-tools">
            <input
              type="text"
              placeholder="🔍 Search orders..."
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
              {updatingExpired ? '🔄 Updating...' : '⚡ Update Expired'}
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <h3>📭 No orders found</h3>
            <p>No orders match your search criteria.</p>
          </div>
        ) : (
          <div className="recent-orders-container">
            <table className="data-table recent-orders">
              <thead>
                <tr>
                  <th>👤 User</th>
                  <th>🚗 Car</th>
                  <th>📅 Start Date</th>
                  <th>📅 End Date</th>
                  <th>📊 Total Days</th>
                  <th>⏱️ Days Status</th>
                  <th>💰 Total Price</th>
                  <th>📋 Status</th>
                  <th>🆔 License</th>
                  <th>📆 Order Date</th>
                  <th>⚙️ Actions</th>
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
                        <div>
                          <strong style={{ color: '#374151', fontSize: '14px' }}>{displayName}</strong><br />
                          <small style={{ color: '#6b7280', fontSize: '12px' }}>{displayEmail}</small>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#1f2937' }}>{order.carName || order.car?.name || 'Unknown Car'}</strong>
                      </td>
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
                      <td>
                        <span style={{ fontWeight: '600' }}>
                          {totalDays > 0 ? `${totalDays} days` : 'N/A'}
                        </span>
                      </td>
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
                                👁️ View
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
                          <Link to={`/edit-order/${order.id}`} className="edit-btn">
                            ✏️ Edit
                          </Link>
                          <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn">
                            🗑️ Delete
                          </button>
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
    </div>
  );
};

export default OrdersList;


//hayda el code li tahet howi true bass design ma menih kan
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

//   // Function to handle license image view
//   const handleViewLicense = (base64Image) => {
//     if (base64Image) {
//       const newWindow = window.open();
//       newWindow.document.write(`
//         <html>
//           <head>
//             <title>Driving License</title>
//             <style>
//               body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
//               img { max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
//             </style>
//           </head>
//           <body>
//             <img src="data:image/jpeg;base64,${base64Image}" alt="Driving License" />
//           </body>
//         </html>
//       `);
//     }
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
        
//         .license-image {
//           max-width: 40px;
//           max-height: 40px;
//           border-radius: 4px;
//           cursor: pointer;
//           border: 1px solid #ddd;
//           object-fit: cover;
//         }
        
//         .license-image:hover {
//           border-color: #2196f3;
//           transform: scale(1.05);
//           transition: all 0.2s ease;
//         }
        
//         .license-status {
//           display: flex;
//           align-items: center;
//           gap: 5px;
//         }
        
//         .license-verified {
//           color: #4caf50;
//           font-size: 12px;
//         }
        
//         .license-unverified {
//           color: #ff9800;
//           font-size: 12px;
//         }
        
//         .license-not-uploaded {
//           color: #f44336;
//           font-size: 12px;
//         }
        
//         .view-license-btn {
//           background-color: #2196f3;
//           color: white;
//           padding: 2px 6px;
//           border-radius: 3px;
//           border: none;
//           cursor: pointer;
//           font-size: 10px;
//           margin-top: 2px;
//         }
        
//         .view-license-btn:hover {
//           background-color: #1976d2;
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
//                   <th>License</th>
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
//                         <div className="license-status">
//                           {order.licenseImageBase64 ? (
//                             <div>
//                               <img 
//                                 src={`data:image/jpeg;base64,${order.licenseImageBase64}`}
//                                 alt="License"
//                                 className="license-image"
//                                 onClick={() => handleViewLicense(order.licenseImageBase64)}
//                                 title="Click to view full image"
//                               />
//                               <div>
//                                 <span className={order.licenseVerified ? 'license-verified' : 'license-unverified'}>
//                                   {order.licenseVerified ? '✓ Verified' : '⚠ Unverified'}
//                                 </span>
//                               </div>
//                               <button 
//                                 className="view-license-btn"
//                                 onClick={() => handleViewLicense(order.licenseImageBase64)}
//                               >
//                                 View
//                               </button>
//                             </div>
//                           ) : (
//                             <span className="license-not-uploaded">
//                               ❌ Not uploaded
//                             </span>
//                           )}
//                         </div>
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
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
