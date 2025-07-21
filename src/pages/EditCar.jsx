import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase.js';

const EditCar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    carName: '',
    brand: '',
    plateNumber: '',
    dailyPrice: '',
    transmission: 'manual',
    passengers: '',
    features: '',
    description: '',
    fuelType: 'gasoline',
    status: 'available',
    image: '',
    imageUrl: ''
  });

  useEffect(() => {
    const loadCarData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const carDoc = doc(db, 'cars', id);
        const carSnapshot = await getDoc(carDoc);
        
        if (carSnapshot.exists()) {
          const carData = carSnapshot.data();
          setFormData({
            carName: carData.carName || '',
            brand: carData.brand || '',
            plateNumber: carData.plateNumber || '',
            dailyPrice: carData.dailyPrice || '',
            transmission: carData.transmission || 'manual',
            passengers: carData.passengers || '',
            features: carData.features || '',
            description: carData.description || '',
            fuelType: carData.fuelType || 'gasoline',
            status: carData.status || 'available',
            image: carData.image || '',
            imageUrl: carData.imageUrl || ''
          });
        } else {
          setError('Car not found');
        }
      } catch (error) {
        console.error('Error loading car data:', error);
        setError('Error loading car data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCarData();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a preview URL for the selected image
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        image: file,
        imageUrl: imageUrl
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError(null);

      // Prepare data for update (exclude file object if no new image)
      const updateData = {
        carName: formData.carName,
        brand: formData.brand,
        plateNumber: formData.plateNumber,
        dailyPrice: parseFloat(formData.dailyPrice),
        transmission: formData.transmission,
        passengers: parseInt(formData.passengers),
        features: formData.features,
        description: formData.description,
        fuelType: formData.fuelType,
        status: formData.status,
        updatedAt: new Date()
      };

      // If there's a new image file, you would handle image upload here
      // For now, we'll keep the existing imageUrl if no new image is selected
      if (formData.image && typeof formData.image === 'object') {
        // Here you would upload the image to Firebase Storage and get the URL
        // For this example, we'll use the preview URL
        updateData.imageUrl = formData.imageUrl;
      } else if (formData.imageUrl) {
        updateData.imageUrl = formData.imageUrl;
      }

      const carDoc = doc(db, 'cars', id);
      await updateDoc(carDoc, updateData);
      
      alert('Car updated successfully!');
      navigate('/cars');
    } catch (error) {
      console.error('Error updating car:', error);
      setError('Error updating car. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Function to get status styling for preview
  const getStatusConfig = (status) => {
    switch (status) {
      case 'available':
        return {
          text: 'Available',
          backgroundColor: '#28a745',
          color: 'white'
        };
      case 'unavailable':
        return {
          text: 'Unavailable',
          backgroundColor: '#dc3545',
          color: 'white'
        };
      case 'maintenance':
        return {
          text: 'Under Maintenance',
          backgroundColor: '#ffc107',
          color: '#212529'
        };
      default:
        return {
          text: 'Unknown',
          backgroundColor: '#6c757d',
          color: 'white'
        };
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading car data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/cars')} className="retry-btn">
          Back to Cars List
        </button>
      </div>
    );
  }

  const currentStatusConfig = getStatusConfig(formData.status);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Edit Car</h1>
        <p>Update car information and details</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="carName">Car Name *</label>
              <input
                type="text"
                id="carName"
                name="carName"
                value={formData.carName}
                onChange={handleInputChange}
                required
                disabled={updating}
              />
            </div>
            <div className="form-group">
              <label htmlFor="brand">Brand *</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                required
                disabled={updating}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plateNumber">Plate Number</label>
              <input
                type="text"
                id="plateNumber"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleInputChange}
                disabled={updating}
              />
            </div>
            <div className="form-group">
              <label htmlFor="dailyPrice">Daily Price ($) *</label>
              <input
                type="number"
                id="dailyPrice"
                name="dailyPrice"
                value={formData.dailyPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                disabled={updating}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transmission">Transmission *</label>
              <select
                id="transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleInputChange}
                required
                disabled={updating}
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="passengers">Number of Passengers *</label>
              <input
                type="number"
                id="passengers"
                name="passengers"
                value={formData.passengers}
                onChange={handleInputChange}
                min="2"
                max="8"
                required
                disabled={updating}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fuelType">Fuel Type *</label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                required
                disabled={updating}
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>

              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                disabled={updating}
                style={{ marginBottom: '10px' }}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
              {/* Status preview */}
              <div style={{ marginTop: '5px' }}>
                <span 
                  style={{
                    backgroundColor: currentStatusConfig.backgroundColor,
                    color: currentStatusConfig.color,
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'inline-block'
                  }}
                >
                  {currentStatusConfig.text}
                </span>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px', marginBottom: '0' }}>
                  Status preview
                </p>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="features">Features</label>
            <textarea
              id="features"
              name="features"
              value={formData.features}
              onChange={handleInputChange}
              placeholder="e.g., Air Conditioning, GPS, Bluetooth, Leather Seats"
              disabled={updating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the car's condition, special notes, etc."
              disabled={updating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Update Car Image</label>
            <div className="file-upload">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                disabled={updating}
              />
              <p>Click to select a new image (optional)</p>
              {formData.imageUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img 
                    src={formData.imageUrl} 
                    alt="Current car" 
                    style={{ 
                      width: '200px', 
                      height: '150px', 
                      objectFit: 'cover', 
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }} 
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Current image
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/cars')}
              disabled={updating}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: updating ? 'not-allowed' : 'pointer',
                opacity: updating ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={updating}
              style={{
                padding: '10px 20px',
                backgroundColor: updating ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: updating ? 'not-allowed' : 'pointer'
              }}
            >
              {updating ? 'Updating...' : 'Update Car'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCar;
// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   doc, 
//   getDoc, 
//   updateDoc 
// } from 'firebase/firestore';
// import { db } from '../firebase.js';

// const EditCar = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState(false);
//   const [error, setError] = useState(null);
//   const [formData, setFormData] = useState({
//     carName: '',
//     brand: '',
//     plateNumber: '',
//     dailyPrice: '',
//     transmission: 'manual',
//     passengers: '',
//     features: '',
//     description: '',
//     fuelType: 'gasoline',
//     status: 'available',
//     image: '',
//     imageUrl: ''
//   });

//   useEffect(() => {
//     const loadCarData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const carDoc = doc(db, 'cars', id);
//         const carSnapshot = await getDoc(carDoc);
        
//         if (carSnapshot.exists()) {
//           const carData = carSnapshot.data();
//           setFormData({
//             carName: carData.carName || '',
//             brand: carData.brand || '',
//             plateNumber: carData.plateNumber || '',
//             dailyPrice: carData.dailyPrice || '',
//             transmission: carData.transmission || 'manual',
//             passengers: carData.passengers || '',
//             features: carData.features || '',
//             description: carData.description || '',
//             fuelType: carData.fuelType || 'gasoline',
//             status: carData.status || 'available',
//             image: carData.image || '',
//             imageUrl: carData.imageUrl || ''
//           });
//         } else {
//           setError('Car not found');
//         }
//       } catch (error) {
//         console.error('Error loading car data:', error);
//         setError('Error loading car data');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) {
//       loadCarData();
//     }
//   }, [id]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // Create a preview URL for the selected image
//       const imageUrl = URL.createObjectURL(file);
//       setFormData(prev => ({
//         ...prev,
//         image: file,
//         imageUrl: imageUrl
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     try {
//       setUpdating(true);
//       setError(null);

//       // Prepare data for update (exclude file object if no new image)
//       const updateData = {
//         carName: formData.carName,
//         brand: formData.brand,
//         plateNumber: formData.plateNumber,
//         dailyPrice: parseFloat(formData.dailyPrice),
//         transmission: formData.transmission,
//         passengers: parseInt(formData.passengers),
//         features: formData.features,
//         description: formData.description,
//         fuelType: formData.fuelType,
//         status: formData.status,
//         updatedAt: new Date()
//       };

//       // If there's a new image file, you would handle image upload here
//       // For now, we'll keep the existing imageUrl if no new image is selected
//       if (formData.image && typeof formData.image === 'object') {
//         // Here you would upload the image to Firebase Storage and get the URL
//         // For this example, we'll use the preview URL
//         updateData.imageUrl = formData.imageUrl;
//       } else if (formData.imageUrl) {
//         updateData.imageUrl = formData.imageUrl;
//       }

//       const carDoc = doc(db, 'cars', id);
//       await updateDoc(carDoc, updateData);
      
//       alert('Car updated successfully!');
//       navigate('/cars');
//     } catch (error) {
//       console.error('Error updating car:', error);
//       setError('Error updating car. Please try again.');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//         <p>Loading car data...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="error-container">
//         <h3>Error</h3>
//         <p>{error}</p>
//         <button onClick={() => navigate('/cars')} className="retry-btn">
//           Back to Cars List
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Edit Car</h1>
//         <p>Update car information and details</p>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="carName">Car Name *</label>
//               <input
//                 type="text"
//                 id="carName"
//                 name="carName"
//                 value={formData.carName}
//                 onChange={handleInputChange}
//                 required
//                 disabled={updating}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="brand">Brand *</label>
//               <input
//                 type="text"
//                 id="brand"
//                 name="brand"
//                 value={formData.brand}
//                 onChange={handleInputChange}
//                 required
//                 disabled={updating}
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="plateNumber">Plate Number</label>
//               <input
//                 type="text"
//                 id="plateNumber"
//                 name="plateNumber"
//                 value={formData.plateNumber}
//                 onChange={handleInputChange}
//                 disabled={updating}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="dailyPrice">Daily Price ($) *</label>
//               <input
//                 type="number"
//                 id="dailyPrice"
//                 name="dailyPrice"
//                 value={formData.dailyPrice}
//                 onChange={handleInputChange}
//                 min="0"
//                 step="0.01"
//                 required
//                 disabled={updating}
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="transmission">Transmission *</label>
//               <select
//                 id="transmission"
//                 name="transmission"
//                 value={formData.transmission}
//                 onChange={handleInputChange}
//                 required
//                 disabled={updating}
//               >
//                 <option value="manual">Manual</option>
//                 <option value="automatic">Automatic</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="passengers">Number of Passengers *</label>
//               <input
//                 type="number"
//                 id="passengers"
//                 name="passengers"
//                 value={formData.passengers}
//                 onChange={handleInputChange}
//                 min="2"
//                 max="8"
//                 required
//                 disabled={updating}
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="fuelType">Fuel Type *</label>
//               <select
//                 id="fuelType"
//                 name="fuelType"
//                 value={formData.fuelType}
//                 onChange={handleInputChange}
//                 required
//                 disabled={updating}
//               >
//                 <option value="gasoline">Gasoline</option>
//                 <option value="diesel">Diesel</option>
//                 <option value="hybrid">Hybrid</option>
//                 <option value="electric">Electric</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="status">Status *</label>
//               <select
//                 id="status"
//                 name="status"
//                 value={formData.status}
//                 onChange={handleInputChange}
//                 required
//                 disabled={updating}
//               >
//                 <option value="available">Available</option>
//                 <option value="unavailable">Unavailable</option>
//                 <option value="maintenance">Under Maintenance</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-group">
//             <label htmlFor="features">Features</label>
//             <textarea
//               id="features"
//               name="features"
//               value={formData.features}
//               onChange={handleInputChange}
//               placeholder="e.g., Air Conditioning, GPS, Bluetooth, Leather Seats"
//               disabled={updating}
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               placeholder="Describe the car's condition, special notes, etc."
//               disabled={updating}
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="image">Update Car Image</label>
//             <div className="file-upload">
//               <input
//                 type="file"
//                 id="image"
//                 name="image"
//                 accept="image/*"
//                 onChange={handleImageChange}
//                 disabled={updating}
//               />
//               <p>Click to select a new image (optional)</p>
//               {formData.imageUrl && (
//                 <div style={{ marginTop: '10px' }}>
//                   <img 
//                     src={formData.imageUrl} 
//                     alt="Current car" 
//                     style={{ 
//                       width: '200px', 
//                       height: '150px', 
//                       objectFit: 'cover', 
//                       borderRadius: '4px',
//                       border: '1px solid #ddd'
//                     }} 
//                   />
//                   <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
//                     Current image
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
//             <button
//               type="button"
//               className="cancel-btn"
//               onClick={() => navigate('/cars')}
//               disabled={updating}
//               style={{
//                 padding: '10px 20px',
//                 backgroundColor: '#6c757d',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '4px',
//                 cursor: updating ? 'not-allowed' : 'pointer',
//                 opacity: updating ? 0.6 : 1
//               }}
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               className="submit-btn"
//               disabled={updating}
//               style={{
//                 padding: '10px 20px',
//                 backgroundColor: updating ? '#ccc' : '#007bff',
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '4px',
//                 cursor: updating ? 'not-allowed' : 'pointer'
//               }}
//             >
//               {updating ? 'Updating...' : 'Update Car'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditCar;




// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';

// const EditCar = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     name: '',
//     brand: '',
//     plateNumber: '',
//     dailyPrice: '',
//     transmission: 'manual',
//     seats: '',
//     features: '',
//     description: '',
//     fuelType: 'gasoline',
//     status: 'available',
//     image: null
//   });

  
//   useEffect(() => {
//     // Simulate loading car data from Firebase
//     const loadCarData = async () => {
//       try {
//         // Mock data - replace with actual Firebase call
//         const mockCarData = {
//           name: 'Toyota Camry',
//           brand: 'Toyota',
//           plateNumber: 'ABC-123',
//           dailyPrice: '50',
//           transmission: 'automatic',
//           seats: '5',
//           features: 'Air Conditioning, GPS, Bluetooth',
//           description: 'Comfortable sedan perfect for city driving',
//           fuelType: 'gasoline',
//           status: 'available'
//         };
        
//         setFormData(mockCarData);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error loading car data:', error);
//         setLoading(false);
//       }
//     };

//     loadCarData();
//   }, [id]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     setFormData(prev => ({
//       ...prev,
//       image: file
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       // Here you would update the car in Firebase
//       console.log('Updating car:', formData);
//       alert('Car updated successfully!');
//       navigate('/cars');
//     } catch (error) {
//       console.error('Error updating car:', error);
//       alert('Error updating car. Please try again.');
//     }
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
//         <h1>Edit Car</h1>
//         <p>Update car information and details</p>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="name">Car Name *</label>
//               <input
//                 type="text"
//                 id="name"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="brand">Brand *</label>
//               <input
//                 type="text"
//                 id="brand"
//                 name="brand"
//                 value={formData.brand}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="plateNumber">Plate Number</label>
//               <input
//                 type="text"
//                 id="plateNumber"
//                 name="plateNumber"
//                 value={formData.plateNumber}
//                 onChange={handleInputChange}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="dailyPrice">Daily Price ($) *</label>
//               <input
//                 type="number"
//                 id="dailyPrice"
//                 name="dailyPrice"
//                 value={formData.dailyPrice}
//                 onChange={handleInputChange}
//                 min="0"
//                 step="0.01"
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="transmission">Transmission *</label>
//               <select
//                 id="transmission"
//                 name="transmission"
//                 value={formData.transmission}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="manual">Manual</option>
//                 <option value="automatic">Automatic</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="seats">Number of Seats *</label>
//               <input
//                 type="number"
//                 id="seats"
//                 name="seats"
//                 value={formData.seats}
//                 onChange={handleInputChange}
//                 min="2"
//                 max="8"
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="fuelType">Fuel Type *</label>
//               <select
//                 id="fuelType"
//                 name="fuelType"
//                 value={formData.fuelType}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="gasoline">Gasoline</option>
//                 <option value="diesel">Diesel</option>
//                 <option value="hybrid">Hybrid</option>
//                 <option value="electric">Electric</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="status">Status *</label>
//               <select
//                 id="status"
//                 name="status"
//                 value={formData.status}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="available">Available</option>
//                 <option value="unavailable">Unavailable</option>
//                 <option value="maintenance">Under Maintenance</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-group">
//             <label htmlFor="features">Features</label>
//             <textarea
//               id="features"
//               name="features"
//               value={formData.features}
//               onChange={handleInputChange}
//               placeholder="e.g., Air Conditioning, GPS, Bluetooth, Leather Seats"
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleInputChange}
//               placeholder="Describe the car's condition, special notes, etc."
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="image">Update Car Image</label>
//             <div className="file-upload">
//               <input
//                 type="file"
//                 id="image"
//                 name="image"
//                 accept="image/*"
//                 onChange={handleImageChange}
//               />
//               <p>Click to select a new image (optional)</p>
//             </div>
//           </div>

//           <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
//             <button
//               type="button"
//               className="cancel-btn"
//               onClick={() => navigate('/cars')}
//             >
//               Cancel
//             </button>
//             <button type="submit" className="submit-btn">
//               Update Car
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditCar;