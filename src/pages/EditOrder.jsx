//code with firebase
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase'; 

const EditOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    carName: '',
    startDate: '',
    endDate: '',
    totalDays: 0,
    dailyPrice: 0,
    totalPrice: 0,
    status: 'pending',
    notes: '',
    pickupLocation: '',
    dropoffLocation: ''
  });

  // Fetch order data from Firebase
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const orderDoc = doc(db, 'orders', id);
        const orderSnapshot = await getDoc(orderDoc);

        if (orderSnapshot.exists()) {
          const orderData = orderSnapshot.data();
          
          // Handle Firestore Timestamps
          const formatDate = (timestamp) => {
            if (timestamp && timestamp.toDate) {
              return timestamp.toDate().toISOString().split('T')[0];
            }
            if (timestamp instanceof Date) {
              return timestamp.toISOString().split('T')[0];
            }
            return timestamp || '';
          };

          setOrder({
            id: orderSnapshot.id,
            userName: orderData.userName || orderData.customerName || '',
            userEmail: orderData.userEmail || orderData.email || '',
            userPhone: orderData.userPhone || orderData.phone || '',
            carName: orderData.carName || orderData.car || '',
            startDate: formatDate(orderData.startDate),
            endDate: formatDate(orderData.endDate),
            totalDays: orderData.totalDays || 0,
            dailyPrice: orderData.dailyPrice || 0,
            totalPrice: orderData.totalPrice || 0,
            status: orderData.status || 'pending',
            notes: orderData.notes || '',
            pickupLocation: orderData.pickupLocation || '',
            dropoffLocation: orderData.dropoffLocation || ''
          });
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrder(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'startDate' || name === 'endDate' || name === 'dailyPrice') {
      calculateTotalPrice({ ...order, [name]: value });
    }
  };

  const calculateTotalPrice = (orderData) => {
    if (orderData.startDate && orderData.endDate && orderData.dailyPrice) {
      const start = new Date(orderData.startDate);
      const end = new Date(orderData.endDate);
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff > 0) {
        const total = daysDiff * parseFloat(orderData.dailyPrice);
        setOrder(prev => ({
          ...prev,
          totalDays: daysDiff,
          totalPrice: total
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError(null);

      const orderDoc = doc(db, 'orders', id);
      
      // Prepare update data
      const updateData = {
        userName: order.userName,
        userEmail: order.userEmail,
        userPhone: order.userPhone,
        carName: order.carName,
        startDate: new Date(order.startDate),
        endDate: new Date(order.endDate),
        totalDays: order.totalDays,
        dailyPrice: parseFloat(order.dailyPrice),
        totalPrice: parseFloat(order.totalPrice),
        status: order.status,
        notes: order.notes,
        pickupLocation: order.pickupLocation,
        dropoffLocation: order.dropoffLocation,
        updatedAt: serverTimestamp()
      };

      await updateDoc(orderDoc, updateData);
      
      alert('Order updated successfully!');
      navigate('/orders');
      
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/orders');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px'
      }}>
        <div>Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#dc3545'
      }}>
        <div>{error}</div>
        <button 
          onClick={() => navigate('/orders')} 
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '5px' }}>Edit Order #{id}</h1>
        <p style={{ color: '#666', margin: 0 }}>Edit booking order details</p>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Customer Information */}
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Customer Information</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>Customer Name</label>
                <input
                  type="text"
                  name="userName"
                  value={order.userName}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>Email Address</label>
                <input
                  type="email"
                  name="userEmail"
                  value={order.userEmail}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>Phone Number</label>
              <input
                type="tel"
                name="userPhone"
                value={order.userPhone}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>

          {/* Booking Details */}
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Booking Details</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>Car Name</label>
              <input
                type="text"
                name="carName"
                value={order.carName}
                onChange={handleInputChange}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  backgroundColor: '#e9ecef'
                }}
              />
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={order.startDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={order.endDate}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>Daily Price ($)</label>
                <input
                  type="number"
                  name="dailyPrice"
                  value={order.dailyPrice}
                  onChange={handleInputChange}
                  min="1"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>Total Days</label>
                <input
                  type="number"
                  value={order.totalDays}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    backgroundColor: '#e9ecef'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>Total Price ($)</label>
              <input
                type="number"
                value={order.totalPrice}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: '#28a745',
                  backgroundColor: '#e9ecef'
                }}
              />
            </div>
          </div>

          {/* Location Details */}
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Location Details</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px' 
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>Pickup Location</label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={order.pickupLocation}
                  onChange={handleInputChange}
                  placeholder="Enter pickup location"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontWeight: 'bold', 
                  color: '#333' 
                }}>Drop-off Location</label>
                <input
                  type="text"
                  name="dropoffLocation"
                  value={order.dropoffLocation}
                  onChange={handleInputChange}
                  placeholder="Enter drop-off location"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Order Status and Notes */}
          <div style={{ 
            marginBottom: '30px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Order Status & Notes</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>Status</label>
              <select
                name="status"
                value={order.status}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>Additional Notes</label>
              <textarea
                name="notes"
                value={order.notes}
                onChange={handleInputChange}
                placeholder="Add any special notes for this order..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={handleCancel}
              disabled={updating}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={updating}
              style={{
                padding: '12px 24px',
                backgroundColor: updating ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: updating ? 'not-allowed' : 'pointer'
              }}
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Order Summary Card */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        border: '2px solid #28a745'
      }}>
        <h3 style={{ color: '#28a745', marginBottom: '15px' }}>Order Summary</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <div>
            <strong>Customer:</strong> {order.userName}
          </div>
          <div>
            <strong>Car:</strong> {order.carName}
          </div>
          <div>
            <strong>Duration:</strong> {order.totalDays} days
          </div>
          <div>
            <strong>Total Price:</strong> <span style={{ color: '#28a745', fontSize: '1.2rem' }}>${order.totalPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;
//version sans code firebase
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';

// const EditOrder = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [order, setOrder] = useState({
//     userName: '',
//     userEmail: '',
//     userPhone: '',
//     carName: '',
//     startDate: '',
//     endDate: '',
//     totalDays: 0,
//     dailyPrice: 0,
//     totalPrice: 0,
//     status: 'pending',
//     notes: '',
//     pickupLocation: '',
//     dropoffLocation: ''
//   });

//   useEffect(() => {
//     // Simulate fetching order data from Firebase
//     const mockOrder = {
//       id: id,
//       userName: 'Ahmad Mohammad',
//       userEmail: 'ahmed@example.com',
//       userPhone: '+961 70 123 456',
//       carName: 'Toyota Camry 2023',
//       startDate: '2024-12-15',
//       endDate: '2024-12-20',
//       totalDays: 5,
//       dailyPrice: 50,
//       totalPrice: 250,
//       status: 'confirmed',
//       notes: 'Please ensure the car is cleaned before delivery',
//       pickupLocation: 'Beirut Airport',
//       dropoffLocation: 'Corniche Hotel - Beirut'
//     };

//     setOrder(mockOrder);
//     setLoading(false);
//   }, [id]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setOrder(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     if (name === 'startDate' || name === 'endDate' || name === 'dailyPrice') {
//       calculateTotalPrice({ ...order, [name]: value });
//     }
//   };

//   const calculateTotalPrice = (orderData) => {
//     if (orderData.startDate && orderData.endDate && orderData.dailyPrice) {
//       const start = new Date(orderData.startDate);
//       const end = new Date(orderData.endDate);
//       const timeDiff = end.getTime() - start.getTime();
//       const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
//       if (daysDiff > 0) {
//         const total = daysDiff * parseFloat(orderData.dailyPrice);
//         setOrder(prev => ({
//           ...prev,
//           totalDays: daysDiff,
//           totalPrice: total
//         }));
//       }
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log('Updating order:', order);
//     alert('Order updated successfully!');
//     navigate('/orders');
//   };

//   const handleCancel = () => {
//     navigate('/orders');
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Edit Order #{id}</h1>
//         <p>Edit booking order details</p>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           {/* Customer Information */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>Customer Information</h3>
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Customer Name</label>
//                 <input
//                   type="text"
//                   name="userName"
//                   value={order.userName}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Email Address</label>
//                 <input
//                   type="email"
//                   name="userEmail"
//                   value={order.userEmail}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//             </div>
//             <div className="form-group">
//               <label>Phone Number</label>
//               <input
//                 type="tel"
//                 name="userPhone"
//                 value={order.userPhone}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//           </div>

//           {/* Booking Details */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>Booking Details</h3>
//             <div className="form-group">
//               <label>Car Name</label>
//               <input
//                 type="text"
//                 name="carName"
//                 value={order.carName}
//                 onChange={handleInputChange}
//                 readOnly
//                 style={{ backgroundColor: '#e9ecef' }}
//               />
//             </div>
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Start Date</label>
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={order.startDate}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label>End Date</label>
//                 <input
//                   type="date"
//                   name="endDate"
//                   value={order.endDate}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//             </div>

//             <div className="form-row">
//               <div className="form-group">
//                 <label>Daily Price ($)</label>
//                 <input
//                   type="number"
//                   name="dailyPrice"
//                   value={order.dailyPrice}
//                   onChange={handleInputChange}
//                   min="1"
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Total Days</label>
//                 <input
//                   type="number"
//                   value={order.totalDays}
//                   readOnly
//                   style={{ backgroundColor: '#e9ecef' }}
//                 />
//               </div>
//             </div>

//             <div className="form-group">
//               <label>Total Price ($)</label>
//               <input
//                 type="number"
//                 value={order.totalPrice}
//                 readOnly
//                 style={{
//                   backgroundColor: '#e9ecef',
//                   fontSize: '1.2rem',
//                   fontWeight: 'bold',
//                   color: '#28a745'
//                 }}
//               />
//             </div>
//           </div>

//           {/* Location Details */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>Location Details</h3>
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Pickup Location</label>
//                 <input
//                   type="text"
//                   name="pickupLocation"
//                   value={order.pickupLocation}
//                   onChange={handleInputChange}
//                   placeholder="Enter pickup location"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Drop-off Location</label>
//                 <input
//                   type="text"
//                   name="dropoffLocation"
//                   value={order.dropoffLocation}
//                   onChange={handleInputChange}
//                   placeholder="Enter drop-off location"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Order Status and Notes */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>Order Status & Notes</h3>
//             <div className="form-group">
//               <label>Status</label>
//               <select
//                 name="status"
//                 value={order.status}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="pending">Pending</option>
//                 <option value="confirmed">Confirmed</option>
//                 <option value="delivered">Delivered</option>
//                 <option value="cancelled">Cancelled</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Additional Notes</label>
//               <textarea
//                 name="notes"
//                 value={order.notes}
//                 onChange={handleInputChange}
//                 placeholder="Add any special notes for this order..."
//                 rows="4"
//               />
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
//             <button type="button" onClick={handleCancel} className="cancel-btn">
//               Cancel
//             </button>
//             <button type="submit" className="submit-btn">
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Order Summary Card */}
//       <div style={{
//         marginTop: '30px',
//         padding: '20px',
//         backgroundColor: 'white',
//         borderRadius: '10px',
//         boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
//         border: '2px solid #28a745'
//       }}>
//         <h3 style={{ color: '#28a745', marginBottom: '15px' }}>Order Summary</h3>
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
//           <div>
//             <strong>Customer:</strong> {order.userName}
//           </div>
//           <div>
//             <strong>Car:</strong> {order.carName}
//           </div>
//           <div>
//             <strong>Duration:</strong> {order.totalDays} days
//           </div>
//           <div>
//             <strong>Total Price:</strong> <span style={{ color: '#28a745', fontSize: '1.2rem' }}>${order.totalPrice}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditOrder;



//***************************************************************************************************** */
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';

// const EditOrder = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [order, setOrder] = useState({
//     userName: '',
//     userEmail: '',
//     userPhone: '',
//     carName: '',
//     startDate: '',
//     endDate: '',
//     totalDays: 0,
//     dailyPrice: 0,
//     totalPrice: 0,
//     status: 'pending',
//     notes: '',
//     pickupLocation: '',
//     dropoffLocation: ''
//   });

//   useEffect(() => {
//     // Simulate fetching order data from Firebase
//     const mockOrder = {
//       id: id,
//       userName: 'أحمد محمد',
//       userEmail: 'ahmed@example.com',
//       userPhone: '+961 70 123 456',
//       carName: 'تويوتا كامري 2023',
//       startDate: '2024-12-15',
//       endDate: '2024-12-20',
//       totalDays: 5,
//       dailyPrice: 50,
//       totalPrice: 250,
//       status: 'confirmed',
//       notes: 'يرجى التأكد من تنظيف السيارة قبل التسليم',
//       pickupLocation: 'المطار - بيروت',
//       dropoffLocation: 'فندق الكورنيش - بيروت'
//     };

//     setOrder(mockOrder);
//     setLoading(false);
//   }, [id]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setOrder(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     // Recalculate total price if dates or daily price change
//     if (name === 'startDate' || name === 'endDate' || name === 'dailyPrice') {
//       calculateTotalPrice({...order, [name]: value});
//     }
//   };

//   const calculateTotalPrice = (orderData) => {
//     if (orderData.startDate && orderData.endDate && orderData.dailyPrice) {
//       const start = new Date(orderData.startDate);
//       const end = new Date(orderData.endDate);
//       const timeDiff = end.getTime() - start.getTime();
//       const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
//       if (daysDiff > 0) {
//         const total = daysDiff * parseFloat(orderData.dailyPrice);
//         setOrder(prev => ({
//           ...prev,
//           totalDays: daysDiff,
//           totalPrice: total
//         }));
//       }
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     // Here you would normally update the order in Firebase
//     console.log('Updating order:', order);
    
//     // Show success message
//     alert('تم تحديث الطلب بنجاح!');
    
//     // Navigate back to orders list
//     navigate('/orders');
//   };

//   const handleCancel = () => {
//     navigate('/orders');
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>تعديل الطلب #{id}</h1>
//         <p>تعديل تفاصيل طلب الحجز</p>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           {/* Customer Information */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>معلومات العميل</h3>
//             <div className="form-row">
//               <div className="form-group">
//                 <label>اسم العميل</label>
//                 <input
//                   type="text"
//                   name="userName"
//                   value={order.userName}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label>البريد الإلكتروني</label>
//                 <input
//                   type="email"
//                   name="userEmail"
//                   value={order.userEmail}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//             </div>
//             <div className="form-group">
//               <label>رقم الهاتف</label>
//               <input
//                 type="tel"
//                 name="userPhone"
//                 value={order.userPhone}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//           </div>

//           {/* Booking Details */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>تفاصيل الحجز</h3>
//             <div className="form-group">
//               <label>السيارة المحجوزة</label>
//               <input
//                 type="text"
//                 name="carName"
//                 value={order.carName}
//                 onChange={handleInputChange}
//                 readOnly
//                 style={{ backgroundColor: '#e9ecef' }}
//               />
//             </div>
            
//             <div className="form-row">
//               <div className="form-group">
//                 <label>تاريخ البداية</label>
//                 <input
//                   type="date"
//                   name="startDate"
//                   value={order.startDate}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label>تاريخ النهاية</label>
//                 <input
//                   type="date"
//                   name="endDate"
//                   value={order.endDate}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </div>
//             </div>

//             <div className="form-row">
//               <div className="form-group">
//                 <label>السعر اليومي ($)</label>
//                 <input
//                   type="number"
//                   name="dailyPrice"
//                   value={order.dailyPrice}
//                   onChange={handleInputChange}
//                   min="1"
//                   required
//                 />
//               </div>
//               <div className="form-group">
//                 <label>عدد الأيام</label>
//                 <input
//                   type="number"
//                   value={order.totalDays}
//                   readOnly
//                   style={{ backgroundColor: '#e9ecef' }}
//                 />
//               </div>
//             </div>

//             <div className="form-group">
//               <label>السعر الكلي ($)</label>
//               <input
//                 type="number"
//                 value={order.totalPrice}
//                 readOnly
//                 style={{ 
//                   backgroundColor: '#e9ecef',
//                   fontSize: '1.2rem',
//                   fontWeight: 'bold',
//                   color: '#28a745'
//                 }}
//               />
              
//             </div>
//           </div>

//           {/* Location Details */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>تفاصيل المواقع</h3>
//             <div className="form-row">
//               <div className="form-group">
//                 <label>موقع الاستلام</label>
//                 <input
//                   type="text"
//                   name="pickupLocation"
//                   value={order.pickupLocation}
//                   onChange={handleInputChange}
//                   placeholder="أدخل موقع استلام السيارة"
//                 />
//               </div>
//               <div className="form-group">
//                 <label>موقع التسليم</label>
//                 <input
//                   type="text"
//                   name="dropoffLocation"
//                   value={order.dropoffLocation}
//                   onChange={handleInputChange}
//                   placeholder="أدخل موقع تسليم السيارة"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Order Status and Notes */}
//           <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
//             <h3 style={{ marginBottom: '20px', color: '#333' }}>حالة الطلب والملاحظات</h3>
//             <div className="form-group">
//               <label>حالة الطلب</label>
//               <select
//                 name="status"
//                 value={order.status}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="pending">في الانتظار</option>
//                 <option value="confirmed">مؤكد</option>
//                 <option value="delivered">مسلم</option>
//                 <option value="cancelled">ملغي</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>ملاحظات إضافية</label>
//               <textarea
//                 name="notes"
//                 value={order.notes}
//                 onChange={handleInputChange}
//                 placeholder="أضف أي ملاحظات خاصة بهذا الطلب..."
//                 rows="4"
//               />
//             </div>
//           </div>

//           {/* Form Actions */}
//           <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
//             <button type="button" onClick={handleCancel} className="cancel-btn">
//               إلغاء
//             </button>
//             <button type="submit" className="submit-btn">
//               حفظ التعديلات
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Order Summary Card */}
//       <div style={{ 
//         marginTop: '30px', 
//         padding: '20px', 
//         backgroundColor: 'white', 
//         borderRadius: '10px',
//         boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
//         border: '2px solid #28a745'
//       }}>
//         <h3 style={{ color: '#28a745', marginBottom: '15px' }}>ملخص الطلب</h3>
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
//           <div>
//             <strong>العميل:</strong> {order.userName}
//           </div>
//           <div>
//             <strong>السيارة:</strong> {order.carName}
//           </div>
//           <div>
//             <strong>المدة:</strong> {order.totalDays} أيام
//           </div>
//           <div>
//             <strong>السعر الكلي:</strong> <span style={{color: '#28a745', fontSize: '1.2rem'}}>${order.totalPrice}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditOrder;