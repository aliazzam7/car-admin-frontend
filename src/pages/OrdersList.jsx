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
  where 
} from 'firebase/firestore';
import { db } from '../firebase.js';
// import { db } from '../firebase/config'; // Adjust path according to your Firebase config file
//import './OrdersList.css';

const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create a query to get orders ordered by creation date (newest first)
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
          const ordersData = [];
          snapshot.forEach((doc) => {
            ordersData.push({
              id: doc.id,
              ...doc.data()
            });
          });
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

    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-badge pending';
      case 'confirmed': return 'status-badge confirmed';
      case 'delivered': return 'status-badge delivered';
      case 'cancelled': return 'status-badge cancelled';
      default: return 'status-badge';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.carName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, 'orders', orderId));
        // The onSnapshot listener will automatically update the orders state
        console.log('Order deleted successfully');
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
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
      <div className="page-header">
        <h1>Orders Management</h1>
        <p>View and manage all reservation orders</p>
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.userName}</strong><br />
                      <small>{order.userEmail}</small>
                    </td>
                    <td>{order.carName}</td>
                    <td>{order.startDate ? new Date(order.startDate.seconds ? order.startDate.seconds * 1000 : order.startDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{order.endDate ? new Date(order.endDate.seconds ? order.endDate.seconds * 1000 : order.endDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{order.totalDays} days</td>
                    <td className="price">${order.totalPrice}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td>{order.createdAt ? new Date(order.createdAt.seconds ? order.createdAt.seconds * 1000 : order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <Link to={`/edit-order/${order.id}`} className="edit-btn">Edit</Link>
                        <button onClick={() => handleDeleteOrder(order.id)} className="delete-btn">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stats-grid">
        {['pending', 'confirmed', 'delivered', 'cancelled'].map(status => (
          <div className="stat-card" key={status}>
            <div className={`stat-icon ${status}`}>
              {status === 'pending' ? '📋' : status === 'confirmed' ? '✅' : status === 'delivered' ? '🚗' : '❌'}
            </div>
            <div className="stat-info">
              <h3>{orders.filter(o => o.status === status).length}</h3>
              <p>{getStatusText(status)} Orders</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersList;
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