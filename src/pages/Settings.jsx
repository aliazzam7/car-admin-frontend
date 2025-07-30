import React, { useState, useEffect } from 'react';
import {
  getAuth,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../App'; // استيراد Theme Context

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const auth = getAuth();
  
  // استخدام Theme Context
  const { theme, toggleTheme, isDark } = useTheme();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setProfileData(prev => ({
        ...prev,
        email: user.email
      }));
      initAdminIfNotExists(user.uid);
      loadProfile(user.uid);
    }
  }, []);

  const initAdminIfNotExists = async (uid) => {
    const user = auth.currentUser;
    const adminRef = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        password: '[ENCRYPTED]'
      });
    }
  };

  const loadProfile = async (uid) => {
    const adminRef = doc(db, 'admins', uid);
    const snap = await getDoc(adminRef);
    if (snap.exists()) {
      const data = snap.data();
      setProfileData(prev => ({
        ...prev,
        name: data.displayName || '',
        phone: data.phoneNumber || '',
        email: data.email || ''
      }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    try {
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          alert('Passwords do not match');
          return;
        }
        const credential = EmailAuthProvider.credential(
          user.email,
          profileData.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, profileData.newPassword);
      }

      if (profileData.email !== user.email) {
        await updateEmail(user, profileData.email);
      }

      const userRef = doc(db, 'admins', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.name,
        phoneNumber: profileData.phone,
        email: profileData.email,
        password: profileData.newPassword ? '[ENCRYPTED]' : '[UNCHANGED]'
      });

      alert('Profile updated successfully!');
      
      //remetree another password
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
        <button 
          className={activeTab === 'theme' ? 'active' : ''}
          onClick={() => setActiveTab('theme')}
        >
          🎨 Theme
        </button>
        {/* <button 
          className={activeTab === 'notifications' ? 'active' : ''}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button> */}
      </div>

      {activeTab === 'profile' && (
        <div className="tab-content">
          <h2>👤 Profile Settings</h2>
          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              
              <label>Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                placeholder="Enter your full name"
              />

              <label>Email Address</label>
              <input
                type="email"
                value={profileData.email}
                onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="Enter your email"
              />

              <label>Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-section">
              <h3>Password Settings</h3>
              
              <label>Current Password</label>
              <input
                type="password"
                value={profileData.currentPassword}
                onChange={e => setProfileData({ ...profileData, currentPassword: e.target.value })}
                placeholder="Enter current password"
              />

              <label>New Password</label>
              <input
                type="password"
                value={profileData.newPassword}
                onChange={e => setProfileData({ ...profileData, newPassword: e.target.value })}
                placeholder="Enter new password (optional)"
              />

              <label>Confirm New Password</label>
              <input
                type="password"
                value={profileData.confirmPassword}
                onChange={e => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" className="submit-btn">
              💾 Save Changes
            </button>
          </form>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="tab-content">
          <h2>🎨 Theme Settings</h2>
          <div className="theme-toggle">
            <div className="theme-info">
              <h3>Current Theme: {theme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}</h3>
              <p>
                {theme === 'light' 
                  ? 'Switch to dark mode for a better experience in low-light environments.' 
                  : 'Switch to light mode for a bright and clean interface.'
                }
              </p>
            </div>
            
            <div className="theme-preview">
              {/* <div className={`preview-card ${theme}`}>
                {/* <div className="preview-header">
                  <h4>Preview</h4>
                  <span className="preview-icon">{theme === 'light' ? '☀️' : '🌙'}</span>
                </div> }
                { <div className="preview-content">
                  <p>This is how your interface will look</p>
                  <div className="preview-buttons">
                    <button className="preview-btn primary">Button</button>
                    <button className="preview-btn secondary">Button</button>
                  </div>
                </div> }
              </div> */}
            </div>
            
            <button onClick={toggleTheme} className="theme-switch-btn">
              {theme === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

//hayda el code vrai bass men done theme dark/light
// import React, { useState, useEffect } from 'react';
// import {
//   getAuth,
//   updateEmail,
//   updatePassword,
//   reauthenticateWithCredential,
//   EmailAuthProvider
// } from 'firebase/auth';
// import {
//   doc,
//   getDoc,
//   setDoc,
//   updateDoc
// } from 'firebase/firestore';
// import { db } from '../firebase';

// const Settings = () => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [profileData, setProfileData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [theme, setTheme] = useState('light');
//   const auth = getAuth();

//   useEffect(() => {
//     const user = auth.currentUser;
//     if (user) {
//       setProfileData(prev => ({
//         ...prev,
//         email: user.email
//       }));
//       initAdminIfNotExists(user.uid);
//       loadProfile(user.uid);

//       const savedTheme = localStorage.getItem('adminTheme') || 'light';
//       setTheme(savedTheme);
//       applyTheme(savedTheme);
//     }
//   }, []);

//   const initAdminIfNotExists = async (uid) => {
//     const user = auth.currentUser;
//     const adminRef = doc(db, 'admins', uid);
//     const adminSnap = await getDoc(adminRef);

//     if (!adminSnap.exists()) {
//       await setDoc(adminRef, {
//         displayName: user.displayName || '',
//         phoneNumber: user.phoneNumber || '',
//         email: user.email || '',
//         password: '[ENCRYPTED]'
//       });
//     }
//   };

//   const loadProfile = async (uid) => {
//     const adminRef = doc(db, 'admins', uid);
//     const snap = await getDoc(adminRef);
//     if (snap.exists()) {
//       const data = snap.data();
//       setProfileData(prev => ({
//         ...prev,
//         name: data.displayName || '',
//         phone: data.phoneNumber || '',
//         email: data.email || ''
//       }));
//     }
//   };

//   const applyTheme = (mode) => {
//     document.documentElement.classList.toggle('dark', mode === 'dark');
//     localStorage.setItem('adminTheme', mode);
//   };

//   const handleProfileSubmit = async (e) => {
//     e.preventDefault();
//     const user = auth.currentUser;

//     try {
//       if (profileData.newPassword) {
//         if (profileData.newPassword !== profileData.confirmPassword) {
//           alert('Passwords do not match');
//           return;
//         }
//         const credential = EmailAuthProvider.credential(
//           user.email,
//           profileData.currentPassword
//         );
//         await reauthenticateWithCredential(user, credential);
//         await updatePassword(user, profileData.newPassword);
//       }

//       if (profileData.email !== user.email) {
//         await updateEmail(user, profileData.email);
//       }

//       const userRef = doc(db, 'admins', user.uid);
//       await updateDoc(userRef, {
//         displayName: profileData.name,
//         phoneNumber: profileData.phone,
//         email: profileData.email,
//         password: profileData.newPassword ? '[ENCRYPTED]' : '[UNCHANGED]'
//       });

//       alert('Profile updated');
//     } catch (error) {
//       console.error(error);
//       alert(error.message);
//     }
//   };

//   const toggleTheme = () => {
//     const newTheme = theme === 'light' ? 'dark' : 'light';
//     setTheme(newTheme);
//     applyTheme(newTheme);
//   };

//   return (
//     <div className="settings-page">
//       <h1>Settings</h1>

//       <div className="tabs">
//         <button onClick={() => setActiveTab('profile')}>Profile</button>
//         <button onClick={() => setActiveTab('theme')}>Theme</button>
//       </div>

//       {activeTab === 'profile' && (
//         <form onSubmit={handleProfileSubmit} className="profile-form">
//           <label>Name</label>
//           <input
//             type="text"
//             value={profileData.name}
//             onChange={e => setProfileData({ ...profileData, name: e.target.value })}
//           />

//           <label>Email</label>
//           <input
//             type="email"
//             value={profileData.email}
//             onChange={e => setProfileData({ ...profileData, email: e.target.value })}
//           />

//           <label>Phone</label>
//           <input
//             type="tel"
//             value={profileData.phone}
//             onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
//           />

//           <label>Current Password</label>
//           <input
//             type="password"
//             value={profileData.currentPassword}
//             onChange={e => setProfileData({ ...profileData, currentPassword: e.target.value })}
//           />

//           <label>New Password</label>
//           <input
//             type="password"
//             value={profileData.newPassword}
//             onChange={e => setProfileData({ ...profileData, newPassword: e.target.value })}
//           />

//           <label>Confirm New Password</label>
//           <input
//             type="password"
//             value={profileData.confirmPassword}
//             onChange={e => setProfileData({ ...profileData, confirmPassword: e.target.value })}
//           />

//           <button type="submit">Save Changes</button>
//         </form>
//       )}

//       {activeTab === 'theme' && (
//         <div className="theme-toggle">
//           <p>Current Theme: {theme.toUpperCase()}</p>
//           <button onClick={toggleTheme}>
//             {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Settings;

/******************************************************************************************************** */



















// // ✅ Step-by-step Admin Settings Page using Firebase with Light/Dark Toggle & Notification Toggle as Buttons + Save Email & Password

// import React, { useState, useEffect } from 'react';
// import {
//   getAuth,
//   updateEmail,
//   updatePassword,
//   reauthenticateWithCredential,
//   EmailAuthProvider
// } from 'firebase/auth';
// import {
//   doc,
//   getDoc,
//   setDoc,
//   updateDoc
// } from 'firebase/firestore';
// import { db } from '../firebase';

// const Settings = () => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [profileData, setProfileData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [theme, setTheme] = useState('light');
//   // const [notificationsOn, setNotificationsOn] = useState(true);

//   const auth = getAuth();

//   useEffect(() => {
//     const user = auth.currentUser;
//     if (user) {
//       setProfileData(prev => ({
//         ...prev,
//         email: user.email
//       }));
//       initAdminIfNotExists(user.uid);
//       loadProfile(user.uid);

//       const savedTheme = localStorage.getItem('adminTheme') || 'light';
//       setTheme(savedTheme);
//       applyTheme(savedTheme);
//     }
//   }, []);

//   const initAdminIfNotExists = async (uid) => {
//     const user = auth.currentUser;
//     const adminRef = doc(db, 'admins', uid);
//     const settingsRef = doc(db, 'adminSettings', uid);

//     const adminSnap = await getDoc(adminRef);
//     if (!adminSnap.exists()) {
//       await setDoc(adminRef, {
//         displayName: user.displayName || '',
//         phoneNumber: user.phoneNumber || '',
//         email: user.email || '',
//         password: '[ENCRYPTED]'
//       });
//     }

//     // const settingsSnap = await getDoc(settingsRef);
//     // if (!settingsSnap.exists()) {
//     //   await setDoc(settingsRef, { newCarNotifications: true });
//     // }
//   };

//   const loadProfile = async (uid) => {
//     const adminRef = doc(db, 'admins', uid);
//     const snap = await getDoc(adminRef);
//     if (snap.exists()) {
//       const data = snap.data();
//       setProfileData(prev => ({
//         ...prev,
//         name: data.displayName || '',
//         phone: data.phoneNumber || '',
//         email: data.email || ''
//       }));
//     }

//     const settingsRef = doc(db, 'adminSettings', uid);
//     const settingSnap = await getDoc(settingsRef);
//     // if (settingSnap.exists()) {
//     //   setNotificationsOn(settingSnap.data().newCarNotifications !== false);
//     // }
//   };

//   const applyTheme = (mode) => {
//     document.documentElement.classList.toggle('dark', mode === 'dark');
//     localStorage.setItem('adminTheme', mode);
//   };

//   const handleProfileSubmit = async (e) => {
//     e.preventDefault();
//     const user = auth.currentUser;

//     try {
//       if (profileData.newPassword) {
//         if (profileData.newPassword !== profileData.confirmPassword) {
//           alert('Passwords do not match');
//           return;
//         }
//         const credential = EmailAuthProvider.credential(
//           user.email,
//           profileData.currentPassword
//         );
//         await reauthenticateWithCredential(user, credential);
//         await updatePassword(user, profileData.newPassword);
//       }

//       if (profileData.email !== user.email) {
//         await updateEmail(user, profileData.email);
//       }

//       const userRef = doc(db, 'admins', user.uid);
//       await updateDoc(userRef, {
//         displayName: profileData.name,
//         phoneNumber: profileData.phone,
//         email: profileData.email,
//         password: profileData.newPassword ? '[ENCRYPTED]' : '[UNCHANGED]'
//       });

//       alert('Profile updated');
//     } catch (error) {
//       console.error(error);
//       alert(error.message);
//     }
//   };

//   const toggleTheme = () => {
//     const newTheme = theme === 'light' ? 'dark' : 'light';
//     setTheme(newTheme);
//     applyTheme(newTheme);
//   };

//   const toggleNotifications = async () => {
//     const newValue = !notificationsOn;
//     setNotificationsOn(newValue);

//     try {
//       const user = auth.currentUser;
//       const ref = doc(db, 'adminSettings', user.uid);
//       await updateDoc(ref, { newCarNotifications: newValue }, { merge: true });
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   return (
//     <div className="settings-page">
//       <h1>Settings</h1>

//       <div className="tabs">
//         <button onClick={() => setActiveTab('profile')}>Profile</button>
//         <button onClick={() => setActiveTab('theme')}>Theme</button>
//         <button onClick={() => setActiveTab('notifications')}>Notifications</button>
//       </div>

//       {activeTab === 'profile' && (
//         <form onSubmit={handleProfileSubmit} className="profile-form">
//           <label>Name</label>
//           <input type="text" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} />

//           <label>Email</label>
//           <input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} />

//           <label>Phone</label>
//           <input type="tel" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />

//           <label>Current Password</label>
//           <input type="password" value={profileData.currentPassword} onChange={e => setProfileData({ ...profileData, currentPassword: e.target.value })} />

//           <label>New Password</label>
//           <input type="password" value={profileData.newPassword} onChange={e => setProfileData({ ...profileData, newPassword: e.target.value })} />

//           <label>Confirm New Password</label>
//           <input type="password" value={profileData.confirmPassword} onChange={e => setProfileData({ ...profileData, confirmPassword: e.target.value })} />

//           <button type="submit">Save Changes</button>
//         </form>
//       )}

//       {activeTab === 'theme' && (
//         <div className="theme-toggle">
//           <p>Current Theme: {theme.toUpperCase()}</p>
//           <button onClick={toggleTheme}>{theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}</button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Settings;



// import React, { useState, useEffect } from 'react';
// import { getAuth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { db } from '../firebase';

// const Settings = () => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [profileData, setProfileData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [themeSettings, setThemeSettings] = useState({
//     darkMode: false
//   });

//   const [notificationSettings, setNotificationSettings] = useState({
//     newCarNotifications: true
//   });

//   const auth = getAuth();

//   useEffect(() => {
//     // Load admin profile
//     const user = auth.currentUser;
//     if (user) {
//       setProfileData(prev => ({
//         ...prev,
//         name: user.displayName || 'Admin',
//         email: user.email || '',
//         phone: user.phoneNumber || ''
//       }));

//       // Load settings from Firestore
//       loadSettings(user.uid);
//     }

//     // Check for saved theme preference
//     const savedTheme = localStorage.getItem('adminTheme');
//     if (savedTheme) {
//       setThemeSettings({ darkMode: savedTheme === 'dark' });
//       applyTheme(savedTheme === 'dark');
//     }
//   }, []);

//   const loadSettings = async (userId) => {
//     try {
//       const docRef = doc(db, 'adminSettings', userId);
//       const docSnap = await getDoc(docRef);
      
//       if (docSnap.exists()) {
//         const data = docSnap.data();
//         setNotificationSettings({
//           newCarNotifications: data.newCarNotifications !== false
//         });
//       }
//     } catch (error) {
//       console.error('Error loading settings:', error);
//     }
//   };

//   const applyTheme = (isDark) => {
//     if (isDark) {
//       document.documentElement.classList.add('dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//     }
//   };

//   const handleProfileSubmit = async (e) => {
//     e.preventDefault();
//     const user = auth.currentUser;
    
//     try {
//       // Update password if provided
//       if (profileData.newPassword) {
//         if (profileData.newPassword !== profileData.confirmPassword) {
//           alert('New passwords do not match');
//           return;
//         }
        
//         const credential = EmailAuthProvider.credential(
//           user.email, 
//           profileData.currentPassword
//         );
        
//         await reauthenticateWithCredential(user, credential);
//         await updatePassword(user, profileData.newPassword);
//       }
      
//       // Update email if changed
//       if (profileData.email !== user.email) {
//         await updateEmail(user, profileData.email);
//       }
      
//       // Update profile in Firestore
//       const userRef = doc(db, 'admins', user.uid);
//       await updateDoc(userRef, {
//         displayName: profileData.name,
//         phoneNumber: profileData.phone
//       });
      
//       alert('Profile updated successfully');
      
//       // Reset password fields
//       setProfileData(prev => ({
//         ...prev,
//         currentPassword: '',
//         newPassword: '',
//         confirmPassword: ''
//       }));
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       alert(`Error: ${error.message}`);
//     }
//   };

//   const handleThemeToggle = () => {
//     const newDarkMode = !themeSettings.darkMode;
//     setThemeSettings({ darkMode: newDarkMode });
//     applyTheme(newDarkMode);
//     localStorage.setItem('adminTheme', newDarkMode ? 'dark' : 'light');
//   };

//   const handleNotificationToggle = async () => {
//     const newValue = !notificationSettings.newCarNotifications;
//     setNotificationSettings({ newCarNotifications: newValue });
    
//     try {
//       const user = auth.currentUser;
//       const settingsRef = doc(db, 'adminSettings', user.uid);
//       await updateDoc(settingsRef, {
//         newCarNotifications: newValue
//       }, { merge: true });
//     } catch (error) {
//       console.error('Error updating notification settings:', error);
//       setNotificationSettings({ newCarNotifications: !newValue });
//     }
//   };

//   const renderProfileTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>Admin Profile</h3>
//       <form onSubmit={handleProfileSubmit}>
//         <div className="form-row">
//           <div className="form-group">
//             <label>Name</label>
//             <input
//               type="text"
//               value={profileData.name}
//               onChange={(e) => setProfileData({...profileData, name: e.target.value})}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Email</label>
//             <input
//               type="email"
//               value={profileData.email}
//               onChange={(e) => setProfileData({...profileData, email: e.target.value})}
//               required
//             />
//           </div>
//         </div>

//         <div className="form-group">
//           <label>Phone Number</label>
//           <input
//             type="tel"
//             value={profileData.phone}
//             onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
//           />
//         </div>

//         <hr style={{ margin: '30px 0', border: '1px solid #e0e0e0' }} />
        
//         <h4 style={{ marginBottom: '20px', color: '#333' }}>Change Password</h4>
        
//         <div className="form-group">
//           <label>Current Password</label>
//           <input
//             type="password"
//             value={profileData.currentPassword}
//             onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
//             placeholder="Required to change password"
//           />
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>New Password</label>
//             <input
//               type="password"
//               value={profileData.newPassword}
//               onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
//               placeholder="Leave empty to keep current"
//             />
//           </div>
//           <div className="form-group">
//             <label>Confirm New Password</label>
//             <input
//               type="password"
//               value={profileData.confirmPassword}
//               onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
//               placeholder="Confirm new password"
//             />
//           </div>
//         </div>

//         <button type="submit" className="submit-btn">
//           Save Profile Changes
//         </button>
//       </form>
//     </div>
//   );

//   const renderThemeTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>Theme Settings</h3>
      
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'space-between', 
//         alignItems: 'center',
//         padding: '20px',
//         background: '#f8f9fa',
//         borderRadius: '8px'
//       }}>
//         <div>
//           <strong style={{ color: '#333' }}>Dark Mode</strong>
//           <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//             Switch between light and dark theme for the entire website
//           </p>
//         </div>
//         <label style={{ 
//           position: 'relative', 
//           display: 'inline-block', 
//           width: '50px', 
//           height: '25px' 
//         }}>
//           <input
//             type="checkbox"
//             checked={themeSettings.darkMode}
//             onChange={handleThemeToggle}
//             style={{ display: 'none' }}
//           />
//           <span style={{
//             position: 'absolute',
//             cursor: 'pointer',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: themeSettings.darkMode ? '#667eea' : '#ccc',
//             borderRadius: '25px',
//             transition: '0.3s',
//           }}>
//             <span style={{
//               position: 'absolute',
//               content: '',
//               height: '19px',
//               width: '19px',
//               left: themeSettings.darkMode ? '28px' : '3px',
//               bottom: '3px',
//               backgroundColor: 'white',
//               borderRadius: '50%',
//               transition: '0.3s',
//             }} />
//           </span>
//         </label>
//       </div>
//     </div>
//   );

//   const renderNotificationTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>Notification Settings</h3>
      
//       <div style={{ 
//         display: 'flex', 
//         justifyContent: 'space-between', 
//         alignItems: 'center',
//         padding: '20px',
//         background: '#f8f9fa',
//         borderRadius: '8px'
//       }}>
//         <div>
//           <strong style={{ color: '#333' }}>New Car Notifications</strong>
//           <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//             Send notifications to users when a new car is added to the system
//           </p>
//         </div>
//         <label style={{ 
//           position: 'relative', 
//           display: 'inline-block', 
//           width: '50px', 
//           height: '25px' 
//         }}>
//           <input
//             type="checkbox"
//             checked={notificationSettings.newCarNotifications}
//             onChange={handleNotificationToggle}
//             style={{ display: 'none' }}
//           />
//           <span style={{
//             position: 'absolute',
//             cursor: 'pointer',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             backgroundColor: notificationSettings.newCarNotifications ? '#667eea' : '#ccc',
//             borderRadius: '25px',
//             transition: '0.3s',
//           }}>
//             <span style={{
//               position: 'absolute',
//               content: '',
//               height: '19px',
//               width: '19px',
//               left: notificationSettings.newCarNotifications ? '28px' : '3px',
//               bottom: '3px',
//               backgroundColor: 'white',
//               borderRadius: '50%',
//               transition: '0.3s',
//             }} />
//           </span>
//         </label>
//       </div>
//     </div>
//   );

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Settings</h1>
//         <p>Manage admin settings and preferences</p>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ 
//           display: 'flex', 
//           background: 'white', 
//           borderRadius: '10px',
//           boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
//           overflow: 'hidden'
//         }}>
//           <button
//             onClick={() => setActiveTab('profile')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'profile' ? '#667eea' : 'transparent',
//               color: activeTab === 'profile' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             Profile
//           </button>
//           <button
//             onClick={() => setActiveTab('theme')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'theme' ? '#667eea' : 'transparent',
//               color: activeTab === 'theme' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             Theme
//           </button>
//           <button
//             onClick={() => setActiveTab('notifications')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'notifications' ? '#667eea' : 'transparent',
//               color: activeTab === 'notifications' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             Notifications
//           </button>
//         </div>
//       </div>

//       {activeTab === 'profile' && renderProfileTab()}
//       {activeTab === 'theme' && renderThemeTab()}
//       {activeTab === 'notifications' && renderNotificationTab()}
//     </div>
//   );
// };

// export default Settings;




























































////////////////////////////////////////////////////////////////////////////////////////////////////////////
// import React, { useState } from 'react';

// const Settings = () => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [profileData, setProfileData] = useState({
//     name: 'Admin',
//     email: 'admin@carreservation.com',
//     phone: '+961 70 123 456',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [notificationSettings, setNotificationSettings] = useState({
//     emailNotifications: true,
//     smsNotifications: false,
//     newOrderNotifications: true,
//     messageNotifications: true,
//     systemUpdates: false
//   });

//   const [systemSettings, setSystemSettings] = useState({
//     siteName: 'Car Reservation Admin',
//     currency: 'USD',
//     language: 'ar',
//     timezone: 'Asia/Beirut',
//     maintenanceMode: false
//   });

//   const handleProfileSubmit = (e) => {
//     e.preventDefault();
    
//     if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
//       alert('New passwords do not match');
//       return;
//     }

//     // Here you would typically send the data to your backend
//     alert('Profile updated successfully');
    
//     // Reset password fields
//     setProfileData({
//       ...profileData,
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: ''
//     });
//   };

//   const handleNotificationChange = (setting) => {
//     setNotificationSettings({
//       ...notificationSettings,
//       [setting]: !notificationSettings[setting]
//     });
//   };

//   const handleSystemSettingsSubmit = (e) => {
//     e.preventDefault();
//     alert('System settings updated successfully');
//   };

//   const renderProfileTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>Profile</h3>
//       <form onSubmit={handleProfileSubmit}>
//         <div className="form-row">
//           <div className="form-group">
//             <label>Name</label>
//             <input
//               type="text"
//               value={profileData.name}
//               onChange={(e) => setProfileData({...profileData, name: e.target.value})}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>Email</label>
//             <input
//               type="email"
//               value={profileData.email}
//               onChange={(e) => setProfileData({...profileData, email: e.target.value})}
//               required
//             />
//           </div>
//         </div>

//         <div className="form-group">
//           <label>Phone Number</label>
//           <input
//             type="tel"
//             value={profileData.phone}
//             onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
//           />
//         </div>

//         <hr style={{ margin: '30px 0', border: '1px solid #e0e0e0' }} />
        
//         <h4 style={{ marginBottom: '20px', color: '#333' }}>Change Password</h4>
        
//         <div className="form-group">
//           <label>Current Password</label>
//           <input
//             type="password"
//             value={profileData.currentPassword}
//             onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
//             placeholder="Leave empty if you don't want to change it"
//           />
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>New Password</label>
//             <input
//               type="password"
//               value={profileData.newPassword}
//               onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
//             />
//           </div>
//           <div className="form-group">
//             <label>Confirm New Password</label>
//             <input
//               type="password"
//               value={profileData.confirmPassword}
//               onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
//             />
//           </div>
//         </div>

//         <button type="submit" className="submit-btn">
//           Save Changes
//         </button>
//       </form>
//     </div>
//   );

//   const renderNotificationTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>Notification Settings</h3>
      
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//         {Object.entries(notificationSettings).map(([key, value]) => (
//           <div key={key} style={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             alignItems: 'center',
//             padding: '15px',
//             background: '#f8f9fa',
//             borderRadius: '5px'
//           }}>
//             <div>
//               <strong style={{ color: '#333' }}>
//                 {key === 'emailNotifications' && 'Email Notifications'}
//                 {key === 'smsNotifications' && 'SMS Notifications'}
//                 {key === 'newOrderNotifications' && 'New Order Notifications'}
//                 {key === 'messageNotifications' && 'Message Notifications'}
//                 {key === 'systemUpdates' && 'System Updates'}
//               </strong>
//               <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//                 {key === 'emailNotifications' && 'Receive notifications via email'}
//                 {key === 'smsNotifications' && 'Receive notifications via SMS'}
//                 {key === 'newOrderNotifications' && 'Get notified when a new order arrives'}
//                 {key === 'messageNotifications' && 'Get notified when a new message arrives'}
//                 {key === 'systemUpdates' && 'Get notifications about system updates'}
//               </p>
//             </div>
//             <label style={{ 
//               position: 'relative', 
//               display: 'inline-block', 
//               width: '50px', 
//               height: '25px' 
//             }}>
//               <input
//                 type="checkbox"
//                 checked={value}
//                 onChange={() => handleNotificationChange(key)}
//                 style={{ display: 'none' }}
//               />
//               <span style={{
//                 position: 'absolute',
//                 cursor: 'pointer',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 backgroundColor: value ? '#667eea' : '#ccc',
//                 borderRadius: '25px',
//                 transition: '0.3s',
//               }}>
//                 <span style={{
//                   position: 'absolute',
//                   content: '',
//                   height: '19px',
//                   width: '19px',
//                   left: value ? '28px' : '3px',
//                   bottom: '3px',
//                   backgroundColor: 'white',
//                   borderRadius: '50%',
//                   transition: '0.3s',
//                 }} />
//               </span>
//             </label>
//           </div>
//         ))}
//       </div>

//       <button 
//         className="submit-btn" 
//         style={{ marginTop: '20px' }}
//         onClick={() => alert('Notification settings saved')}
//       >
//         Save Settings
//       </button>
//     </div>
//   );

//   const renderSystemTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>System Settings</h3>
//       <form onSubmit={handleSystemSettingsSubmit}>
//         <div className="form-row">
//           <div className="form-group">
//             <label>Site Name</label>
//             <input
//               type="text"
//               value={systemSettings.siteName}
//               onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
//             />
//           </div>
//           <div className="form-group">
//             <label>Currency</label>
//             <select
//               value={systemSettings.currency}
//               onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
//             >
//               <option value="USD">US Dollar (USD)</option>
//               <option value="LBP">Lebanese Pound (LBP)</option>
//               <option value="EUR">Euro (EUR)</option>
//             </select>
//           </div>
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>Language</label>
//             <select
//               value={systemSettings.language}
//               onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
//             >
//               <option value="ar">Arabic</option>
//               <option value="en">English</option>
//               <option value="fr">French</option>
//             </select>
//           </div>
//           <div className="form-group">
//             <label>Timezone</label>
//             <select
//               value={systemSettings.timezone}
//               onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
//             >
//               <option value="Asia/Beirut">Beirut</option>
//               <option value="Asia/Dubai">Dubai</option>
//               <option value="Europe/London">London</option>
//               <option value="America/New_York">New York</option>
//             </select>
//           </div>
//         </div>

//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           padding: '15px',
//           background: '#f8f9fa',
//           borderRadius: '5px',
//           marginBottom: '20px'
//         }}>
//           <div>
//             <strong style={{ color: '#333' }}>Maintenance Mode</strong>
//             <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//               Enabling maintenance mode will temporarily block access to the site
//             </p>
//           </div>
//           <label style={{ 
//             position: 'relative', 
//             display: 'inline-block', 
//             width: '50px', 
//             height: '25px' 
//           }}>
//             <input
//               type="checkbox"
//               checked={systemSettings.maintenanceMode}
//               onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
//               style={{ display: 'none' }}
//             />
//             <span style={{
//               position: 'absolute',
//               cursor: 'pointer',
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               backgroundColor: systemSettings.maintenanceMode ? '#dc3545' : '#ccc',
//               borderRadius: '25px',
//               transition: '0.3s',
//             }}>
//               <span style={{
//                 position: 'absolute',
//                 content: '',
//                 height: '19px',
//                 width: '19px',
//                 left: systemSettings.maintenanceMode ? '28px' : '3px',
//                 bottom: '3px',
//                 backgroundColor: 'white',
//                 borderRadius: '50%',
//                 transition: '0.3s',
//               }} />
//             </span>
//           </label>
//         </div>

//         <button type="submit" className="submit-btn">
//           Save System Settings
//         </button>
//       </form>
//     </div>
//   );

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>Settings</h1>
//         <p>Manage system and profile settings</p>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ 
//           display: 'flex', 
//           background: 'white', 
//           borderRadius: '10px',
//           boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
//           overflow: 'hidden'
//         }}>
//           <button
//             onClick={() => setActiveTab('profile')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'profile' ? '#667eea' : 'transparent',
//               color: activeTab === 'profile' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             Profile
//           </button>
//           <button
//             onClick={() => setActiveTab('notifications')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'notifications' ? '#667eea' : 'transparent',
//               color: activeTab === 'notifications' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             Notifications
//           </button>
//           <button
//             onClick={() => setActiveTab('system')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'system' ? '#667eea' : 'transparent',
//               color: activeTab === 'system' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             System
//           </button>
//         </div>
//       </div>

//       {activeTab === 'profile' && renderProfileTab()}
//       {activeTab === 'notifications' && renderNotificationTab()}
//       {activeTab === 'system' && renderSystemTab()}
//     </div>
//   );
// };

// export default Settings;

// import React, { useState } from 'react';

// const Settings = () => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [profileData, setProfileData] = useState({
//     name: 'Admin',
//     email: 'admin@carreservation.com',
//     phone: '+961 70 123 456',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [notificationSettings, setNotificationSettings] = useState({
//     emailNotifications: true,
//     smsNotifications: false,
//     newOrderNotifications: true,
//     messageNotifications: true,
//     systemUpdates: false
//   });

//   const [systemSettings, setSystemSettings] = useState({
//     siteName: 'Car Reservation Admin',
//     currency: 'USD',
//     language: 'ar',
//     timezone: 'Asia/Beirut',
//     maintenanceMode: false
//   });

//   const handleProfileSubmit = (e) => {
//     e.preventDefault();
    
//     if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
//       alert('كلمات المرور الجديدة غير متطابقة');
//       return;
//     }

//     // Here you would typically send the data to your backend
//     alert('تم تحديث الملف الشخصي بنجاح');
    
//     // Reset password fields
//     setProfileData({
//       ...profileData,
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: ''
//     });
//   };

//   const handleNotificationChange = (setting) => {
//     setNotificationSettings({
//       ...notificationSettings,
//       [setting]: !notificationSettings[setting]
//     });
//   };

//   const handleSystemSettingsSubmit = (e) => {
//     e.preventDefault();
//     alert('تم تحديث إعدادات النظام بنجاح');
//   };

//   const renderProfileTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>الملف الشخصي</h3>
//       <form onSubmit={handleProfileSubmit}>
//         <div className="form-row">
//           <div className="form-group">
//             <label>الاسم</label>
//             <input
//               type="text"
//               value={profileData.name}
//               onChange={(e) => setProfileData({...profileData, name: e.target.value})}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>البريد الإلكتروني</label>
//             <input
//               type="email"
//               value={profileData.email}
//               onChange={(e) => setProfileData({...profileData, email: e.target.value})}
//               required
//             />
//           </div>
//         </div>

//         <div className="form-group">
//           <label>رقم الهاتف</label>
//           <input
//             type="tel"
//             value={profileData.phone}
//             onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
//           />
//         </div>

//         <hr style={{ margin: '30px 0', border: '1px solid #e0e0e0' }} />
        
//         <h4 style={{ marginBottom: '20px', color: '#333' }}>تغيير كلمة المرور</h4>
        
//         <div className="form-group">
//           <label>كلمة المرور الحالية</label>
//           <input
//             type="password"
//             value={profileData.currentPassword}
//             onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
//             placeholder="اتركها فارغة إذا لم ترد تغييرها"
//           />
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>كلمة المرور الجديدة</label>
//             <input
//               type="password"
//               value={profileData.newPassword}
//               onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
//             />
//           </div>
//           <div className="form-group">
//             <label>تأكيد كلمة المرور الجديدة</label>
//             <input
//               type="password"
//               value={profileData.confirmPassword}
//               onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
//             />
//           </div>
//         </div>

//         <button type="submit" className="submit-btn">
//           حفظ التغييرات
//         </button>
//       </form>
//     </div>
//   );

//   const renderNotificationTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>إعدادات الإشعارات</h3>
      
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//         {Object.entries(notificationSettings).map(([key, value]) => (
//           <div key={key} style={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             alignItems: 'center',
//             padding: '15px',
//             background: '#f8f9fa',
//             borderRadius: '5px'
//           }}>
//             <div>
//               <strong style={{ color: '#333' }}>
//                 {key === 'emailNotifications' && 'إشعارات البريد الإلكتروني'}
//                 {key === 'smsNotifications' && 'إشعارات الرسائل النصية'}
//                 {key === 'newOrderNotifications' && 'إشعارات الطلبات الجديدة'}
//                 {key === 'messageNotifications' && 'إشعارات الرسائل'}
//                 {key === 'systemUpdates' && 'تحديثات النظام'}
//               </strong>
//               <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//                 {key === 'emailNotifications' && 'استقبال الإشعارات عبر البريد الإلكتروني'}
//                 {key === 'smsNotifications' && 'استقبال الإشعارات عبر الرسائل النصية'}
//                 {key === 'newOrderNotifications' && 'الحصول على إشعار عند وصول طلب جديد'}
//                 {key === 'messageNotifications' && 'الحصول على إشعار عند وصول رسالة جديدة'}
//                 {key === 'systemUpdates' && 'الحصول على إشعارات حول تحديثات النظام'}
//               </p>
//             </div>
//             <label style={{ 
//               position: 'relative', 
//               display: 'inline-block', 
//               width: '50px', 
//               height: '25px' 
//             }}>
//               <input
//                 type="checkbox"
//                 checked={value}
//                 onChange={() => handleNotificationChange(key)}
//                 style={{ display: 'none' }}
//               />
//               <span style={{
//                 position: 'absolute',
//                 cursor: 'pointer',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 backgroundColor: value ? '#667eea' : '#ccc',
//                 borderRadius: '25px',
//                 transition: '0.3s',
//               }}>
//                 <span style={{
//                   position: 'absolute',
//                   content: '',
//                   height: '19px',
//                   width: '19px',
//                   left: value ? '28px' : '3px',
//                   bottom: '3px',
//                   backgroundColor: 'white',
//                   borderRadius: '50%',
//                   transition: '0.3s',
//                 }} />
//               </span>
//             </label>
//           </div>
//         ))}
//       </div>

//       <button 
//         className="submit-btn" 
//         style={{ marginTop: '20px' }}
//         onClick={() => alert('تم حفظ إعدادات الإشعارات')}
//       >
//         حفظ الإعدادات
//       </button>
//     </div>
//   );

//   const renderSystemTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>إعدادات النظام</h3>
//       <form onSubmit={handleSystemSettingsSubmit}>
//         <div className="form-row">
//           <div className="form-group">
//             <label>اسم الموقع</label>
//             <input
//               type="text"
//               value={systemSettings.siteName}
//               onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
//             />
//           </div>
//           <div className="form-group">
//             <label>العملة</label>
//             <select
//               value={systemSettings.currency}
//               onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
//             >
//               <option value="USD">دولار أمريكي (USD)</option>
//               <option value="LBP">ليرة لبنانية (LBP)</option>
//               <option value="EUR">يورو (EUR)</option>
//             </select>
//           </div>
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>اللغة</label>
//             <select
//               value={systemSettings.language}
//               onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
//             >
//               <option value="ar">العربية</option>
//               <option value="en">English</option>
//               <option value="fr">Français</option>
//             </select>
//           </div>
//           <div className="form-group">
//             <label>المنطقة الزمنية</label>
//             <select
//               value={systemSettings.timezone}
//               onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
//             >
//               <option value="Asia/Beirut">بيروت</option>
//               <option value="Asia/Dubai">دبي</option>
//               <option value="Europe/London">لندن</option>
//               <option value="America/New_York">نيويورك</option>
//             </select>
//           </div>
//         </div>

//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           padding: '15px',
//           background: '#f8f9fa',
//           borderRadius: '5px',
//           marginBottom: '20px'
//         }}>
//           <div>
//             <strong style={{ color: '#333' }}>وضع الصيانة</strong>
//             <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//               تفعيل وضع الصيانة سيمنع الوصول إلى الموقع مؤقتاً
//             </p>
//           </div>
//           <label style={{ 
//             position: 'relative', 
//             display: 'inline-block', 
//             width: '50px', 
//             height: '25px' 
//           }}>
//             <input
//               type="checkbox"
//               checked={systemSettings.maintenanceMode}
//               onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
//               style={{ display: 'none' }}
//             />
//             <span style={{
//               position: 'absolute',
//               cursor: 'pointer',
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               backgroundColor: systemSettings.maintenanceMode ? '#dc3545' : '#ccc',
//               borderRadius: '25px',
//               transition: '0.3s',
//             }}>
//               <span style={{
//                 position: 'absolute',
//                 content: '',
//                 height: '19px',
//                 width: '19px',
//                 left: systemSettings.maintenanceMode ? '28px' : '3px',
//                 bottom: '3px',
//                 backgroundColor: 'white',
//                 borderRadius: '50%',
//                 transition: '0.3s',
//               }} />
//             </span>
//           </label>
//         </div>

//         <button type="submit" className="submit-btn">
//           حفظ إعدادات النظام
//         </button>
//       </form>
//     </div>
//   );

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>الإعدادات</h1>
//         <p>إدارة إعدادات النظام والملف الشخصي</p>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ 
//           display: 'flex', 
//           background: 'white', 
//           borderRadius: '10px',
//           boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
//           overflow: 'hidden'
//         }}>
//           <button
//             onClick={() => setActiveTab('profile')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'profile' ? '#667eea' : 'transparent',
//               color: activeTab === 'profile' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             الملف الشخصي
//           </button>
//           <button
//             onClick={() => setActiveTab('notifications')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'notifications' ? '#667eea' : 'transparent',
//               color: activeTab === 'notifications' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             الإشعارات
//           </button>
//           <button
//             onClick={() => setActiveTab('system')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'system' ? '#667eea' : 'transparent',
//               color: activeTab === 'system' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             النظام
//           </button>
//         </div>
//       </div>

//       {activeTab === 'profile' && renderProfileTab()}
//       {activeTab === 'notifications' && renderNotificationTab()}
//       {activeTab === 'system' && renderSystemTab()}
//     </div>
//   );
// };

// export default Settings;