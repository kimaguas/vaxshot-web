import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// KPI Card Component
const KpiCard = ({ title, value, icon: Icon, color, suffix }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">
          {suffix === "₱"
            ? `₱${Number(value || 0).toLocaleString()}`
            : value || 0}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { kpi, charts, alerts } = data || {};

  const paymentData = [
    { name: "Paid", value: charts?.payment_summary?.paid || 0 },
    { name: "Partial", value: charts?.payment_summary?.partial || 0 },
    { name: "Unpaid", value: charts?.payment_summary?.unpaid || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Sales Today"
          value={kpi?.sales_today}
          icon={ShoppingCart}
          color="bg-blue-500"
          suffix="₱"
        />
        <KpiCard
          title="Sales This Month"
          value={kpi?.sales_this_month}
          icon={TrendingUp}
          color="bg-green-500"
          suffix="₱"
        />
        <KpiCard
          title="Revenue This Month"
          value={kpi?.revenue_this_month}
          icon={DollarSign}
          color="bg-emerald-500"
          suffix="₱"
        />
        <KpiCard
          title="Outstanding Balance"
          value={kpi?.outstanding_balance}
          icon={CreditCard}
          color="bg-orange-500"
          suffix="₱"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Products"
          value={kpi?.total_products}
          icon={Package}
          color="bg-purple-500"
        />
        <KpiCard
          title="Low Stock"
          value={kpi?.low_stock_count}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <KpiCard
          title="Expiring Soon"
          value={kpi?.expiring_soon_count}
          icon={Clock}
          color="bg-yellow-500"
        />
        <KpiCard
          title="Total Customers"
          value={kpi?.total_customers}
          icon={Users}
          color="bg-indigo-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Sales Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts?.sales_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [
                  `₱${Number(value).toLocaleString()}`,
                  "Amount",
                ]}
              />
              <Line
                type="monotone"
                dataKey="total_amount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Payment Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top Selling Products This Month
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={charts?.top_products || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="brand_name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="total_quantity"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Low Stock Alerts
          </h3>
          {alerts?.low_stock?.length === 0 ? (
            <p className="text-gray-400 text-sm">No low stock products</p>
          ) : (
            <div className="space-y-3">
              {alerts?.low_stock?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.brand_name}
                    </p>
                    <p className="text-xs text-gray-500">{item.product_code}</p>
                  </div>
                  <span className="text-red-600 font-bold text-sm">
                    {item.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-yellow-500" />
            Expiring Soon
          </h3>
          {alerts?.expiring_soon?.length === 0 ? (
            <p className="text-gray-400 text-sm">No expiring batches</p>
          ) : (
            <div className="space-y-3">
              {alerts?.expiring_soon?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.brand_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      LOT: {item.lot_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-600 font-bold text-sm">
                      {item.days_until_expiry}d
                    </p>
                    <p className="text-xs text-gray-500">{item.expiry_date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unpaid Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-orange-500" />
            Unpaid Sales
          </h3>
          {alerts?.unpaid_sales?.length === 0 ? (
            <p className="text-gray-400 text-sm">No unpaid sales</p>
          ) : (
            <div className="space-y-3">
              {alerts?.unpaid_sales?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {item.customer}
                    </p>
                    <p className="text-xs text-gray-500">{item.sale_number}</p>
                  </div>
                  <span className="text-orange-600 font-bold text-sm">
                    ₱{Number(item.balance).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
