import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCars: 0,
    totalUsers: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    // Simulated data
    setStats({
      totalOrders: 156,
      totalRevenue: 45280,
      totalCars: 24,
      totalUsers: 89
    });

    setRecentOrders([
      {
        id: 1,
        userName: 'Ahmed Hassan',
        carName: 'Toyota Camry',
        startDate: '2024-03-15',
        endDate: '2024-03-20',
        totalPrice: 1250,
        status: 'confirmed'
      },
      {
        id: 2,
        userName: 'Fatima Al-Zahra',
        carName: 'Honda Civic',
        startDate: '2024-03-18',
        endDate: '2024-03-22',
        totalPrice: 980,
        status: 'pending'
      },
      {
        id: 3,
        userName: 'Mohammed Ali',
        carName: 'BMW X5',
        startDate: '2024-03-20',
        endDate: '2024-03-25',
        totalPrice: 2150,
        status: 'delivered'
      },
      {
        id: 4,
        userName: 'Layla Ibrahim',
        carName: 'Mercedes C-Class',
        startDate: '2024-03-22',
        endDate: '2024-03-26',
        totalPrice: 1680,
        status: 'confirmed'
      },
      {
        id: 5,
        userName: 'Omar Khoury',
        carName: 'Hyundai Elantra',
        startDate: '2024-03-25',
        endDate: '2024-03-28',
        totalPrice: 720,
        status: 'cancelled'
      }
    ]);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Overview of your car rental system</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orders">📋</div>
          <div className="stat-info">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">💰</div>
          <div className="stat-info">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cars">🚗</div>
          <div className="stat-info">
            <h3>{stats.totalCars}</h3>
            <p>Total Cars</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
      </div>

      <div className="recent-orders">
        <h3>Recent Orders</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Car</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id}>
                <td>{order.userName}</td>
                <td>{order.carName}</td>
                <td>{formatDate(order.startDate)}</td>
                <td>{formatDate(order.endDate)}</td>
                <td>{formatCurrency(order.totalPrice)}</td>
                <td>
                  <span className={`status-badge ${order.status}`}>
                    {order.status === 'pending' && 'Pending'}
                    {order.status === 'confirmed' && 'Confirmed'}
                    {order.status === 'delivered' && 'Delivered'}
                    {order.status === 'cancelled' && 'Cancelled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;


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