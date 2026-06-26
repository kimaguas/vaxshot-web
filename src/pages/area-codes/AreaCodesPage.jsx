import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/ui/Pagination";

const AreaCodeModal = ({ areaCode, onClose, onSave }) => {
  const [form, setForm] = useState({
    code:                  areaCode?.code                  || "",
    name:                  areaCode?.name                  || "",
    description:           areaCode?.description           || "",
    commission_percentage: areaCode?.commission_percentage ?? 50,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {areaCode ? "Edit Area Code" : "Add New Area Code"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code *
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
              placeholder="e.g. NC, 001, NORTH"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. North Cluster"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Optional description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.commission_percentage}
                onChange={(e) => setForm({ ...form, commission_percentage: e.target.value })}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-gray-400 text-sm font-medium">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Commission = (Sale Price − Acq. Cost) × {form.commission_percentage || 0}% per unit
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {areaCode ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AreaCodesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal]             = useState(false);
  const [selected,  setSelected]              = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [page,      setPage]      = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["area-codes", search, page],
    queryFn: async () => {
      const res = await api.get("/area-codes", { params: { search, page } });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/area-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["area-codes"]);
      toast.success("Area code created successfully!");
      setShowModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create area code"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/area-codes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["area-codes"]);
      toast.success("Area code updated successfully!");
      setShowModal(false);
      setSelected(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update area code"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/area-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["area-codes"]);
      toast.success("Area code deleted successfully!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete area code"),
  });

  const handleSave = (form) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const areaCodes  = data?.area_codes || [];
  const pagination = data?.pagination  || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search area codes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
        </div>
        {hasPermission("create_area_codes") && (
          <button
            onClick={() => { setSelected(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Area Code
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Code</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Description</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Commission %</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customers</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                </td>
              </tr>
            ) : areaCodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <MapPin size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">No area codes found</p>
                </td>
              </tr>
            ) : (
              areaCodes.map((ac) => (
                <React.Fragment key={ac.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {ac.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => { setSelected(ac); setShowModal(true); }}
                      className="text-sm font-medium text-blue-600 hover:underline text-left"
                    >
                      {ac.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {ac.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-blue-700">
                    {ac.commission_percentage ?? 50}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {ac.customers_count ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{ac.created_at}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {hasPermission("edit_area_codes") && (
                        <button
                          onClick={() => { setSelected(ac); setShowModal(true); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {hasPermission("delete_area_codes") && (
                        <button
                          onClick={() => setDeleteConfirmId(ac.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {deleteConfirmId === ac.id && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Trash2 size={18} className="text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-red-700">Delete this area code?</p>
                            <p className="text-xs text-red-500 mt-0.5">
                              "{ac.code} - {ac.name}" will be permanently deleted. This cannot be undone.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-white transition-colors"
                          >
                            Keep Area Code
                          </button>
                          <button
                            onClick={() => { setDeleteConfirmId(null); deleteMutation.mutate(ac.id); }}
                            disabled={deleteMutation.isPending}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                          >
                            <Trash2 size={14} />
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {showModal && (
        <AreaCodeModal
          areaCode={selected}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
