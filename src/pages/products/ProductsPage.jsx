import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import Pagination from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";

// Product Form Modal
const ProductModal = ({ product, onClose, onSave }) => {
  const [form, setForm] = useState({
    product_code: product?.product_code || "",
    brand_name: product?.brand_name || "",
    description: product?.description || "",
    acquisition_cost: product?.acquisition_cost || "",
    selling_price: product?.selling_price || "",
    stock: product?.stock || 0,
    maintaining_stock: product?.maintaining_stock || 0,
    supplier_id: product?.supplier_id || "",
    status: product?.status || "active",
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-dropdown"],
    queryFn: async () => {
      const response = await api.get("/suppliers", {
        params: { status: "active" },
      });
      return response.data;
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {product ? "Edit Product" : "Add New Product"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Code *
              </label>
              <input
                type="text"
                value={form.product_code}
                onChange={(e) =>
                  setForm({ ...form, product_code: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) =>
                  setForm({ ...form, brand_name: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={form.supplier_id}
              onChange={(e) =>
                setForm({ ...form, supplier_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Supplier</option>
              {suppliersData?.suppliers?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acquisition Cost *
              </label>
              <input
                type="number"
                value={form.acquisition_cost}
                onChange={(e) =>
                  setForm({ ...form, acquisition_cost: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price *
              </label>
              <input
                type="number"
                value={form.selling_price}
                onChange={(e) =>
                  setForm({ ...form, selling_price: e.target.value })
                }
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maintaining Stock
              </label>
              <input
                type="number"
                value={form.maintaining_stock}
                onChange={(e) =>
                  setForm({ ...form, maintaining_stock: e.target.value })
                }
                min="0"
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
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {product ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch products
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-filter"],
    queryFn: async () => {
      const response = await api.get("/suppliers", {
        params: { status: "active" },
      });
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, page, supplierFilter, sortField, sortOrder],
    queryFn: async () => {
      const response = await api.get("/products", {
        params: { search, page, supplier_id: supplierFilter },
      });
      return response.data;
    },
  });

  // Create product
  const createMutation = useMutation({
    mutationFn: (data) => api.post("/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product created successfully!");
      setShowModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create product");
    },
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product updated successfully!");
      setShowModal(false);
      setSelected(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update product");
    },
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product deleted successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete product");
    },
  });

  const handleSave = (form) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Delete ${product.brand_name}?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleEdit = (product) => {
    setSelected(product);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelected(null);
    setShowModal(true);
  };

  const products = data?.products || [];
  const pagination = data?.pagination || null;

  // Sort products client-side
  const sortedProducts = [...products].sort((a, b) => {
    if (sortField === "stock") {
      return sortOrder === "asc" ? a.stock - b.stock : b.stock - a.stock;
    }
    if (sortField === "brand_name") {
      return sortOrder === "asc"
        ? a.brand_name.localeCompare(b.brand_name)
        : b.brand_name.localeCompare(a.brand_name);
    }
    if (sortField === "selling_price") {
      return sortOrder === "asc"
        ? a.selling_price - b.selling_price
        : b.selling_price - a.selling_price;
    }
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <span className="text-gray-300 ml-1">↕</span>;
    return (
      <span className="text-blue-600 ml-1">
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>

          {/* Supplier Filter */}
          <select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Suppliers</option>
            {suppliersData?.suppliers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.company}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(search || supplierFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setSupplierFilter("");
                setPage(1);
              }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          )}
        </div>

        {hasPermission("create_products") && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Product
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Product Code
              </th>
              <th
                className="text-left px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none"
                onClick={() => handleSort("brand_name")}
              >
                Brand Name <SortIcon field="brand_name" />
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Supplier
              </th>
              {hasPermission("view_acquisition_cost") && (
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Acquisition Cost
                </th>
              )}
              <th
                className="text-left px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none"
                onClick={() => handleSort("selling_price")}
              >
                Selling Price <SortIcon field="selling_price" />
              </th>
              <th
                className="text-left px-6 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none"
                onClick={() => handleSort("stock")}
              >
                Stock <SortIcon field="stock" />
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
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Package size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">No products found</p>
                </td>
              </tr>
            ) : (
              sortedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {product.product_code}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">
                      {product.brand_name}
                    </p>
                    {product.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {product.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.supplier || "-"}
                  </td>
                  {hasPermission("view_acquisition_cost") && (
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ₱{Number(product.acquisition_cost).toLocaleString()}
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    ₱{Number(product.selling_price).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        product.is_low_stock ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {product.stock}
                      {product.is_low_stock && (
                        <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          Low
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {hasPermission("edit_products") && (
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {hasPermission("delete_products") && (
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={selected}
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
