import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Trash2,
  AlertTriangle,
  ClipboardList,
  Package,
  ShoppingCart,
  FileText,
  Database,
  Archive,
  X,
} from "lucide-react";

const GROUP_META = {
  activity_logs: {
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  inventory_logs: {
    icon: Package,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  sales: {
    icon: ShoppingCart,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  quotations: {
    icon: FileText,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  purchase_orders: {
    icon: Database,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  products: {
    icon: Archive,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ["settings-data-summary"],
    queryFn: async () => {
      const res = await api.get("/settings/data-summary");
      return res.data;
    },
  });

  const cleanMutation = useMutation({
    mutationFn: (groups) => api.post("/settings/clean-data", { groups }),
    onSuccess: (res) => {
      toast.success(res.data.message || "Data cleaned successfully.");
      setSelected({});
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["settings-data-summary"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to clean data.");
    },
  });

  const selectedGroups = Object.keys(selected).filter((k) => selected[k]);
  const hasSelection = selectedGroups.length > 0;

  const toggle = (key) =>
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleClean = () => cleanMutation.mutate(selectedGroups);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">System configuration and data management</p>
      </div>

      {/* Data Management Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Data Management</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select data groups to permanently delete. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!hasSelection}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasSelection
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Trash2 size={15} />
            Clean Data
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {summary &&
              Object.entries(summary).map(([key, group]) => {
                const meta = GROUP_META[key] || {};
                const Icon = meta.icon || Database;
                const isChecked = !!selected[key];

                return (
                  <label
                    key={key}
                    className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${
                      isChecked ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(key)}
                      className="mt-1 w-4 h-4 accent-red-600 cursor-pointer"
                    />
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg}`}
                    >
                      <Icon size={18} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {group.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            group.count > 0
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {group.count.toLocaleString()} record{group.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{group.description}</p>
                      {group.warning && (
                        <div className="flex items-start gap-1.5 mt-1.5">
                          <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-600">{group.warning}</p>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Confirm Data Deletion</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setConfirmOpen(false)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-600 font-medium">The following data will be permanently deleted:</p>
              <ul className="space-y-1.5">
                {selectedGroups.map((key) => {
                  const group = summary?.[key];
                  const meta = GROUP_META[key] || {};
                  const Icon = meta.icon || Database;
                  return (
                    <li key={key} className="flex items-center gap-2 text-sm text-gray-700">
                      <Icon size={14} className={meta.color} />
                      <span className="font-medium">{group?.label}</span>
                      <span className="text-gray-400">
                        ({group?.count.toLocaleString()} record{group?.count !== 1 ? "s" : ""})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={cleanMutation.isPending}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClean}
                disabled={cleanMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {cleanMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
