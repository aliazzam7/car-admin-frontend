import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';

// Components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddCar from './pages/AddCar';
import CarsList from './pages/CarsList';
import EditCar from './pages/EditCar';
import AddUser from './pages/AddUser';
import UsersList from './pages/UsersList';
import OrdersList from './pages/OrdersList';
import EditOrder from './pages/EditOrder';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// إنشاء Theme Context
const ThemeContext = createContext();

// Hook لاستخدام Theme Context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  
  // Theme State - إضافة حالة الثيم
  const [theme, setTheme] = useState('light');
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  useEffect(() => {
    // تحميل Theme من localStorage
    const savedTheme = localStorage.getItem('adminTheme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setIsThemeLoading(false);
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "alitechsolutions2425@gmail.com") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  // وظيفة تطبيق الثيم
  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // وظيفة تغيير الثيم
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('adminTheme', newTheme);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
  };

  if (checking || isThemeLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Theme Provider Context
  const themeValue = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <Router>
        <div className="App">
          {!isAuthenticated ? (
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          ) : (
            <div className="admin-layout">
              {/*button bi top bar lahata 8ayer fiha el theme*/}
              {/* <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
                {theme === 'light' ? ' Dark' : ' Light'}
              </button> */}
              
              <Sidebar />
              <div className="main-content">
                <Topbar onLogout={handleLogout} />
                <div className="content-area">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/add-car" element={<AddCar />} />
                    <Route path="/cars" element={<CarsList />} />
                    <Route path="/edit-car/:id" element={<EditCar />} />
                    <Route path="/add-user" element={<AddUser />} />
                    <Route path="/users" element={<UsersList />} />
                    <Route path="/orders" element={<OrdersList />} />
                    <Route path="/edit-order/:id" element={<EditOrder />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </div>
          )}
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
// //version code avec firebase
// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import './App.css';

// import { onAuthStateChanged, signOut } from 'firebase/auth';
// import { auth } from './firebaseConfig';

// // Components
// import Sidebar from './components/Sidebar';
// import Topbar from './components/Topbar';

// // Pages
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import AddCar from './pages/AddCar';
// import CarsList from './pages/CarsList';
// import EditCar from './pages/EditCar';
// import AddUser from './pages/AddUser';
// import UsersList from './pages/UsersList';
// import OrdersList from './pages/OrdersList';
// import EditOrder from './pages/EditOrder';
// import Messages from './pages/Messages';
// import Settings from './pages/Settings';
// import NotFound from './pages/NotFound';
// // Theme Context - أضف هذا الكود بعد آخر import
// import React, { useState, useEffect, createContext, useContext } from 'react';

// // إنشاء Theme Context
// const ThemeContext = createContext();

// // Hook لاستخدام Theme Context
// export const useTheme = () => {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error('useTheme must be used within ThemeProvider');
//   }
//   return context;
// };

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [checking, setChecking] = useState(true);

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user && user.email === "alitechsolutions2425@gmail.com") {
//         setIsAuthenticated(true);
//       } else {
//         setIsAuthenticated(false);
//       }
//       setChecking(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleLogin = () => {
//     setIsAuthenticated(true);
//   };

//   const handleLogout = async () => {
//     await signOut(auth);
//     setIsAuthenticated(false);
//   };

//   if (checking) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <div className="App">
//         {!isAuthenticated ? (
//           <Routes>
//             <Route path="/login" element={<Login onLogin={handleLogin} />} />
//             <Route path="*" element={<Navigate to="/login" replace />} />
//           </Routes>
//         ) : (
//           <div className="admin-layout">
//             <Sidebar />
//             <div className="main-content">
//               <Topbar onLogout={handleLogout} />
//               <div className="content-area">
//                 <Routes>
//                   <Route path="/" element={<Navigate to="/dashboard" replace />} />
//                   <Route path="/dashboard" element={<Dashboard />} />
//                   <Route path="/add-car" element={<AddCar />} />
//                   <Route path="/cars" element={<CarsList />} />
//                   <Route path="/edit-car/:id" element={<EditCar />} />
//                   <Route path="/add-user" element={<AddUser />} />
//                   <Route path="/users" element={<UsersList />} />
//                   <Route path="/orders" element={<OrdersList />} />
//                   <Route path="/edit-order/:id" element={<EditOrder />} />
//                   <Route path="/messages" element={<Messages />} />
//                   <Route path="/settings" element={<Settings />} />
//                   <Route path="/login" element={<Navigate to="/dashboard" replace />} />
//                   <Route path="*" element={<NotFound />} />
//                 </Routes>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;






//************************************************************************ */
//version sans backend firebase
// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import './App.css';

// // Components
// import Sidebar from './components/Sidebar';
// import Topbar from './components/Topbar';

// // Pages
// import Login from './pages/Login';
// import Dashboard from './pages/Dashboard';
// import AddCar from './pages/AddCar';
// import CarsList from './pages/CarsList';
// import EditCar from './pages/EditCar';
// import AddUser from './pages/AddUser';
// import UsersList from './pages/UsersList';
// import OrdersList from './pages/OrdersList';
// import EditOrder from './pages/EditOrder';
// import Messages from './pages/Messages';
// import Settings from './pages/Settings';
// import NotFound from './pages/NotFound';

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     // Check if user is authenticated
//     const authStatus = localStorage.getItem('isAuthenticated');
//     if (authStatus === 'true') {
//       setIsAuthenticated(true);
//     }
//     setIsLoading(false);
//   }, []);

//   const handleLogin = () => {
//     setIsAuthenticated(true);
//     localStorage.setItem('isAuthenticated', 'true');
//   };

//   const handleLogout = () => {
//     setIsAuthenticated(false);
//     localStorage.removeItem('isAuthenticated');
//   };

//   if (isLoading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <div className="App">
//         {!isAuthenticated ? (
//           <Routes>
//             <Route path="/login" element={<Login onLogin={handleLogin} />} />
//             <Route path="*" element={<Navigate to="/login" replace />} />
//           </Routes>
//         ) : (
//           <div className="admin-layout">
//             <Sidebar />
//             <div className="main-content">
//               <Topbar onLogout={handleLogout} />
//               <div className="content-area">
//                 <Routes>
//                   <Route path="/" element={<Navigate to="/dashboard" replace />} />
//                   <Route path="/dashboard" element={<Dashboard />} />
//                   <Route path="/add-car" element={<AddCar />} />
//                   <Route path="/cars" element={<CarsList />} />
//                   <Route path="/edit-car/:id" element={<EditCar />} />
//                   <Route path="/add-user" element={<AddUser />} />
//                   <Route path="/users" element={<UsersList />} />
//                   <Route path="/orders" element={<OrdersList />} />
//                   <Route path="/edit-order/:id" element={<EditOrder />} />
//                   <Route path="/messages" element={<Messages />} />
//                   <Route path="/settings" element={<Settings />} />
//                   <Route path="/login" element={<Navigate to="/dashboard" replace />} />
//                   <Route path="*" element={<NotFound />} />
//                 </Routes>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </Router>
//   );
// }

// export default App;