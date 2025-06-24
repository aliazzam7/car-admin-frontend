import React, { useState, useEffect } from "react";
import { Upload, Check, ArrowLeft, Save, Star, Gift, AlertCircle } from "lucide-react";
import { db, storage, auth } from "../firebase"; // Ajuste selon ton projet
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

const AddCar = () => {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
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
    image: null,
  });

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
    const { name, value, type, files, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "file"
          ? files[0]
          : type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Vérifier le type de fichier
      if (file.type.startsWith('image/')) {
        setFormData((prev) => ({
          ...prev,
          image: file,
        }));
      } else {
        alert("Please select an image file (PNG, JPG, JPEG, GIF)");
      }
    }
  };

  // Fonction d'upload d'image améliorée avec gestion CORS
  const uploadImage = async (imageFile) => {
    try {
      console.log("Starting image upload...");
      console.log("File details:", {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type
      });

      // Vérifier la taille du fichier (max 10MB)
      if (imageFile.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB");
      }

      // Vérifier le type de fichier
      if (!imageFile.type.startsWith('image/')) {
        throw new Error("Please select a valid image file");
      }

      // Générer un nom de fichier unique et propre
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = imageFile.name.split('.').pop().toLowerCase();
      const fileName = `car_${timestamp}_${randomString}.${fileExtension}`;
      
      // Créer la référence de stockage
      const storageRef = ref(storage, `cars/${fileName}`);
      
      console.log("Uploading to:", `cars/${fileName}`);
      
      // Simuler le progress pour l'UX
      setUploadProgress(10);

      // Attendre un peu pour s'assurer que Firebase est prêt
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setUploadProgress(30);

      // Upload avec uploadBytes (plus fiable pour CORS)
      console.log("Starting upload with uploadBytes...");
      const snapshot = await uploadBytes(storageRef, imageFile);
      
      console.log("Upload successful, snapshot:", snapshot);
      setUploadProgress(80);
      
      // Petit délai avant de récupérer l'URL
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Obtenir l'URL de téléchargement
      console.log("Getting download URL...");
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log("Download URL obtained:", downloadURL);
      setUploadProgress(100);
      
      // Petit délai pour l'UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return downloadURL;
      
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      setUploadProgress(0);
      
      // Messages d'erreur spécifiques avec solutions
      if (error.code === 'storage/unauthorized') {
        throw new Error("Permission denied. Please check Firebase Storage rules and authentication.");
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error("Storage quota exceeded. Please contact administrator.");
      } else if (error.code === 'storage/unauthenticated') {
        throw new Error("Authentication required. Please log in again.");
      } else if (error.message.includes("network") || error.message.includes("CORS")) {
        throw new Error("Network/CORS error. Please check your Firebase configuration and try again.");
      } else if (error.message.includes("Failed to fetch")) {
        throw new Error("Connection failed. Please check your internet connection and Firebase setup.");
      } else {
        throw new Error(error.message || "Upload failed. Please try again.");
      }
    }
  };

  // Alternative: Upload sans image si CORS persiste
  const uploadImageWithFallback = async (imageFile) => {
    try {
      return await uploadImage(imageFile);
    } catch (error) {
      console.error("Primary upload failed:", error);
      
      // Si c'est un problème CORS/réseau, proposer de continuer sans image
      if (error.message.includes("CORS") || error.message.includes("network") || error.message.includes("Failed to fetch")) {
        const shouldContinue = window.confirm(
          "Image upload failed due to network/CORS issues. Would you like to add the car without an image? You can add the image later by editing the car."
        );
        
        if (shouldContinue) {
          console.log("User chose to continue without image");
          return ""; // Retourner une chaîne vide pour continuer sans image
        }
      }
      
      // Sinon, propager l'erreur
      throw error;
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
    setUploadProgress(0);

    try {
      console.log("=== Starting car submission ===");
      console.log("User:", user.email);
      console.log("Form data:", formData);

      let imageUrl = "";

      // Upload image si présente
      if (formData.image) {
        console.log("Image selected, starting upload...");
        try {
          imageUrl = await uploadImageWithFallback(formData.image);
          console.log("Image upload result:", imageUrl);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
      } else {
        console.log("No image selected, proceeding without image");
      }

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
        imageUrl: imageUrl,
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
      const successMessage = imageUrl 
        ? "Car added successfully with image! 🎉" 
        : "Car added successfully! 🎉" + (formData.image ? " (Image upload skipped due to technical issues)" : "");
      
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
        image: null,
      });

      // Reset file input
      const fileInput = document.getElementById("fileInput");
      if (fileInput) {
        fileInput.value = "";
      }

      console.log("=== Car submission completed successfully ===");

    } catch (error) {
      console.error("=== Error in car submission ===");
      console.error("Error details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // Message d'erreur détaillé pour l'utilisateur
      let errorMessage = "Failed to add car. ";
      
      if (error.message.includes("permission-denied")) {
        errorMessage += "Permission denied. Please check your Firebase Storage rules.";
      } else if (error.message.includes("network") || error.message.includes("CORS")) {
        errorMessage += "Network/CORS error. Please check your Firebase configuration.";
      } else if (error.message.includes("quota")) {
        errorMessage += "Storage quota exceeded. Please contact administrator.";
      } else if (error.message.includes("unauthenticated")) {
        errorMessage += "Please log in and try again.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const brands = [
    { value: "Toyota", icon: "🚗" },
    { value: "Honda", icon: "🚙" },
    { value: "BMW", icon: "🏎️" },
    { value: "Mercedes", icon: "🚐" },
    { value: "Audi", icon: "🚕" },
    { value: "Hyundai", icon: "🚗" },
    { value: "Kia", icon: "🚙" },
    { value: "Nissan", icon: "🚗" },
    { value: "Volkswagen", icon: "🚐" },
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
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <div style={{ 
                width: '200px', 
                height: '6px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '3px',
                margin: '10px auto',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: '#007bff',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              <p>Uploading image... {uploadProgress}%</p>
            </div>
          )}
          {uploadProgress === 0 && (
            <p>Adding car to database...</p>
          )}
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
          {/* Image Upload Section */}
          <div className="form-group">
            <label
              style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}
            >
              <Upload size={18} />
              Car Image (Optional)
            </label>

            <div
              className={`file-upload ${dragActive ? "active" : ""} ${
                formData.image ? "has-file" : ""
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput").click()}
              style={{ position: "relative", cursor: "pointer" }}
            >
              <input
                id="fileInput"
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  top: 0,
                  left: 0,
                  cursor: "pointer",
                }}
                disabled={loading}
              />

              {formData.image ? (
                <div
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                >
                  <Check size={24} style={{ color: "#28a745" }} />
                  <p style={{ margin: 0, fontWeight: "600", color: "#28a745" }}>
                    {formData.image.name}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                    {(formData.image.size / 1024 / 1024).toFixed(2)} MB - Image selected successfully
                  </p>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                >
                  <Upload size={24} />
                  <p style={{ margin: 0, fontWeight: "600" }}>
                    Drop your image here or click to browse
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                    PNG, JPG, JPEG, GIF up to 10MB (Optional)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rest of the form remains the same */}
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
                <option value="2">👥 2 passengers</option>
                <option value="4">👨‍👩‍👧‍👦 4 passengers</option>
                <option value="5">👨‍👩‍👧‍👦 5 passengers</option>
                <option value="7">👨‍👩‍👧‍👦 7 passengers</option>
                <option value="8">👥 8 passengers</option>
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
                <option value="gasoline">⛽ Gasoline</option>
                <option value="diesel">🚛 Diesel</option>
                <option value="hybrid">🔋 Hybrid</option>
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
                  {uploadProgress > 0 && uploadProgress < 100 ? 
                    `Uploading... ${uploadProgress}%` : 
                    "Adding car..."
                  }
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

// // Go to Firebase Console > Storage > Rules
// // Make sure your rules allow authenticated users to upload:

// rules_version = '2';
// service firebase.storage {
//   match /b/{bucket}/o {
//     match /cars/{imageId} {
//       // Allow read and write for authenticated users
//       allow read, write: if request.auth != null;
//     }
//   }
// }










//---------------------

//sans le firebase
// import React, { useState } from 'react';
// import { Car, Upload, Star, Gift, Check, ArrowLeft, Save } from 'lucide-react';

// const AddCar = () => {
//   const [loading, setLoading] = useState(false);
//   const [dragActive, setDragActive] = useState(false);
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
//     isFeatured: false,
//     specialOffer: '',
//     image: null
//   });

//   const handleChange = (e) => {
//     const { name, value, type, files, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'file' ? files[0] : 
//                type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
    
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setFormData(prev => ({
//         ...prev,
//         image: e.dataTransfer.files[0]
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     setTimeout(() => {
//       console.log('New car added:', formData);
//       const carDestination = formData.isFeatured ? 'Featured Cars & All Cars' : 'All Cars only';
//       alert(`Car successfully added to: ${carDestination}!`);
//       setLoading(false);
//     }, 2000);
//   };

//   const brands = [
//     { value: 'Toyota', icon: '🚗' },
//     { value: 'Honda', icon: '🚙' },
//     { value: 'BMW', icon: '🏎️' },
//     { value: 'Mercedes', icon: '🚐' },
//     { value: 'Audi', icon: '🚕' },
//     { value: 'Hyundai', icon: '🚗' },
//     { value: 'Kia', icon: '🚙' },
//     { value: 'Nissan', icon: '🚗' },
//     { value: 'Volkswagen', icon: '🚐' }
//   ];

//   return (
//     <div className="page-container">
//       {/* Loading Overlay */}
//       {loading && (
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//         </div>
//       )}

//       {/* Page Header */}
//       <div className="page-header">
//         <button className="cancel-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
//           <ArrowLeft size={16} />
//           Back
//         </button>
//         <h1>Add New Car</h1>
//         <p>Create a new car listing for your fleet</p>
//       </div>

//       {/* Main Form Container */}
//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
          
//           {/* Image Upload Section */}
//           <div className="form-group">
//             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
//               <Upload size={18} />
//               Car Image
//             </label>
            
//             <div 
//               className={`file-upload ${dragActive ? 'active' : ''} ${formData.image ? 'has-file' : ''}`}
//               onDragEnter={handleDrag}
//               onDragLeave={handleDrag}
//               onDragOver={handleDrag}
//               onDrop={handleDrop}
//             >
//               <input
//                 type="file"
//                 name="image"
//                 accept="image/*"
//                 onChange={handleChange}
//               />
              
//               {formData.image ? (
//                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
//                   <Check size={24} style={{ color: '#28a745' }} />
//                   <p style={{ margin: 0, fontWeight: '600', color: '#28a745' }}>{formData.image.name}</p>
//                   <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Image selected successfully</p>
//                 </div>
//               ) : (
//                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
//                   <Upload size={24} />
//                   <p style={{ margin: 0, fontWeight: '600' }}>Drop your image here or click to browse</p>
//                   <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>PNG, JPG up to 10MB</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Basic Information */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>Car Name *</label>
//               <input
//                 type="text"
//                 name="carName"
//                 value={formData.carName}
//                 onChange={handleChange}
//                 placeholder="e.g. Corolla 2023"
//                 required
//               />
//             </div>

//             <div className="form-group">
//               <label>Brand *</label>
//               <select
//                 name="brand"
//                 value={formData.brand}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select a brand</option>
//                 {brands.map(brand => (
//                   <option key={brand.value} value={brand.value}>
//                     {brand.icon} {brand.value}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label>License Plate</label>
//               <input
//                 type="text"
//                 name="plateNumber"
//                 value={formData.plateNumber}
//                 onChange={handleChange}
//                 placeholder="e.g. ABC-123"
//               />
//             </div>

//             <div className="form-group">
//               <label>Daily Price (€) *</label>
//               <input
//                 type="number"
//                 name="dailyPrice"
//                 value={formData.dailyPrice}
//                 onChange={handleChange}
//                 placeholder="e.g. 50"
//                 min="1"
//                 required
//               />
//             </div>
//           </div>

//           {/* Specifications */}
//           <div className="form-row">
//             <div className="form-group">
//               <label>Transmission *</label>
//               <select
//                 name="transmission"
//                 value={formData.transmission}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="manual">🔧 Manual</option>
//                 <option value="automatic">⚙️ Automatic</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Passengers *</label>
//               <select
//                 name="passengers"
//                 value={formData.passengers}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select</option>
//                 <option value="2">👥 2 passengers</option>
//                 <option value="4">👨‍👩‍👧‍👦 4 passengers</option>
//                 <option value="5">👨‍👩‍👧‍👦 5 passengers</option>
//                 <option value="7">👨‍👩‍👧‍👦 7 passengers</option>
//                 <option value="8">👥 8 passengers</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label>Fuel Type *</label>
//               <select
//                 name="fuelType"
//                 value={formData.fuelType}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="gasoline">⛽ Gasoline</option>
//                 <option value="diesel">🚛 Diesel</option>
//                 <option value="hybrid">🔋 Hybrid</option>
//                 <option value="electric">⚡ Electric</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Status *</label>
//               <select
//                 name="status"
//                 value={formData.status}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="available">✅ Available</option>
//                 <option value="unavailable">❌ Unavailable</option>
//               </select>
//             </div>
//           </div>

//           {/* Featured Car Section */}
//           <div className={`featured-section ${formData.isFeatured ? 'active' : ''}`}>
//             <div className="form-group">
//               <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
//                 <input
//                   type="checkbox"
//                   name="isFeatured"
//                   checked={formData.isFeatured}
//                   onChange={handleChange}
//                   style={{ transform: 'scale(1.2)' }}
//                 />
//                 <Star size={18} style={{ color: formData.isFeatured ? '#ffc107' : '#666' }} />
//                 <span style={{ fontWeight: '600' }}>Make this car Featured</span>
//               </label>
//               <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
//                 Featured cars appear in the special section and get premium visibility
//               </p>
//             </div>

//             {formData.isFeatured && (
//               <div className="featured-options">
//                 <div className="form-group">
//                   <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                     <Gift size={16} />
//                     Special Offer (Optional)
//                   </label>
//                   <input
//                     type="text"
//                     name="specialOffer"
//                     value={formData.specialOffer}
//                     onChange={handleChange}
//                     placeholder="e.g. 20% OFF, Free GPS, Special Weekend Rate..."
//                   />
//                 </div>

//                 {/* Featured Preview */}
//                 <div className="featured-preview">
//                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 10px 0' }}>
//                     <Star size={16} style={{ color: '#ffc107' }} />
//                     Featured Car Preview
//                   </h4>
//                   <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
//                     <p style={{ margin: '4px 0' }}>
//                       <strong>Car:</strong> {formData.carName || 'Car Name'} - {formData.brand || 'Brand'}
//                     </p>
//                     <p style={{ margin: '4px 0' }}>
//                       <strong>Price:</strong> €{formData.dailyPrice || '0'}/day
//                     </p>
//                     {formData.specialOffer && (
//                       <p style={{ margin: '4px 0', color: '#28a745', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
//                         <Gift size={14} />
//                         {formData.specialOffer}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Additional Details */}
//           <div className="form-group">
//             <label>Features</label>
//             <textarea
//               name="features"
//               value={formData.features}
//               onChange={handleChange}
//               placeholder="e.g. Air Conditioning, GPS, Bluetooth, Rear Camera..."
//               rows="3"
//             />
//           </div>

//           <div className="form-group">
//             <label>Description</label>
//             <textarea
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               placeholder="Detailed description of the car..."
//               rows="4"
//             />
//           </div>

//           {/* Action Buttons */}
//           <div className="action-buttons" style={{ marginTop: '30px' }}>
//             <button type="button" className="cancel-btn">
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className={`submit-btn ${loading ? 'loading' : ''} ${formData.isFeatured ? 'featured' : ''}`}
//               disabled={loading}
//               style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
//             >
//               {loading ? (
//                 <>
//                   <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white' }}></div>
//                   Adding car...
//                 </>
//               ) : (
//                 <>
//                   <Save size={16} />
//                   {formData.isFeatured ? 'Add Featured Car' : 'Add Car'}
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddCar;
//---------------------------------------------------------



// //code with featured cars version 2 plus organiser
// import React, { useState } from 'react';
// import { Car, Upload, Star, Gift, Check, ArrowLeft, Save } from 'lucide-react';

// const AddCar = () => {
//   const [loading, setLoading] = useState(false);
//   const [dragActive, setDragActive] = useState(false);
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
//     isFeatured: false,
//     specialOffer: '',
//     image: null
//   });

//   const handleChange = (e) => {
//     const { name, value, type, files, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'file' ? files[0] : 
//                type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleDrag = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
    
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       setFormData(prev => ({
//         ...prev,
//         image: e.dataTransfer.files[0]
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     setTimeout(() => {
//       console.log('New car added:', formData);
//       const carDestination = formData.isFeatured ? 'Featured Cars & All Cars' : 'All Cars only';
//       alert(`Car successfully added to: ${carDestination}!`);
//       setLoading(false);
//     }, 2000);
//   };

//   const brands = [
//     { value: 'Toyota', icon: '🚗' },
//     { value: 'Honda', icon: '🚙' },
//     { value: 'BMW', icon: '🏎️' },
//     { value: 'Mercedes', icon: '🚐' },
//     { value: 'Audi', icon: '🚕' },
//     { value: 'Hyundai', icon: '🚗' },
//     { value: 'Kia', icon: '🚙' },
//     { value: 'Nissan', icon: '🚗' },
//     { value: 'Volkswagen', icon: '🚐' }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Header */}
//       <div className="bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto px-6 py-4">
//           <div className="flex items-center gap-4">
//             <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
//               <ArrowLeft className="w-5 h-5" />
//             </button>
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
//                 <Car className="w-6 h-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
//                   Add New Car
//                 </h1>
//                 <p className="text-gray-500 text-sm">Create a new car listing for your fleet</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-4xl mx-auto px-6 py-8">
//         <div className="space-y-8">
          
//           {/* Image Upload Section */}
//           <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
//             <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
//               <Upload className="w-5 h-5 text-blue-600" />
//               Car Image
//             </h3>
            
//             <div 
//               className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
//                 dragActive 
//                   ? 'border-blue-500 bg-blue-50' 
//                   : formData.image 
//                     ? 'border-green-400 bg-green-50' 
//                     : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
//               }`}
//               onDragEnter={handleDrag}
//               onDragLeave={handleDrag}
//               onDragOver={handleDrag}
//               onDrop={handleDrop}
//             >
//               <input
//                 type="file"
//                 name="image"
//                 accept="image/*"
//                 onChange={handleChange}
//                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
//               />
              
//               {formData.image ? (
//                 <div className="space-y-2">
//                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
//                     <Check className="w-8 h-8 text-green-600" />
//                   </div>
//                   <p className="font-medium text-green-700">{formData.image.name}</p>
//                   <p className="text-sm text-green-600">Image selected successfully</p>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
//                     <Upload className="w-8 h-8 text-blue-600" />
//                   </div>
//                   <p className="font-medium text-gray-700">Drop your image here or click to browse</p>
//                   <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Basic Information */}
//           <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
//             <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
//               <Car className="w-5 h-5 text-blue-600" />
//               Basic Information
//             </h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Car Name *</label>
//                 <input
//                   type="text"
//                   name="carName"
//                   value={formData.carName}
//                   onChange={handleChange}
//                   placeholder="e.g. Corolla 2023"
//                   required
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Brand *</label>
//                 <select
//                   name="brand"
//                   value={formData.brand}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 >
//                   <option value="">Select a brand</option>
//                   {brands.map(brand => (
//                     <option key={brand.value} value={brand.value}>
//                       {brand.icon} {brand.value}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">License Plate</label>
//                 <input
//                   type="text"
//                   name="plateNumber"
//                   value={formData.plateNumber}
//                   onChange={handleChange}
//                   placeholder="e.g. ABC-123"
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Daily Price (€) *</label>
//                 <input
//                   type="number"
//                   name="dailyPrice"
//                   value={formData.dailyPrice}
//                   onChange={handleChange}
//                   placeholder="e.g. 50"
//                   min="1"
//                   required
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Specifications */}
//           <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
//             <h3 className="text-lg font-semibold mb-6">Specifications</h3>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Transmission *</label>
//                 <select
//                   name="transmission"
//                   value={formData.transmission}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 >
//                   <option value="manual">🔧 Manual</option>
//                   <option value="automatic">⚙️ Automatic</option>
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Passengers *</label>
//                 <select
//                   name="passengers"
//                   value={formData.passengers}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 >
//                   <option value="">Select</option>
//                   <option value="2">👥 2 passengers</option>
//                   <option value="4">👨‍👩‍👧‍👦 4 passengers</option>
//                   <option value="5">👨‍👩‍👧‍👦 5 passengers</option>
//                   <option value="7">👨‍👩‍👧‍👦 7 passengers</option>
//                   <option value="8">👥 8 passengers</option>
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Fuel Type *</label>
//                 <select
//                   name="fuelType"
//                   value={formData.fuelType}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 >
//                   <option value="gasoline">⛽ Gasoline</option>
//                   <option value="diesel">🚛 Diesel</option>
//                   <option value="hybrid">🔋 Hybrid</option>
//                   <option value="electric">⚡ Electric</option>
//                 </select>
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Status *</label>
//                 <select
//                   name="status"
//                   value={formData.status}
//                   onChange={handleChange}
//                   required
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50"
//                 >
//                   <option value="available">✅ Available</option>
//                   <option value="unavailable">❌ Unavailable</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Featured Car Section */}
//           <div className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
//             formData.isFeatured 
//               ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 shadow-lg' 
//               : 'bg-white/60 backdrop-blur-sm border-white/20 shadow-lg'
//           }`}>
//             <div className="flex items-center gap-3 mb-4">
//               <label className="flex items-center gap-3 cursor-pointer group">
//                 <div className={`relative w-6 h-6 rounded-md border-2 transition-all ${
//                   formData.isFeatured ? 'bg-amber-500 border-amber-500' : 'border-gray-300 group-hover:border-amber-400'
//                 }`}>
//                   <input
//                     type="checkbox"
//                     name="isFeatured"
//                     checked={formData.isFeatured}
//                     onChange={handleChange}
//                     className="absolute inset-0 opacity-0 cursor-pointer"
//                   />
//                   {formData.isFeatured && (
//                     <Check className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
//                   )}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Star className={`w-5 h-5 ${formData.isFeatured ? 'text-amber-500 fill-current' : 'text-gray-400'}`} />
//                   <span className={`font-semibold ${formData.isFeatured ? 'text-amber-700' : 'text-gray-700'}`}>
//                     Make this car Featured
//                   </span>
//                 </div>
//               </label>
//             </div>

//             <p className="text-sm text-gray-600 mb-4">
//               Featured cars appear in the special section and get premium visibility
//             </p>

//             {formData.isFeatured && (
//               <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
//                 <div className="space-y-2">
//                   <label className="text-sm font-medium text-amber-700 flex items-center gap-2">
//                     <Gift className="w-4 h-4" />
//                     Special Offer (Optional)
//                   </label>
//                   <input
//                     type="text"
//                     name="specialOffer"
//                     value={formData.specialOffer}
//                     onChange={handleChange}
//                     placeholder="e.g. 20% OFF, Free GPS, Special Weekend Rate..."
//                     className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none bg-amber-50/50"
//                   />
//                 </div>

//                 {/* Preview */}
//                 <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-xl border border-amber-200">
//                   <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
//                     <Star className="w-4 h-4 fill-current" />
//                     Featured Car Preview
//                   </h4>
//                   <div className="space-y-1 text-sm">
//                     <p className="text-amber-700">
//                       <span className="font-medium">Car:</span> {formData.carName || 'Car Name'} - {formData.brand || 'Brand'}
//                     </p>
//                     <p className="text-amber-700">
//                       <span className="font-medium">Price:</span> €{formData.dailyPrice || '0'}/day
//                     </p>
//                     {formData.specialOffer && (
//                       <p className="text-green-700 font-medium flex items-center gap-1">
//                         <Gift className="w-4 h-4" />
//                         {formData.specialOffer}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Additional Details */}
//           <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
//             <h3 className="text-lg font-semibold mb-6">Additional Details</h3>

//             <div className="space-y-6">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Features</label>
//                 <textarea
//                   name="features"
//                   value={formData.features}
//                   onChange={handleChange}
//                   placeholder="e.g. Air Conditioning, GPS, Bluetooth, Rear Camera..."
//                   rows="3"
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50 resize-none"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <label className="text-sm font-medium text-gray-700">Description</label>
//                 <textarea
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   placeholder="Detailed description of the car..."
//                   rows="4"
//                   className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/50 resize-none"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 pt-6">
//             <button
//               type="button"
//               className="flex-1 px-8 py-4 rounded-xl border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 hover:scale-105"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               onClick={handleSubmit}
//               className={`flex-1 px-8 py-4 rounded-xl font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 ${
//                 formData.isFeatured
//                   ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg'
//                   : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
//               } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {loading ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   Adding car...
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-5 h-5" />
//                   {formData.isFeatured ? 'Add Featured Car' : 'Add Car'}
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddCar;








// //code with featured cars version 1
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const AddCar = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
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
//     isFeatured: false, // جديد: للتحكم بالسيارات المميزة
//     specialOffer: '', // جديد: للعروض الخاصة
//     image: null
//   });

//   const handleChange = (e) => {
//     const { name, value, type, files, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'file' ? files[0] : 
//                type === 'checkbox' ? checked : value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     // Simulate car addition
//     setTimeout(() => {
//       console.log('New car added:', formData);
      
//       // تحديد وين رح تنحط السيارة
//       const carDestination = formData.isFeatured ? 'Featured Cars & All Cars' : 'All Cars only';
      
//       alert(`Car successfully added to: ${carDestination}!`);
//       setLoading(false);
//       navigate('/cars');
//     }, 2000);
//   };

//   const handleCancel = () => {
//     navigate('/cars');
//   };

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Add a New Car</h1>
//         <p>Fill in the car information below</p>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Car Image</label>
//             <div className="file-upload">
//               <input
//                 type="file"
//                 name="image"
//                 accept="image/*"
//                 onChange={handleChange}
//                 id="car-image"
//               />
//               <label htmlFor="car-image">
//                 📷 Choose an image
//                 {formData.image && <div>Selected file: {formData.image.name}</div>}
//               </label>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="carName">Car Name *</label>
//               <input
//                 type="text"
//                 id="carName"
//                 name="carName"
//                 value={formData.carName}
//                 onChange={handleChange}
//                 placeholder="e.g. Corolla 2023"
//                 required
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="brand">Brand *</label>
//               <select
//                 id="brand"
//                 name="brand"
//                 value={formData.brand}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select a brand</option>
//                 <option value="Toyota">Toyota</option>
//                 <option value="Honda">Honda</option>
//                 <option value="BMW">BMW</option>
//                 <option value="Mercedes">Mercedes</option>
//                 <option value="Audi">Audi</option>
//                 <option value="Hyundai">Hyundai</option>
//                 <option value="Kia">Kia</option>
//                 <option value="Nissan">Nissan</option>
//                 <option value="Volkswagen">Volkswagen</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="plateNumber">License Plate</label>
//               <input
//                 type="text"
//                 id="plateNumber"
//                 name="plateNumber"
//                 value={formData.plateNumber}
//                 onChange={handleChange}
//                 placeholder="e.g. ABC-123"
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="dailyPrice">Daily Price (€) *</label>
//               <input
//                 type="number"
//                 id="dailyPrice"
//                 name="dailyPrice"
//                 value={formData.dailyPrice}
//                 onChange={handleChange}
//                 placeholder="e.g. 50"
//                 min="1"
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="transmission">Transmission Type *</label>
//               <select
//                 id="transmission"
//                 name="transmission"
//                 value={formData.transmission}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="manual">Manual</option>
//                 <option value="automatic">Automatic</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label htmlFor="passengers">Number of Passengers *</label>
//               <select
//                 id="passengers"
//                 name="passengers"
//                 value={formData.passengers}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select</option>
//                 <option value="2">2 passengers</option>
//                 <option value="4">4 passengers</option>
//                 <option value="5">5 passengers</option>
//                 <option value="7">7 passengers</option>
//                 <option value="8">8 passengers</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="fuelType">Fuel Type *</label>
//               <select
//                 id="fuelType"
//                 name="fuelType"
//                 value={formData.fuelType}
//                 onChange={handleChange}
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
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="available">Available</option>
//                 <option value="unavailable">Unavailable</option>
//               </select>
//             </div>
//           </div>

//           {/* قسم جديد للسيارات المميزة */}
//           <div className="form-group" style={{ 
//             border: '2px solid #e3f2fd', 
//             padding: '20px', 
//             borderRadius: '8px', 
//             backgroundColor: '#f8f9ff',
//             marginTop: '20px'
//           }}>
//             <div className="checkbox-group" style={{ marginBottom: '15px' }}>
//               <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
//                 <input
//                   type="checkbox"
//                   name="isFeatured"
//                   checked={formData.isFeatured}
//                   onChange={handleChange}
//                   style={{ marginRight: '10px', transform: 'scale(1.2)' }}
//                 />
//                 <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
//                   ⭐ Make this car Featured
//                 </span>
//               </label>
//               <p style={{ 
//                 margin: '5px 0 0 30px', 
//                 fontSize: '14px', 
//                 color: '#666',
//                 fontStyle: 'italic'
//               }}>
//                 Featured cars appear in the special "Featured Cars" section and get more visibility
//               </p>
//             </div>

//             {/* خيار العرض الخاص - يظهر فقط إذا كانت السيارة مميزة */}
//             {formData.isFeatured && (
//               <div className="form-group" style={{ marginTop: '15px' }}>
//                 <label htmlFor="specialOffer">Special Offer (Optional)</label>
//                 <input
//                   type="text"
//                   id="specialOffer"
//                   name="specialOffer"
//                   value={formData.specialOffer}
//                   onChange={handleChange}
//                   placeholder="e.g. 20% OFF, Free GPS, Special Weekend Rate..."
//                   style={{ 
//                     border: '2px solid #4caf50',
//                     backgroundColor: '#f1f8e9'
//                   }}
//                 />
//                 <p style={{ 
//                   margin: '5px 0 0 0', 
//                   fontSize: '12px', 
//                   color: '#2e7d32'
//                 }}>
//                   💡 Add a special offer to make this car even more attractive!
//                 </p>
//               </div>
//             )}
//           </div>

//           <div className="form-group">
//             <label htmlFor="features">Features</label>
//             <textarea
//               id="features"
//               name="features"
//               value={formData.features}
//               onChange={handleChange}
//               placeholder="e.g. Air Conditioning, GPS, Bluetooth, Rear Camera..."
//               rows="3"
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               placeholder="Detailed description of the car..."
//               rows="4"
//             />
//           </div>

//           <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
//             <button
//               type="button"
//               className="cancel-btn"
//               onClick={handleCancel}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="submit-btn"
//               disabled={loading}
//               style={{
//                 backgroundColor: formData.isFeatured ? '#ff9800' : '#2196f3',
//                 transition: 'background-color 0.3s ease'
//               }}
//             >
//               {loading ? 'Adding car...' : 
//                formData.isFeatured ? '⭐ Add Featured Car' : 'Add Car'}
//             </button>
//           </div>

//           {/* معاينة سريعة */}
//           {formData.isFeatured && (
//             <div style={{
//               marginTop: '20px',
//               padding: '15px',
//               backgroundColor: '#fff3e0',
//               border: '2px solid #ff9800',
//               borderRadius: '8px'
//             }}>
//               <h4 style={{ color: '#e65100', margin: '0 0 10px 0' }}>
//                 ⭐ Featured Car Preview:
//               </h4>
//               <p style={{ margin: '5px 0', color: '#bf360c' }}>
//                 <strong>Car:</strong> {formData.carName || 'Car Name'} - {formData.brand || 'Brand'}
//               </p>
//               <p style={{ margin: '5px 0', color: '#bf360c' }}>
//                 <strong>Price:</strong> €{formData.dailyPrice || '0'}/day
//               </p>
//               {formData.specialOffer && (
//                 <p style={{ 
//                   margin: '5px 0', 
//                   color: '#4caf50', 
//                   fontWeight: 'bold',
//                   fontSize: '16px'
//                 }}>
//                   🎉 <strong>Special Offer:</strong> {formData.specialOffer}
//                 </p>
//               )}
//             </div>
//           )}
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddCar;


//--------------------------------------------------------------
//version of code sans featured cars
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const AddCar = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
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
//     image: null
//   });

//   const handleChange = (e) => {
//     const { name, value, type, files } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'file' ? files[0] : value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     // Simulate car addition
//     setTimeout(() => {
//       console.log('New car added:', formData);
//       alert('Car successfully added!');
//       setLoading(false);
//       navigate('/cars');
//     }, 2000);
//   };

//   const handleCancel = () => {
//     navigate('/cars');
//   };

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Add a New Car</h1>
//         <p>Fill in the car information below</p>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           <div className="form-group">
//             <label>Car Image</label>
//             <div className="file-upload">
//               <input
//                 type="file"
//                 name="image"
//                 accept="image/*"
//                 onChange={handleChange}
//                 id="car-image"
//               />
//               <label htmlFor="car-image">
//                 📷 Choose an image
//                 {formData.image && <div>Selected file: {formData.image.name}</div>}
//               </label>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="carName">Car Name *</label>
//               <input
//                 type="text"
//                 id="carName"
//                 name="carName"
//                 value={formData.carName}
//                 onChange={handleChange}
//                 placeholder="e.g. Corolla 2023"
//                 required
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="brand">Brand *</label>
//               <select
//                 id="brand"
//                 name="brand"
//                 value={formData.brand}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select a brand</option>
//                 <option value="Toyota">Toyota</option>
//                 <option value="Honda">Honda</option>
//                 <option value="BMW">BMW</option>
//                 <option value="Mercedes">Mercedes</option>
//                 <option value="Audi">Audi</option>
//                 <option value="Hyundai">Hyundai</option>
//                 <option value="Kia">Kia</option>
//                 <option value="Nissan">Nissan</option>
//                 <option value="Volkswagen">Volkswagen</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="plateNumber">License Plate</label>
//               <input
//                 type="text"
//                 id="plateNumber"
//                 name="plateNumber"
//                 value={formData.plateNumber}
//                 onChange={handleChange}
//                 placeholder="e.g. ABC-123"
//               />
//             </div>

//             <div className="form-group">
//               <label htmlFor="dailyPrice">Daily Price (€) *</label>
//               <input
//                 type="number"
//                 id="dailyPrice"
//                 name="dailyPrice"
//                 value={formData.dailyPrice}
//                 onChange={handleChange}
//                 placeholder="e.g. 50"
//                 min="1"
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="transmission">Transmission Type *</label>
//               <select
//                 id="transmission"
//                 name="transmission"
//                 value={formData.transmission}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="manual">Manual</option>
//                 <option value="automatic">Automatic</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label htmlFor="passengers">Number of Passengers *</label>
//               <select
//                 id="passengers"
//                 name="passengers"
//                 value={formData.passengers}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="">Select</option>
//                 <option value="2">2 passengers</option>
//                 <option value="4">4 passengers</option>
//                 <option value="5">5 passengers</option>
//                 <option value="7">7 passengers</option>
//                 <option value="8">8 passengers</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="fuelType">Fuel Type *</label>
//               <select
//                 id="fuelType"
//                 name="fuelType"
//                 value={formData.fuelType}
//                 onChange={handleChange}
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
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="available">Available</option>
//                 <option value="unavailable">Unavailable</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-group">
//             <label htmlFor="features">Features</label>
//             <textarea
//               id="features"
//               name="features"
//               value={formData.features}
//               onChange={handleChange}
//               placeholder="e.g. Air Conditioning, GPS, Bluetooth, Rear Camera..."
//               rows="3"
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="description">Description</label>
//             <textarea
//               id="description"
//               name="description"
//               value={formData.description}
//               onChange={handleChange}
//               placeholder="Detailed description of the car..."
//               rows="4"
//             />
//           </div>

//           <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
//             <button
//               type="button"
//               className="cancel-btn"
//               onClick={handleCancel}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="submit-btn"
//               disabled={loading}
//             >
//               {loading ? 'Adding car...' : 'Add Car'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddCar;
