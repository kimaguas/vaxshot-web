import { useState, useEffect } from "react";
import { provinces, citiesMunicipalities } from "ph-locations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import Pagination from "../../components/ui/Pagination";

const CustomerModal = ({ customer, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: customer?.name || "",
    address: customer?.address || "",
    barangay: customer?.barangay || "",
    city: customer?.city || "",
    province: customer?.province || "",
    contact_no: customer?.contact_no || "",
    specialization: customer?.specialization || "",
    status: customer?.status || "active",
  });

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);

  // Load initial values if editing
  useEffect(() => {
    if (customer?.province) {
      const province = provinces.find((p) => p.name === customer.province);
      if (province) {
        setSelectedProvince(province.code);
        const citiesInProvince = citiesMunicipalities.filter(
          (c) => c.province === province.code,
        );
        setFilteredCities(citiesInProvince);
        if (customer?.city) {
          setSelectedCity(customer.city);
        }
      }
    }
  }, [customer]);

  const handleProvinceChange = (e) => {
    const provCode = e.target.value;
    const province = provinces.find((p) => p.code === provCode);
    setSelectedProvince(provCode);
    setSelectedCity("");
    setFilteredCities([]);
    setForm({
      ...form,
      province: province?.name || "",
      city: "",
      barangay: "",
    });
    if (provCode) {
      setFilteredCities(
        citiesMunicipalities.filter((c) => c.province === provCode),
      );
    }
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    setForm({
      ...form,
      city: cityName,
      barangay: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {customer ? "Edit Customer" : "Add New Customer"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House/Unit No., Street"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Province
            </label>
            <select
              value={selectedProvince}
              onChange={handleProvinceChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Province</option>
              {provinces
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* City/Municipality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City / Municipality
            </label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              disabled={!selectedProvince}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select City/Municipality</option>
              {filteredCities
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Barangay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barangay
            </label>
            <input
              type="text"
              value={form.barangay}
              onChange={(e) => setForm({ ...form, barangay: e.target.value })}
              placeholder="Enter barangay"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Contact No */}
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

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={form.specialization}
                onChange={(e) =>
                  setForm({ ...form, specialization: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status */}
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
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {customer ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search, page],
    queryFn: async () => {
      const response = await api.get("/customers", {
        params: { search, page },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      toast.success("Customer created successfully!");
      setShowModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create customer"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      toast.success("Customer updated successfully!");
      setShowModal(false);
      setSelected(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update customer"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      toast.success("Customer deleted successfully!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete customer"),
  });

  const handleSave = (form) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const customers = data?.customers || [];
  const pagination = data?.pagination || null;

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
            placeholder="Search customers..."
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
          Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Name
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Address
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Contact No
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Specialization
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
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Users size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">No customers found</p>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">
                      {customer.name}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 truncate max-w-xs">
                      {customer.full_address || "-"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.contact_no || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {customer.specialization || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelected(customer);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${customer.name}?`)) {
                            deleteMutation.mutate(customer.id);
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
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {showModal && (
        <CustomerModal
          customer={selected}
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
