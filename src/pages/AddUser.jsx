import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, onAuthStateChanged, getAuth, connectAuthEmulator } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ArrowLeft, User, Mail, Phone, Lock, Shield, AlertCircle } from 'lucide-react';

const AddUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    status: 'active'
  });

  // Check authentication and admin permission
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user);
      setCurrentUser(user);
      setAuthLoading(false);
      
      // TODO: Check if user is admin by checking their role in Firestore
      // For now, assuming any authenticated user can add users
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication
    if (!currentUser) {
      alert('Please log in to add users.');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    // Validate required fields
    if (!formData.fullName.trim() || !formData.email.trim()) {
      alert('Please fill in all required fields!');
      return;
    }

    setLoading(true);

    try {
      console.log('=== Starting user creation ===');
      console.log('Form data:', formData);

      // Step 1: Create user using Firebase REST API (doesn't affect current session)
      console.log('Creating user via REST API...');
      
      // Get your Web API Key from Firebase Console -> Project Settings -> General
      const API_KEY = "AIzaSyCrwOvceGAenF3rbKfUA4gRb0pWCP643Ag"; // Replace with your actual API key
      
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          returnSecureToken: true
        })
      });
      
      const authResult = await response.json();
      
      if (!response.ok) {
        throw new Error(authResult.error?.message || 'Failed to create user account');
      }
      
      const newUserUid = authResult.localId;
      console.log('User created with UID:', newUserUid);

      // Step 2: Save user data in Firestore
      console.log('Saving user data to Firestore...');
      const userData = {
        uid: newUserUid,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || "",
        role: formData.role,
        status: formData.status,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        lastLogin: null,
        profilePicture: "", // Can be added later
      };

      const usersColRef = collection(db, "users");
      const docRef = await addDoc(usersColRef, userData);
      console.log('User data saved to Firestore with ID:', docRef.id);

      // Success message
      alert(`User "${formData.fullName}" created successfully! 🎉\n\nCredentials:\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nPlease share these credentials securely with the user.`);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        status: 'active'
      });

      console.log('=== User creation completed successfully ===');
      
      // Navigate back to users list
      navigate('/users');

    } catch (error) {
      console.error('=== Error in user creation ===');
      console.error('Error details:', error);
      
      let errorMessage = "Failed to create user. ";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage += "This email is already registered.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage += "Invalid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage += "Password is too weak.";
      } else if (error.code === 'permission-denied') {
        errorMessage += "Permission denied. Please check your Firestore rules.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage += "Network error. Please check your connection.";
      } else {
        errorMessage += error.message || "Please try again.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      password: password,
      confirmPassword: password
    }));
  };

  // Loading screen while checking auth
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

  // Not authenticated screen
  if (!currentUser) {
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
                Please log in to add users
              </p>
              <p style={{ margin: "5px 0 0 0", color: "#856404" }}>
                You need admin privileges to access this feature.
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
          <p>Creating user account...</p>
        </div>
      )}

      <div className="page-header">
        <button
          className="cancel-btn"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}
          onClick={() => navigate('/users')}
          type="button"
          disabled={loading}
        >
          <ArrowLeft size={16} />
          Back to Users
        </button>
        <h1>Add New User</h1>
        <p>Create a new user account for the car reservation system</p>
        <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 10 }}>
          Creating as: <strong>{currentUser.email}</strong>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <User size={16} />
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
                disabled={loading}
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={16} />
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="user@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone size={16} />
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1234567890"
                disabled={loading}
                maxLength={20}
              />
            </div>
            <div className="form-group">
              <label htmlFor="role" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={16} />
                User Role *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={loading}
              >
                <option value="user">👤 User</option>
                <option value="admin">👑 Admin</option>
                <option value="moderator">🛡️ Moderator</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={16} />
                Password *
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter secure password"
                  required
                  disabled={loading}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={generatePassword}
                  disabled={loading}
                  style={{
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    padding: '12px 15px',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  Generate
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '0.85rem' }}>
                Minimum 6 characters required (recommended: 8+ with mixed characters)
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Lock size={16} />
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Account Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="active">✅ Active</option>
              <option value="inactive">⏸️ Inactive</option>
              <option value="suspended">🚫 Suspended</option>
            </select>
          </div>

          <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/users')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`submit-btn ${loading ? 'loading' : ''}`}
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
                  Creating User...
                </>
              ) : (
                <>
                  <User size={16} />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '5px', border: '1px solid #b8daff' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>Important Notes:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#004085' }}>
          <li><strong>Security:</strong> Share login credentials securely with the new user</li>
          <li><strong>First Login:</strong> User should change password on first login</li>
          <li><strong>Admin Access:</strong> Admin users have full system access</li>
          <li><strong>User Management:</strong> Accounts can be modified later from Users list</li>
          <li><strong>Email Verification:</strong> Users will need to verify their email address</li>
        </ul>
      </div>
    </div>
  );
};

export default AddUser;


// //hayda code with firebase v1
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { auth, db } from "../firebase";
// import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// import { ArrowLeft, User, Mail, Phone, Lock, Shield, AlertCircle } from 'lucide-react';

// const AddUser = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [currentUser, setCurrentUser] = useState(null);
//   const [authLoading, setAuthLoading] = useState(true);
  
//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     phone: '',
//     password: '',
//     confirmPassword: '',
//     role: 'user',
//     status: 'active'
//   });

//   // Check authentication and admin permission
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       console.log("Auth state changed:", user);
//       setCurrentUser(user);
//       setAuthLoading(false);
      
//       // TODO: Check if user is admin by checking their role in Firestore
//       // For now, assuming any authenticated user can add users
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Check authentication
//     if (!currentUser) {
//       alert('Please log in to add users.');
//       return;
//     }

//     // Validate passwords match
//     if (formData.password !== formData.confirmPassword) {
//       alert('Passwords do not match!');
//       return;
//     }

//     // Validate password strength
//     if (formData.password.length < 6) {
//       alert('Password must be at least 6 characters long!');
//       return;
//     }

//     // Validate required fields
//     if (!formData.fullName.trim() || !formData.email.trim()) {
//       alert('Please fill in all required fields!');
//       return;
//     }

//     setLoading(true);

//     try {
//       console.log('=== Starting user creation ===');
//       console.log('Form data:', formData);

//       // Step 1: Create user in Firebase Auth
//       console.log('Creating user in Firebase Auth...');
//       const userCredential = await createUserWithEmailAndPassword(
//         auth, 
//         formData.email.trim(), 
//         formData.password
//       );
      
//       const newUser = userCredential.user;
//       console.log('User created in Auth with UID:', newUser.uid);

//       // Step 2: Save user data in Firestore
//       console.log('Saving user data to Firestore...');
//       const userData = {
//         uid: newUser.uid,
//         fullName: formData.fullName.trim(),
//         email: formData.email.trim(),
//         phone: formData.phone.trim() || "",
//         role: formData.role,
//         status: formData.status,
//         createdAt: serverTimestamp(),
//         createdBy: currentUser.uid,
//         createdByEmail: currentUser.email,
//         lastLogin: null,
//         profilePicture: "", // Can be added later
//       };

//       const usersColRef = collection(db, "users");
//       const docRef = await addDoc(usersColRef, userData);
//       console.log('User data saved to Firestore with ID:', docRef.id);

//       // Success message
//       alert(`User "${formData.fullName}" created successfully! 🎉\n\nCredentials:\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nPlease share these credentials securely with the user.`);
      
//       // Reset form
//       setFormData({
//         fullName: '',
//         email: '',
//         phone: '',
//         password: '',
//         confirmPassword: '',
//         role: 'user',
//         status: 'active'
//       });

//       console.log('=== User creation completed successfully ===');
      
//       // Navigate back to users list
//       navigate('/users');

//     } catch (error) {
//       console.error('=== Error in user creation ===');
//       console.error('Error details:', error);
      
//       let errorMessage = "Failed to create user. ";
      
//       if (error.code === 'auth/email-already-in-use') {
//         errorMessage += "This email is already registered.";
//       } else if (error.code === 'auth/invalid-email') {
//         errorMessage += "Invalid email address.";
//       } else if (error.code === 'auth/weak-password') {
//         errorMessage += "Password is too weak.";
//       } else if (error.code === 'permission-denied') {
//         errorMessage += "Permission denied. Please check your Firestore rules.";
//       } else if (error.code === 'auth/network-request-failed') {
//         errorMessage += "Network error. Please check your connection.";
//       } else {
//         errorMessage += error.message || "Please try again.";
//       }
      
//       alert(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generatePassword = () => {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
//     let password = '';
//     for (let i = 0; i < 10; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     setFormData(prev => ({
//       ...prev,
//       password: password,
//       confirmPassword: password
//     }));
//   };

//   // Loading screen while checking auth
//   if (authLoading) {
//     return (
//       <div className="page-container">
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>Checking authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   // Not authenticated screen
//   if (!currentUser) {
//     return (
//       <div className="page-container">
//         <div className="page-header">
//           <h1>Authentication Required</h1>
//           <div style={{ 
//             display: "flex", 
//             alignItems: "center", 
//             gap: 10, 
//             padding: 20, 
//             backgroundColor: "#fff3cd", 
//             border: "1px solid #ffeaa7", 
//             borderRadius: 8, 
//             marginTop: 20 
//           }}>
//             <AlertCircle size={24} color="#856404" />
//             <div>
//               <p style={{ margin: 0, fontWeight: "600", color: "#856404" }}>
//                 Please log in to add users
//               </p>
//               <p style={{ margin: "5px 0 0 0", color: "#856404" }}>
//                 You need admin privileges to access this feature.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       {loading && (
//         <div className="loading-container">
//           <div className="loading-spinner"></div>
//           <p>Creating user account...</p>
//         </div>
//       )}

//       <div className="page-header">
//         <button
//           className="cancel-btn"
//           style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}
//           onClick={() => navigate('/users')}
//           type="button"
//           disabled={loading}
//         >
//           <ArrowLeft size={16} />
//           Back to Users
//         </button>
//         <h1>Add New User</h1>
//         <p>Create a new user account for the car reservation system</p>
//         <div style={{ fontSize: '0.9rem', color: '#666', marginTop: 10 }}>
//           Creating as: <strong>{currentUser.email}</strong>
//         </div>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="fullName" style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <User size={16} />
//                 Full Name *
//               </label>
//               <input
//                 type="text"
//                 id="fullName"
//                 name="fullName"
//                 value={formData.fullName}
//                 onChange={handleInputChange}
//                 placeholder="Enter full name"
//                 required
//                 disabled={loading}
//                 maxLength={100}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="email" style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Mail size={16} />
//                 Email Address *
//               </label>
//               <input
//                 type="email"
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 placeholder="user@example.com"
//                 required
//                 disabled={loading}
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="phone" style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Phone size={16} />
//                 Phone Number
//               </label>
//               <input
//                 type="tel"
//                 id="phone"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleInputChange}
//                 placeholder="+1234567890"
//                 disabled={loading}
//                 maxLength={20}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="role" style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Shield size={16} />
//                 User Role *
//               </label>
//               <select
//                 id="role"
//                 name="role"
//                 value={formData.role}
//                 onChange={handleInputChange}
//                 required
//                 disabled={loading}
//               >
//                 <option value="user">👤 User</option>
//                 <option value="admin">👑 Admin</option>
//                 <option value="moderator">🛡️ Moderator</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="password" style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Lock size={16} />
//                 Password *
//               </label>
//               <div style={{ display: 'flex', gap: '10px' }}>
//                 <input
//                   type="password"
//                   id="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   placeholder="Enter secure password"
//                   required
//                   disabled={loading}
//                   style={{ flex: 1 }}
//                 />
//                 <button
//                   type="button"
//                   onClick={generatePassword}
//                   disabled={loading}
//                   style={{
//                     background: '#17a2b8',
//                     color: 'white',
//                     border: 'none',
//                     padding: '12px 15px',
//                     borderRadius: '5px',
//                     cursor: loading ? 'not-allowed' : 'pointer',
//                     fontSize: '0.9rem',
//                     opacity: loading ? 0.6 : 1
//                   }}
//                 >
//                   Generate
//                 </button>
//               </div>
//               <small style={{ color: '#666', fontSize: '0.85rem' }}>
//                 Minimum 6 characters required (recommended: 8+ with mixed characters)
//               </small>
//             </div>
//             <div className="form-group">
//               <label htmlFor="confirmPassword" style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                 <Lock size={16} />
//                 Confirm Password *
//               </label>
//               <input
//                 type="password"
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleInputChange}
//                 placeholder="Confirm password"
//                 required
//                 disabled={loading}
//               />
//             </div>
//           </div>

//           <div className="form-group">
//             <label htmlFor="status">Account Status *</label>
//             <select
//               id="status"
//               name="status"
//               value={formData.status}
//               onChange={handleInputChange}
//               required
//               disabled={loading}
//             >
//               <option value="active">✅ Active</option>
//               <option value="inactive">⏸️ Inactive</option>
//               <option value="suspended">🚫 Suspended</option>
//             </select>
//           </div>

//           <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
//             <button
//               type="button"
//               className="cancel-btn"
//               onClick={() => navigate('/users')}
//               disabled={loading}
//             >
//               Cancel
//             </button>
//             <button 
//               type="submit" 
//               className={`submit-btn ${loading ? 'loading' : ''}`}
//               disabled={loading}
//               style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
//             >
//               {loading ? (
//                 <>
//                   <div
//                     className="loading-spinner"
//                     style={{
//                       width: 16,
//                       height: 16,
//                       border: "2px solid rgba(255,255,255,0.3)",
//                       borderTop: "2px solid white",
//                       borderRadius: "50%",
//                       animation: "spin 1s linear infinite",
//                     }}
//                   />
//                   Creating User...
//                 </>
//               ) : (
//                 <>
//                   <User size={16} />
//                   Create User
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>

//       <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '5px', border: '1px solid #b8daff' }}>
//         <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>Important Notes:</h4>
//         <ul style={{ margin: 0, paddingLeft: '20px', color: '#004085' }}>
//           <li><strong>Security:</strong> Share login credentials securely with the new user</li>
//           <li><strong>First Login:</strong> User should change password on first login</li>
//           <li><strong>Admin Access:</strong> Admin users have full system access</li>
//           <li><strong>User Management:</strong> Accounts can be modified later from Users list</li>
//           <li><strong>Email Verification:</strong> Users will need to verify their email address</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default AddUser;

//hayda code men done firebase
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const AddUser = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     phone: '',
//     password: '',
//     confirmPassword: '',
//     role: 'user',
//     status: 'active'
//   });

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validate passwords match
//     if (formData.password !== formData.confirmPassword) {
//       alert('Passwords do not match!');
//       return;
//     }

//     // Validate password strength
//     if (formData.password.length < 6) {
//       alert('Password must be at least 6 characters long!');
//       return;
//     }

//     try {
//       // Here you would create the user in Firebase
//       console.log('Creating user:', formData);
//       alert('User created successfully!');
//       navigate('/users');
//     } catch (error) {
//       console.error('Error creating user:', error);
//       alert('Error creating user. Please try again.');
//     }
//   };

//   const generatePassword = () => {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let password = '';
//     for (let i = 0; i < 8; i++) {
//       password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     setFormData(prev => ({
//       ...prev,
//       password: password,
//       confirmPassword: password
//     }));
//   };

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Add New User</h1>
//         <p>Create a new user account for the car reservation system</p>
//       </div>

//       <div className="form-container">
//         <form onSubmit={handleSubmit}>
//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="fullName">Full Name *</label>
//               <input
//                 type="text"
//                 id="fullName"
//                 name="fullName"
//                 value={formData.fullName}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="email">Email Address *</label>
//               <input
//                 type="email"
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="phone">Phone Number</label>
//               <input
//                 type="tel"
//                 id="phone"
//                 name="phone"
//                 value={formData.phone}
//                 onChange={handleInputChange}
//                 placeholder="+1234567890"
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="role">User Role *</label>
//               <select
//                 id="role"
//                 name="role"
//                 value={formData.role}
//                 onChange={handleInputChange}
//                 required
//               >
//                 <option value="user">User</option>
//                 <option value="admin">Admin</option>
//                 <option value="moderator">Moderator</option>
//               </select>
//             </div>
//           </div>

//           <div className="form-row">
//             <div className="form-group">
//               <label htmlFor="password">Password *</label>
//               <div style={{ display: 'flex', gap: '10px' }}>
//                 <input
//                   type="password"
//                   id="password"
//                   name="password"
//                   value={formData.password}
//                   onChange={handleInputChange}
//                   required
//                   style={{ flex: 1 }}
//                 />
//                 <button
//                   type="button"
//                   onClick={generatePassword}
//                   style={{
//                     background: '#17a2b8',
//                     color: 'white',
//                     border: 'none',
//                     padding: '12px 15px',
//                     borderRadius: '5px',
//                     cursor: 'pointer',
//                     fontSize: '0.9rem'
//                   }}
//                 >
//                   Generate
//                 </button>
//               </div>
//               <small style={{ color: '#666', fontSize: '0.85rem' }}>
//                 Minimum 6 characters required
//               </small>
//             </div>
//             <div className="form-group">
//               <label htmlFor="confirmPassword">Confirm Password *</label>
//               <input
//                 type="password"
//                 id="confirmPassword"
//                 name="confirmPassword"
//                 value={formData.confirmPassword}
//                 onChange={handleInputChange}
//                 required
//               />
//             </div>
//           </div>

//           <div className="form-group">
//             <label htmlFor="status">Account Status *</label>
//             <select
//               id="status"
//               name="status"
//               value={formData.status}
//               onChange={handleInputChange}
//               required
//             >
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//               <option value="suspended">Suspended</option>
//             </select>
//           </div>

//           <div className="form-actions" style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
//             <button
//               type="button"
//               className="cancel-btn"
//               onClick={() => navigate('/users')}
//             >
//               Cancel
//             </button>
//             <button type="submit" className="submit-btn">
//               Create User
//             </button>
//           </div>
//         </form>
//       </div>

//       <div style={{ marginTop: '20px', padding: '15px', background: '#e7f3ff', borderRadius: '5px', border: '1px solid #b8daff' }}>
//         <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>Important Notes:</h4>
//         <ul style={{ margin: 0, paddingLeft: '20px', color: '#004085' }}>
//           <li>Users will receive login credentials via email</li>
//           <li>Default password should be changed on first login</li>
//           <li>Admin users have full access to the system</li>
//           <li>User accounts can be modified later from the Users list</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default AddUser;