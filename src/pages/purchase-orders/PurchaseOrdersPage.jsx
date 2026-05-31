import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Eye, ClipboardList, CheckCircle } from "lucide-react";
import Pagination from "../../components/ui/Pagination";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const colors = {
    draft: "bg-gray-100 text-gray-600",
    ordered: "bg-blue-100 text-blue-600",
    partial: "bg-yellow-100 text-yellow-600",
    received: "bg-green-100 text-green-600",
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

// Create PO Modal
const CreatePOModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    notes: "",
    items: [{ product_id: "", quantity_ordered: "", unit_cost: "" }],
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const response = await api.get("/suppliers");
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
      items: [
        ...form.items,
        { product_id: "", quantity_ordered: "", unit_cost: "" },
      ],
    });
  };

  const removeItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    setForm({ ...form, items });
  };

  const totalAmount = form.items.reduce((sum, item) => {
    return sum + (Number(item.quantity_ordered) * Number(item.unit_cost) || 0);
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
            Create Purchase Order
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Supplier & Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                value={form.supplier_id}
                onChange={(e) =>
                  setForm({ ...form, supplier_id: e.target.value })
                }
                required
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date *
              </label>
              <input
                type="date"
                value={form.order_date}
                onChange={(e) =>
                  setForm({ ...form, order_date: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Delivery
              </label>
              <input
                type="date"
                value={form.expected_delivery_date}
                onChange={(e) =>
                  setForm({ ...form, expected_delivery_date: e.target.value })
                }
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
                          {p.brand_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity_ordered}
                      onChange={(e) =>
                        updateItem(index, "quantity_ordered", e.target.value)
                      }
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Unit Cost"
                      value={item.unit_cost}
                      onChange={(e) =>
                        updateItem(index, "unit_cost", e.target.value)
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              Create PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View PO Modal
const ViewPOModal = ({ po, onClose, onConfirm, onReceive }) => {
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    receipt_date: new Date().toISOString().split("T")[0],
    notes: "",
    items:
      po.items?.map((item) => ({
        purchase_order_item_id: item.id,
        product_id: item.product_id,
        brand_name: item.brand_name,
        lot_number: "",
        expiry_date: "",
        quantity_received: item.remaining_quantity || 0,
        unit_cost: item.unit_cost,
      })) || [],
  });

  const handleReceive = (e) => {
    e.preventDefault();
    onReceive(po.id, receiptForm);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {po.po_number}
            </h3>
            <p className="text-sm text-gray-500">{po.supplier}</p>
          </div>
          <StatusBadge status={po.status} />
        </div>

        <div className="p-6 space-y-4">
          {/* PO Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order Date</p>
              <p className="font-medium">{po.order_date}</p>
            </div>
            <div>
              <p className="text-gray-500">Expected Delivery</p>
              <p className="font-medium">{po.expected_delivery_date || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-medium text-blue-600">
                ₱{Number(po.total_amount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Created By</p>
              <p className="font-medium">{po.created_by}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="text-left px-3 py-2">Ordered</th>
                  <th className="text-left px-3 py-2">Received</th>
                  <th className="text-left px-3 py-2">Remaining</th>
                  <th className="text-left px-3 py-2">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {po.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">{item.brand_name}</td>
                    <td className="px-3 py-2">{item.quantity_ordered}</td>
                    <td className="px-3 py-2 text-green-600">
                      {item.quantity_received}
                    </td>
                    <td className="px-3 py-2 text-orange-600">
                      {item.remaining_quantity}
                    </td>
                    <td className="px-3 py-2">
                      ₱{Number(item.unit_cost).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Receive Form */}
          {showReceiveForm && (
            <form
              onSubmit={handleReceive}
              className="border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-gray-700">
                Receive Delivery
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Receipt Date *
                  </label>
                  <input
                    type="date"
                    value={receiptForm.receipt_date}
                    onChange={(e) =>
                      setReceiptForm({
                        ...receiptForm,
                        receipt_date: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={receiptForm.notes}
                    onChange={(e) =>
                      setReceiptForm({ ...receiptForm, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {receiptForm.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-100 rounded-lg p-3 space-y-2"
                >
                  <p className="text-sm font-medium text-gray-700">
                    {item.brand_name}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Lot Number *
                      </label>
                      <input
                        type="text"
                        value={item.lot_number}
                        onChange={(e) => {
                          const items = [...receiptForm.items];
                          items[index].lot_number = e.target.value;
                          setReceiptForm({ ...receiptForm, items });
                        }}
                        required
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => {
                          const items = [...receiptForm.items];
                          items[index].expiry_date = e.target.value;
                          setReceiptForm({ ...receiptForm, items });
                        }}
                        required
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Qty Received *
                      </label>
                      <input
                        type="number"
                        value={item.quantity_received}
                        onChange={(e) => {
                          const items = [...receiptForm.items];
                          items[index].quantity_received = e.target.value;
                          setReceiptForm({ ...receiptForm, items });
                        }}
                        required
                        min="1"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Unit Cost *
                      </label>
                      <input
                        type="number"
                        value={item.unit_cost}
                        onChange={(e) => {
                          const items = [...receiptForm.items];
                          items[index].unit_cost = e.target.value;
                          setReceiptForm({ ...receiptForm, items });
                        }}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Confirm Receipt
              </button>
            </form>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              Close
            </button>
            {po.status === "draft" && (
              <button
                onClick={() => onConfirm(po.id)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Confirm Order
              </button>
            )}
            {["ordered", "partial"].includes(po.status) && (
              <button
                onClick={() => setShowReceiveForm(!showReceiveForm)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                {showReceiveForm ? "Hide Form" : "Receive Delivery"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-orders", search, page],
    queryFn: async () => {
      const response = await api.get("/purchase-orders", {
        params: { search, page },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/purchase-orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["purchase-orders"]);
      toast.success("Purchase Order created!");
      setShowCreate(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create PO"),
  });

  const confirmMutation = useMutation({
    mutationFn: (id) =>
      api.put(`/purchase-orders/${id}`, { status: "ordered" }),
    onSuccess: () => {
      queryClient.invalidateQueries(["purchase-orders"]);
      toast.success("Purchase Order confirmed!");
      setSelectedPO(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to confirm PO"),
  });

  const receiveMutation = useMutation({
    mutationFn: ({ poId, data }) =>
      api.post(`/purchase-orders/${poId}/receipts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["purchase-orders"]);
      toast.success("Delivery received successfully!");
      setSelectedPO(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to receive delivery"),
  });

  const orders = data?.purchase_orders || [];
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
            placeholder="Search PO number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create PO
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                PO Number
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Supplier
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Order Date
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Expected Delivery
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                Total Amount
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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <ClipboardList
                    size={40}
                    className="mx-auto text-gray-300 mb-2"
                  />
                  <p className="text-gray-400">No purchase orders found</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {order.po_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {order.supplier}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.order_date}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {order.expected_delivery_date || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    ₱{Number(order.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedPO(order)}
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
        <CreatePOModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => createMutation.mutate(data)}
        />
      )}

      {selectedPO && (
        <ViewPOModal
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
          onConfirm={(id) => confirmMutation.mutate(id)}
          onReceive={(poId, data) => receiveMutation.mutate({ poId, data })}
        />
      )}
    </div>
  );
}
