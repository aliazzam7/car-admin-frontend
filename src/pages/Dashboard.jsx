
// import React, { useState, useEffect } from 'react';
// import { 
//   collection, 
//   getDocs, 
//   query, 
//   orderBy, 
//   limit,
//   onSnapshot,
//   doc,
//   getDoc 
// } from 'firebase/firestore';
// import { db } from "../firebase";

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     totalOrders: 0,
//     totalRevenue: 0,
//     totalCars: 0,
//     totalUsers: 0
//   });

//   const [recentOrders, setRecentOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch statistics from Firestore
//   const fetchStats = async () => {
//     try {
//       // Fetch orders count and total revenue
//       const ordersSnapshot = await getDocs(collection(db, 'orders'));
//       const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
//       const totalOrders = orders.length;
      
//       // Enhanced revenue calculation with better error handling
//       const totalRevenue = orders.reduce((sum, order) => {
//         // Check multiple possible price fields and convert to number
//         const price = order.totalPrice || order.total || order.price || 0;
//         const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
//         return sum + (isNaN(numericPrice) ? 0 : numericPrice);
//       }, 0);

//       // Fetch cars count
//       const carsSnapshot = await getDocs(collection(db, 'cars'));
//       const totalCars = carsSnapshot.size;

//       // Fetch users count
//       const usersSnapshot = await getDocs(collection(db, 'users'));
//       const totalUsers = usersSnapshot.size;

//       setStats({
//         totalOrders,
//         totalRevenue,
//         totalCars,
//         totalUsers
//       });
//     } catch (err) {
//       console.error('Error fetching stats:', err);
//       setError('Failed to load statistics');
//     }
//   };

//   // Fetch recent orders with user details from Firestore
//   const fetchRecentOrders = () => {
//     try {
//       const ordersQuery = query(
//         collection(db, 'orders'),
//         orderBy('createdAt', 'desc'),
//         limit(5)
//       );

//       // Real-time listener for orders
//       const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
//         try {
//           const orders = snapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//           }));

//           // Fetch user details for each order
//           const ordersWithUserDetails = await Promise.all(
//             orders.map(async (order) => {
//               if (order.userId) {
//                 try {
//                   // Fetch user details from users collection
//                   const usersSnapshot = await getDocs(collection(db, 'users'));
//                   const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  
//                   // Find the user by userId
//                   const user = users.find(u => u.id === order.userId);
                  
//                   if (user) {
//                     return {
//                       ...order,
//                       userName: user.fullName || user.name || user.firstName + ' ' + user.lastName || 'N/A',
//                       userEmail: user.email || order.userEmail || 'N/A'
//                     };
//                   }
//                 } catch (userErr) {
//                   console.error('Error fetching user details:', userErr);
//                 }
//               }
//               return {
//                 ...order,
//                 userName: order.userName || order.customerName || 'N/A',
//                 userEmail: order.userEmail || 'N/A'
//               };
//             })
//           );

//           setRecentOrders(ordersWithUserDetails);
//           setLoading(false);
//         } catch (err) {
//           console.error('Error processing orders with user details:', err);
//           setError('Failed to load recent orders with user details');
//           setLoading(false);
//         }
//       }, (err) => {
//         console.error('Error fetching orders:', err);
//         setError('Failed to load recent orders');
//         setLoading(false);
//       });

//       return unsubscribe;
//     } catch (err) {
//       console.error('Error setting up orders listener:', err);
//       setError('Failed to setup real-time updates');
//       setLoading(false);
//       return null;
//     }
//   };

//   useEffect(() => {
//     fetchStats();
//     const unsubscribe = fetchRecentOrders();

//     // Cleanup function
//     return () => {
//       if (unsubscribe) {
//         unsubscribe();
//       }
//     };
//   }, []);

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD'
//     }).format(amount);
//   };

//   const formatDate = (dateString) => {
//     if (dateString && dateString.toDate) {
//       // Handle Firestore Timestamp
//       return dateString.toDate().toLocaleDateString('en-US');
//     }
//     return new Date(dateString).toLocaleDateString('en-US');
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'confirmed': return '#28a745';
//       case 'pending': return '#ffc107';
//       case 'delivered': return '#17a2b8';
//       case 'cancelled': return '#dc3545';
//       default: return '#6c757d';
//     }
//   };

//   // Enhanced function to get customer name (now with user data fetched)
//   const getCustomerName = (order) => {
//     // First priority: userName from user lookup
//     if (order.userName && order.userName !== 'N/A') {
//       return order.userName;
//     }
    
//     // Fallback to other possible name fields
//     const name = order.customerName || order.name || order.user?.name || order.customer?.name;
//     return name || 'N/A';
//   };

//   // Enhanced function to get total price with proper formatting
//   const getOrderPrice = (order) => {
//     const price = order.totalPrice || order.total || order.price || 0;
//     const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
//     return isNaN(numericPrice) ? 0 : numericPrice;
//   };

//   if (loading) {
//     return (
//       <div className="dashboard">
//         <div className="loading-container" style={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           height: '400px',
//           fontSize: '18px'
//         }}>
//           Loading dashboard data...
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="dashboard">
//         <div className="error-container" style={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           height: '400px',
//           fontSize: '18px',
//           color: '#dc3545'
//         }}>
//           {error}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="dashboard" style={{
//       fontFamily: 'Arial, sans-serif',
//       padding: '20px',
//       backgroundColor: '#f5f5f5',
//       minHeight: '100vh'
//     }}>
//       <div className="dashboard-header" style={{
//         marginBottom: '30px'
//       }}>
//         <h1 style={{ color: '#333', marginBottom: '5px' }}>Dashboard</h1>
//         <p style={{ color: '#666', margin: 0 }}>Overview of your car rental system</p>
//       </div>

//       <div className="stats-grid" style={{
//         display: 'grid',
//         gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//         gap: '20px',
//         marginBottom: '40px'
//       }}>
//         <div className="stat-card" style={{
//           backgroundColor: 'white',
//           padding: '20px',
//           borderRadius: '8px',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center'
//         }}>
//           <div className="stat-icon orders" style={{
//             fontSize: '40px',
//             marginRight: '15px'
//           }}>📋</div>
//           <div className="stat-info">
//             <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{stats.totalOrders}</h3>
//             <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Orders</p>
//           </div>
//         </div>

//         <div className="stat-card" style={{
//           backgroundColor: 'white',
//           padding: '20px',
//           borderRadius: '8px',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center'
//         }}>
//           <div className="stat-icon revenue" style={{
//             fontSize: '40px',
//             marginRight: '15px'
//           }}>💰</div>
//           <div className="stat-info">
//             <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{formatCurrency(stats.totalRevenue)}</h3>
//             <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Revenue</p>
//           </div>
//         </div>

//         <div className="stat-card" style={{
//           backgroundColor: 'white',
//           padding: '20px',
//           borderRadius: '8px',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center'
//         }}>
//           <div className="stat-icon cars" style={{
//             fontSize: '40px',
//             marginRight: '15px'
//           }}>🚗</div>
//           <div className="stat-info">
//             <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{stats.totalCars}</h3>
//             <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Cars</p>
//           </div>
//         </div>

//         <div className="stat-card" style={{
//           backgroundColor: 'white',
//           padding: '20px',
//           borderRadius: '8px',
//           boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center'
//         }}>
//           <div className="stat-icon users" style={{
//             fontSize: '40px',
//             marginRight: '15px'
//           }}>👥</div>
//           <div className="stat-info">
//             <h3 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{stats.totalUsers}</h3>
//             <p style={{ margin: '5px 0 0 0', color: '#666' }}>Total Users</p>
//           </div>
//         </div>
//       </div>

//       <div className="recent-orders" style={{
//         backgroundColor: 'white',
//         padding: '20px',
//         borderRadius: '8px',
//         boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//       }}>
//         <h3 style={{ marginTop: 0, color: '#333' }}>Recent Orders</h3>
//         {recentOrders.length > 0 ? (
//           <div style={{ overflowX: 'auto' }}>
//             <table className="data-table" style={{
//               width: '100%',
//               borderCollapse: 'collapse',
//               marginTop: '15px'
//             }}>
//               <thead>
//                 <tr style={{ backgroundColor: '#f8f9fa' }}>
//                   <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Customer</th>
//                   <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Car</th>
//                   <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Start Date</th>
//                   <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>End Date</th>
//                   <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Total Price</th>
//                   <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {recentOrders.map(order => (
//                   <tr key={order.id} style={{ borderBottom: '1px solid #dee2e6' }}>
//                     <td style={{ padding: '12px' }}>{getCustomerName(order)}</td>
//                     <td style={{ padding: '12px' }}>{order.carName || order.car || 'N/A'}</td>
//                     <td style={{ padding: '12px' }}>{formatDate(order.startDate)}</td>
//                     <td style={{ padding: '12px' }}>{formatDate(order.endDate)}</td>
//                     <td style={{ padding: '12px' }}>{formatCurrency(getOrderPrice(order))}</td>
//                     <td style={{ padding: '12px' }}>
//                       <span style={{
//                         padding: '4px 8px',
//                         borderRadius: '12px',
//                         fontSize: '12px',
//                         fontWeight: 'bold',
//                         backgroundColor: getStatusColor(order.status),
//                         color: 'white',
//                         textTransform: 'capitalize'
//                       }}>
//                         {order.status || 'Unknown'}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <p style={{ color: '#666', fontStyle: 'italic' }}>No recent orders found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const [chartData, setChartData] = useState([]);
const exportChartDataToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(chartData); // chartData هو [{ date: '...', revenue: ... }]
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ChartData');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, 'RevenueChartData.xlsx');
};

const exportChartDataToCSV = () => {
  const worksheet = XLSX.utils.json_to_sheet(chartData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ChartData');

  const csvBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
  const blob = new Blob([csvBuffer], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'RevenueChartData.csv');
};

  const fetchStats = async () => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalOrders = orders.length;

      const totalRevenue = orders.reduce((sum, order) => {
        const price = order.totalPrice || order.total || order.price || 0;
        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
        return sum + (isNaN(numericPrice) ? 0 : numericPrice);
      }, 0);

      const carsSnapshot = await getDocs(collection(db, 'cars'));
      const totalCars = carsSnapshot.size;

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      const groupedByDate = {};
      orders.forEach(order => {
        if (order.createdAt && order.createdAt.toDate) {
          const dateStr = order.createdAt.toDate().toLocaleDateString();
          const amount = typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice || 0);
          if (!groupedByDate[dateStr]) groupedByDate[dateStr] = 0;
          groupedByDate[dateStr] += isNaN(amount) ? 0 : amount;
        }
      });

      const chartArray = Object.keys(groupedByDate).map(date => ({
        date,
        revenue: groupedByDate[date]
      }));

      setChartData(chartArray);

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

  const fetchRecentOrders = () => {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
        try {
          const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          const usersSnapshot = await getDocs(collection(db, 'users'));
          const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const ordersWithUserDetails = await Promise.all(
            orders.map(async (order) => {
              if (order.userId) {
                const user = users.find(u => u.id === order.userId);
                if (user) {
                  return {
                    ...order,
                    userName: user.fullName || user.name || user.firstName + ' ' + user.lastName || 'N/A',
                    userEmail: user.email || order.userEmail || 'N/A'
                  };
                }
              }
              return {
                ...order,
                userName: order.userName || order.customerName || 'N/A',
                userEmail: order.userEmail || 'N/A'
              };
            })
          );

          setRecentOrders(ordersWithUserDetails);
          setLoading(false);
        } catch (err) {
          console.error('Error processing orders with user details:', err);
          setError('Failed to load recent orders with user details');
          setLoading(false);
        }
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
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(amount);

  const formatDate = (dateString) => {
    if (dateString && dateString.toDate) {
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

  const getCustomerName = (order) => {
    if (order.userName && order.userName !== 'N/A') return order.userName;
    const name = order.customerName || order.name || order.user?.name || order.customer?.name;
    return name || 'N/A';
  };

  const getOrderPrice = (order) => {
    const price = order.totalPrice || order.total || order.price || 0;
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numericPrice) ? 0 : numericPrice;
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', height: '400px', alignItems: 'center' }}>Loading dashboard data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', display: 'flex', justifyContent: 'center', height: '400px', alignItems: 'center' }}>{error}</div>;
  }

  const pieData = [
    { name: 'Orders', value: stats.totalOrders },
    { name: 'Cars', value: stats.totalCars },
    { name: 'Users', value: stats.totalUsers }
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#333' }}>Dashboard</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>{stats.totalOrders}</h3><p>Total Orders</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>{formatCurrency(stats.totalRevenue)}</h3><p>Total Revenue</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>{stats.totalCars}</h3><p>Total Cars</p>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>{stats.totalUsers}</h3><p>Total Users</p>
        </div>
      </div>
      
{/* Export Buttons */}
<div style={{ marginBottom: '20px' }}>
  <button
    onClick={exportChartDataToExcel}
    style={{
      marginRight: '10px',
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    Export Chart to Excel
  </button>

  <button
    onClick={exportChartDataToCSV}
    style={{
      padding: '10px 20px',
      backgroundColor: '#17a2b8',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    Export Chart to CSV
  </button>
</div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#ccc" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} fill="#8884d8" label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ gridColumn: '1 / -1', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Revenue Bar Chart</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>Recent Orders</h3>
        {recentOrders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Car</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Start Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>End Date</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Total Price</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>{getCustomerName(order)}</td>
                    <td style={{ padding: '12px' }}>{order.carName || order.car || 'N/A'}</td>
                    <td style={{ padding: '12px' }}>{formatDate(order.startDate)}</td>
                    <td style={{ padding: '12px' }}>{formatDate(order.endDate)}</td>
                    <td style={{ padding: '12px' }}>{formatCurrency(getOrderPrice(order))}</td>
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