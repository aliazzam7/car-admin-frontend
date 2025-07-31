import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path if firebase.js is in different location

const Reports = () => {
  const [carReports, setCarReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get cars and orders from Firestore
        const [carsSnapshot, ordersSnapshot] = await Promise.all([
          getDocs(collection(db, 'cars')),
          getDocs(collection(db, 'orders'))
        ]);

        const cars = [];
        carsSnapshot.forEach(doc => {
          cars.push({ id: doc.id, ...doc.data() });
        });

        const orders = [];
        ordersSnapshot.forEach(doc => {
          orders.push({ id: doc.id, ...doc.data() });
        });

        // Debug info to check IDs matching
        console.log('Cars IDs:', cars.map(car => ({ id: car.id, name: car.carName })));
        console.log('Orders with carId:', orders.map(order => ({ 
          orderId: order.id, 
          carId: order.carId, 
          carName: order.carName,
          userName: order.userName 
        })));

        // Build reports per car with multiple matching strategies
        const reports = cars.map(car => {
          // Strategy 1: Match by carId (most common)
          let carOrders = orders.filter(order => order.carId === car.id);
          
          // Strategy 2: If no match by carId, try matching by carName
          if (carOrders.length === 0) {
            carOrders = orders.filter(order => 
              order.carName && car.carName && 
              order.carName.toLowerCase() === car.carName.toLowerCase()
            );
          }
          
          // Strategy 3: If still no match, try partial name matching
          if (carOrders.length === 0) {
            carOrders = orders.filter(order => 
              order.carName && car.carName && 
              (order.carName.toLowerCase().includes(car.carName.toLowerCase()) ||
               car.carName.toLowerCase().includes(order.carName.toLowerCase()))
            );
          }

          // Calculate totals with null safety
          const totalRevenue = carOrders.reduce((sum, order) => {
            const price = order.totalPrice || 0;
            return sum + price;
          }, 0);
          
          const totalDays = carOrders.reduce((sum, order) => {
            const days = order.totalDays || order.duration || 0;
            return sum + days;
          }, 0);

          // Get unique users who booked this car
          const uniqueUsers = carOrders.reduce((users, order) => {
            const userInfo = {
              name: order.userName || 'Unknown User',
              email: order.userEmail || 'No Email',
              phone: order.userPhone || 'No Phone',
              bookingDate: order.selectedDate || 'Unknown Date',
              notes: order.notes || 'No Notes'
            };
            
            // Avoid duplicate users based on email or userId
            const existingUser = users.find(u => 
              u.email === userInfo.email || 
              (order.userId && users.some(user => user.userId === order.userId))
            );
            
            if (!existingUser) {
              users.push({ ...userInfo, userId: order.userId });
            }
            
            return users;
          }, []);

          return {
            ...car,
            bookings: carOrders.length,
            revenue: totalRevenue,
            days: totalDays,
            orders: carOrders,
            users: uniqueUsers,
            matchedBy: carOrders.length > 0 ? 
              (orders.some(o => o.carId === car.id) ? 'carId' : 'carName') : 'none'
          };
        });

        // Set debug info
        setDebugInfo({
          totalCars: cars.length,
          totalOrders: orders.length,
          carsWithBookings: reports.filter(r => r.bookings > 0).length
        });

        setCarReports(reports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to load reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="reports-page">
        <h1>Car Usage Reports</h1>
        <div className="reports-loading">
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-page">
        <h1>Car Usage Reports</h1>
        <div className="reports-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <h1>Car Usage Reports</h1>
      
      {/* Debug Info */}
      {debugInfo && (
        <div className="reports-debug-info">
          <h4>Debug Info:</h4>
          <p>Total Cars: {debugInfo.totalCars} | Total Orders: {debugInfo.totalOrders} | Cars with Bookings: {debugInfo.carsWithBookings}</p>
        </div>
      )}
      
      {carReports.length === 0 ? (
        <div className="reports-loading">
          <p>No cars found in the database.</p>
        </div>
      ) : (
        <div className="report-list">
          {carReports.map((car, index) => (
            <div 
              key={car.id || index} 
              className={`car-report ${car.bookings > 0 ? 'has-bookings' : ''}`}
            >
              <div className="car-report-header">
                <h2>{car.carName || 'Unknown Car'} - {car.brand || 'Unknown Brand'}</h2>
                {car.matchedBy !== 'none' && (
                  <span className="match-badge">
                    Matched by: {car.matchedBy}
                  </span>
                )}
              </div>
              
              {car.imageUrl && (
                <img
                  src={car.imageUrl}
                  alt={car.carName || 'Car image'}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              
              <div className="car-stats-grid">
                <p>
                  <strong>Times Booked:</strong> 
                  <span className={car.bookings > 0 ? 'metric-positive' : 'metric-zero'}>
                    {car.bookings}
                  </span>
                </p>
                <p>
                  <strong>Total Revenue:</strong> 
                  <span className={car.revenue > 0 ? 'metric-positive' : 'metric-zero'}>
                    ${car.revenue.toFixed(2)}
                  </span>
                </p>
                <p>
                  <strong>Total Days Booked:</strong> 
                  <span className={car.days > 0 ? 'metric-positive' : 'metric-zero'}>
                    {car.days} days
                  </span>
                </p>
                <p><strong>Daily Price:</strong> ${car.dailyPrice || 0}</p>
                <p><strong>Plate Number:</strong> {car.plateNumber || 'N/A'}</p>
                <p><strong>Fuel Type:</strong> {car.fuelType || 'N/A'}</p>
                <p><strong>Transmission:</strong> {car.transmission || 'N/A'}</p>
                <p>
                  <strong>Status:</strong> 
                  <span className={
                    car.status === 'available' ? 'status-available' : 
                    car.status === 'reserved' ? 'status-reserved' : 
                    'status-unavailable'
                  }>
                    {car.status || 'Unknown'}
                  </span>
                </p>
              </div>
              
              {car.features && (
                <div className="car-features">
                  <p><strong>Features:</strong> {car.features}</p>
                </div>
              )}
              
              {car.specialOffer && (
                <div className="car-special-offer">
                  <p><strong>Special Offer:</strong> 
                    <span>{car.specialOffer}</span>
                  </p>
                </div>
              )}

              {/* Users who booked this car */}
              {car.users && car.users.length > 0 && (
                <div className="users-section">
                  <h4>Users who booked this car ({car.users.length}):</h4>
                  {car.users.map((user, userIndex) => (
                    <div key={userIndex} className="user-card">
                      <p><strong>Name:</strong> {user.name}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Phone:</strong> {user.phone}</p>
                      <p><strong>Booking Date:</strong> {user.bookingDate}</p>
                      {user.notes && user.notes !== 'No Notes' && (
                        <p><strong>Notes:</strong> {user.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Show if no bookings found */}
              {car.bookings === 0 && (
                <div className="no-bookings-warning">
                  <p>
                    ⚠️ No bookings found for this car. Car ID: <code>{car.id}</code>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="reports-summary">
        <h3>Summary</h3>
        <p><strong>Total Cars:</strong> <span>{carReports.length}</span></p>
        <p><strong>Cars with Bookings:</strong> <span>{carReports.filter(car => car.bookings > 0).length}</span></p>
        <p><strong>Total Revenue:</strong> <span>${carReports.reduce((sum, car) => sum + car.revenue, 0).toFixed(2)}</span></p>
        <p><strong>Total Bookings:</strong> <span>{carReports.reduce((sum, car) => sum + car.bookings, 0)}</span></p>
        <p><strong>Total Days Booked:</strong> <span>{carReports.reduce((sum, car) => sum + car.days, 0)} days</span></p>
      </div>
    </div>
  );
};

export default Reports;
// import React, { useEffect, useState } from 'react';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '../firebase'; // Adjust path if firebase.js is in different location

// const Reports = () => {
//   const [carReports, setCarReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [debugInfo, setDebugInfo] = useState(null);

//   useEffect(() => {
//     const fetchReports = async () => {
//       setLoading(true);
//       setError(null);
      
//       try {
//         // Get cars and orders from Firestore
//         const [carsSnapshot, ordersSnapshot] = await Promise.all([
//           getDocs(collection(db, 'cars')),
//           getDocs(collection(db, 'orders'))
//         ]);

//         const cars = [];
//         carsSnapshot.forEach(doc => {
//           cars.push({ id: doc.id, ...doc.data() });
//         });

//         const orders = [];
//         ordersSnapshot.forEach(doc => {
//           orders.push({ id: doc.id, ...doc.data() });
//         });

//         // Debug info to check IDs matching
//         console.log('Cars IDs:', cars.map(car => ({ id: car.id, name: car.carName })));
//         console.log('Orders with carId:', orders.map(order => ({ 
//           orderId: order.id, 
//           carId: order.carId, 
//           carName: order.carName,
//           userName: order.userName 
//         })));

//         // Build reports per car with multiple matching strategies
//         const reports = cars.map(car => {
//           // Strategy 1: Match by carId (most common)
//           let carOrders = orders.filter(order => order.carId === car.id);
          
//           // Strategy 2: If no match by carId, try matching by carName
//           if (carOrders.length === 0) {
//             carOrders = orders.filter(order => 
//               order.carName && car.carName && 
//               order.carName.toLowerCase() === car.carName.toLowerCase()
//             );
//           }
          
//           // Strategy 3: If still no match, try partial name matching
//           if (carOrders.length === 0) {
//             carOrders = orders.filter(order => 
//               order.carName && car.carName && 
//               (order.carName.toLowerCase().includes(car.carName.toLowerCase()) ||
//                car.carName.toLowerCase().includes(order.carName.toLowerCase()))
//             );
//           }

//           // Calculate totals with null safety
//           const totalRevenue = carOrders.reduce((sum, order) => {
//             const price = order.totalPrice || 0;
//             return sum + price;
//           }, 0);
          
//           const totalDays = carOrders.reduce((sum, order) => {
//             const days = order.totalDays || order.duration || 0;
//             return sum + days;
//           }, 0);

//           // Get unique users who booked this car
//           const uniqueUsers = carOrders.reduce((users, order) => {
//             const userInfo = {
//               name: order.userName || 'Unknown User',
//               email: order.userEmail || 'No Email',
//               phone: order.userPhone || 'No Phone',
//               bookingDate: order.selectedDate || 'Unknown Date',
//               notes: order.notes || 'No Notes'
//             };
            
//             // Avoid duplicate users based on email or userId
//             const existingUser = users.find(u => 
//               u.email === userInfo.email || 
//               (order.userId && users.some(user => user.userId === order.userId))
//             );
            
//             if (!existingUser) {
//               users.push({ ...userInfo, userId: order.userId });
//             }
            
//             return users;
//           }, []);

//           return {
//             ...car,
//             bookings: carOrders.length,
//             revenue: totalRevenue,
//             days: totalDays,
//             orders: carOrders,
//             users: uniqueUsers,
//             matchedBy: carOrders.length > 0 ? 
//               (orders.some(o => o.carId === car.id) ? 'carId' : 'carName') : 'none'
//           };
//         });

//         // Set debug info
//         setDebugInfo({
//           totalCars: cars.length,
//           totalOrders: orders.length,
//           carsWithBookings: reports.filter(r => r.bookings > 0).length
//         });

//         setCarReports(reports);
//       } catch (error) {
//         console.error('Error fetching reports:', error);
//         setError('Failed to load reports. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchReports();
//   }, []);

//   if (loading) {
//     return (
//       <div className="reports-page" style={{ padding: '20px' }}>
//         <h1>Car Usage Reports</h1>
//         <p>Loading reports...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="reports-page" style={{ padding: '20px' }}>
//         <h1>Car Usage Reports</h1>
//         <p style={{ color: 'red' }}>{error}</p>
//         <button onClick={() => window.location.reload()}>Retry</button>
//       </div>
//     );
//   }

//   return (
//     <div className="reports-page" style={{ padding: '20px' }}>
//       <h1>Car Usage Reports</h1>
      
//       {/* Debug Info */}
//       {debugInfo && (
//         <div style={{ 
//           padding: '10px', 
//           backgroundColor: '#e3f2fd', 
//           borderRadius: '4px', 
//           marginBottom: '20px' 
//         }}>
//           <h4>Debug Info:</h4>
//           <p>Total Cars: {debugInfo.totalCars} | Total Orders: {debugInfo.totalOrders} | Cars with Bookings: {debugInfo.carsWithBookings}</p>
//         </div>
//       )}
      
//       {carReports.length === 0 ? (
//         <p>No cars found in the database.</p>
//       ) : (
//         <div className="report-list">
//           {carReports.map((car, index) => (
//             <div 
//               key={car.id || index} 
//               className="car-report" 
//               style={{
//                 border: car.bookings > 0 ? '2px solid #4caf50' : '1px solid #ccc',
//                 marginBottom: '20px',
//                 padding: '15px',
//                 borderRadius: '8px',
//                 boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//                 backgroundColor: '#fff'
//               }}
//             >
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <h2>{car.carName || 'Unknown Car'} - {car.brand || 'Unknown Brand'}</h2>
//                 {car.matchedBy !== 'none' && (
//                   <span style={{ 
//                     fontSize: '12px', 
//                     color: '#666', 
//                     backgroundColor: '#f0f0f0', 
//                     padding: '2px 6px', 
//                     borderRadius: '4px' 
//                   }}>
//                     Matched by: {car.matchedBy}
//                   </span>
//                 )}
//               </div>
              
//               {car.imageUrl && (
//                 <img
//                   src={car.imageUrl}
//                   alt={car.carName || 'Car image'}
//                   style={{ 
//                     width: '300px', 
//                     height: 'auto', 
//                     marginBottom: '10px',
//                     borderRadius: '4px'
//                   }}
//                   onError={(e) => {
//                     e.target.style.display = 'none';
//                   }}
//                 />
//               )}
              
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
//                 <p><strong>Times Booked:</strong> 
//                   <span style={{ color: car.bookings > 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
//                     {car.bookings}
//                   </span>
//                 </p>
//                 <p><strong>Total Revenue:</strong> 
//                   <span style={{ color: car.revenue > 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
//                     ${car.revenue.toFixed(2)}
//                   </span>
//                 </p>
//                 <p><strong>Total Days Booked:</strong> 
//                   <span style={{ color: car.days > 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
//                     {car.days} days
//                   </span>
//                 </p>
//                 <p><strong>Daily Price:</strong> ${car.dailyPrice || 0}</p>
//                 <p><strong>Plate Number:</strong> {car.plateNumber || 'N/A'}</p>
//                 <p><strong>Fuel Type:</strong> {car.fuelType || 'N/A'}</p>
//                 <p><strong>Transmission:</strong> {car.transmission || 'N/A'}</p>
//                 <p><strong>Status:</strong> 
//                   <span style={{
//                     color: car.status === 'available' ? 'green' : 
//                            car.status === 'reserved' ? 'orange' : 'red',
//                     fontWeight: 'bold'
//                   }}>
//                     {car.status || 'Unknown'}
//                   </span>
//                 </p>
//               </div>
              
//               {car.features && (
//                 <p><strong>Features:</strong> {car.features}</p>
//               )}
              
//               {car.specialOffer && (
//                 <p><strong>Special Offer:</strong> 
//                   <span style={{ color: 'green', fontWeight: 'bold' }}>
//                     {car.specialOffer}
//                   </span>
//                 </p>
//               )}

//               {/* Users who booked this car */}
//               {car.users && car.users.length > 0 && (
//                 <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
//                   <h4>Users who booked this car ({car.users.length}):</h4>
//                   {car.users.map((user, userIndex) => (
//                     <div key={userIndex} style={{ 
//                       marginBottom: '8px', 
//                       padding: '8px', 
//                       backgroundColor: 'white', 
//                       borderRadius: '4px',
//                       border: '1px solid #e0e0e0'
//                     }}>
//                       <p style={{ margin: '2px 0' }}><strong>Name:</strong> {user.name}</p>
//                       <p style={{ margin: '2px 0' }}><strong>Email:</strong> {user.email}</p>
//                       <p style={{ margin: '2px 0' }}><strong>Phone:</strong> {user.phone}</p>
//                       <p style={{ margin: '2px 0' }}><strong>Booking Date:</strong> {user.bookingDate}</p>
//                       {user.notes && user.notes !== 'No Notes' && (
//                         <p style={{ margin: '2px 0' }}><strong>Notes:</strong> {user.notes}</p>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Show if no bookings found */}
//               {car.bookings === 0 && (
//                 <div style={{ 
//                   marginTop: '10px', 
//                   padding: '10px', 
//                   backgroundColor: '#fff3cd', 
//                   border: '1px solid #ffeaa7',
//                   borderRadius: '4px' 
//                 }}>
//                   <p style={{ margin: 0, color: '#856404' }}>
//                     ⚠️ No bookings found for this car. Car ID: <code>{car.id}</code>
//                   </p>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
      
//       <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
//         <h3>Summary</h3>
//         <p><strong>Total Cars:</strong> {carReports.length}</p>
//         <p><strong>Cars with Bookings:</strong> {carReports.filter(car => car.bookings > 0).length}</p>
//         <p><strong>Total Revenue:</strong> ${carReports.reduce((sum, car) => sum + car.revenue, 0).toFixed(2)}</p>
//         <p><strong>Total Bookings:</strong> {carReports.reduce((sum, car) => sum + car.bookings, 0)}</p>
//         <p><strong>Total Days Booked:</strong> {carReports.reduce((sum, car) => sum + car.days, 0)} days</p>
//       </div>
//     </div>
//   );
// };

// export default Reports;