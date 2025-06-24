import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>Sorry, the page you are looking for does not exist or has been moved.</p>
      <Link to="/dashboard" className="home-btn">
        redirect to dasboard 
             </Link>
    </div>
  );
};

export default NotFound;