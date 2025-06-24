import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditCar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    plateNumber: '',
    dailyPrice: '',
    transmission: 'manual',
    seats: '',
    features: '',
    description: '',
    fuelType: 'gasoline',
    status: 'available',
    image: null
  });

  
  useEffect(() => {
    // Simulate loading car data from Firebase
    const loadCarData = async () => {
      try {
        // Mock data - replace with actual Firebase call
        const mockCarData = {
          name: 'Toyota Camry',
          brand: 'Toyota',
          plateNumber: 'ABC-123',
          dailyPrice: '50',
          transmission: 'automatic',
          seats: '5',
          features: 'Air Conditioning, GPS, Bluetooth',
          description: 'Comfortable sedan perfect for city driving',
          fuelType: 'gasoline',
          status: 'available'
        };
        
        setFormData(mockCarData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading car data:', error);
        setLoading(false);
      }
    };

    loadCarData();
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
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Here you would update the car in Firebase
      console.log('Updating car:', formData);
      alert('Car updated successfully!');
      navigate('/cars');
    } catch (error) {
      console.error('Error updating car:', error);
      alert('Error updating car. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
              <label htmlFor="name">Car Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
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
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="seats">Number of Seats *</label>
              <input
                type="number"
                id="seats"
                name="seats"
                value={formData.seats}
                onChange={handleInputChange}
                min="2"
                max="8"
                required
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
              >
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
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
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="maintenance">Under Maintenance</option>
              </select>
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
              />
              <p>Click to select a new image (optional)</p>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/cars')}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Update Car
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCar;