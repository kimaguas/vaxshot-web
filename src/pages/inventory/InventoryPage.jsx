import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Search, Package, Eye, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import Pagination from "../../components/ui/Pagination";
import { useAuth } from "../../context/AuthContext";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d > new Date() && d <= new Date(Date.now() + THIRTY_DAYS_MS);
}
function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) <= new Date();
}

function StockBadge({ stock, maintainingStock }) {
  if (stock < 0)
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-200 text-red-800">Negative (Backorder)</span>;
  if (stock === 0)
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Out of Stock</span>;
  if (maintainingStock > 0 && stock <= maintainingStock)
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Low Stock</span>;
  return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">OK</span>;
}

function ProductCombobox({ value, onChange, supplierFilter }) {
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reset input text when value is cleared externally (e.g. supplier change)
  useEffect(() => {
    if (!value) setInputText("");
  }, [value]);

  const { data: comboData } = useQuery({
    queryKey: ["inventory-combo", supplierFilter],
    queryFn: async () => {
      const res = await api.get("/products", {
        params: { supplier_id: supplierFilter || undefined, status: "active", per_page: 500 },
      });
      return res.data;
    },
  });

  const allProducts = (comboData?.products || []).slice().sort((a, b) => a.brand_name.localeCompare(b.brand_name));
  const filtered = inputText
    ? allProducts.filter(
        (p) =>
          p.brand_name.toLowerCase().includes(inputText.toLowerCase()) ||
          (p.generic_name && p.generic_name.toLowerCase().includes(inputText.toLowerCase()))
      )
    : allProducts;

  const handleSelect = (product) => {
    onChange(product);
    setInputText("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setInputText("");
    setOpen(false);
  };

  const handleFocus = () => {
    setInputText("");
    setOpen(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`flex items-center gap-2 px-3 py-2 border rounded-lg bg-white transition-all ${
          open ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300"
        }`}
        onClick={() => { if (!open) { setOpen(true); } }}
      >
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          type="text"
          className="flex-1 text-sm outline-none bg-transparent min-w-0"
          placeholder={value ? value.brand_name : "All Products"}
          value={open ? inputText : (value ? value.brand_name : "")}
          onChange={(e) => setInputText(e.target.value)}
          onFocus={handleFocus}
        />
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {/* All Products option */}
          <button
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              !value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-50"
            }`}
            onClick={() => handleSelect(null)}
          >
            All Products
          </button>
          <div className="border-t border-gray-100" />
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No products found</div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value?.id === p.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleSelect(p)}
              >
                <div className="font-medium">{p.brand_name}</div>
                {p.generic_name && (
                  <div className="text-xs text-gray-400 mt-0.5">{p.generic_name}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const BatchModal = ({ product, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-batches", product.id],
    queryFn: async () => {
      const res = await api.get("/inventory/batches", { params: { product_id: product.id } });
      return res.data;
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{product.brand_name}</h3>
            <p className="text-sm text-gray-500">Batch / Lot Details</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : !data?.batches?.length ? (
            <div className="text-center py-12 text-gray-400">
              <Package size={36} className="mx-auto mb-2 text-gray-300" />
              No batches recorded for this product yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Lot No</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Receipt Date</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Expiry Date</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Received</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Remaining</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className={
                      batch.is_expired
                        ? "bg-red-50"
                        : batch.is_expiring_soon
                        ? "bg-yellow-50"
                        : ""
                    }
                  >
                    <td className="px-5 py-3 font-mono text-gray-800">{batch.lot_number}</td>
                    <td className="px-5 py-3 text-gray-600">{batch.received_date || "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{batch.expiry_date || "—"}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{batch.quantity}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800">{Number(batch.remaining_quantity).toLocaleString("en-PH")}</td>
                    <td className="px-5 py-3">
                      {batch.is_expired ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Expired</span>
                      ) : batch.is_expiring_soon ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Expiring Soon</span>
                      ) : batch.status === "depleted" ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">Depleted</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const AdjustModal = ({ product, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState({
    product_batch_id: "",
    type: "adjustment",
    qty_change: "",
    remarks: "",
  });

  const { data: batchData, isLoading: batchLoading } = useQuery({
    queryKey: ["inventory-batches-active", product.id],
    queryFn: async () => {
      const res = await api.get("/inventory/batches", { params: { product_id: product.id } });
      return res.data;
    },
  });

  const activeBatches = batchData?.batches?.filter((b) => b.status === "active") || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.qty_change || form.qty_change === "0") {
      toast.error("Quantity cannot be zero");
      return;
    }
    onSave({
      product_id: product.id,
      product_batch_id: parseInt(form.product_batch_id),
      type: form.type,
      qty_change: parseInt(form.qty_change),
      remarks: form.remarks || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Adjust Stock</h3>
            <p className="text-sm text-gray-500">{product.brand_name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch / Lot *</label>
            {batchLoading ? (
              <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <select
                required
                value={form.product_batch_id}
                onChange={(e) => setForm({ ...form, product_batch_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select batch</option>
                {activeBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.lot_number} — Exp: {b.expiry_date} — Rem: {b.remaining_quantity}
                  </option>
                ))}
              </select>
            )}
            {!batchLoading && activeBatches.length === 0 && (
              <p className="text-xs text-red-500 mt-1">No active batches found. Add a batch via Purchase Orders first.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="adjustment">Adjustment (count correction)</option>
              <option value="damaged">Damaged</option>
              <option value="expired">Expired / Write-off</option>
              <option value="return">Return (add back to stock)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
              <span className="text-gray-400 font-normal ml-1 text-xs">negative = deduct, positive = add</span>
            </label>
            <input
              type="number"
              required
              value={form.qty_change}
              onChange={(e) => setForm({ ...form, qty_change: e.target.value })}
              placeholder="e.g. -5 to deduct, 10 to add"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              rows={2}
              placeholder="Reason for adjustment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={activeBatches.length === 0 || isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewBatchesFor, setViewBatchesFor] = useState(null);
  const [adjustFor, setAdjustFor] = useState(null);

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const res = await api.get("/suppliers", { params: { status: "active", per_page: 200 } });
      return res.data;
    },
  });
  const suppliers = suppliersData?.suppliers || [];

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", selectedProduct?.id, supplierFilter, page],
    queryFn: async () => {
      const res = await api.get("/products", {
        params: {
          product_id: selectedProduct?.id || undefined,
          supplier_id: supplierFilter || undefined,
          page,
          per_page: 15,
          status: "active",
        },
      });
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["inventory-stats", supplierFilter],
    queryFn: async () => {
      const res = await api.get("/inventory/stats", {
        params: { supplier_id: supplierFilter || undefined },
      });
      return res.data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (payload) => api.post("/inventory/adjustments", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-batches"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-batches-active"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-combo"] });
      toast.success("Stock adjustment saved!");
      setAdjustFor(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to save adjustment"),
  });

  const handleSupplierChange = (e) => {
    setSupplierFilter(e.target.value);
    setSelectedProduct(null);
    setPage(1);
  };

  const products = data?.products || [];
  const pagination = data?.pagination || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor stock levels, batches, and expiry</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={supplierFilter}
            onChange={handleSupplierChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.company}</option>
            ))}
          </select>
          <div className="w-64">
            <ProductCombobox
              value={selectedProduct}
              onChange={(p) => { setSelectedProduct(p); setPage(1); }}
              supplierFilter={supplierFilter}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Products</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{statsData?.total ?? "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Low / Out of Stock</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{statsData?.low_or_out ?? "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Expiring ≤ 30 days</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{statsData?.expiring_soon ?? "—"}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-4 font-semibold text-gray-600">Product</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-600">Lot No</th>
                <th className="text-right px-5 py-4 font-semibold text-gray-600">Stock</th>
                <th className="text-right px-5 py-4 font-semibold text-gray-600">Min Stock</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-600">Expiry</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-600">Actions</th>
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
                    <Package size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const expSoon = isExpiringSoon(product.expiry_date);
                  const exp = isExpired(product.expiry_date);
                  const stock = product.stock ?? 0;
                  const minStock = product.maintaining_stock ?? 0;
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50 transition-colors ${exp ? "bg-red-50" : expSoon ? "bg-yellow-50" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <button
                          onClick={() => hasPermission("adjust_inventory") && setAdjustFor(product)}
                          className={`text-left ${hasPermission("adjust_inventory") ? "hover:text-blue-600 hover:underline cursor-pointer" : "cursor-default"}`}
                        >
                          <p className="font-medium text-blue-600">{product.brand_name}</p>
                          {product.generic_name && (
                            <p className="text-xs text-gray-400 mt-0.5">{product.generic_name}</p>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-600 text-xs">{product.lot_no || "—"}</td>
                      <td className={`px-5 py-4 text-right font-semibold ${stock < 0 ? "text-red-600" : "text-gray-800"}`}>{stock.toLocaleString("en-PH")}</td>
                      <td className="px-5 py-4 text-right text-gray-500">{minStock || "—"}</td>
                      <td className="px-5 py-4">
                        <StockBadge stock={stock} maintainingStock={minStock} />
                      </td>
                      <td className="px-5 py-4">
                        {product.expiry_date ? (
                          <span className={exp ? "text-red-600 font-medium" : expSoon ? "text-yellow-600 font-medium" : "text-gray-600"}>
                            {product.expiry_date}
                            {exp ? " ⚠ Expired" : expSoon ? " ⚠ Soon" : ""}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewBatchesFor(product)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Eye size={13} />
                            Batches
                          </button>
                          {hasPermission("adjust_inventory") && (
                            <button
                              onClick={() => setAdjustFor(product)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                            >
                              <SlidersHorizontal size={13} />
                              Adjust
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {viewBatchesFor && (
        <BatchModal product={viewBatchesFor} onClose={() => setViewBatchesFor(null)} />
      )}
      {adjustFor && (
        <AdjustModal
          product={adjustFor}
          onClose={() => setAdjustFor(null)}
          onSave={adjustMutation.mutate}
          isSaving={adjustMutation.isPending}
        />
      )}
    </div>
  );
}
