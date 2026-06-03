import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  UserCog,
  MapPin,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",       path: "/",                icon: LayoutDashboard, permission: "view_dashboard" },
  { label: "Products",        path: "/products",        icon: Package,         permission: "view_products" },
  { label: "Suppliers",       path: "/suppliers",       icon: Truck,           permission: "view_suppliers" },
  { label: "Customers",       path: "/customers",       icon: Users,           permission: "view_customers" },
  { label: "Purchase Orders", path: "/purchase-orders", icon: ClipboardList,   permission: "view_purchase_orders" },
  { label: "Sales",           path: "/sales",           icon: ShoppingCart,    permission: "view_sales" },
  { label: "Reports",         path: "/reports",         icon: BarChart3,       permission: "view_reports" },
  { label: "Area Codes",      path: "/area-codes",      icon: MapPin,          permission: "view_area_codes" },
  { label: "Users",           path: "/users",           icon: UserCog,         permission: "view_users" },
  { label: "Activity Logs",   path: "/activity-logs",   icon: ClipboardList,   permission: "view_activity_logs" },
];

export default function Sidebar() {
  const { user, hasPermission } = useAuth();

  const filteredItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">💉 VaxshotApp</h1>
        <p className="text-xs text-gray-400 mt-1">Pharma Inventory System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <item.icon size={20} />
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <ChevronRight
              size={16}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400">
              @{user?.username} ·{" "}
              <span className="capitalize">{user?.role}</span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
