import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageTitles = {
  "/": "Dashboard",
  "/products": "Products",
  "/suppliers": "Suppliers",
  "/supplier-pricing": "Supplier Pricing",
  "/customers": "Customers",
  "/purchase-orders": "Purchase Orders",
  "/sales": "Sales",
  "/reports": "Reports",
  "/users": "Users",
  "/activity-logs": "Activity Logs",
  "/area-codes": "Area Codes",
};

export default function MainLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "VaxshotApp";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
        {/* Header */}
        <Header title={title} onMenuToggle={() => setSidebarOpen((v) => !v)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
