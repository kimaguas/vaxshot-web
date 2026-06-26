import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { DollarSign, ChevronDown, ChevronUp, X } from "lucide-react";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const STATUS_TABS = [
  { key: "pending",     label: "Pending",     color: "yellow" },
  { key: "for_release", label: "For Release", color: "blue" },
  { key: "collected",   label: "Collected",   color: "green" },
];

const BADGE = {
  unpaid:    "bg-red-100 text-red-700",
  partial:   "bg-yellow-100 text-yellow-700",
  paid:      "bg-green-100 text-green-700",
  pending:   "bg-yellow-100 text-yellow-700",
  delivered: "bg-green-100 text-green-700",
  draft:     "bg-gray-100 text-gray-700",
};

export default function SalesCommissionPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab]     = useState("pending");
  const [expandedId, setExpandedId]   = useState(null);
  const [collectSale, setCollectSale] = useState(null);
  const [notes, setNotes]             = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sale-commissions", activeTab],
    queryFn: async () => {
      const res = await api.get("/sale-commissions", { params: { status: activeTab } });
      return res.data;
    },
  });

  const collectMutation = useMutation({
    mutationFn: ({ saleId, notes }) =>
      api.post(`/sale-commissions/${saleId}/collect`, { notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sale-commissions"] });
      setCollectSale(null);
      setNotes("");
    },
  });

  const summary  = data?.summary  ?? {};
  const sales    = data?.sales    ?? [];

  const tabColor = (tab) => {
    const active = activeTab === tab.key;
    if (!active) return "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";
    const c = { yellow: "border-yellow-500 text-yellow-600", blue: "border-blue-500 text-blue-600", green: "border-green-500 text-green-600" };
    return c[tab.color] ?? "border-blue-500 text-blue-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Commission</h1>
        <p className="text-sm text-gray-500 mt-1">Commission = (Sale Price − Acquisition Cost) × 50% per item</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Pending"
          amount={summary.pending_total ?? 0}
          count={summary.pending_count ?? 0}
          color="yellow"
        />
        <SummaryCard
          label="For Release"
          amount={summary.for_release_total ?? 0}
          count={summary.for_release_count ?? 0}
          color="blue"
        />
        <SummaryCard
          label="Collected"
          amount={summary.collected_total ?? 0}
          count={summary.collected_count ?? 0}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${tabColor(tab)}`}
              >
                {tab.label}
                {summary[`${tab.key}_count`] > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                    {summary[`${tab.key}_count`]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <DollarSign size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No commissions in this category</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left w-8" />
                  <th className="px-4 py-3 text-left">Sale #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Sale Date</th>
                  <th className="px-4 py-3 text-left">Delivery Date</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  {activeTab === "collected" && (
                    <th className="px-4 py-3 text-left">Collected</th>
                  )}
                  {activeTab === "for_release" && hasPermission("collect_commission") && (
                    <th className="px-4 py-3 text-center">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <>
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                    >
                      <td className="px-4 py-3 text-gray-400">
                        {expandedId === sale.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {sale.sale_number}
                        {sale.invoice_number && (
                          <div className="text-xs text-gray-400">INV: {sale.invoice_number}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{sale.customer}</td>
                      <td className="px-4 py-3 text-gray-600">{sale.sale_date}</td>
                      <td className="px-4 py-3 text-gray-600">{sale.delivery_date ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BADGE[sale.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                          {sale.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">₱{fmt(sale.total_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">₱{fmt(sale.commission_amount)}</td>
                      {activeTab === "collected" && (
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <div>{sale.collected_at}</div>
                          {sale.collected_by && <div className="text-gray-400">by {sale.collected_by}</div>}
                        </td>
                      )}
                      {activeTab === "for_release" && hasPermission("collect_commission") && (
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setCollectSale(sale); setNotes(""); }}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Collect
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded items breakdown */}
                    {expandedId === sale.id && (
                      <tr key={`${sale.id}-items`}>
                        <td colSpan={activeTab === "collected" ? 9 : activeTab === "for_release" && hasPermission("collect_commission") ? 9 : 8} className="px-8 pb-4 bg-blue-50">
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Commission Breakdown</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400">
                                  <th className="text-left py-1 font-medium">Product</th>
                                  <th className="text-right py-1 font-medium">Qty</th>
                                  <th className="text-right py-1 font-medium">Sale Price</th>
                                  <th className="text-right py-1 font-medium">Acq. Cost</th>
                                  <th className="text-right py-1 font-medium">Commission</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100">
                                {sale.items.map((item, i) => (
                                  <tr key={i}>
                                    <td className="py-1.5 text-gray-700">{item.product_name}</td>
                                    <td className="py-1.5 text-right text-gray-600">{item.quantity}</td>
                                    <td className="py-1.5 text-right text-gray-600">₱{fmt(item.unit_price)}</td>
                                    <td className="py-1.5 text-right text-gray-600">₱{fmt(item.acquisition_cost)}</td>
                                    <td className="py-1.5 text-right font-semibold text-blue-700">₱{fmt(item.commission)}</td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-blue-200 font-semibold">
                                  <td colSpan={4} className="py-1.5 text-gray-700">Total Commission</td>
                                  <td className="py-1.5 text-right text-blue-700">₱{fmt(sale.commission_amount)}</td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Collect Modal */}
      {collectSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Collect Commission</h2>
              <button onClick={() => setCollectSale(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sale</span>
                  <span className="font-medium">{collectSale.sale_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Customer</span>
                  <span className="font-medium">{collectSale.customer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Commission Amount</span>
                  <span className="font-bold text-blue-700 text-base">₱{fmt(collectSale.commission_amount)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setCollectSale(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => collectMutation.mutate({ saleId: collectSale.id, notes })}
                disabled={collectMutation.isPending}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {collectMutation.isPending ? "Collecting..." : "Confirm Collect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, amount, count, color }) {
  const colors = {
    yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-600" },
    blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700",   badge: "bg-blue-100 text-blue-600" },
    green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  badge: "bg-green-100 text-green-600" },
  };
  const c = colors[color] ?? colors.blue;

  return (
    <div className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm font-medium ${c.text}`}>{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{count} sale{count !== 1 ? "s" : ""}</span>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>₱{Number(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
    </div>
  );
}
