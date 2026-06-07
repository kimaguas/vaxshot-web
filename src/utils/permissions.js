export const PERMISSION_MODULES = [
  {
    module: "Dashboard",
    permissions: [{ name: "view_dashboard", label: "View Dashboard" }],
  },
  {
    module: "Products",
    permissions: [
      { name: "view_products",        label: "View Products" },
      { name: "create_products",      label: "Add Product" },
      { name: "edit_products",        label: "Edit Product" },
      { name: "delete_products",      label: "Delete Product" },
      { name: "view_acquisition_cost", label: "View Acquisition Cost" },
    ],
  },
  {
    module: "Suppliers",
    permissions: [
      { name: "view_suppliers",   label: "View Suppliers" },
      { name: "create_suppliers", label: "Add Supplier" },
      { name: "edit_suppliers",   label: "Edit Supplier" },
      { name: "delete_suppliers", label: "Delete Supplier" },
    ],
  },
  {
    module: "Customers",
    permissions: [
      { name: "view_customers",   label: "View Customers" },
      { name: "create_customers", label: "Add Customer" },
      { name: "edit_customers",   label: "Edit Customer" },
      { name: "delete_customers", label: "Delete Customer" },
    ],
  },
  {
    module: "Purchase Orders",
    permissions: [
      { name: "view_purchase_orders",    label: "View Purchase Orders" },
      { name: "create_purchase_orders",  label: "Create Purchase Order" },
      { name: "receive_purchase_orders", label: "Receive Purchase Order" },
      { name: "cancel_purchase_orders",  label: "Cancel Purchase Order" },
    ],
  },
  {
    module: "Sales",
    permissions: [
      { name: "view_sales",    label: "View Sales" },
      { name: "create_sales",  label: "Create Sale" },
      { name: "edit_sales",    label: "Edit Sale" },
      { name: "confirm_sales", label: "Confirm Sale" },
      { name: "cancel_sales",  label: "Cancel Sale" },
    ],
  },
  {
    module: "Quotations",
    permissions: [
      { name: "view_quotations",   label: "View Quotations" },
      { name: "create_quotations", label: "Create Quotation" },
      { name: "edit_quotations",   label: "Edit Quotation" },
      { name: "delete_quotations", label: "Delete Quotation" },
      { name: "send_quotations",   label: "Send Quotation Email" },
    ],
  },
  {
    module: "Email Templates",
    permissions: [
      { name: "view_email_templates",   label: "View Email Templates" },
      { name: "create_email_templates", label: "Create Email Template" },
      { name: "edit_email_templates",   label: "Edit Email Template" },
      { name: "delete_email_templates", label: "Delete Email Template" },
    ],
  },
  {
    module: "Reports",
    permissions: [{ name: "view_reports", label: "View Reports" }],
  },
  {
    module: "Area Codes",
    permissions: [
      { name: "view_area_codes",   label: "View Area Codes" },
      { name: "create_area_codes", label: "Add Area Code" },
      { name: "edit_area_codes",   label: "Edit Area Code" },
      { name: "delete_area_codes", label: "Delete Area Code" },
    ],
  },
  {
    module: "Users",
    permissions: [
      { name: "view_users",   label: "View Users" },
      { name: "create_users", label: "Add User" },
      { name: "edit_users",   label: "Edit User" },
      { name: "delete_users", label: "Delete User" },
    ],
  },
  {
    module: "Activity Logs",
    permissions: [{ name: "view_activity_logs", label: "View Activity Logs" }],
  },
];

export const ROLE_PERMISSION_PRESETS = {
  admin: [
    "view_dashboard",
    "view_products", "create_products", "edit_products", "delete_products", "view_acquisition_cost",
    "view_suppliers", "create_suppliers", "edit_suppliers", "delete_suppliers",
    "view_customers", "create_customers", "edit_customers", "delete_customers",
    "view_purchase_orders", "create_purchase_orders", "receive_purchase_orders", "cancel_purchase_orders",
    "view_sales", "create_sales", "edit_sales", "confirm_sales", "cancel_sales",
    "view_quotations", "create_quotations", "edit_quotations", "delete_quotations", "send_quotations",
    "view_email_templates", "create_email_templates", "edit_email_templates", "delete_email_templates",
    "view_reports",
    "view_area_codes", "create_area_codes", "edit_area_codes", "delete_area_codes",
    "view_users", "create_users", "edit_users", "delete_users",
    "view_activity_logs",
  ],
  manager: [
    "view_dashboard",
    "view_products", "create_products", "edit_products", "delete_products", "view_acquisition_cost",
    "view_suppliers", "create_suppliers", "edit_suppliers", "delete_suppliers",
    "view_customers", "create_customers", "edit_customers", "delete_customers",
    "view_purchase_orders", "create_purchase_orders", "receive_purchase_orders", "cancel_purchase_orders",
    "view_sales", "create_sales", "edit_sales", "confirm_sales", "cancel_sales",
    "view_quotations", "create_quotations", "edit_quotations", "delete_quotations", "send_quotations",
    "view_email_templates", "create_email_templates", "edit_email_templates", "delete_email_templates",
    "view_reports",
    "view_area_codes", "create_area_codes", "edit_area_codes", "delete_area_codes",
  ],
  staff: [
    "view_dashboard",
    "view_products", "create_products", "edit_products",
    "view_suppliers", "create_suppliers", "edit_suppliers",
    "view_customers", "create_customers", "edit_customers",
    "view_purchase_orders", "create_purchase_orders", "receive_purchase_orders",
    "view_sales", "create_sales", "edit_sales", "confirm_sales",
    "view_quotations", "create_quotations", "edit_quotations", "send_quotations",
    "view_email_templates", "create_email_templates", "edit_email_templates",
    "view_reports",
    "view_area_codes", "create_area_codes", "edit_area_codes",
  ],
  viewer: ["view_dashboard", "view_reports"],
};
