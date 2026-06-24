import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Truck,
  Users,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  UserCog,
  MapPin,
  ChevronRight,
  Tag,
  FileText,
  Mail,
  X,
  Package,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard",       path: "/",                icon: LayoutDashboard, permission: "view_dashboard" },
  { label: "Suppliers",       path: "/suppliers",       icon: Truck,           permission: "view_suppliers" },
  { label: "Products",         path: "/products",         icon: Tag,           permission: "view_products" },
  { label: "Customers",       path: "/customers",       icon: Users,           permission: "view_customers" },
  { label: "Inventory",       path: "/inventory",       icon: Package,         permission: "view_inventory" },
  { label: "Purchase Orders", path: "/purchase-orders", icon: ClipboardList,   permission: "view_purchase_orders" },
  { label: "Sales",           path: "/sales",           icon: ShoppingCart,    permission: "view_sales" },
  { label: "Quotations",       path: "/quotations",       icon: FileText,     permission: "view_quotations" },
  { label: "Email Templates",  path: "/email-templates",  icon: Mail,         permission: "view_email_templates" },
  { label: "Reports",          path: "/reports",          icon: BarChart3,    permission: "view_reports" },
  { label: "Area Codes",      path: "/area-codes",      icon: MapPin,          permission: "view_area_codes" },
  { label: "Users",           path: "/users",           icon: UserCog,         permission: "view_users" },
  { label: "Activity Logs",   path: "/activity-logs",   icon: ClipboardList,   permission: "view_activity_logs" },
  { label: "Settings",        path: "/settings",         icon: Settings,        permission: "manage_settings" },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, hasPermission } = useAuth();

  const filteredItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Logo */}
      <div className="relative px-4 py-4 border-b border-gray-700 flex items-center justify-center">
        <NavLink to="/" onClick={onClose} className="flex flex-col items-center gap-1">
          <img
            src="/logo.png"
            alt="Vaxshot"
            className="h-14 w-auto object-contain"
          />
          <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">Vaxshot Web System</span>
        </NavLink>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden absolute right-4 p-1 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={onClose}
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
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
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
