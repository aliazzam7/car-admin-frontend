//version code avec firebase
import React, { useState, useEffect } from 'react';
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
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === "adminali@carreservation.com") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
  };

  if (checking) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <div className="admin-layout">
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
  );
}

export default App;


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