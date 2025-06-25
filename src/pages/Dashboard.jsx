import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  onSnapshot 
} from 'firebase/firestore';
import { db } from "../firebase";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCars: 0,
    totalUsers: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch statistics from Firestore
  const fetchStats = async () => {
    try {
      // Fetch orders count and total revenue
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      // Fetch cars count
      const carsSnapshot = await getDocs(collection(db, 'cars'));
      const totalCars = carsSnapshot.size;

      // Fetch users count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      setStats({
        totalOrders,
        totalRevenue,
        totalCars,
        totalUsers
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    }
  };

  // Fetch recent orders from Firestore
  const fetchRecentOrders = () => {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      // Real-time listener for orders
      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentOrders(orders);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching orders:', err);
        setError('Failed to load recent orders');
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      console.error('Error setting up orders listener:', err);
      setError('Failed to setup real-time updates');
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    fetchStats();
    const unsubscribe = fetchRecentOrders();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (dateString && dateString.toDate) {
      // Handle Firestore Timestamp
      return dateString.toDate().toLocaleDateString('en-US');
    }
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'delivered': return '#17a2b8';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px'
        }}>
          Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          fontSize: '18px',
          color: '#dc3545'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div className="dashboard-header" style={{
        marginBottom: '30px'
      }}>
        <h1 style={{ color: '#333', marginBottom: '5px' }}>Dashboard</h1>
        <p style={{ color: '#666', margin: 0 }}>Overview of your car rental system</p>
      </div>

      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div className="stat-card" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="stat-icon orders" style={{
            fontSize: '40px',
            marginRight: '15px'
          }}>📋</div>
          <div className="stat-info">
            <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{stats.totalOrders}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Orders</p>
          </div>
        </div>

        <div className="stat-card" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="stat-icon revenue" style={{
            fontSize: '40px',
            marginRight: '15px'
          }}>💰</div>
          <div className="stat-info">
            <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{formatCurrency(stats.totalRevenue)}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="stat-icon cars" style={{
            fontSize: '40px',
            marginRight: '15px'
          }}>🚗</div>
          <div className="stat-info">
            <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{stats.totalCars}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Cars</p>
          </div>
        </div>

        <div className="stat-card" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div className="stat-icon users" style={{
            fontSize: '40px',
            marginRight: '15px'
          }}>👥</div>
          <div className="stat-info">
            <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{stats.totalUsers}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Users</p>
          </div>
        </div>
      </div>

      <div className="recent-orders" style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Recent Orders</h3>
        {recentOrders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '15px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Car</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Start Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>End Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Total Price</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{order.userName || order.customerName}</td>
                    <td style={{ padding: '12px' }}>{order.carName || order.car}</td>
                    <td style={{ padding: '12px' }}>{formatDate(order.startDate)}</td>
                    <td style={{ padding: '12px' }}>{formatDate(order.endDate)}</td>
                    <td style={{ padding: '12px' }}>{formatCurrency(order.totalPrice || 0)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: getStatusColor(order.status),
                        color: 'white',
                        textTransform: 'capitalize'
                      }}>
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No recent orders found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

// //version sans firebase
// import React, { useState, useEffect } from 'react';

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     totalCars: 0,
//     totalUsers: 0
//   });

//   const [recentOrders, setRecentOrders] = useState([]);

//   useEffect(() => {
//     // Simulated data
//     setStats({
//       totalOrders: 156,
//       totalRevenue: 45280,
//       totalCars: 24,
//       totalUsers: 89
//     });

//     setRecentOrders([
//       {
//         id: 1,
//         userName: 'Ahmed Hassan',
//         carName: 'Toyota Camry',
//         startDate: '2024-03-15',
//         endDate: '2024-03-20',
//         totalPrice: 1250,
//         status: 'confirmed'
//       },
//       {
//         id: 2,
//         userName: 'Fatima Al-Zahra',
//         carName: 'Honda Civic',
//         startDate: '2024-03-18',
//         endDate: '2024-03-22',
//         totalPrice: 980,
//         status: 'pending'
//       },
//       {
//         id: 3,
//         userName: 'Mohammed Ali',
//         carName: 'BMW X5',
//         startDate: '2024-03-20',
//         endDate: '2024-03-25',
//         totalPrice: 2150,
//         status: 'delivered'
//       },
//       {
//         id: 4,
//         userName: 'Layla Ibrahim',
//         carName: 'Mercedes C-Class',
//         startDate: '2024-03-22',
//         endDate: '2024-03-26',
//         totalPrice: 1680,
//         status: 'confirmed'
//       },
//       {
//         id: 5,
//         userName: 'Omar Khoury',
//         carName: 'Hyundai Elantra',
//         startDate: '2024-03-25',
//         endDate: '2024-03-28',
//         totalPrice: 720,
//         status: 'cancelled'
//       }
//     ]);
//   }, []);

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount);
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US');
//   };

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <h1>Dashboard</h1>
//         <p>Overview of your car rental system</p>
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon orders">📋</div>
//           <div className="stat-info">
//             <h3>{stats.totalOrders}</h3>
//             <p>Total Orders</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon revenue">💰</div>
//           <div className="stat-info">
//             <h3>{formatCurrency(stats.totalRevenue)}</h3>
//             <p>Total Revenue</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon cars">🚗</div>
//           <div className="stat-info">
//             <h3>{stats.totalCars}</h3>
//             <p>Total Cars</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon users">👥</div>
//           <div className="stat-info">
//             <h3>{stats.totalUsers}</h3>
//             <p>Total Users</p>
//           </div>
//         </div>
//       </div>

//       <div className="recent-orders">
//         <h3>Recent Orders</h3>
//         <table className="data-table">
//           <thead>
//             <tr>
//               <th>Customer</th>
//               <th>Car</th>
//               <th>Start Date</th>
//               <th>End Date</th>
//               <th>Total Price</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {recentOrders.map(order => (
//               <tr key={order.id}>
//                 <td>{order.userName}</td>
//                 <td>{order.carName}</td>
//                 <td>{formatDate(order.startDate)}</td>
//                 <td>{formatDate(order.endDate)}</td>
//                 <td>{formatCurrency(order.totalPrice)}</td>
//                 <td>
//                   <span className={`status-badge ${order.status}`}>
//                     {order.status === 'pending' && 'Pending'}
//                     {order.status === 'confirmed' && 'Confirmed'}
//                     {order.status === 'delivered' && 'Delivered'}
//                     {order.status === 'cancelled' && 'Cancelled'}
//                   </span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

//************************************************************************************************** */
// import React, { useState, useEffect } from 'react';

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     totalCars: 0,
//     totalUsers: 0
//   });

//   const [recentOrders, setRecentOrders] = useState([]);

//   useEffect(() => {
//     // Simulation de données
//     setStats({
//       totalOrders: 156,
//       totalRevenue: 45280,
//       totalCars: 24,
//       totalUsers: 89
//     });

//     setRecentOrders([
//       {
//         id: 1,
//         userName: 'Ahmed Hassan',
//         carName: 'Toyota Camry',
//         startDate: '2024-03-15',
//         endDate: '2024-03-20',
//         totalPrice: 1250,
//         status: 'confirmed'
//       },
//       {
//         id: 2,
//         userName: 'Fatima Al-Zahra',
//         carName: 'Honda Civic',
//         startDate: '2024-03-18',
//         endDate: '2024-03-22',
//         totalPrice: 980,
//         status: 'pending'
//       },
//       {
//         id: 3,
//         userName: 'Mohammed Ali',
//         carName: 'BMW X5',
//         startDate: '2024-03-20',
//         endDate: '2024-03-25',
//         totalPrice: 2150,
//         status: 'delivered'
//       },
//       {
//         id: 4,
//         userName: 'Layla Ibrahim',
//         carName: 'Mercedes C-Class',
//         startDate: '2024-03-22',
//         endDate: '2024-03-26',
//         totalPrice: 1680,
//         status: 'confirmed'
//       },
//       {
//         id: 5,
//         userName: 'Omar Khoury',
//         carName: 'Hyundai Elantra',
//         startDate: '2024-03-25',
//         endDate: '2024-03-28',
//         totalPrice: 720,
//         status: 'cancelled'
//       }
//     ]);
//   }, []);

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('fr-FR', {
//       style: 'currency',
//       currency: 'EUR'
//     }).format(amount);
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('fr-FR');
//   };

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <h1>Tableau de Bord</h1>
//         <p>Vue d'ensemble de votre système de réservation de voitures</p>
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon orders">📋</div>
//           <div className="stat-info">
//             <h3>{stats.totalOrders}</h3>
//             <p>Total Commandes</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon revenue">💰</div>
//           <div className="stat-info">
//             <h3>{formatCurrency(stats.totalRevenue)}</h3>
//             <p>Revenus Total</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon cars">🚗</div>
//           <div className="stat-info">
//             <h3>{stats.totalCars}</h3>
//             <p>Total Voitures</p>
//           </div>
//         </div>

//         <div className="stat-card">
//           <div className="stat-icon users">👥</div>
//           <div className="stat-info">
//             <h3>{stats.totalUsers}</h3>
//             <p>Total Utilisateurs</p>
//           </div>
//         </div>
//       </div>

//       <div className="recent-orders">
//         <h3>Dernières Commandes</h3>
//         <table className="data-table">
//           <thead>
//             <tr>
//               <th>Client</th>
//               <th>Voiture</th>
//               <th>Date Début</th>
//               <th>Date Fin</th>
//               <th>Prix Total</th>
//               <th>Statut</th>
//             </tr>
//           </thead>
//           <tbody>
//             {recentOrders.map(order => (
//               <tr key={order.id}>
//                 <td>{order.userName}</td>
//                 <td>{order.carName}</td>
//                 <td>{formatDate(order.startDate)}</td>
//                 <td>{formatDate(order.endDate)}</td>
//                 <td>{formatCurrency(order.totalPrice)}</td>
//                 <td>
//                   <span className={`status-badge ${order.status}`}>
//                     {order.status === 'pending' && 'En Attente'}
//                     {order.status === 'confirmed' && 'Confirmé'}
//                     {order.status === 'delivered' && 'Livré'}
//                     {order.status === 'cancelled' && 'Annulé'}
//                   </span>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;