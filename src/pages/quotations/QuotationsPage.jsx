import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Eye,
  FileText,
  Mail,
  Trash2,
  Pencil,
  X,
  LayoutTemplate,
} from "lucide-react";
import Pagination from "../../components/ui/Pagination";
import ProductSelect from "../../components/ui/ProductSelect";
import { useAuth } from "../../context/AuthContext";

const StatusBadge = ({ status }) => {
  const colors = {
    draft:    "bg-gray-100 text-gray-600",
    sent:     "bg-blue-100 text-blue-600",
    accepted: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
};

// ─── Template Form Modal ──────────────────────────────────────────────────────
const TemplateFormModal = ({ initial, onClose, onSave, isPending, products }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:        initial?.name        ?? "",
    description: initial?.description ?? "",
    items: initial?.items?.length
      ? initial.items.map((i) => ({
          product_id:    String(i.product_id),
          quantity:      String(i.quantity),
          unit_price:    String(i.unit_price),
          use_flat_price: false,
        }))
      : [{ product_id: "", quantity: "", unit_price: "", use_flat_price: false }],
  });

  const getTierPrice = (tiers, qty) => {
    if (!tiers?.length) return "";
    const n = parseInt(qty) || 1;
    const tier = tiers.find((t) => n >= (t.min_qty ?? 1) && (t.max_qty == null || n <= t.max_qty));
    return tier?.price ?? tiers[tiers.length - 1]?.price ?? "";
  };

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { product_id: "", quantity: "", unit_price: "", use_flat_price: false }] });

  const removeItem = (idx) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = value;
    if (field === "product_id") {
      const catalog = products.find((p) => p.id === parseInt(value));
      if (!items[idx].use_flat_price && catalog?.tiers?.length) {
        items[idx].quantity   = String(catalog.tiers[0].min_qty ?? 1);
        items[idx].unit_price = String(catalog.tiers[0].price);
      } else {
        items[idx].quantity   = "";
        items[idx].unit_price = "";
      }
    }
    if (field === "quantity" && !items[idx].use_flat_price) {
      const catalog = products.find((p) => p.id === parseInt(items[idx].product_id));
      if (catalog?.tiers?.length) {
        items[idx].unit_price = getTierPrice(catalog.tiers, value);
      }
    }
    setForm({ ...form, items });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-70 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit Template" : "New Quotation Template"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Standard HPV Package"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this template"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Products *</label>
              <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, idx) => {
                const catalog = products.find((p) => p.id === parseInt(item.product_id));
                const tiers = catalog?.tiers ?? [];
                const activeTierIdx = tiers.findIndex((t) => {
                  const n = parseInt(item.quantity) || 0;
                  return n >= (t.min_qty ?? 1) && (t.max_qty == null || n <= t.max_qty);
                });
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);

                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2.5">
                    {/* Product select + remove */}
                    <div className="flex gap-2 items-center">
                      <ProductSelect
                        products={products}
                        value={item.product_id}
                        onChange={(id) => updateItem(idx, "product_id", id)}
                        required
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={form.items.length === 1}
                        className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Single price toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`flat-tpl-${idx}`}
                        checked={item.use_flat_price}
                        onChange={(e) => updateItem(idx, "use_flat_price", e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                      <label htmlFor={`flat-tpl-${idx}`} className="text-xs text-gray-500 cursor-pointer select-none">
                        Single price only
                      </label>
                    </div>

                    {/* Tier pills */}
                    {!item.use_flat_price && tiers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tiers.map((t, ti) => {
                          const isActive = ti === activeTierIdx;
                          const range = t.max_qty
                            ? `${t.min_qty}–${t.max_qty} units`
                            : `${t.min_qty}+ units`;
                          return (
                            <button
                              key={ti}
                              type="button"
                              onClick={() => {
                                const items = [...form.items];
                                items[idx].quantity   = String(t.min_qty ?? 1);
                                items[idx].unit_price = String(t.price);
                                setForm({ ...form, items });
                              }}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                isActive
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              {t.tier_label}: ₱{Number(t.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })} · {range}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Qty + Price + Total */}
                    <div className="flex gap-2 items-end">
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          required
                          min="1"
                          placeholder="Qty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-500 mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex-1 py-2 text-right text-sm font-semibold text-gray-700">
                        ₱{lineTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-60">
              {isPending ? "Saving..." : isEdit ? "Update Template" : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Template Manager Modal ───────────────────────────────────────────────────
const TemplateManagerModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [formTarget, setFormTarget]         = useState(null);
  const [showNew, setShowNew]               = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data: productsData } = useQuery({
    queryKey: ["products-for-template"],
    queryFn: async () => {
      const res = await api.get("/products", { params: { status: "active", per_page: 500 } });
      return res.data;
    },
  });
  const products = (productsData?.products ?? []).slice().sort((a, b) => a.brand_name.localeCompare(b.brand_name));

  const { data, isLoading } = useQuery({
    queryKey: ["quotation-templates"],
    queryFn: async () => {
      const res = await api.get("/quotation-templates");
      return res.data;
    },
  });
  const templates = data?.templates ?? [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/quotation-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotation-templates"]);
      toast.success("Template created!");
      setShowNew(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create template"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/quotation-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotation-templates"]);
      toast.success("Template updated!");
      setFormTarget(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update template"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/quotation-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotation-templates"]);
      toast.success("Template deleted!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to delete template"),
  });

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-60 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <LayoutTemplate size={18} className="text-blue-600" />
              Quotation Templates
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>

          <div className="p-6 space-y-3">
            <button
              onClick={() => setShowNew(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus size={15} />
              New Template
            </button>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No templates yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div key={tpl.id}>
                    {deleteConfirmId === tpl.id ? (
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Trash2 size={18} className="text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-red-700">Delete this template?</p>
                            <p className="text-xs text-red-500 mt-0.5">
                              <span className="font-medium">"{tpl.name}"</span> will be permanently deleted. This cannot be undone.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-white transition-colors"
                          >
                            Keep Template
                          </button>
                          <button
                            onClick={() => { setDeleteConfirmId(null); deleteMutation.mutate(tpl.id); }}
                            disabled={deleteMutation.isPending}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                          >
                            <Trash2 size={14} />
                            Yes, Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{tpl.name}</p>
                          {tpl.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tpl.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{tpl.items.length} item{tpl.items.length !== 1 ? "s" : ""}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => setFormTarget(tpl)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(tpl.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200">
            <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              Close
            </button>
          </div>
        </div>
      </div>

      {showNew && (
        <TemplateFormModal
          products={products}
          onClose={() => setShowNew(false)}
          onSave={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}

      {formTarget && (
        <TemplateFormModal
          initial={formTarget}
          products={products}
          onClose={() => setFormTarget(null)}
          onSave={(data) => updateMutation.mutate({ id: formTarget.id, data })}
          isPending={updateMutation.isPending}
        />
      )}
    </>
  );
};

// ─── Send Email Modal ─────────────────────────────────────────────────────────
const SendEmailModal = ({ quotation, onClose, onSend, isSending }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const { data: templatesData } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await api.get("/email-templates");
      return res.data;
    },
  });

  const templates = templatesData?.templates ?? [];
  const selected  = templates.find((t) => String(t.id) === String(selectedTemplateId));

  const resolvePlaceholders = (text) => {
    if (!text) return "";
    return text
      .replace(/{customer_name}/g,    quotation.customer_name)
      .replace(/{contact_name}/g,     quotation.contact_name ?? quotation.customer_name)
      .replace(/{quotation_number}/g, quotation.quotation_number)
      .replace(/{quotation_date}/g,   quotation.quotation_date);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Mail size={18} className="text-blue-600" />
            Send Quotation Email
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
            <span className="font-medium">To:</span>{" "}
            {(quotation.emails ?? [quotation.email]).join(", ")}
          </div>
          {quotation.cc_emails?.length > 0 && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
              <span className="font-medium">CC:</span>{" "}
              {quotation.cc_emails.join(", ")}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Template <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">— No template (generic email) —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category.replace(/_/g, " ")})
                  {t.is_default ? " ★" : ""}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <>
              {selected.header_html && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Header Preview
                  </label>
                  <div
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selected.header_html }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Subject Preview
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                  {resolvePlaceholders(selected.subject)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Body Preview
                </label>
                <div
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 max-h-32 overflow-y-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: resolvePlaceholders(selected.body) }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Signature
                </label>
                <div
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selected.signature }}
                />
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(selectedTemplateId || null)}
            disabled={isSending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-60"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail size={14} />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
const QuotationFormModal = ({ onClose, onSave, isPending, initial }) => {
  const isEdit = !!initial;
  const [loadTemplateId, setLoadTemplateId] = useState("");

  const { data: templatesData } = useQuery({
    queryKey: ["quotation-templates"],
    queryFn: async () => {
      const res = await api.get("/quotation-templates");
      return res.data;
    },
    enabled: !isEdit,
  });
  const availableTemplates = templatesData?.templates ?? [];

  const parseEmails = (val) => {
    if (Array.isArray(val)) return val.length ? val : [""];
    if (typeof val === "string" && val) return val.split(",").map((e) => e.trim());
    return [""];
  };

  const [form, setForm] = useState({
    customer_name:  initial?.customer_name  ?? "",
    contact_name:   initial?.contact_name   ?? "",
    address:        initial?.address        ?? "",
    emails:         parseEmails(initial?.emails ?? initial?.email),
    cc_emails:      Array.isArray(initial?.cc_emails) && initial.cc_emails.length ? initial.cc_emails : [],
    quotation_date:  initial?.quotation_date  ?? new Date().toISOString().split("T")[0],
    quotation_type:  initial?.quotation_type  ?? "pricing",
    notes:           initial?.notes           ?? "",
    items: initial?.items?.length
      ? initial.items.map((i) => ({
          product_id:     String(i.product_id),
          quantity:       String(i.quantity),
          unit_price:     String(i.unit_price),
          description:    i.description   ?? "",
          expiry_date:    i.expiry_date   ?? "",
          use_flat_price: !!i.use_flat_price,
        }))
      : [{ product_id: "", quantity: "", unit_price: "", description: "", expiry_date: "", use_flat_price: false }],
  });

  const { data: catalogsData } = useQuery({
    queryKey: ["catalogs-for-quotation"],
    queryFn: async () => {
      const response = await api.get("/products", {
        params: { status: "active", per_page: 500 },
      });
      return response.data;
    },
  });

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product_id: "", quantity: "", unit_price: "", description: "", expiry_date: "", use_flat_price: false }] });
  };

  const removeItem = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const getTierPrice = (tiers, qty) => {
    if (!tiers?.length) return "";
    const n = parseInt(qty) || 1;
    const tier = tiers.find(
      (t) => n >= (t.min_qty ?? 1) && (t.max_qty == null || n <= t.max_qty)
    );
    return tier?.price ?? tiers[tiers.length - 1]?.price ?? "";
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    if (field === "product_id") {
      const catalog = catalogsData?.products?.find((c) => c.id === parseInt(value));
      if (catalog) {
        items[index].description = catalog.indication  ?? "";
        items[index].expiry_date = catalog.expiry_date ?? "";
        if (!items[index].use_flat_price && catalog.tiers?.length) {
          items[index].quantity   = String(catalog.tiers[0].min_qty ?? 1);
          items[index].unit_price = String(catalog.tiers[0].price);
        } else {
          items[index].quantity   = "";
          items[index].unit_price = "";
        }
      }
    }
    if (field === "quantity" && !items[index].use_flat_price) {
      const catalog = catalogsData?.products?.find((c) => c.id === parseInt(items[index].product_id));
      if (catalog?.tiers?.length) {
        items[index].unit_price = getTierPrice(catalog.tiers, value);
      }
    }
    setForm({ ...form, items });
  };

  const totalAmount = form.items.reduce((sum, item) => {
    return sum + (Number(item.quantity) * Number(item.unit_price) || 0);
  }, 0);

  const addEmail = () => setForm({ ...form, emails: [...form.emails, ""] });

  const removeEmail = (idx) => {
    if (form.emails.length === 1) return;
    setForm({ ...form, emails: form.emails.filter((_, i) => i !== idx) });
  };

  const updateEmail = (idx, value) => {
    const emails = [...form.emails];
    emails[idx] = value;
    setForm({ ...form, emails });
  };

  const addCcEmail = () => setForm({ ...form, cc_emails: [...form.cc_emails, ""] });

  const removeCcEmail = (idx) => setForm({ ...form, cc_emails: form.cc_emails.filter((_, i) => i !== idx) });

  const updateCcEmail = (idx, value) => {
    const cc_emails = [...form.cc_emails];
    cc_emails[idx] = value;
    setForm({ ...form, cc_emails });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validEmails   = form.emails.map((e) => e.trim()).filter(Boolean);
    const validCcEmails = form.cc_emails.map((e) => e.trim()).filter(Boolean);
    onSave({ ...form, emails: validEmails, email: validEmails[0] ?? "", cc_emails: validCcEmails });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit Quotation" : "Create New Quotation"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
                placeholder="e.g. Metro Pharma Inc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 123 Rizal St., Quezon City"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <button
                  type="button"
                  onClick={addEmail}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Email
                </button>
              </div>
              <div className="space-y-2">
                {form.emails.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(idx, e.target.value)}
                      required={idx === 0}
                      placeholder={idx === 0 ? "e.g. juan@metro-pharma.com" : "e.g. cc@metro-pharma.com"}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    {form.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmail(idx)}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                        title="Remove email"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  CC Email <span className="text-xs text-gray-400 font-normal">(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={addCcEmail}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add CC
                </button>
              </div>
              {form.cc_emails.length === 0 ? (
                <button
                  type="button"
                  onClick={addCcEmail}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  + Add CC recipient
                </button>
              ) : (
                <div className="space-y-2">
                  {form.cc_emails.map((email, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateCcEmail(idx, e.target.value)}
                        placeholder="e.g. manager@company.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeCcEmail(idx)}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                        title="Remove CC"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Date *</label>
              <input
                type="date"
                value={form.quotation_date}
                onChange={(e) => setForm({ ...form, quotation_date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
          </div>

          {/* Quotation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quotation Type</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quotation_type"
                  value="pricing"
                  checked={form.quotation_type === "pricing"}
                  onChange={() => setForm({ ...form, quotation_type: "pricing" })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">Pricing Only</span>
                <span className="text-xs text-gray-400">(price tiers per product)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="quotation_type"
                  value="with_total"
                  checked={form.quotation_type === "with_total"}
                  onChange={() => setForm({ ...form, quotation_type: "with_total" })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">Pricing with Total</span>
                <span className="text-xs text-gray-400">(price × qty = total)</span>
              </label>
            </div>
          </div>

          {/* Load Template (create mode only) */}
          {!isEdit && availableTemplates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Load Template <span className="text-gray-400 font-normal text-xs">(optional — replaces current items)</span>
              </label>
              <select
                value={loadTemplateId}
                onChange={(e) => {
                  const id = e.target.value;
                  setLoadTemplateId(id);
                  if (!id) return;
                  const tpl = availableTemplates.find((t) => String(t.id) === id);
                  if (!tpl) return;
                  setForm((prev) => ({
                    ...prev,
                    items: tpl.items.map((i) => ({
                      product_id:  String(i.product_id),
                      quantity:    String(i.quantity),
                      unit_price:  String(i.unit_price),
                      description: i.description ?? "",
                      expiry_date: "",
                    })),
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="">— Load a template —</option>
                {availableTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.items.length} item{t.items.length !== 1 ? "s" : ""})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Products *</label>
              <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => {
                const catalog = catalogsData?.products?.find((c) => c.id === parseInt(item.product_id));
                const tiers = catalog?.tiers ?? [];
                const activeTierIdx = tiers.findIndex((t) => {
                  const n = parseInt(item.quantity) || 0;
                  return n >= (t.min_qty ?? 1) && (t.max_qty == null || n <= t.max_qty);
                });
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2.5">
                    {/* Product select + remove */}
                    <div className="flex gap-2 items-center">
                      <ProductSelect
                        products={catalogsData?.products?.slice().sort((a, b) => a.brand_name.localeCompare(b.brand_name)) ?? []}
                        value={item.product_id}
                        onChange={(id) => updateItem(index, "product_id", id)}
                        required
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={form.items.length === 1}
                        className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Single price toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`flat-qt-${index}`}
                        checked={item.use_flat_price}
                        onChange={(e) => updateItem(index, "use_flat_price", e.target.checked)}
                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                      />
                      <label htmlFor={`flat-qt-${index}`} className="text-xs text-gray-500 cursor-pointer select-none">
                        Single price only
                      </label>
                    </div>

                    {/* Tier pills — click to apply */}
                    {!item.use_flat_price && tiers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tiers.map((t, ti) => {
                          const isActive = ti === activeTierIdx;
                          const range = t.max_qty
                            ? `${t.min_qty}–${t.max_qty} units`
                            : `${t.min_qty}+ units`;
                          return (
                            <button
                              key={ti}
                              type="button"
                              onClick={() => {
                                const items = [...form.items];
                                items[index].quantity   = String(t.min_qty ?? 1);
                                items[index].unit_price = String(t.price);
                                setForm({ ...form, items });
                              }}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                isActive
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              {t.tier_label}: ₱{Number(t.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })} · {range}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Qty + Price + Total */}
                    <div className="flex gap-2 items-end">
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-0.5">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          required
                          min="1"
                          placeholder="Qty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-500 mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                          required
                          min="0"
                          step="0.01"
                          placeholder="Price"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex-1 py-2 text-right text-sm font-semibold text-gray-700">
                        ₱{lineTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-800">
                Total: ₱{totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-60"
            >
              {isPending ? "Saving..." : isEdit ? "Update Quotation" : "Save Quotation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────
const ViewQuotationModal = ({ quotation, onClose, onEdit, onDelete, onSendClick, isDeleting }) => {
  const { hasPermission } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{quotation.quotation_number}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={quotation.status} />
              <span className="text-sm text-gray-500">{quotation.quotation_date}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{quotation.customer_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Contact Person</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{quotation.contact_name || "—"}</p>
            </div>
            {quotation.address && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{quotation.address}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Email Address</p>
              <div className="mt-0.5 space-y-0.5">
                {(quotation.emails ?? [quotation.email]).map((addr, i) => (
                  <p key={i} className="text-sm font-medium text-gray-800">{addr}</p>
                ))}
              </div>
            </div>
            {quotation.cc_emails?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">CC</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{quotation.cc_emails.join(", ")}</p>
              </div>
            )}
            {quotation.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5">{quotation.notes}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Products</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {quotation.quotation_type === "with_total" ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Product Name</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Indication</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Unit Price</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
                      <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotation.items?.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-3 py-3 font-semibold text-gray-800 text-sm">{item.product_name}</td>
                        <td className="px-3 py-3">
                          {item.supplier_name && (
                            <p className="text-sm font-medium text-gray-800">{item.supplier_name}/</p>
                          )}
                          <p className="text-sm text-gray-600">{item.description || (item.supplier_name ? "" : "—")}</p>
                          {item.expiry_date && (
                            <p className="text-xs text-gray-400 mt-0.5">Exp: {item.expiry_date}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-medium text-gray-800">
                          ₱{Number(item.unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right text-sm text-gray-700">{Number(item.quantity).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-gray-800">
                          ₱{(Number(item.unit_price) * Number(item.quantity)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</td>
                      <td className="px-3 py-2.5 text-right text-sm font-bold text-gray-800">
                        ₱{(quotation.items ?? []).reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Product Name</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Indication</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Price</th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">Expiration Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotation.items?.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="px-3 py-3 font-semibold text-gray-800 text-sm">{item.product_name}</td>
                        <td className="px-3 py-3">
                          {item.supplier_name && (
                            <p className="text-sm font-medium text-gray-800">{item.supplier_name}/</p>
                          )}
                          <p className="text-sm text-gray-600">{item.description || (item.supplier_name ? "" : "—")}</p>
                        </td>
                        <td className="px-3 py-3">
                          {item.use_flat_price ? (
                            <p className="text-sm font-medium text-gray-800">
                              ₱{Number(item.unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                          ) : item.tiers?.length > 0 ? (
                            <div className="space-y-0.5">
                              {item.tiers.map((t, i) => {
                                const range = t.max_qty ? `${t.min_qty}-${t.max_qty}` : `${t.min_qty}+`;
                                return (
                                  <p key={i} className="text-sm font-medium text-gray-800 whitespace-nowrap">
                                    {range} @ ₱{Number(t.price).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                                  </p>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-gray-800">
                              ₱{Number(item.unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{item.expiry_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {showDeleteConfirm ? (
          <div className="p-6 border-t border-gray-200">
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Trash2 size={20} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Delete this quotation?</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    Quotation <span className="font-medium">{quotation.quotation_number}</span> will be permanently deleted. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-white transition-colors"
                >
                  Keep Quotation
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); onDelete(); }}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors"
                >
                  <Trash2 size={14} />
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t border-gray-200 flex flex-wrap gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Close
            </button>
            {hasPermission("edit_quotations") && quotation.status === "draft" && (
              <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm">
                <Pencil size={14} />
                Edit
              </button>
            )}
            {hasPermission("send_quotations") && (
              <button onClick={onSendClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                <Mail size={14} />
                Send Email
              </button>
            )}
            {hasPermission("delete_quotations") && quotation.status === "draft" && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuotationsPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate]           = useState(false);
  const [editTarget, setEditTarget]           = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [showSendModal, setShowSendModal]     = useState(false);
  const [showTemplates, setShowTemplates]     = useState(false);
  const [search, setSearch]                   = useState("");
  const [statusFilter, setStatusFilter]       = useState("");
  const [page, setPage]                       = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["quotations", search, statusFilter, page],
    queryFn: async () => {
      const response = await api.get("/quotations", {
        params: { search, status: statusFilter, page },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/quotations", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotations"]);
      toast.success("Quotation created successfully!");
      setShowCreate(false);
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0];
        toast.error(Array.isArray(first) ? first[0] : first);
      } else {
        toast.error(err.response?.data?.message || "Failed to create quotation");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/quotations/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["quotations"]);
      toast.success("Quotation updated successfully!");
      setEditTarget(null);
      setSelectedQuotation(res.data.quotation);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update quotation");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/quotations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["quotations"]);
      toast.success("Quotation deleted!");
      setSelectedQuotation(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete quotation");
    },
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, template_id }) =>
      api.post(`/quotations/${id}/send`, { template_id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["quotations"]);
      toast.success("Quotation email sent successfully!");
      setShowSendModal(false);
      setSelectedQuotation(res.data.quotation);
    },
    onError: (err) => {
      const detail = err.response?.data?.error;
      toast.error(detail || err.response?.data?.message || "Failed to send email");
    },
  });

  const handleView = async (quotation) => {
    try {
      const res = await api.get(`/quotations/${quotation.id}`);
      setSelectedQuotation(res.data.quotation);
    } catch {
      toast.error("Failed to load quotation details");
    }
  };

  const handleDelete = () => {
    if (!selectedQuotation) return;
    deleteMutation.mutate(selectedQuotation.id);
  };

  const quotations = data?.quotations ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">Create and send price quotations to clients</p>
        </div>
        {hasPermission("create_quotations") && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LayoutTemplate size={16} />
              Templates
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              New Quotation
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by quotation #, customer, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">#</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Quotation No.</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Items</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Total</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading quotations...
                    </div>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <FileText size={32} className="text-gray-300" />
                      <p className="font-medium">No quotations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map((q, index) => (
                  <React.Fragment key={q.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {((pagination?.current_page - 1) * pagination?.per_page) + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleView(q)}
                        className="text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {q.quotation_number}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{q.quotation_date}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-800">{q.customer_name}</div>
                      {q.contact_name && <div className="text-xs text-gray-500">{q.contact_name}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{q.email}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {q.items_count ?? q.items?.length ?? 0}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">
                      ₱{Number(q.total_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={q.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(q)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        {hasPermission("delete_quotations") && (
                          <button
                            onClick={() => setDeleteConfirmId(deleteConfirmId === q.id ? null : q.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {deleteConfirmId === q.id && (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 bg-red-50">
                        <div className="border border-red-200 bg-white rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Trash2 size={18} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-red-700">Delete this quotation?</p>
                              <p className="text-xs text-red-500 mt-0.5">
                                <span className="font-medium">"{q.quotation_number}"</span> will be permanently deleted. This cannot be undone.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                            >
                              Keep Quotation
                            </button>
                            <button
                              onClick={() => { setDeleteConfirmId(null); deleteMutation.mutate(q.id); }}
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
        {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
      </div>

      {showCreate && (
        <QuotationFormModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}

      {editTarget && (
        <QuotationFormModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(data) => updateMutation.mutate({ id: editTarget.id, data })}
          isPending={updateMutation.isPending}
        />
      )}

      {selectedQuotation && !editTarget && !showSendModal && (
        <ViewQuotationModal
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
          onEdit={() => setEditTarget(selectedQuotation)}
          onDelete={handleDelete}
          onSendClick={() => setShowSendModal(true)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {selectedQuotation && showSendModal && (
        <SendEmailModal
          quotation={selectedQuotation}
          onClose={() => setShowSendModal(false)}
          onSend={(template_id) => sendMutation.mutate({ id: selectedQuotation.id, template_id })}
          isSending={sendMutation.isPending}
        />
      )}

      {showTemplates && (
        <TemplateManagerModal onClose={() => setShowTemplates(false)} />
      )}
    </div>
  );
}
