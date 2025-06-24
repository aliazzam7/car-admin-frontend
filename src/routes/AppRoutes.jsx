// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AddCar from '../pages/AddCar';
import CarsList from '../pages/CarsList';
import EditCar from '../pages/EditCar';
import AddUser from '../pages/AddUser';
import UsersList from '../pages/UsersList';
import OrdersList from '../pages/OrdersList';
import EditOrder from '../pages/EditOrder';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/add-car" element={<AddCar />} />
      <Route path="/cars-list" element={<CarsList />} />
      <Route path="/edit-car/:id" element={<EditCar />} />
      <Route path="/add-user" element={<AddUser />} />
      <Route path="/users-list" element={<UsersList />} />
      <Route path="/orders-list" element={<OrdersList />} />
      <Route path="/edit-order/:id" element={<EditOrder />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
