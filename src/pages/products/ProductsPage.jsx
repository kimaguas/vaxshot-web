import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  ChevronDown,
  ChevronRight,
  Upload,
  X,
} from "lucide-react";
import Pagination from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";

// ── Modal ─────────────────────────────────────────────────────────────────────

const PricingModal = ({ catalog, suppliers, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    supplier_id:      catalog?.supplier_id      ?? "",
    brand_name:       catalog?.brand_name       ?? "",
    lot_no:           catalog?.lot_no           ?? "",
    acquisition_cost: catalog?.acquisition_cost ?? "",
    indication:       catalog?.indication       ?? "",
    expiry_date:      catalog?.expiry_date      ?? "",
    effective_date:   catalog?.effective_date   ?? "",
    notes:            catalog?.notes            ?? "",
    status:           catalog?.status           ?? "active",
    tiers:          catalog?.tiers?.length
      ? catalog.tiers.map((t) => ({ min_qty: t.min_qty ?? 1, max_qty: t.max_qty ?? "", price: t.price }))
      : [{ min_qty: 1, max_qty: "", price: "" }],
  });

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setTier = (index, key, value) =>
    setForm((f) => {
      const tiers = [...f.tiers];
      tiers[index] = { ...tiers[index], [key]: value };
      return { ...f, tiers };
    });

  const addTier = () =>
    setForm((f) => ({ ...f, tiers: [...f.tiers, { min_qty: 1, max_qty: "", price: "" }] }));

  const removeTier = (index) =>
    setForm((f) => ({ ...f, tiers: f.tiers.filter((_, i) => i !== index) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      tiers: form.tiers.map((t, i) => ({
        min_qty:    parseInt(t.min_qty) || 1,
        max_qty:    t.max_qty !== "" ? parseInt(t.max_qty) : null,
        tier_label: t.max_qty !== "" ? `${t.min_qty}-${t.max_qty}vls` : `${t.min_qty || 1}vls & up`,
        price:      t.price,
        sort_order: i,
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {catalog ? "Edit Product" : "Add Product"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier *
            </label>
            <select
              value={form.supplier_id}
              onChange={(e) => setField("supplier_id", e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand / Product Name *
              </label>
              <input
                type="text"
                value={form.brand_name}
                onChange={(e) => setField("brand_name", e.target.value)}
                required
                placeholder="e.g. Gardasil 9 (HPV)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lot No.
              </label>
              <input
                type="text"
                value={form.lot_no}
                onChange={(e) => setField("lot_no", e.target.value)}
                placeholder="e.g. LOT-2026-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indication / Type
            </label>
            <input
              type="text"
              value={form.indication}
              onChange={(e) => setField("indication", e.target.value)}
              placeholder="e.g. GSK / Quadrivalent Influenza Vaccine"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acquisition Cost (PHP)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.acquisition_cost}
                onChange={(e) => setField("acquisition_cost", e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setField("expiry_date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price List Date
              </label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => setField("effective_date", e.target.value)}
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
              onChange={(e) => setField("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Price Tiers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Price Tiers *
              </label>
              <button
                type="button"
                onClick={addTier}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Tier
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[72px_72px_1fr_110px_36px] bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200 gap-2">
                <span>Min Qty</span>
                <span>Max Qty</span>
                <span>Label (auto)</span>
                <span>Price (PHP)</span>
                <span />
              </div>
              <div className="divide-y divide-gray-100">
                {form.tiers.map((tier, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[72px_72px_1fr_110px_36px] items-center px-3 py-2 gap-2"
                  >
                    <input
                      type="number"
                      min="1"
                      value={tier.min_qty}
                      onChange={(e) => setTier(i, "min_qty", e.target.value)}
                      required
                      placeholder="1"
                      className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="number"
                      min="1"
                      value={tier.max_qty}
                      onChange={(e) => setTier(i, "max_qty", e.target.value)}
                      placeholder="∞"
                      className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                    <span className="text-xs text-gray-400 self-center truncate">
                      {tier.max_qty ? `${tier.min_qty || 1}-${tier.max_qty}vls` : `${tier.min_qty || 1}vls & up`}
                    </span>
                    <input
                      type="number"
                      value={tier.price}
                      onChange={(e) => setTier(i, "price", e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      disabled={form.tiers.length === 1}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : catalog ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Import Modal ──────────────────────────────────────────────────────────────

const ImportModal = ({ suppliers, onClose, onImport, importing }) => {
  const fileRef = useRef();
  const [supplierId, setSupplierId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileRef.current?.files[0]) return toast.error("Please select a file");
    if (!supplierId) return toast.error("Please select a supplier");
    onImport({ file: fileRef.current.files[0], supplier_id: supplierId });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Import Price List</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File (Excel / CSV) *
            </label>
            <input
              type="file"
              ref={fileRef}
              accept=".xlsx,.xls,.csv"
              required
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">
              Required columns: brand_name, generic_name, tier_label, price. Optional: effective_date
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
              disabled={importing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              {importing ? "Importing…" : "Import"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Product Row ───────────────────────────────────────────────────────────────

const ProductRow = ({ catalog, canManage, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 w-8 text-gray-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-800">{catalog.brand_name}</p>
          {catalog.indication && (
            <p className="text-xs text-gray-500 truncate max-w-xs">{catalog.indication}</p>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {catalog.supplier?.company || "-"}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {catalog.tiers?.length ?? 0} tier{catalog.tiers?.length !== 1 ? "s" : ""}
        </td>
        <td className="px-4 py-3">
          {catalog.effective_date ? (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Updated {catalog.effective_date}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              catalog.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {catalog.status}
          </span>
        </td>
        <td className="px-4 py-3">
          {canManage && (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onEdit(catalog)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit size={15} />
              </button>
              <button
                onClick={() => onDelete(catalog)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </td>
      </tr>

      {expanded && catalog.tiers?.length > 0 && (
        <tr className="bg-blue-50">
          <td colSpan={7} className="px-8 py-3">
            <div className="overflow-x-auto">
              <table className="w-full max-w-sm text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-blue-200">
                    <th className="text-left py-1 pr-6">Quantity Tier</th>
                    <th className="text-right py-1">Price (PHP)</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.tiers.map((tier) => (
                    <tr key={tier.id} className="border-b border-blue-100 last:border-0">
                      <td className="py-1 pr-6 text-gray-700">{tier.tier_label}</td>
                      <td className="py-1 text-right font-medium text-gray-800">
                        {Number(tier.price).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_products");

  const [search, setSearch]                 = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [page, setPage]                     = useState(1);
  const [showModal, setShowModal]           = useState(false);
  const [showImport, setShowImport]         = useState(false);
  const [selected, setSelected]             = useState(null);

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const res = await api.get("/suppliers", { params: { status: "active", per_page: 200 } });
      return res.data;
    },
  });
  const suppliers = suppliersData?.suppliers || [];

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, supplierFilter, page],
    queryFn: async () => {
      const res = await api.get("/products", {
        params: { search, supplier_id: supplierFilter || undefined, page },
      });
      return res.data;
    },
  });

  const products   = data?.products   || [];
  const pagination = data?.pagination || null;

  const createMutation = useMutation({
    mutationFn: (payload) => api.post("/products", payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product created!");
      setShowModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product updated!");
      setShowModal(false);
      setSelected(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      toast.success("Product deleted.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete product"),
  });

  const importMutation = useMutation({
    mutationFn: ({ file, supplier_id }) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("supplier_id", supplier_id);
      return api.post("/products/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(["products"]);
      const { count, errors } = res.data;
      toast.success(`${count} products imported successfully`);
      if (errors?.length) {
        errors.forEach((e) => toast.error(e, { duration: 6000 }));
      }
      setShowImport(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Import failed"),
  });

  const handleSave = (form) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (catalog) => {
    if (window.confirm(`Delete "${catalog.brand_name}"?`)) {
      deleteMutation.mutate(catalog.id);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search product or generic name…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72 text-sm"
            />
          </div>
          <select
            value={supplierFilter}
            onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.company}
              </option>
            ))}
          </select>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Upload size={16} />
              Import
            </button>
            <button
              onClick={() => { setSelected(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus size={16} />
              Add Entry
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Product</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Supplier</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Tiers</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Price List Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Tag size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <ProductRow
                    key={product.id}
                    catalog={product}
                    canManage={canManage}
                    onEdit={(p) => { setSelected(p); setShowModal(true); }}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {showModal && (
        <PricingModal
          catalog={selected}
          suppliers={suppliers}
          onClose={() => { setShowModal(false); setSelected(null); }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {showImport && (
        <ImportModal
          suppliers={suppliers}
          onClose={() => setShowImport(false)}
          onImport={(payload) => importMutation.mutate(payload)}
          importing={importMutation.isPending}
        />
      )}
    </div>
  );
}
