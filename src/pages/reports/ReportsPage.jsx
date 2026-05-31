import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FileText, Package, ShoppingCart, Users, Clock } from "lucide-react";

const tabs = [
  { id: "sales", label: "Sales Report", icon: ShoppingCart },
  { id: "inventory", label: "Inventory Report", icon: Package },
  { id: "purchase-orders", label: "Purchase Orders", icon: FileText },
  { id: "customers", label: "Customer Report", icon: Users },
  { id: "expiry", label: "Expiry Report", icon: Clock },
];

// Date Filter Component
const DateFilter = ({ from, to, onFromChange, onToChange, onSearch }) => (
  <div className="flex items-center gap-3">
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        From
      </label>
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
    <button
      onClick={onSearch}
      className="mt-5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
    >
      Generate
    </button>
  </div>
);

// Sales Report Tab
const SalesReportTab = () => {
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [params, setParams] = useState({ from, to });

  const { data, isLoading } = useQuery({
    queryKey: ["report-sales", params],
    queryFn: async () => {
      const response = await api.get("/reports/sales", { params });
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <DateFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onSearch={() => setParams({ from, to })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Sales",
                value: data.summary?.total_sales,
                prefix: "",
              },
              {
                label: "Total Amount",
                value: `₱${Number(data.summary?.total_amount || 0).toLocaleString()}`,
                prefix: "",
              },
              {
                label: "Total Paid",
                value: `₱${Number(data.summary?.total_paid || 0).toLocaleString()}`,
                prefix: "",
              },
              {
                label: "Total Balance",
                value: `₱${Number(data.summary?.total_balance || 0).toLocaleString()}`,
                prefix: "",
              },
            ].map((card, i) => (
              <div key={i} className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* By Product Chart */}
          {data.by_product?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">
                Sales by Product
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.by_product}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="product" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [
                      `₱${Number(value).toLocaleString()}`,
                      "Amount",
                    ]}
                  />
                  <Bar
                    dataKey="total_amount"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sales Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Sale No
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Invoice No
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Paid
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Balance
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.sales?.map((sale, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-blue-600">
                      {sale.sale_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {sale.invoice_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{sale.customer}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {sale.sale_date}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ₱{Number(sale.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-green-600">
                      ₱{Number(sale.amount_paid).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      ₱{Number(sale.balance).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sale.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : sale.payment_status === "partial"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {sale.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
};

// Inventory Report Tab
const InventoryReportTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["report-inventory"],
    queryFn: async () => {
      const response = await api.get("/reports/inventory");
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Low Stock Alert */}
          {data?.low_stock?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">
                ⚠️ Low Stock Products
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {data.low_stock.map((p, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-3 border border-red-100"
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {p.brand_name}
                    </p>
                    <p className="text-xs text-gray-500">{p.product_code}</p>
                    <p className="text-red-600 font-bold mt-1">
                      {p.total_stock} left
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Product Code
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Brand Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Supplier
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Total Stock
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Min Stock
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Batches
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.products?.map((product, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {product.product_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {product.brand_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.supplier || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${product.is_low_stock ? "text-red-600" : "text-green-600"}`}
                      >
                        {product.total_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.maintaining_stock}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_low_stock
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.is_low_stock ? "Low Stock" : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.batches?.length || 0} batch(es)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Expiry Report Tab
const ExpiryReportTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["report-expiry"],
    queryFn: async () => {
      const response = await api.get("/reports/expiry");
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {data?.summary?.expired_count || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Expired</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {data?.summary?.expiring_urgent_count || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Expiring in 7 days</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {data?.summary?.expiring_soon_count || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Expiring in 30 days</p>
            </div>
          </div>

          {/* Expired */}
          {data?.expired?.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                <h4 className="text-sm font-semibold text-red-700">
                  🚨 Expired Batches
                </h4>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Lot Number
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Expiry Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Remaining Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.expired.map((batch, i) => (
                    <tr key={i} className="bg-red-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {batch.brand_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {batch.lot_number}
                      </td>
                      <td className="px-4 py-3 text-red-600">
                        {batch.expiry_date}
                      </td>
                      <td className="px-4 py-3 text-red-600 font-bold">
                        {batch.remaining_quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Expiring Soon */}
          {data?.expiring_soon?.length > 0 && (
            <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden">
              <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200">
                <h4 className="text-sm font-semibold text-yellow-700">
                  ⚠️ Expiring Soon (30 days)
                </h4>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Lot Number
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Expiry Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Days Left
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Remaining Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.expiring_soon.map((batch, i) => (
                    <tr key={i} className="bg-yellow-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {batch.brand_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {batch.lot_number}
                      </td>
                      <td className="px-4 py-3 text-yellow-600">
                        {batch.expiry_date}
                      </td>
                      <td className="px-4 py-3 text-yellow-600 font-bold">
                        {batch.days_until_expiry}d
                      </td>
                      <td className="px-4 py-3">{batch.remaining_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.expired?.length === 0 && data?.expiring_soon?.length === 0 && (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">No expiring or expired batches</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Customer Report Tab
const CustomerReportTab = () => {
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [params, setParams] = useState({ from, to });

  const { data, isLoading } = useQuery({
    queryKey: ["report-customers", params],
    queryFn: async () => {
      const response = await api.get("/reports/customers", { params });
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <DateFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onSearch={() => setParams({ from, to })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Specialization
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    City
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Total Sales
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Total Amount
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.by_customer?.map((customer, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {customer.customer}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {customer.specialization || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {customer.city || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {customer.total_sales}
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">
                      ₱{Number(customer.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      ₱{Number(customer.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
};

// PO Report Tab
const POReportTab = () => {
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [params, setParams] = useState({ from, to });

  const { data, isLoading } = useQuery({
    queryKey: ["report-po", params],
    queryFn: async () => {
      const response = await api.get("/reports/purchase-orders", { params });
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <DateFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onSearch={() => setParams({ from, to })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: data.summary?.total_orders },
              {
                label: "Total Amount",
                value: `₱${Number(data.summary?.total_amount || 0).toLocaleString()}`,
              },
              { label: "Received", value: data.summary?.received_count },
              { label: "Pending", value: data.summary?.ordered_count },
            ].map((card, i) => (
              <div key={i} className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    PO Number
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Supplier
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Order Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Total Amount
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders?.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-blue-600">
                      {order.po_number}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {order.supplier}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.order_date}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ₱{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "received"
                            ? "bg-green-100 text-green-700"
                            : order.status === "ordered"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "partial"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "sales" && <SalesReportTab />}
        {activeTab === "inventory" && <InventoryReportTab />}
        {activeTab === "purchase-orders" && <POReportTab />}
        {activeTab === "customers" && <CustomerReportTab />}
        {activeTab === "expiry" && <ExpiryReportTab />}
      </div>
    </div>
  );
}
