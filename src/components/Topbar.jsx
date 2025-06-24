import React from 'react';

const Topbar = ({ onLogout }) => {
  const currentTime = new Date().toLocaleDateString('en-EN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1>Car Reservation Management</h1>
      </div>
      
      <div className="topbar-right">
        <div className="admin-info">
          <div className="admin-avatar">A</div>
          <div>
            <div className="admin-name">Admin</div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>{currentTime}</div>
          </div>
        </div>
        
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;