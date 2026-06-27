import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { DollarSign, ChevronDown, ChevronUp, X, Printer, FileText } from "lucide-react";

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

function printCommission(sale, editedCosts = {}, blank = false) {
  const pct = (sale.commission_percentage ?? 50) / 100;
  let totalCommission = 0;
  const itemRows = sale.items.map((item, i) => {
    const acqCost  = Number(editedCosts[`${sale.id}_${i}`] ?? item.acquisition_cost);
    const unitComm = (item.unit_price - acqCost) * pct;
    const totalComm = unitComm * item.quantity;
    totalCommission += totalComm;
    return `
      <tr>
        <td>${item.product_name}</td>
        <td class="right">₱${fmt(item.unit_price)}</td>
        <td class="center">${blank ? "&nbsp;" : `₱${fmt(acqCost)}`}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">₱${fmt(item.unit_price * item.quantity)}</td>
        <td class="center">${blank ? "&nbsp;" : `₱${fmt(unitComm)}`}</td>
        <td class="center">${blank ? "&nbsp;" : `₱${fmt(totalComm)}`}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Commission — ${sale.sale_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 28px 36px; }

    .doc-header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
    .doc-header img { height: 60px; }
    .doc-header-text h1 { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
    .doc-header-text p  { font-size: 10px; color: #555; margin-top: 2px; }

    .section-title { font-size: 11px; font-weight: bold; letter-spacing: 0.5px; margin: 18px 0 6px; text-transform: uppercase; }

    /* Order Details */
    .details-table { width: 100%; border-collapse: collapse; }
    .details-table td { border: 1px solid #999; padding: 4px 8px; }
    .details-table td.label { font-weight: bold; width: 30%; background: #f5f5f5; }

    /* Order Form */
    .order-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .order-table th { border: 1px solid #000; padding: 5px 8px; background: #e8e8e8; font-size: 10px; font-weight: bold; text-align: center; }
    .order-table td { border: 1px solid #999; padding: 4px 8px; font-size: 10px; }
    .order-table td.center { text-align: center; }
    .order-table td.right  { text-align: right; }
    .order-table tr.total-row td { font-weight: bold; background: #f5f5f5; }
    .order-table td:first-child { text-align: left; }
    /* Blank filler rows */
    .order-table tr.blank td { height: 20px; }

    /* Collection section */
    .collection-box { border: 1px solid #999; padding: 12px 16px; margin-top: 6px; }
    .collection-row { display: flex; gap: 40px; margin-top: 10px; }
    .collection-field { flex: 1; }
    .collection-field .field-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #555; }
    .collection-field .field-value { border-bottom: 1px solid #000; padding: 2px 0; margin-top: 2px; min-height: 18px; font-size: 11px; }

    .total-collected { font-size: 12px; font-weight: bold; }
    .total-collected span { font-size: 14px; }

    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 10px; color: #777; border-top: 1px solid #ddd; padding-top: 8px; }

    @media print {
      body { padding: 16px 24px; }
      @page { margin: 10mm; size: A4 portrait; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="doc-header">
    <img src="${window.location.origin}/logo.png" onerror="this.style.display='none'">
    <div class="doc-header-text">
      <h1>VAXSHOT CORPORATION</h1>
      <p>Sales Commission Receipt</p>
    </div>
    <div style="margin-left:auto;text-align:right;font-size:10px;color:#555;">
      <div><b>${sale.sale_number}</b></div>
      <div>Printed: ${new Date().toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" })}</div>
    </div>
  </div>

  <!-- ORDER DETAILS -->
  <div class="section-title">Order Details</div>
  <table class="details-table">
    <tr>
      <td class="label">SALE DATE</td>
      <td>${sale.sale_date ?? ""}</td>
      <td class="label">INVOICE #</td>
      <td>${sale.invoice_number ?? ""}</td>
    </tr>
    <tr>
      <td class="label">COMPANY / LGU</td>
      <td>${sale.customer ?? ""}</td>
      <td class="label">OR #</td>
      <td>${sale.or_number ?? ""}</td>
    </tr>
    <tr>
      <td class="label">ADDRESS</td>
      <td colspan="3">${sale.customer_address ?? ""}</td>
    </tr>
    <tr>
      <td class="label">MODE OF PAYMENT</td>
      <td colspan="3">${sale.payment_method ? sale.payment_method.replace(/_/g," ").toUpperCase() : ""}</td>
    </tr>
    <tr>
      <td class="label">DELIVERY DATE</td>
      <td>${sale.delivery_date ?? ""}</td>
      <td class="label">PAYMENT DATE</td>
      <td>${sale.payment_date ?? ""}</td>
    </tr>
    <tr>
      <td class="label">TOTAL AMOUNT</td>
      <td colspan="3" style="font-weight:bold;">₱${fmt(sale.total_amount)}</td>
    </tr>
  </table>

  <!-- ORDER FORM -->
  <div class="section-title">Order Form</div>
  <table class="order-table">
    <thead>
      <tr>
        <th style="text-align:left;width:30%">PRODUCT NAME</th>
        <th>PRICE</th>
        <th>ACQ. COST</th>
        <th>QTY</th>
        <th>TOTAL</th>
        <th>UNIT COMMISSION</th>
        <th>TOTAL SALES COMMISSION</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr class="total-row">
        <td colspan="6" style="text-align:right;padding-right:12px;">TOTAL:</td>
        <td class="center">${blank ? "&nbsp;" : `₱${fmt(totalCommission)}`}</td>
      </tr>
    </tbody>
  </table>

  <!-- COLLECTION OF SALES COMMISSION -->
  <div class="section-title">Collection of Sales Commission</div>
  <div class="collection-box">
    <div class="total-collected">
      TOTAL AMOUNT COLLECTED: <span style="border-bottom:1px solid #000;display:inline-block;min-width:200px;padding:0 4px;">&nbsp;</span>
    </div>
    <div class="collection-row">
      <div class="collection-field">
        <div class="field-label">Date</div>
        <div class="field-value">${sale.collected_at ?? ""}</div>
      </div>
      <div class="collection-field">
        <div class="field-label">Collected From</div>
        <div class="field-value">&nbsp;</div>
      </div>
      <div class="collection-field">
        <div class="field-label">Received By</div>
        <div class="field-value">${sale.collected_by ?? ""}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>This document is system-generated by Vaxshot Web System</span>
    <span>${sale.sale_number} · ${sale.invoice_number ?? ""}</span>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  win.document.write(html);
  win.document.close();
}

export default function SalesCommissionPage() {
  const { hasPermission, isSalesRep } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab]         = useState("pending");
  const [areaCodeFilter, setAreaCodeFilter] = useState("");
  const [expandedId, setExpandedId]       = useState(null);
  const [editedCosts, setEditedCosts]     = useState({});
  const [collectSale, setCollectSale]     = useState(null);
  const [notes, setNotes]                 = useState("");
  const [collectedDate, setCollectedDate] = useState("");

  const { data: areaCodesData } = useQuery({
    queryKey: ["area-codes-list"],
    queryFn: async () => {
      const res = await api.get("/area-codes", { params: { list: 1 } });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !isSalesRep(),
  });

  const setAcqCost = (saleId, index, value) =>
    setEditedCosts((prev) => ({ ...prev, [`${saleId}_${index}`]: value }));

  const getAcqCost = (saleId, index, defaultCost) =>
    editedCosts[`${saleId}_${index}`] !== undefined
      ? editedCosts[`${saleId}_${index}`]
      : String(defaultCost);

  const calcSaleComm = (sale) => {
    const pct = (sale.commission_percentage ?? 50) / 100;
    return sale.items.reduce((sum, item, i) => {
      const cost = Number(getAcqCost(sale.id, i, item.acquisition_cost)) || 0;
      return sum + (item.unit_price - cost) * item.quantity * pct;
    }, 0);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["sale-commissions", activeTab, areaCodeFilter],
    queryFn: async () => {
      const params = { status: activeTab };
      if (areaCodeFilter) params.area_code_id = areaCodeFilter;
      const res = await api.get("/sale-commissions", { params });
      return res.data;
    },
  });

  const collectMutation = useMutation({
    mutationFn: ({ saleId, notes, collected_date, commission_amount }) =>
      api.post(`/sale-commissions/${saleId}/collect`, { notes, collected_date, commission_amount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sale-commissions"] });
      setCollectSale(null);
      setNotes("");
      setCollectedDate("");
    },
  });

  const summary = data?.summary ?? {};
  const sales   = data?.sales   ?? [];

  const tabColor = (tab) => {
    const active = activeTab === tab.key;
    if (!active) return "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";
    const c = { yellow: "border-yellow-500 text-yellow-600", blue: "border-blue-500 text-blue-600", green: "border-green-500 text-green-600" };
    return c[tab.color] ?? "border-blue-500 text-blue-600";
  };

  // Always 9 columns: toggle + sale# + customer + sale date + delivery date + payment + total + commission + action
  const colSpan = activeTab === "collected" ? 10 : 9;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Pending"     amount={summary.pending_total ?? 0}     count={summary.pending_count ?? 0}     color="yellow" />
        <SummaryCard label="For Release" amount={summary.for_release_total ?? 0} count={summary.for_release_count ?? 0} color="blue" />
        <SummaryCard label="Collected"   amount={summary.collected_total ?? 0}   count={summary.collected_count ?? 0}   color="green" />
      </div>

      {/* Area Code Filter — hidden for sales reps (they're auto-scoped) */}
      {!isSalesRep() && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter by Area Code:</label>
          <select
            value={areaCodeFilter}
            onChange={(e) => { setAreaCodeFilter(e.target.value); setExpandedId(null); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
          >
            <option value="">All Areas</option>
            {(areaCodesData?.area_codes ?? areaCodesData ?? []).map((ac) => (
              <option key={ac.id} value={ac.id}>{ac.code} — {ac.name}</option>
            ))}
          </select>
        </div>
      )}

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
                    <th className="px-4 py-3 text-left">Collected On</th>
                  )}
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <>
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        const next = expandedId === sale.id ? null : sale.id;
                        setExpandedId(next);
                        if (next) {
                          const init = {};
                          sale.items.forEach((item, i) => {
                            const key = `${sale.id}_${i}`;
                            if (editedCosts[key] === undefined) {
                              const saved = sale.cost_overrides?.[String(i)];
                              init[key] = String(saved !== undefined ? saved : item.acquisition_cost);
                            }
                          });
                          if (Object.keys(init).length) setEditedCosts((p) => ({ ...p, ...init }));
                        }
                      }}
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
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          {activeTab === "for_release" && hasPermission("collect_commission") && (
                            <button
                              onClick={() => {
                                setCollectSale(sale);
                                setNotes("");
                                setCollectedDate(new Date().toISOString().split("T")[0]);
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Collect
                            </button>
                          )}
                          {activeTab === "for_release" && (
                            <button
                              onClick={() => printCommission(sale, editedCosts, true)}
                              title="Print Blank (fill manually)"
                              className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              <FileText size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => printCommission(sale, editedCosts)}
                            title="Print PDF"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded items breakdown */}
                    {expandedId === sale.id && (
                      <tr key={`${sale.id}-items`}>
                        <td colSpan={colSpan} className="px-8 pb-4 bg-blue-50">
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Commission Breakdown</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-400">
                                  <th className="text-left py-1 font-medium">Product</th>
                                  <th className="text-right py-1 font-medium">Qty</th>
                                  <th className="text-right py-1 font-medium">Sale Price</th>
                                  <th className="text-right py-1 font-medium">Acq. Cost</th>
                                  <th className="text-right py-1 font-medium">Unit Comm.</th>
                                  <th className="text-right py-1 font-medium">Comm. Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100">
                                {sale.items.map((item, i) => {
                                  const pct       = (sale.commission_percentage ?? 50) / 100;
                                  const acqCost   = Number(getAcqCost(sale.id, i, item.acquisition_cost)) || 0;
                                  const unitComm  = (item.unit_price - acqCost) * pct;
                                  const commAmt   = unitComm * item.quantity;
                                  return (
                                    <tr key={i}>
                                      <td className="py-1.5 text-gray-700">{item.product_name}</td>
                                      <td className="py-1.5 text-right text-gray-600">{item.quantity}</td>
                                      <td className="py-1.5 text-right text-gray-600">₱{fmt(item.unit_price)}</td>
                                      <td className="py-1.5 text-right text-gray-600">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={getAcqCost(sale.id, i, item.acquisition_cost)}
                                          onChange={(e) => activeTab !== "collected" && setAcqCost(sale.id, i, e.target.value)}
                                          readOnly={activeTab === "collected"}
                                          onClick={(e) => e.stopPropagation()}
                                          onBlur={(e) => {
                                            if (activeTab === "collected") return;
                                            e.stopPropagation();
                                            const overrides = {};
                                            sale.items.forEach((_, idx) => {
                                              overrides[String(idx)] = Number(getAcqCost(sale.id, idx, sale.items[idx].acquisition_cost)) || 0;
                                            });
                                            const newAmount = calcSaleComm(sale);
                                            api.patch(`/sale-commissions/${sale.id}/amount`, {
                                              commission_amount: newAmount,
                                              cost_overrides: overrides,
                                            }).then(() => {
                                              qc.setQueryData(['sale-commissions', activeTab], (old) =>
                                                old ? {
                                                  ...old,
                                                  sales: old.sales.map((s) =>
                                                    s.id === sale.id
                                                      ? { ...s, commission_amount: newAmount, cost_overrides: overrides }
                                                      : s
                                                  ),
                                                } : old
                                              );
                                            });
                                          }}
                                          className={`w-24 text-right border rounded px-1.5 py-0.5 text-xs focus:outline-none ${activeTab === "collected" ? "border-gray-200 bg-gray-50 text-gray-500 cursor-default" : "border-blue-300 focus:ring-1 focus:ring-blue-400 bg-white"}`}
                                        />
                                      </td>
                                      <td className="py-1.5 text-right text-gray-600">₱{fmt(unitComm)}</td>
                                      <td className="py-1.5 text-right font-semibold text-blue-700">₱{fmt(commAmt)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-blue-200 font-semibold">
                                  <td colSpan={5} className="py-1.5 text-gray-700">Total Commission</td>
                                  <td className="py-1.5 text-right text-blue-700">₱{fmt(calcSaleComm(sale))}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
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
                  <span className="font-bold text-blue-700 text-base">₱{fmt(calcSaleComm(collectSale))}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
                <input
                  type="date"
                  value={collectedDate}
                  onChange={(e) => setCollectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                onClick={() => collectMutation.mutate({ saleId: collectSale.id, notes, collected_date: collectedDate, commission_amount: calcSaleComm(collectSale) })}
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
