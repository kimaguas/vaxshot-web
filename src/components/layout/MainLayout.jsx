import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const pageTitles = {
  "/": "Dashboard",
  "/products": "Products",
  "/suppliers": "Suppliers",
  "/customers": "Customers",
  "/purchase-orders": "Purchase Orders",
  "/sales": "Sales",
  "/reports": "Reports",
  "/users": "Users",
  "/activity-logs": "Activity Logs",
};

export default function MainLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "VaxshotApp";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        {/* Header */}
        <Header title={title} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
