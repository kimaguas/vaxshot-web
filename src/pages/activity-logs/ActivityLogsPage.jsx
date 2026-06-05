import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import Pagination from "../../components/ui/Pagination";
import { ClipboardList, Search } from "lucide-react";

const actionColors = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
  LOGOUT: "bg-gray-100 text-gray-600",
  CONFIRM: "bg-emerald-100 text-emerald-700",
  CANCEL: "bg-orange-100 text-orange-700",
  PAYMENT: "bg-yellow-100 text-yellow-700",
  RECEIVE: "bg-indigo-100 text-indigo-700",
};

const modules = [
  "All Modules",
  "Auth",
  "Products",
  "Suppliers",
  "Customers",
  "Purchase Orders",
  "Sales",
  "Users",
];

export default function ActivityLogsPage() {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [userName, setUserName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [params, setParams] = useState({});

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const response = await api.get("/users/list");
      return response.data;
    },
  });

  const usersList = usersData?.users || [];

  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", params, page],
    queryFn: async () => {
      const response = await api.get("/activity-logs", {
        params: { ...params, page },
      });
      return response.data;
    },
  });

  const handleSearch = () => {
    setPage(1);
    setParams({
      search: search || undefined,
      module: module || undefined,
      user_name: userName || undefined,
      from: from || undefined,
      to: to || undefined,
    });
  };

  const handleClear = () => {
    setSearch("");
    setModule("");
    setUserName("");
    setFrom("");
    setTo("");
    setPage(1);
    setParams({});
  };

  const logs = data?.logs || [];
  const pagination = data?.pagination || null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* User Filter */}
          <select
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Users</option>
            {usersList.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Module Filter */}
          <select
            value={module}
            onChange={(e) =>
              setModule(e.target.value === "All Modules" ? "" : e.target.value)
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {modules.map((m) => (
              <option key={m} value={m === "All Modules" ? "" : m}>
                {m}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Search
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Date & Time
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                User
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Action
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Module
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Description
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <ClipboardList
                    size={40}
                    className="mx-auto text-gray-300 mb-2"
                  />
                  <p className="text-gray-400">No activity logs found</p>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {log.created_at}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {log.user_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        {log.user_name || "System"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-gray-100 text-gray-600"}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.module}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.ip_address}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>
    </div>
  );
}
