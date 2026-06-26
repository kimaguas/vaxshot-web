import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Eye,
  ShoppingCart,
  CheckCircle,
  XCircle,
  CreditCard,
  Pencil,
  X,
  Truck,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Paperclip,
  Trash2,
  Upload,
} from "lucide-react";

import Pagination from "../../components/ui/Pagination";
import ProductSelect from "../../components/ui/ProductSelect";
import CustomerSelect from "../../components/ui/CustomerSelect";
import { useAuth } from "../../context/AuthContext";

const StatusBadge = ({ status }) => {
  const colors = {
    draft: "bg-gray-100 text-gray-600",
    confirmed: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || colors.draft}`}
    >
      {status}
    </span>
  );
};

const PaymentBadge = ({ status }) => {
  const colors = {
    unpaid: "bg-red-100 text-red-600",
    partial: "bg-yellow-100 text-yellow-600",
    paid: "bg-green-100 text-green-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status] || colors.unpaid}`}
    >
      {status}
    </span>
  );
};

const DeliveryBadge = ({ status }) => {
  const map = {
    pending:   "bg-gray-100 text-gray-500",
    partial:   "bg-blue-100 text-blue-600",
    delivered: "bg-green-100 text-green-600",
  };
  const labels = { pending: "Pending", partial: "Partial", delivered: "Delivered" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>
      {labels[status] || "Pending"}
    </span>
  );
};

// Create Sale Modal
const CreateSaleModal = ({ onClose, onSave, isPending }) => {
  const [form, setForm] = useState({
    customer_id: "",
    area_code_id: "",
    sale_date: new Date().toISOString().split("T")[0],
    invoice_number: "",
    payment_method: "cash",
    notes: "",
    items: [{ product_id: "", quantity: "", unit_price: "" }],
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const response = await api.get("/customers", { params: { per_page: 500 } });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: areaCodesData } = useQuery({
    queryKey: ["area-codes-list"],
    queryFn: async () => {
      const res = await api.get("/area-codes", { params: { list: 1 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const areaCodes = areaCodesData?.area_codes ?? [];

  const { data: catalogsData } = useQuery({
    queryKey: ["catalogs-for-sale"],
    queryFn: async () => {
      const response = await api.get("/products", {
        params: { status: "active", per_page: 500 },
      });
      return response.data;
    },
  });

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { product_id: "", quantity: "", unit_price: "" }],
    });
  };

  const removeItem = (index) => {
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
        items[index].unit_price = getTierPrice(catalog.tiers, items[index].quantity || 1);
      }
    }
    if (field === "quantity") {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Create New Sale
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <CustomerSelect
                customers={customersData?.customers ?? []}
                value={form.customer_id}
                onChange={(val) => {
                  const cust = customersData?.customers?.find(c => c.id === parseInt(val));
                  setForm({ ...form, customer_id: val, area_code_id: cust?.area_code_id ? String(cust.area_code_id) : "" });
                }}
                required
                placeholder="Search by name, code, or city..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area Code
              </label>
              <select
                value={form.area_code_id}
                onChange={(e) => setForm({ ...form, area_code_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— None —</option>
                {areaCodes.map((ac) => (
                  <option key={ac.id} value={String(ac.id)}>
                    {ac.code} — {ac.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sale Date *
              </label>
              <input
                type="date"
                value={form.sale_date}
                onChange={(e) =>
                  setForm({ ...form, sale_date: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                value={form.invoice_number}
                onChange={(e) =>
                  setForm({ ...form, invoice_number: e.target.value })
                }
                placeholder="INV-2026-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method *
              </label>
              <select
                value={form.payment_method}
                onChange={(e) =>
                  setForm({ ...form, payment_method: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, index) => {
                const selectedCatalog = catalogsData?.products?.find(
                  (c) => c.id === parseInt(item.product_id)
                );
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <ProductSelect
                          products={catalogsData?.products?.slice().sort((a, b) => a.brand_name.localeCompare(b.brand_name)) ?? []}
                          value={item.product_id}
                          onChange={(id) => updateItem(index, "product_id", id)}
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                          required
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(index, "unit_price", e.target.value)
                          }
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        {form.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-700 text-lg font-bold"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedCatalog && (
                      <div className="flex flex-col gap-1 px-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border w-fit ${
                          (selectedCatalog.stock ?? 0) === 0
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}>
                          Stock: {(selectedCatalog.stock ?? 0).toLocaleString()} available
                        </span>
                        {selectedCatalog.tiers?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedCatalog.tiers.map((t, ti) => (
                              <span
                                key={ti}
                                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full"
                              >
                                {t.tier_label}: &#8369;{Number(t.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-right">
              <span className="text-sm font-semibold text-gray-700">
                Total: ₱{totalAmount.toLocaleString()}
              </span>
            </div>
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
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving..." : "Create Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Sale Modal
const ViewSaleModal = ({ sale, onClose, onConfirm, onCancel, onPayment, onUpdate, onUpdateItems, onDelivery, onUploadAttachment, onDeleteAttachment, isDeliverying, products, forceConfirmReady }) => {
  const { hasPermission } = useAuth();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showItemsEdit, setShowItemsEdit] = useState(false);
  const [itemsForm, setItemsForm] = useState(
    () => (sale.items || []).map((i) => ({
      product_id: i.product_id ?? "",
      quantity:   String(i.quantity),
      unit_price: String(i.unit_price),
    }))
  );

  const getTierPrice = (tiers, qty) => {
    if (!tiers?.length) return "";
    const n = parseInt(qty) || 1;
    const tier = tiers.find((t) => n >= (t.min_qty ?? 1) && (t.max_qty == null || n <= t.max_qty));
    return tier?.price ?? tiers[tiers.length - 1]?.price ?? "";
  };

  const addItemRow = () =>
    setItemsForm([...itemsForm, { product_id: "", quantity: "", unit_price: "" }]);

  const removeItemRow = (index) =>
    setItemsForm(itemsForm.filter((_, i) => i !== index));

  const updateItemRow = (index, field, value) => {
    const rows = [...itemsForm];
    rows[index][field] = value;
    if (field === "product_id") {
      const p = products?.find((c) => c.id === parseInt(value));
      if (p) rows[index].unit_price = getTierPrice(p.tiers, rows[index].quantity || 1);
    }
    if (field === "quantity") {
      const p = products?.find((c) => c.id === parseInt(rows[index].product_id));
      if (p?.tiers?.length) rows[index].unit_price = getTierPrice(p.tiers, value);
    }
    setItemsForm(rows);
  };

  const handleItemsSave = (e) => {
    e.preventDefault();
    onUpdateItems(sale.id, itemsForm, () => setShowItemsEdit(false));
  };
  const [deliveryForm, setDeliveryForm] = useState({
    delivery_date: new Date().toISOString().split("T")[0],
    notes: "",
    items: [],
  });

  const { data: deliveriesData, isFetching: deliveriesFetching } = useQuery({
    queryKey: ["sale-deliveries", sale.id],
    queryFn: async () => {
      const res = await api.get(`/sales/${sale.id}/deliveries`);
      return res.data;
    },
    enabled: hasPermission("view_deliveries"),
  });
  const deliveries = deliveriesData?.deliveries || [];

  const getAlreadyDelivered = (saleItemId) =>
    deliveries.reduce((sum, d) => {
      const found = d.items.find((i) => i.sale_item_id === saleItemId);
      return sum + (found?.quantity_delivered || 0);
    }, 0);

  const openDeliveryForm = () => {
    const items = (sale.items || [])
      .map((item) => {
        const alreadyDelivered = getAlreadyDelivered(item.id);
        const remaining = item.quantity - alreadyDelivered;
        return {
          sale_item_id:        item.id,
          product_name:        item.brand_name,
          lot_number:          item.lot_number,
          ordered:             item.quantity,
          already_delivered:   alreadyDelivered,
          remaining,
          quantity_delivered:  remaining,
        };
      })
      .filter((i) => i.remaining > 0);
    setDeliveryForm({ delivery_date: new Date().toISOString().split("T")[0], notes: "", items });
    setShowDeliveryForm(true);
  };

  const handleDelivery = (e) => {
    e.preventDefault();
    const payload = {
      delivery_date: deliveryForm.delivery_date,
      notes: deliveryForm.notes || undefined,
      items: deliveryForm.items
        .filter((i) => parseInt(i.quantity_delivered) > 0)
        .map((i) => ({ sale_item_id: i.sale_item_id, quantity_delivered: parseInt(i.quantity_delivered) })),
    };
    if (!payload.items.length) { toast.error("Enter at least one item quantity"); return; }
    onDelivery(sale.id, payload, () => setShowDeliveryForm(false));
  };

  const [paymentForm, setPaymentForm] = useState({
    amount: sale.balance || "",
    payment_method: sale.payment_method || "cash",
    payment_date: new Date().toISOString().split("T")[0],
    or_number: "",
    reference_number: "",
    notes: "",
    or_attachment: null,
  });

  const [editForm, setEditForm] = useState({
    invoice_number: sale.invoice_number || "",
    or_number:      sale.or_number      || "",
    sale_date:      sale.sale_date      || "",
    payment_method: sale.payment_method || "cash",
    notes:          sale.notes          || "",
    area_code_id:   sale.area_code_id   ? String(sale.area_code_id) : "",
  });

  const { data: editAreaCodesData } = useQuery({
    queryKey: ["area-codes-list"],
    queryFn: async () => {
      const res = await api.get("/area-codes", { params: { list: 1 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const editAreaCodes = editAreaCodesData?.area_codes ?? [];

  const handlePayment = (e) => {
    e.preventDefault();
    const rawAmount = String(paymentForm.amount).replace(/,/g, "");
    if (paymentForm.or_attachment) {
      const fd = new FormData();
      fd.append("amount",           rawAmount);
      fd.append("payment_method",   paymentForm.payment_method);
      fd.append("payment_date",     paymentForm.payment_date);
      fd.append("or_number",        paymentForm.or_number);
      fd.append("reference_number", paymentForm.reference_number);
      fd.append("notes",            paymentForm.notes);
      fd.append("or_attachment",    paymentForm.or_attachment);
      onPayment(sale.id, fd);
    } else {
      onPayment(sale.id, { ...paymentForm, amount: rawAmount });
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    onUpdate(sale.id, editForm);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{sale.sale_number}</h3>
            <p className="text-sm text-gray-500">{sale.customer}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Status</span>
              <StatusBadge status={sale.status} />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Delivery</span>
              <DeliveryBadge status={sale.delivery_status} />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Payment</span>
              <PaymentBadge status={sale.payment_status} />
            </div>
            {hasPermission("edit_sales") && sale.status !== "cancelled" && (
              <button
                onClick={() => setShowEditForm(!showEditForm)}
                title="Edit sale details"
                className={`p-1.5 rounded-lg transition-colors ${
                  showEditForm
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {showEditForm ? <X size={16} /> : <Pencil size={16} />}
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Inline Edit Form */}
          {showEditForm && (
            <form
              onSubmit={handleEdit}
              className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-blue-700">Edit Sale Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    value={editForm.invoice_number}
                    onChange={(e) => setEditForm({ ...editForm, invoice_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">OR Number</label>
                  <input
                    type="text"
                    value={editForm.or_number}
                    onChange={(e) => setEditForm({ ...editForm, or_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {sale.status === "draft" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sale Date</label>
                    <input
                      type="date"
                      value={editForm.sale_date}
                      onChange={(e) => setEditForm({ ...editForm, sale_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                  <select
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Area Code</label>
                  <select
                    value={editForm.area_code_id}
                    onChange={(e) => setEditForm({ ...editForm, area_code_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— None —</option>
                    {editAreaCodes.map((ac) => (
                      <option key={ac.id} value={String(ac.id)}>
                        {ac.code} — {ac.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Attachments */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Paperclip size={12} />
                      Attachments
                      {sale.attachments?.length > 0 && (
                        <span className="text-gray-400">({sale.attachments.length})</span>
                      )}
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                      <Upload size={11} />
                      Add Files
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          e.target.value = "";
                          if (files.length) onUploadAttachment(sale.id, files);
                        }}
                      />
                    </label>
                  </div>
                  {sale.attachments?.length > 0 ? (
                    <div className="space-y-1">
                      {sale.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between gap-2 bg-white border border-gray-200 rounded px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Paperclip size={11} className="text-gray-400 shrink-0" />
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-700 hover:underline truncate"
                            >
                              {att.original_name}
                            </a>
                            <span className="text-xs text-gray-400 shrink-0">
                              {att.file_size < 1024 * 1024
                                ? `${(att.file_size / 1024).toFixed(0)} KB`
                                : `${(att.file_size / (1024 * 1024)).toFixed(1)} MB`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteAttachment(sale.id, att.id)}
                            className="p-0.5 text-red-400 hover:text-red-600 shrink-0"
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No attachments yet.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Sale Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Invoice Number</p>
              <p className="font-medium">{sale.invoice_number || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">OR Number</p>
              <p className="font-medium">{sale.or_number || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Sale Date</p>
              <p className="font-medium">{sale.sale_date}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment Method</p>
              <p className="font-medium capitalize">
                {sale.payment_method?.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-medium text-blue-600">
                ₱{Number(sale.total_amount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Balance</p>
              <p className={`font-medium ${Number(sale.balance) > 0 ? "text-red-600" : "text-green-600"}`}>
                ₱{Number(sale.balance).toLocaleString()}
              </p>
            </div>
            {sale.notes && (
              <div className="col-span-2">
                <p className="text-gray-500">Notes</p>
                <p className="font-medium">{sale.notes}</p>
              </div>
            )}
            {sale.attachments?.length > 0 && (
              <div className="col-span-2">
                <p className="text-gray-500 mb-1.5 flex items-center gap-1">
                  <Paperclip size={13} />
                  Attachments
                </p>
                <div className="flex flex-wrap gap-2">
                  {sale.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700"
                    >
                      <Paperclip size={11} className="shrink-0" />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {att.original_name}
                      </a>
                      {hasPermission("edit_sales") && sale.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => onDeleteAttachment(sale.id, att.id)}
                          className="ml-1 p-0.5 text-blue-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700">Items</h4>
              {hasPermission("edit_sales") && sale.status === "draft" && (
                <button
                  type="button"
                  onClick={() => setShowItemsEdit(!showItemsEdit)}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                    showItemsEdit
                      ? "bg-orange-100 text-orange-700 border-orange-300"
                      : "text-gray-500 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Pencil size={12} />
                  {showItemsEdit ? "Cancel Edit" : "Edit Items"}
                </button>
              )}
            </div>

            {showItemsEdit ? (
              <form onSubmit={handleItemsSave} className="space-y-3">
                <div className="space-y-2">
                  {itemsForm.map((row, index) => {
                    const selectedProduct = products?.find((c) => c.id === parseInt(row.product_id));
                    return (
                      <div key={index} className="space-y-1 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <ProductSelect
                              products={products?.slice().sort((a, b) => a.brand_name.localeCompare(b.brand_name)) ?? []}
                              value={row.product_id}
                              onChange={(id) => updateItemRow(index, "product_id", id)}
                              required
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              placeholder="Qty"
                              value={row.quantity}
                              onChange={(e) => updateItemRow(index, "quantity", e.target.value)}
                              required
                              min="1"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              placeholder="Unit Price"
                              value={row.unit_price}
                              onChange={(e) => updateItemRow(index, "unit_price", e.target.value)}
                              required
                              min="0"
                              step="0.01"
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="col-span-1">
                            {itemsForm.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(index)}
                                className="text-red-500 hover:text-red-700 text-lg font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                        {selectedProduct && (
                          <div className="flex flex-col gap-1 px-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border w-fit ${
                              (selectedProduct.stock ?? 0) === 0
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}>
                              Stock: {(selectedProduct.stock ?? 0).toLocaleString()} available
                            </span>
                            {selectedProduct.tiers?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {selectedProduct.tiers.map((t, ti) => (
                                  <span key={ti} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                    {t.tier_label}: &#8369;{Number(t.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Item
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                    Total: ₱{itemsForm.reduce((s, r) => s + (Number(r.quantity) * Number(r.unit_price) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowItemsEdit(false)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Save Items
                  </button>
                </div>
              </form>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-left px-3 py-2">Lot No</th>
                    <th className="text-left px-3 py-2">Expiry</th>
                    <th className="text-left px-3 py-2">Qty</th>
                    <th className="text-left px-3 py-2">Price</th>
                    <th className="text-left px-3 py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sale.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">{item.brand_name}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{item.lot_number}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{item.expiry_date}</td>
                      <td className="px-3 py-2">{Number(item.quantity).toLocaleString()}</td>
                      <td className="px-3 py-2">₱{Number(item.unit_price).toLocaleString()}</td>
                      <td className="px-3 py-2 font-medium">₱{Number(item.total_price).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Payment History */}
          {sale.payments?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment History</h4>
              <div className="space-y-2">
                {sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-gray-100 rounded-lg p-3 text-sm bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-green-700">
                        ₱{Number(payment.amount).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">{payment.payment_date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                      <span>Method: <span className="capitalize">{payment.payment_method?.replace("_", " ")}</span></span>
                      {payment.or_number   && <span>OR #: {payment.or_number}</span>}
                      {payment.reference_number && <span>Ref #: {payment.reference_number}</span>}
                      {payment.received_by && <span>By: {payment.received_by}</span>}
                      {payment.notes       && <span className="col-span-2">Notes: {payment.notes}</span>}
                    </div>
                    {payment.or_attachment_url && (
                      <div className="mt-2">
                        <a
                          href={payment.or_attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          📎 View OR Attachment
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery History */}
          {sale.status === "confirmed" && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery History</h4>
              {deliveriesFetching ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : deliveries.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No deliveries recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {deliveries.map((d) => (
                    <div key={d.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 text-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-gray-700">{d.delivery_number}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{d.delivery_date}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            d.status === "complete" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                          }`}>
                            {d.status === "complete" ? "Complete" : "Partial"}
                          </span>
                        </div>
                      </div>
                      {d.delivered_by && (
                        <p className="text-xs text-gray-500 mb-1">By: {d.delivered_by}</p>
                      )}
                      <table className="w-full text-xs mt-1">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left py-0.5">Product</th>
                            <th className="text-left py-0.5">Lot</th>
                            <th className="text-right py-0.5">Qty Delivered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.items.map((di) => (
                            <tr key={di.id} className="text-gray-700">
                              <td className="py-0.5">{di.product_name}</td>
                              <td className="py-0.5 text-gray-500">{di.lot_number || "—"}</td>
                              <td className="py-0.5 text-right font-medium">{di.quantity_delivered?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {d.notes && <p className="text-xs text-gray-400 mt-1">Notes: {d.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Record Delivery Form */}
          {showDeliveryForm && (
            <form
              onSubmit={handleDelivery}
              className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-blue-700">Record Delivery</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    value={deliveryForm.delivery_date}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, delivery_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    placeholder="Optional remarks..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Items to Deliver</label>
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="text-left px-3 py-2">Product</th>
                        <th className="text-right px-3 py-2">Ordered</th>
                        <th className="text-right px-3 py-2">Delivered</th>
                        <th className="text-right px-3 py-2">Remaining</th>
                        <th className="text-right px-3 py-2 w-28">Qty to Deliver</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {deliveryForm.items.map((item, idx) => (
                        <tr key={item.sale_item_id}>
                          <td className="px-3 py-2">
                            <div className="font-medium">{item.product_name}</div>
                            {item.lot_number && <div className="text-xs text-gray-400">{item.lot_number}</div>}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500">{item.ordered}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{item.already_delivered}</td>
                          <td className="px-3 py-2 text-right text-blue-600 font-medium">{item.remaining}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              max={item.remaining}
                              value={item.quantity_delivered}
                              onChange={(e) => {
                                const items = [...deliveryForm.items];
                                items[idx] = { ...items[idx], quantity_delivered: e.target.value };
                                setDeliveryForm({ ...deliveryForm, items });
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryForm(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeliverying}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isDeliverying ? "Saving..." : "Save Delivery"}
                </button>
              </div>
            </form>
          )}

          {/* Record Payment Form */}
          {showPaymentForm && sale.status === "confirmed" && sale.payment_status !== "paid" && (
            <form
              onSubmit={handlePayment}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-gray-700">Record Payment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={paymentForm.amount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, "");
                      setPaymentForm({ ...paymentForm, amount: raw });
                    }}
                    onBlur={() => {
                      const num = parseFloat(paymentForm.amount);
                      if (!isNaN(num)) {
                        setPaymentForm({ ...paymentForm, amount: num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) });
                      }
                    }}
                    onFocus={() => {
                      const raw = String(paymentForm.amount).replace(/,/g, "");
                      setPaymentForm({ ...paymentForm, amount: raw });
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">OR Number</label>
                  <input
                    type="text"
                    value={paymentForm.or_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, or_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    OR Attachment <span className="text-gray-400 font-normal">(optional — photo or PDF)</span>
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0] || null;
                      if (file && file.size > 5 * 1024 * 1024) {
                        toast.error("File must be 5MB or smaller.");
                        e.target.value = "";
                        return;
                      }
                      setPaymentForm({ ...paymentForm, or_attachment: file });
                    }}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none"
                  />
                  {paymentForm.or_attachment && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {paymentForm.or_attachment.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Record Payment
              </button>
            </form>
          )}

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <XCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Cancel this sale?</p>
                  <p className="text-xs text-red-500 mt-0.5">
                    Sale <span className="font-medium">{sale.sale_number}</span> will be marked as cancelled. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-white"
                >
                  Keep Sale
                </button>
                <button
                  onClick={() => { setShowCancelConfirm(false); onCancel(sale.id); }}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  Yes, Cancel Sale
                </button>
              </div>
            </div>
          )}

          {/* Backorder warning — shown after a failed confirm */}
          {forceConfirmReady && sale.status === "draft" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">Insufficient stock</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Confirm anyway as a backorder? Stock will go negative and will be covered when the purchase order is received.
                </p>
              </div>
              <button
                onClick={() => onConfirm(sale.id, true)}
                className="flex-shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600"
              >
                Force Confirm
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Close
            </button>
            {sale.status === "draft" && (
              <>
                {hasPermission("confirm_sales") && (
                  <button
                    onClick={() => onConfirm(sale.id, false)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Confirm Sale
                  </button>
                )}
                {hasPermission("cancel_sales") && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Cancel Sale
                  </button>
                )}
              </>
            )}
            {sale.status === "confirmed" && sale.delivery_status !== "delivered" && (
              <button
                onClick={() => { setShowPaymentForm(false); showDeliveryForm ? setShowDeliveryForm(false) : openDeliveryForm(); }}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm flex items-center justify-center gap-2"
              >
                <Truck size={16} />
                {showDeliveryForm ? "Hide Delivery" : "Record Delivery"}
              </button>
            )}
            {sale.status === "confirmed" && sale.payment_status !== "paid" && (
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                {showPaymentForm ? "Hide Payment" : "Record Payment"}
              </button>
            )}
            {sale.status === "confirmed" && hasPermission("cancel_sales") && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                Cancel Sale
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DATE_MODES = [
  { value: "date",  label: "By Date" },
  { value: "month", label: "By Month" },
  { value: "range", label: "Date Range" },
  { value: "as_of", label: "As Of" },
];

export default function SalesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  // Filters
  const [search,        setSearch]        = useState("");
  const [dateMode,      setDateMode]      = useState("");
  const [dateValue,     setDateValue]     = useState("");
  const [monthValue,    setMonthValue]    = useState("");
  const [fromDate,      setFromDate]      = useState("");
  const [toDate,        setToDate]        = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [areaCodeId,    setAreaCodeId]    = useState("");
  // Sorting
  const [sortBy,    setSortBy]    = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");

  const [showCreate,     setShowCreate]     = useState(false);
  const [selectedSale,   setSelectedSale]   = useState(null);
  const [page,           setPage]           = useState(1);
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  const { data: areaCodesData } = useQuery({
    queryKey: ["area-codes-list"],
    queryFn: async () => {
      const res = await api.get("/area-codes", { params: { list: 1 } });
      return res.data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-for-sale"],
    queryFn: async () => {
      const res = await api.get("/products", { params: { status: "active", per_page: 500 } });
      return res.data;
    },
    enabled: !!selectedSale && selectedSale.status === "draft",
  });
  const productsForSale = productsData?.products ?? [];

  const buildParams = () => {
    const p = { search, page, sort_by: sortBy, sort_order: sortOrder };
    if (paymentStatus) p.payment_status = paymentStatus;
    if (areaCodeId)    p.area_code_id   = areaCodeId;
    if (dateMode === "date"  && dateValue)  p.date = dateValue;
    if (dateMode === "as_of" && dateValue)  p.as_of = dateValue;
    if (dateMode === "month" && monthValue) {
      const [y, m] = monthValue.split("-");
      p.year = y; p.month = m;
    }
    if (dateMode === "range" && fromDate && toDate) {
      p.from = fromDate; p.to = toDate;
    }
    return p;
  };

  const { data, isLoading } = useQuery({
    queryKey: ["sales", search, page, dateMode, dateValue, monthValue, fromDate, toDate, paymentStatus, areaCodeId, sortBy, sortOrder],
    queryFn: async () => {
      const response = await api.get("/sales", { params: buildParams() });
      return response.data;
    },
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(o => o === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  const clearFilters = () => {
    setSearch(""); setDateMode(""); setDateValue(""); setMonthValue("");
    setFromDate(""); setToDate(""); setPaymentStatus(""); setAreaCodeId(""); setPage(1);
  };

  const hasActiveFilters = search || dateMode || paymentStatus || areaCodeId;

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/sales", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Sale created successfully!");
      setShowCreate(false);
    },
    onError: (err) => {
      const data = err.response?.data;
      const firstValidationError = data?.errors
        ? Object.values(data.errors).flat()[0]
        : null;
      toast.error(firstValidationError || data?.error || data?.message || "Failed to create sale");
    },
  });

  const refreshSale = async (id) => {
    try {
      const response = await api.get(`/sales/${id}`);
      setSelectedSale(response.data.sale);
    } catch {
      // ignore — modal will close naturally if needed
    }
  };

  const [forceConfirmSaleId, setForceConfirmSaleId] = useState(null);

  const confirmMutation = useMutation({
    mutationFn: ({ id, force }) => api.post(`/sales/${id}/confirm`, { force: !!force }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Sale confirmed!");
      setForceConfirmSaleId(null);
      refreshSale(id);
    },
    onError: (err, { id }) => {
      const msg = err.response?.data?.message || "Failed to confirm sale";
      toast.error(msg);
      if (msg.startsWith("Insufficient stock")) {
        setForceConfirmSaleId(id);
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.post(`/sales/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Sale cancelled!");
      setSelectedSale(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to cancel sale"),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ saleId, data }) =>
      api.post(`/sales/${saleId}/payments`, data, {
        headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
      }),
    onSuccess: (_, { saleId }) => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Payment recorded!");
      refreshSale(saleId);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to record payment"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/sales/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Sale updated!");
      setSelectedSale(res.data.sale);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update sale"),
  });

  const updateItemsMutation = useMutation({
    mutationFn: ({ id, items }) => api.put(`/sales/${id}/items`, { items }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Items updated!");
      setSelectedSale(res.data.sale);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update items"),
  });

  const deliveryMutation = useMutation({
    mutationFn: ({ saleId, data }) => api.post(`/sales/${saleId}/deliveries`, data),
    onSuccess: (res, { saleId }) => {
      queryClient.invalidateQueries(["sales"]);
      queryClient.invalidateQueries(["sale-deliveries", saleId]);
      queryClient.invalidateQueries(["inventory"]);
      queryClient.invalidateQueries(["inventory-stats"]);
      toast.success(`Delivery ${res.data.delivery_number} recorded!`);
      refreshSale(saleId);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to record delivery"),
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ saleId, files }) => {
      let lastResponse;
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        lastResponse = await api.post(`/sales/${saleId}/attachments`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      return lastResponse;
    },
    onSuccess: (_, { saleId }) => {
      toast.success("Attachment(s) uploaded!");
      refreshSale(saleId);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to upload attachment"),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ saleId, attachmentId }) =>
      api.delete(`/sales/${saleId}/attachments/${attachmentId}`),
    onSuccess: (_, { saleId }) => {
      toast.success("Attachment deleted");
      refreshSale(saleId);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete attachment"),
  });

  // Fetch full sale details when viewing
  const handleView = async (sale) => {
    try {
      const response = await api.get(`/sales/${sale.id}`);
      setSelectedSale(response.data.sale);
    } catch (error) {
      toast.error("Failed to load sale details");
    }
  };

  const sales      = data?.sales      || [];
  const pagination = data?.pagination  || null;
  const totals     = data?.totals      || null;

  return (
    <div className="space-y-4">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sales",   value: totals?.total_sales,   color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-100" },
          { label: "Total Paid",    value: totals?.total_paid,    color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
          { label: "Balance",       value: totals?.total_balance, color: "text-red-600",   bg: "bg-red-50",   border: "border-red-100" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl px-5 py-4`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-xl font-bold ${color} mt-1`}>
              {value == null ? "—" : `₱${Number(value).toLocaleString()}`}
            </p>
          </div>
        ))}
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Records</p>
          <p className="text-xl font-bold text-gray-700 mt-1">
            {totals == null ? "—" : totals.count.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Text search */}
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sale #, invoice, customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
          />
        </div>

        {/* Payment Status */}
        <select
          value={paymentStatus}
          onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>

        {/* Area Code Filter */}
        <select
          value={areaCodeId}
          onChange={(e) => { setAreaCodeId(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Areas</option>
          {areaCodesData?.area_codes?.map((ac) => (
            <option key={ac.id} value={ac.id}>
              {ac.code} — {ac.name}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}

        <div className="ml-auto">
          {hasPermission("create_sales") && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus size={16} />
              New Sale
            </button>
          )}
        </div>
      </div>

      {/* Date Filter Mode Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Filter by:</span>
        {DATE_MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => {
              setDateMode(dateMode === m.value ? "" : m.value);
              setDateValue(""); setMonthValue(""); setFromDate(""); setToDate("");
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              dateMode === m.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {m.label}
          </button>
        ))}

        {/* Date inputs based on active mode */}
        {dateMode === "date" && (
          <input type="date" value={dateValue}
            onChange={(e) => { setDateValue(e.target.value); setPage(1); }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        {dateMode === "as_of" && (
          <input type="date" value={dateValue}
            onChange={(e) => { setDateValue(e.target.value); setPage(1); }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        {dateMode === "month" && (
          <input type="month" value={monthValue}
            onChange={(e) => { setMonthValue(e.target.value); setPage(1); }}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        {dateMode === "range" && (
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} placeholder="From"
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={toDate} placeholder="To"
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600 w-12">No.</th>
              <th
                className="text-left px-4 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none"
                onClick={() => handleSort("sale_date")}
              >
                Date <SortIcon field="sale_date" />
              </th>
              <th
                className="text-left px-4 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none"
                onClick={() => handleSort("invoice_number")}
              >
                Invoice No <SortIcon field="invoice_number" />
              </th>
              <th
                className="text-left px-4 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none"
                onClick={() => handleSort("customer")}
              >
                Customer <SortIcon field="customer" />
              </th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Items</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">QTY</th>
              <th
                className="text-left px-4 py-4 text-sm font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none"
                onClick={() => handleSort("total_amount")}
              >
                Total <SortIcon field="total_amount" />
              </th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Paid</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Balance</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Delivery</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Payment</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-12">
                  <ShoppingCart size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">No sales found</p>
                </td>
              </tr>
            ) : (
              sales.map((sale, index) => {
                const rowNo       = (page - 1) * (pagination?.per_page ?? 10) + index + 1;
                const totalQty    = sale.items?.reduce((s, i) => s + i.quantity, 0) ?? "-";
                const itemNames   = sale.items?.map(i => i.brand_name) ?? [];
                const itemsLabel  = itemNames.length === 0
                  ? "-"
                  : itemNames.length <= 2
                    ? itemNames.join(", ")
                    : `${itemNames.slice(0, 2).join(", ")} +${itemNames.length - 2}`;

                const isExpanded = expandedSaleId === sale.id;
                const hasMultipleItems = (sale.items?.length ?? 0) > 1;

                return (
                  <React.Fragment key={sale.id}>
                    <tr
                      className={`transition-colors cursor-pointer select-none ${isExpanded ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 w-12">
                        {rowNo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {sale.sale_date}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleView(sale); }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {sale.invoice_number || sale.sale_number}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {sale.customer}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-40">
                        <div className="flex items-center gap-1">
                          {hasMultipleItems
                            ? (isExpanded
                                ? <ChevronDown size={14} className="text-blue-500 shrink-0" />
                                : <ChevronRight size={14} className="text-gray-400 shrink-0" />)
                            : null}
                          <span title={itemNames.join(", ")}>{itemsLabel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {Number(totalQty).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 whitespace-nowrap">
                        ₱{Number(sale.total_amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-700 whitespace-nowrap">
                        ₱{Number(sale.amount_paid).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600 whitespace-nowrap">
                        ₱{Number(sale.balance).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sale.status} />
                      </td>
                      <td className="px-4 py-3">
                        <DeliveryBadge status={sale.delivery_status} />
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={sale.payment_status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleView(sale); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* Collapsible item details */}
                    {isExpanded && sale.items?.length > 0 && (
                      <tr className="bg-blue-50 border-t border-blue-100">
                        <td colSpan={13} className="px-8 pb-3 pt-0">
                          <table className="w-full text-sm border border-blue-100 rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-blue-100 text-blue-700 text-xs uppercase tracking-wide">
                                <th className="text-left px-3 py-2">Product</th>
                                <th className="text-left px-3 py-2">Lot No</th>
                                <th className="text-left px-3 py-2">Expiry</th>
                                <th className="text-right px-3 py-2">Qty</th>
                                <th className="text-right px-3 py-2">Unit Price</th>
                                <th className="text-right px-3 py-2">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50 bg-white">
                              {sale.items.map((item, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2 font-medium text-gray-800">{item.brand_name}</td>
                                  <td className="px-3 py-2 text-gray-500">{item.lot_number || "—"}</td>
                                  <td className="px-3 py-2 text-gray-500">{item.expiry_date || "—"}</td>
                                  <td className="px-3 py-2 text-right text-gray-700">{Number(item.quantity).toLocaleString()}</td>
                                  <td className="px-3 py-2 text-right text-gray-700">₱{Number(item.unit_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-gray-800">₱{Number(item.total_price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateSaleModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}

      {selectedSale && (
        <ViewSaleModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onConfirm={(id, force) => confirmMutation.mutate({ id, force })}
          forceConfirmReady={forceConfirmSaleId === selectedSale?.id}
          onCancel={(id) => cancelMutation.mutate(id)}
          onPayment={(saleId, data) => paymentMutation.mutate({ saleId, data })}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          onUpdateItems={(id, items, cb) => updateItemsMutation.mutate({ id, items }, { onSuccess: cb })}
          onDelivery={(saleId, data, cb) => deliveryMutation.mutate({ saleId, data }, { onSuccess: cb })}
          onUploadAttachment={(saleId, files) => uploadAttachmentMutation.mutate({ saleId, files })}
          onDeleteAttachment={(saleId, attachmentId) => deleteAttachmentMutation.mutate({ saleId, attachmentId })}
          isDeliverying={deliveryMutation.isPending}
          products={productsForSale}
        />
      )}
    </div>
  );
}
