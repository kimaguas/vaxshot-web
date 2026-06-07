import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Dashboard
import DashboardPage from "./pages/dashboard/DashboardPage";

// Suppliers
import SuppliersPage from "./pages/suppliers/SuppliersPage";

// Customers
import CustomersPage from "./pages/customers/CustomersPage";

// Purchase Orders
import PurchaseOrdersPage from "./pages/purchase-orders/PurchaseOrdersPage";

// Sales
import SalesPage from "./pages/sales/SalesPage";

// Quotations
import QuotationsPage from "./pages/quotations/QuotationsPage";

// Email Templates
import EmailTemplatesPage from "./pages/email-templates/EmailTemplatesPage";

// Reports
import ReportsPage from "./pages/reports/ReportsPage";

// Users
import UsersPage from "./pages/users/UsersPage";

import ActivityLogsPage from "./pages/activity-logs/ActivityLogsPage";
import AreaCodesPage from "./pages/area-codes/AreaCodesPage";
import ProductsPage from "./pages/products/ProductsPage";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Permission-gated route — redirects to / if the user lacks the required permission
const PermissionRoute = ({ permission, children }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route
          path="products"
          element={
            <PermissionRoute permission="view_products">
              <ProductsPage />
            </PermissionRoute>
          }
        />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route
          path="quotations"
          element={
            <PermissionRoute permission="view_quotations">
              <QuotationsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="email-templates"
          element={
            <PermissionRoute permission="view_email_templates">
              <EmailTemplatesPage />
            </PermissionRoute>
          }
        />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="area-codes"
          element={
            <PermissionRoute permission="view_area_codes">
              <AreaCodesPage />
            </PermissionRoute>
          }
        />
        <Route
          path="users"
          element={
            <PermissionRoute permission="view_users">
              <UsersPage />
            </PermissionRoute>
          }
        />
        <Route
          path="activity-logs"
          element={
            <PermissionRoute permission="view_activity_logs">
              <ActivityLogsPage />
            </PermissionRoute>
          }
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
