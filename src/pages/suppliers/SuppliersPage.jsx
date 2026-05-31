import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2, Truck } from "lucide-react";

const SupplierModal = ({ supplier, onClose, onSave }) => {
  const [form, setForm] = useState({
    tin_no: supplier?.tin_no || "",
    company: supplier?.company || "",
    address: supplier?.address || "",
    contact_person: supplier?.contact_person || "",
    contact_no: supplier?.contact_no || "",
    status: supplier?.status || "active",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {supplier ? "Edit Supplier" : "Add New Supplier"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TIN No
              </label>
              <input
                type="text"
                value={form.tin_no}
                onChange={(e) => setForm({ ...form, tin_no: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact No
              </label>
              <input
                type="text"
                value={form.contact_no}
                onChange={(e) =>
                  setForm({ ...form, contact_no: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
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
              {supplier ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: async () => {
      const response = await api.get("/suppliers", { params: { search } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["suppliers"]);
      toast.success("Supplier created successfully!");
      setShowModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create supplier"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["suppliers"]);
      toast.success("Supplier updated successfully!");
      setShowModal(false);
      setSelected(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update supplier"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["suppliers"]);
      toast.success("Supplier deleted successfully!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete supplier"),
  });

  const handleSave = (form) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const suppliers = data?.suppliers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Company
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                TIN No
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Contact Person
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Contact No
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Actions
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
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Truck size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">No suppliers found</p>
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">
                      {supplier.company}
                    </p>
                    {supplier.address && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {supplier.address}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {supplier.tin_no || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {supplier.contact_person || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {supplier.contact_no || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        supplier.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {supplier.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelected(supplier);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${supplier.company}?`)) {
                            deleteMutation.mutate(supplier.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SupplierModal
          supplier={selected}
          onClose={() => {
            setShowModal(false);
            setSelected(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
