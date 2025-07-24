//code version 1 with vercel:
import React, { useState, useEffect } from "react";
import { Upload, Check, ArrowLeft, Save, Star, Gift, AlertCircle, Image } from "lucide-react";
import { db, auth } from "../firebase"; // إزالة storage
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AddCar = () => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({
    carName: "",
    brand: "",
    plateNumber: "",
    dailyPrice: "",
    transmission: "manual",
    passengers: "",
    features: "",
    description: "",
    fuelType: "gasoline",
    status: "available",
    isFeatured: false,
    specialOffer: "",
    imageUrl: "", // بدل image file، نستخدم URL مباشرة
  });

  // public/assets/images/cars (all images in this path)
  const availableImages = [
    "altima.jpg",
    "audi.jpg", 
    "bmw.jpg",
    "bmw3d.png",
    "camry.jpg",
    "crv.jpg",
    "ford.jpg",
    "jeep.jpg",
    "malibu.jpg",
    "mercedes.jpg",
    "profile.jpg",
    "tesla1.jpg",
    "tesla2.jpg",
    "tesla3.jpg",
    "carhyundai.jpg",
    "carnissan.png",
    "gclass.png",
    "hyundai1.png",
    "kiapicanto.jpg",
    "kiapicanto2.png",
    "nissan1.jpg",
    "porsche.png",
    "rangerover.png",
    "rover1.jpg",
  ];

  // Vérifier l'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser);
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    //if  chnage images in updates car
    if (name === "imageUrl" && value) {
      setImagePreview(`/assets/images/cars/${value}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérification de l'authentification
    if (!user) {
      alert("Please log in to add a car.");
      return;
    }

    setLoading(true);

    try {
      console.log("=== Starting car submission ===");
      console.log("User:", user.email);
      console.log("Form data:", formData);

      const fullImageUrl = formData.imageUrl 
        ? `https://car-admin-frontend.vercel.app/assets/images/cars/${formData.imageUrl}` 
        : "";

      // Préparer les données de la voiture
      const carData = {
        carName: formData.carName.trim(),
        brand: formData.brand,
        plateNumber: formData.plateNumber.trim() || "",
        dailyPrice: Number(formData.dailyPrice),
        transmission: formData.transmission,
        passengers: formData.passengers,
        features: formData.features.trim() || "",
        description: formData.description.trim() || "",
        fuelType: formData.fuelType,
        status: formData.status,
        specialOffer: formData.specialOffer.trim() || "",
        imageUrl: fullImageUrl, // استخدام URL من public folder
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        createdByEmail: user.email,
      };

      console.log("Prepared car data:", carData);

      // Validation des données
      if (!carData.carName || !carData.brand || !carData.dailyPrice || !carData.passengers) {
        throw new Error("Please fill in all required fields");
      }

      if (carData.dailyPrice <= 0) {
        throw new Error("Daily price must be greater than 0");
      }

      console.log("Adding car to database...");

      // Ajout dans collection "cars"
      const carsColRef = collection(db, "cars");
      const docRef = await addDoc(carsColRef, carData);
      console.log("Car added successfully with ID:", docRef.id);

      //code kermal el notification
      // 🔔 New push notification after successful car addition
      try {
        const notificationResponse = await fetch(
        "https://sendnewcarnotification-5qp5vk3tga-uc.a.run.app",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            carName: formData.carName?.trim(),
            brand: formData.brand?.trim(),
          }),
        }
    );

        const notificationText = await notificationResponse.text(); // استخدم text() لأنك ترسل نص من السيرفر
        console.log("✅ Notification sent:", notificationText);
      } catch (notificationError) {
        console.error("❌ Failed to send notification:", notificationError);
      }



      // Si featured, ajout aussi dans "featuredCars"
      if (formData.isFeatured) {
        console.log("Adding to featured cars collection...");
        try {
          const featuredColRef = collection(db, "featuredCars");
          const featuredCarData = {
            ...carData,
            carRefId: docRef.id,
            featuredAt: serverTimestamp(),
          };
          
          const featuredDocRef = await addDoc(featuredColRef, featuredCarData);
          console.log("Featured car added successfully with ID:", featuredDocRef.id);
        } catch (featuredError) {
          console.error("Error adding to featured cars:", featuredError);
          // Ne pas faire échouer toute l'opération si juste featured fail
          console.log("Car was added successfully but not marked as featured");
        }
      }

      // Succès
      const successMessage = fullImageUrl 
        ? "Car added successfully with image! 🎉" 
        : "Car added successfully! 🎉";
      
      alert(successMessage);
      
      // Reset form
      setFormData({
        carName: "",
        brand: "",
        plateNumber: "",
        dailyPrice: "",
        transmission: "manual",
        passengers: "",
        features: "",
        description: "",
        fuelType: "gasoline",
        status: "available",
        isFeatured: false,
        specialOffer: "",
        imageUrl: "",
      });

      // Reset image preview
      setImagePreview("");

      console.log("=== Car submission completed successfully ===");

    } catch (error) {
      console.error("=== Error in car submission ===");
      console.error("Error details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Message d'erreur détaillé pour l'utilisateur
      let errorMessage = "Failed to add car. ";
      
      if (error.message.includes("permission-denied")) {
        errorMessage += "Permission denied. Please check your Firestore rules.";
      } else if (error.message.includes("unauthenticated")) {
        errorMessage += "Please log in and try again.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const brands = [
    { value: "Toyota"},
    { value: "Honda"},
    { value: "BMW"},
    { value: "Mercedes"},
    { value: "Audi" },
    { value: "Hyundai"},
    { value: "Kia"},
    { value: "Nissan" },
    { value: "Rover"},
    { value: "Porche"},
    { value: "Camaro"},
    { value: "Jeep"},
    { value: "Ford"},
    { value: "Ferrari"}
  ];

  // Affichage pendant le chargement auth
  if (authLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Affichage si pas authentifié
  if (!user) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Authentication Required</h1>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 10, 
            padding: 20, 
            backgroundColor: "#fff3cd", 
            border: "1px solid #ffeaa7", 
            borderRadius: 8, 
            marginTop: 20 
          }}>
            <AlertCircle size={24} color="#856404" />
            <div>
              <p style={{ margin: 0, fontWeight: "600", color: "#856404" }}>
                Please log in to add a car
              </p>
              <p style={{ margin: "5px 0 0 0", color: "#856404" }}>
                You need to be authenticated to access this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Adding car to database...</p>
        </div>
      )}

      <div className="page-header">
        <button
          className="cancel-btn"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}
          onClick={() => window.history.back()}
          type="button"
          disabled={loading}
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1>Add New Car</h1>
        <p>Create a new car listing for your fleet</p>
        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 10 }}>
          Logged in as: <strong>{user.email}</strong>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Image Selection Section */}
          <div className="form-group">
            <label
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
            >
              <Image size={18} />
              Car Image (Optional)
            </label>

            <select
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                fontSize: "16px",
                backgroundColor: "#fff",
                marginBottom: "10px"
              }}
            >
              <option value="">No Image</option>
              {availableImages.map((imageName) => (
                <option key={imageName} value={imageName}>
                  {imageName}
                </option>
              ))}
            </select>

            {/* Image Preview */}
            {imagePreview && (
              <div style={{
                marginTop: "10px",
                padding: "10px",
                border: "2px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
                textAlign: "center"
              }}>
                <p style={{ margin: "0 0 10px 0", fontWeight: "600", color: "#28a745" }}>
                  <Check size={16} style={{ marginRight: "5px" }} />
                  Image Preview:
                </p>
                <img 
                  src={imagePreview} 
                  alt="Car preview" 
                  style={{
                    maxWidth: "200px",
                    maxHeight: "150px",
                    borderRadius: "8px",
                    objectFit: "cover",
                    border: "1px solid #ddd"
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', color: '#dc3545', marginTop: '10px' }}>
                  ❌ Image not found. Please check if the image exists in /public/assets/images/cars/
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="form-row">
            <div className="form-group">
              <label>Car Name *</label>
              <input
                type="text"
                name="carName"
                value={formData.carName}
                onChange={handleChange}
                placeholder="e.g. Corolla 2023"
                required
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Brand *</label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select a brand</option>
                {brands.map((brand) => (
                  <option key={brand.value} value={brand.value}>
                    {brand.icon} {brand.value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>License Plate</label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                placeholder="e.g. ABC-123"
                disabled={loading}
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label>Daily Price (€) *</label>
              <input
                type="number"
                name="dailyPrice"
                value={formData.dailyPrice}
                onChange={handleChange}
                placeholder="e.g. 50"
                min="1"
                max="9999"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Specifications */}
          <div className="form-row">
            <div className="form-group">
              <label>Transmission *</label>
              <select
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="manual">🔧 Manual</option>
                <option value="automatic">⚙️ Automatic</option>
              </select>
            </div>

            <div className="form-group">
              <label>Passengers *</label>
              <select
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select</option>
                <option value="2"> 2 passengers</option>
                <option value="4"> 4 passengers</option>
                <option value="5"> 5 passengers</option>
                <option value="7"> 7 passengers</option>
                <option value="8"> 8 passengers</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fuel Type *</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="petrol">⛽ Petrol</option>  
                <option value="diesel">🚛 Diesel</option>
                <option value="electric">⚡ Electric</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="available">✅ Available</option>
                <option value="unavailable">❌ Unavailable</option>
              </select>
            </div>
          </div>

          {/* Checkbox Featured */}
          <div className="form-group">
            <label
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                style={{ transform: "scale(1.2)" }}
                disabled={loading}
              />
              <Star size={18} style={{ color: formData.isFeatured ? "#ffc107" : "#666" }} />
              <span style={{ fontWeight: "600" }}>Make this car Featured</span>
            </label>
            <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem", color: "#666" }}>
              Featured cars appear in the special section and get premium visibility
            </p>
          </div>

          {/* Special Offer */}
          {formData.isFeatured && (
            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Gift size={16} />
                Special Offer (Optional)
              </label>
              <input
                type="text"
                name="specialOffer"
                value={formData.specialOffer}
                onChange={handleChange}
                placeholder="e.g. 20% OFF, Free GPS, Special Weekend Rate..."
                disabled={loading}
                maxLength={100}
              />
            </div>
          )}

          {/* Additional Details */}
          <div className="form-group">
            <label>Features</label>
            <textarea
              name="features"
              value={formData.features}
              onChange={handleChange}
              placeholder="e.g. Air Conditioning, GPS, Bluetooth, Rear Camera..."
              rows="3"
              disabled={loading}
              maxLength={500}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of the car..."
              rows="4"
              disabled={loading}
              maxLength={1000}
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons" style={{ marginTop: 30 }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => window.history.back()}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`submit-btn ${loading ? "loading" : ""} ${
                formData.isFeatured ? "featured" : ""
              }`}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? (
                <>
                  <div
                    className="loading-spinner"
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Adding car...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {formData.isFeatured ? "Add Featured Car" : "Add Car"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCar;
