import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, FaCar, FaListAlt, FaClipboardList,
  FaUsers, FaComments, FaCog, FaSignOutAlt 
} from 'react-icons/fa';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { path: '/add-car', label: 'Add Car', icon: <FaCar /> },
    { path: '/cars', label: 'Manage Cars', icon: <FaListAlt /> },
    { path: '/orders', label: 'Orders', icon: <FaClipboardList /> },
    { path: '/users', label: 'Users', icon: <FaUsers /> },
    { path: '/messages', label: 'Messages', icon: <FaComments /> },
    { path: '/settings', label: 'Settings', icon: <FaCog /> }
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Car Reservation</h2>
        <p>Administration Panel</p>
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={index}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}

       {/* <li>
  <button
    onClick={handleLogout}
    style={{
      color: '#ff4d4d',
      background: 'none',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '10px 20px',
      width: '100%',
      fontSize: 'inherit',
      fontFamily: 'inherit',
    }}
  >
    <span className="menu-icon"><FaSignOutAlt /></span>
    <span style={{ marginLeft: '10px' }}>Logout</span>
  </button>
</li> */}

      </ul>
    </div>
  );
};

export default Sidebar;


// import React from 'react';
// import { NavLink, useNavigate } from 'react-router-dom';

// const Sidebar = () => {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem('isAuthenticated');
//     navigate('/login');
//   };

//   const menuItems = [
//     { path: '/dashboard', label: 'Dashboard', icon: '📊' },
//     { path: '/add-car', label: 'Add Car', icon: '🚗' },
//     { path: '/cars', label: 'Manage Cars', icon: '🚙' },
//     { path: '/orders', label: 'Orders', icon: '📋' },
//     { path: '/users', label: 'Users', icon: '👥' },
//     { path: '/messages', label: 'Messages', icon: '💬' },
//     { path: '/settings', label: 'Settings', icon: '⚙️' }
//   ];

//   return (
//     <div className="sidebar">
//       <div className="sidebar-header">
//         <h2>Car Reservation</h2>
//         <p>Administration panel</p>
//       </div>
      
//       <ul className="sidebar-menu">
//         {menuItems.map((item, index) => (
//           <li key={index}>
//             <NavLink 
//               to={item.path} 
//               className={({ isActive }) => isActive ? 'active' : ''}
//             >
//               <span className="menu-icon">{item.icon}</span>
//               <span>{item.label}</span>
//             </NavLink>
//           </li>
//         ))}
        
//         <li>
//           <a href="#" onClick={handleLogout} style={{ color: '#ffcccb' }}>
//             <span className="menu-icon">🚪</span>
//             <span>Logout</span>
//           </a>
//         </li>
//       </ul>
//     </div>
//   );
// };

// export default Sidebar;
