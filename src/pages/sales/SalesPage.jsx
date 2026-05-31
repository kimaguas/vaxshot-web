import { useState } from "react";
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
} from "lucide-react";

import Pagination from "../../components/ui/Pagination";

const StatusBadge = ({ status }) => {
  const colors = {
    draft: "bg-gray-100 text-gray-600",
    confirmed: "bg-green-100 text-green-600",
    cancelled: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.unpaid}`}
    >
      {status}
    </span>
  );
};

// Create Sale Modal
const CreateSaleModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    customer_id: "",
    sale_date: new Date().toISOString().split("T")[0],
    invoice_number: "",
    payment_method: "cash",
    notes: "",
    items: [{ product_id: "", quantity: "", unit_price: "" }],
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const response = await api.get("/customers");
      return response.data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const response = await api.get("/products");
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

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    // Auto fill unit price from product
    if (field === "product_id") {
      const product = productsData?.products?.find(
        (p) => p.id === parseInt(value),
      );
      if (product) items[index].unit_price = product.selling_price;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Create New Sale
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={form.customer_id}
                onChange={(e) =>
                  setForm({ ...form, customer_id: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Customer</option>
                {customersData?.customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
              {form.items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-5">
                    <select
                      value={item.product_id}
                      onChange={(e) =>
                        updateItem(index, "product_id", e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select Product</option>
                      {productsData?.products?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.brand_name} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
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
              ))}
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Sale Modal
const ViewSaleModal = ({ sale, onClose, onConfirm, onCancel, onPayment }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: sale.balance || "",
    payment_method: sale.payment_method || "cash",
    payment_date: new Date().toISOString().split("T")[0],
    or_number: "",
    reference_number: "",
    notes: "",
  });

  const handlePayment = (e) => {
    e.preventDefault();
    onPayment(sale.id, paymentForm);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {sale.sale_number}
            </h3>
            <p className="text-sm text-gray-500">{sale.customer}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={sale.status} />
            <PaymentBadge status={sale.payment_status} />
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Sale Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
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
              <p
                className={`font-medium ${Number(sale.balance) > 0 ? "text-red-600" : "text-green-600"}`}
              >
                ₱{Number(sale.balance).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
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
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {item.lot_number}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {item.expiry_date}
                    </td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2">
                      ₱{Number(item.unit_price).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      ₱{Number(item.total_price).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Form */}
          {showPaymentForm &&
            sale.status === "confirmed" &&
            sale.payment_status !== "paid" && (
              <form
                onSubmit={handlePayment}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <h4 className="text-sm font-semibold text-gray-700">
                  Record Payment
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          amount: e.target.value,
                        })
                      }
                      required
                      min="0"
                      step="0.01"
                      max={sale.balance}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentForm.payment_method}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Payment Date *
                    </label>
                    <input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          payment_date: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      OR Number
                    </label>
                    <input
                      type="text"
                      value={paymentForm.or_number}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          or_number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      value={paymentForm.reference_number}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          reference_number: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={paymentForm.notes}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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

          {/* Actions */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Close
            </button>
            {sale.status === "draft" && (
              <>
                <button
                  onClick={() => onConfirm(sale.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Confirm Sale
                </button>
                <button
                  onClick={() => onCancel(sale.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center justify-center gap-2"
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              </>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["sales", search, page],
    queryFn: async () => {
      const response = await api.get("/sales", { params: { search, page } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/sales", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Sale created successfully!");
      setShowCreate(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create sale"),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.post(`/sales/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Sale confirmed!");
      setSelectedSale(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to confirm sale"),
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
      api.post(`/sales/${saleId}/payments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      toast.success("Payment recorded!");
      setSelectedSale(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to record payment"),
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

  const sales = data?.sales || [];
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
            placeholder="Search sale/invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          New Sale
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Sale No
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Invoice No
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Customer
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Date
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Total
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Balance
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Status
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Payment
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Actions
              </th>
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
                <td colSpan={9} className="text-center py-12">
                  <ShoppingCart
                    size={40}
                    className="mx-auto text-gray-300 mb-2"
                  />
                  <p className="text-gray-400">No sales found</p>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {sale.sale_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.invoice_number || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {sale.customer}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {sale.sale_date}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    ₱{Number(sale.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">
                    ₱{Number(sale.balance).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PaymentBadge status={sale.payment_status} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleView(sale)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateSaleModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => createMutation.mutate(data)}
        />
      )}

      {selectedSale && (
        <ViewSaleModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onConfirm={(id) => confirmMutation.mutate(id)}
          onCancel={(id) => cancelMutation.mutate(id)}
          onPayment={(saleId, data) => paymentMutation.mutate({ saleId, data })}
        />
      )}
    </div>
  );
}
