import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import ManageListings from './pages/farmer/ManageListings';
import FarmerOrders from './pages/farmer/FarmerOrders';
import FarmerBulkOffers from './pages/farmer/FarmerBulkOffers';

// Institution Pages
import InstitutionDashboard from './pages/institution/InstitutionDashboard';
import BrowseProduce from './pages/institution/BrowseProduce';
import BulkRequirements from './pages/institution/BulkRequirements';
import ReviewBulkOffers from './pages/institution/ReviewBulkOffers';
import InstitutionOrders from './pages/institution/InstitutionOrders';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserApprovals from './pages/admin/UserApprovals';
import AdminComplaints from './pages/admin/AdminComplaints';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<BrowseProduce />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated Shared */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Farmer Routes */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/listings"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <ManageListings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/orders"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/bulk-offers"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerBulkOffers />
              </ProtectedRoute>
            }
          />

          {/* Institution Routes */}
          <Route
            path="/institution/dashboard"
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/browse"
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <BrowseProduce />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/requirements"
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <BulkRequirements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/requirements/:requirementId/offers"
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <ReviewBulkOffers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/orders"
            element={
              <ProtectedRoute allowedRoles={['institution']}>
                <InstitutionOrders />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminComplaints />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
