import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FileText, Package, ShoppingCart, Users, Clock, CreditCard, Download } from "lucide-react";
import Pagination from "../../components/ui/Pagination";

const tabs = [
  { id: "sales", label: "Sales Report", icon: ShoppingCart },
  { id: "payments", label: "Payments Report", icon: CreditCard },
  { id: "inventory", label: "Inventory Report", icon: Package },
  { id: "purchase-orders", label: "Purchase Orders", icon: FileText },
  { id: "customers", label: "Customer Report", icon: Users },
  { id: "expiry", label: "Expiry Report", icon: Clock },
];

// Date Filter Component
const DateFilter = ({ from, to, onFromChange, onToChange, onSearch }) => (
  <div className="flex flex-wrap items-end gap-3">
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        From
      </label>
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
    </div>
    <button
      onClick={onSearch}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
    >
      Generate
    </button>
  </div>
);

// Sales Report Tab
const SalesReportTab = () => {
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [params, setParams] = useState({ from, to });
  const [reportType, setReportType] = useState("sales");
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["report-sales", params],
    queryFn: async () => {
      const response = await api.get("/reports/sales", { params });
      return response.data;
    },
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-all"],
    queryFn: async () => {
      const response = await api.get("/suppliers", { params: { per_page: 500 } });
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const exportSupplierReport = async (group) => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sales Report");

    const HEADER_COLOR = "1F4E79";
    const WHITE = "FFFFFFFF";

    ws.columns = [
      { width: 13 },
      { width: 56 },
      { width: 36 },
      { width: 12 },
      { width: 16 },
      { width: 14 },
    ];

    // Title
    ws.mergeCells("A1:F1");
    Object.assign(ws.getCell("A1"), {
      value: "SALES REPORT",
      font: { bold: true, size: 14 },
      alignment: { horizontal: "center" },
    });

    // Period
    ws.mergeCells("A2:F2");
    Object.assign(ws.getCell("A2"), {
      value: `Period: ${params.from} to ${params.to}`,
      alignment: { horizontal: "center" },
    });

    // Supplier
    ws.mergeCells("A3:F3");
    Object.assign(ws.getCell("A3"), {
      value: `Supplier: ${group.supplier}`,
      font: { italic: true },
      alignment: { horizontal: "center" },
    });

    ws.addRow([]); // empty spacer

    // Column headers
    const headerRow = ws.addRow([
      "DATE",
      "CUSTOMERS CODE - NAME - ADDRESS",
      "PRODUCT",
      "QUANTITY",
      "AMOUNT",
      "INVOICE NO",
    ]);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_COLOR } };
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });
    headerRow.height = 20;

    // Data rows
    group.items.forEach((item) => {
      const customerCell = [item.customer_code, item.customer_name, item.customer_address]
        .filter(Boolean)
        .join(" - ");
      const row = ws.addRow([
        item.sale_date,
        customerCell,
        item.product,
        item.quantity,
        Number(item.amount),
        item.invoice_number || "",
      ]);
      row.getCell(4).alignment = { horizontal: "right" };
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(5).alignment = { horizontal: "right" };
    });

    // Total row
    const totalRow = ws.addRow(["TOTAL", "", "", group.total_quantity, Number(group.total_amount), ""]);
    [1, 4, 5].forEach((col) => {
      totalRow.getCell(col).font = { bold: true };
    });
    totalRow.getCell(4).alignment = { horizontal: "right" };
    totalRow.getCell(5).numFmt = '#,##0.00';
    totalRow.getCell(5).alignment = { horizontal: "right" };
    totalRow.eachCell((cell) => {
      cell.border = { top: { style: "thin" } };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_by_supplier_${group.supplier}_${params.from}_to_${params.to}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reportTypes = [
    { value: "sales", label: "Sales" },
    { value: "by_product", label: "Sales by Product" },
    { value: "by_supplier", label: "Sales by Supplier" },
    { value: "by_customer", label: "Sales by Customer" },
    { value: "by_area", label: "Sales by Area" },
  ];

  return (
    <div className="space-y-6">
      {/* Controls Row */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {reportTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {reportType === "by_supplier" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">-- Select Supplier --</option>
              {(suppliersData?.suppliers || []).map((s) => (
                <option key={s.id} value={s.company}>
                  {s.company}
                </option>
              ))}
            </select>
          </div>
        )}
        <DateFilter
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onSearch={() => setParams({ from, to })}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards — context-aware */}
          {(() => {
            let cards;
            if (reportType === "by_supplier" && selectedSupplier) {
              const group = data.by_supplier?.find((g) => g.supplier === selectedSupplier);
              if (group) {
                const uniqueCustomers = new Set(group.items.map((i) => i.customer_name)).size;
                cards = [
                  { label: "Line Items", value: group.items.length },
                  { label: "Total Qty Sold", value: Number(group.total_quantity).toLocaleString() },
                  { label: "Total Amount", value: `₱${Number(group.total_amount).toLocaleString()}` },
                  { label: "Unique Customers", value: uniqueCustomers },
                ];
              }
            }
            if (!cards) {
              cards = [
                { label: "Total Sales", value: data.summary?.total_sales },
                { label: "Total Amount", value: `₱${Number(data.summary?.total_amount || 0).toLocaleString()}` },
                { label: "Total Paid", value: `₱${Number(data.summary?.total_paid || 0).toLocaleString()}` },
                { label: "Total Balance", value: `₱${Number(data.summary?.total_balance || 0).toLocaleString()}` },
              ];
            }
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                  <div key={i} className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">{card.value}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ── Sales ── */}
          {reportType === "sales" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Sale No</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice No</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Paid</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Balance</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.sales?.map((sale, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-blue-600">{sale.sale_number}</td>
                        <td className="px-4 py-3 text-gray-600">{sale.invoice_number || "-"}</td>
                        <td className="px-4 py-3 text-gray-800">{sale.customer}</td>
                        <td className="px-4 py-3 text-gray-600">{sale.sale_date}</td>
                        <td className="px-4 py-3 font-medium">₱{Number(sale.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-600">₱{Number(sale.amount_paid).toLocaleString()}</td>
                        <td className="px-4 py-3 text-red-600">₱{Number(sale.balance).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              sale.payment_status === "paid"
                                ? "bg-green-100 text-green-700"
                                : sale.payment_status === "partial"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {sale.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sales by Product ── */}
          {reportType === "by_product" && (
            <>
              {data.by_product?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.by_product}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="product" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, "Amount"]} />
                      <Bar dataKey="total_amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Product Code</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Qty Sold</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.by_product?.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">{row.product_code || "-"}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{row.product}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{Number(row.total_quantity).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">₱{Number(row.total_amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Sales by Supplier ── */}
          {reportType === "by_supplier" && (
            <div className="space-y-4">
              {!selectedSupplier ? (
                <div className="text-center py-16 text-gray-400">
                  Select a supplier above to view records
                </div>
              ) : (() => {
                const group = data.by_supplier?.find((g) => g.supplier === selectedSupplier);
                if (!group) return (
                  <p className="text-center py-12 text-gray-400">No records found for this supplier in the selected period</p>
                );
                return (
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">{group.supplier}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {group.items.length} item(s) &nbsp;·&nbsp; Total:{" "}
                          <span className="font-semibold text-blue-600">
                            ₱{Number(group.total_amount).toLocaleString()}
                          </span>
                        </span>
                        <button
                          onClick={() => exportSupplierReport(group)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Download size={13} />
                          Export XLS
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-2 font-semibold text-gray-600">Date</th>
                            <th className="text-left px-4 py-2 font-semibold text-gray-600">Customer Code</th>
                            <th className="text-left px-4 py-2 font-semibold text-gray-600">Customer Name</th>
                            <th className="text-left px-4 py-2 font-semibold text-gray-600">Address</th>
                            <th className="text-left px-4 py-2 font-semibold text-gray-600">Product</th>
                            <th className="text-right px-4 py-2 font-semibold text-gray-600">Qty</th>
                            <th className="text-right px-4 py-2 font-semibold text-gray-600">Amount</th>
                            <th className="text-left px-4 py-2 font-semibold text-gray-600">Invoice No.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.items.map((item, ii) => (
                            <tr key={ii} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{item.sale_date}</td>
                              <td className="px-4 py-2 text-gray-500">{item.customer_code || "-"}</td>
                              <td className="px-4 py-2 font-medium text-gray-800">{item.customer_name}</td>
                              <td className="px-4 py-2 text-gray-500 text-xs">{item.customer_address || "-"}</td>
                              <td className="px-4 py-2 text-gray-800">{item.product}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{item.quantity.toLocaleString()}</td>
                              <td className="px-4 py-2 text-right font-medium text-blue-600">₱{Number(item.amount).toLocaleString()}</td>
                              <td className="px-4 py-2 text-gray-600">{item.invoice_number || "-"}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-semibold">
                            <td colSpan={5} className="px-4 py-2 text-right text-gray-600 text-xs uppercase tracking-wide">Subtotal</td>
                            <td className="px-4 py-2 text-right text-gray-700">{group.total_quantity.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right text-blue-600">₱{Number(group.total_amount).toLocaleString()}</td>
                            <td />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Sales by Customer ── */}
          {reportType === "by_customer" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer Code</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">No. of Sales</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Amount</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Paid</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.by_customer?.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{row.customer_code || "-"}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.customer}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.total_sales}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">₱{Number(row.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-600">₱{Number(row.total_paid).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600">₱{Number(row.balance).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sales by Area ── */}
          {reportType === "by_area" && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Area</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">No. of Sales</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Amount</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Paid</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.by_area?.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.area}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.total_sales}</td>
                        <td className="px-4 py-3 text-right font-medium text-blue-600">₱{Number(row.total_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-600">₱{Number(row.total_paid).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600">₱{Number(row.balance).toLocaleString()}</td>
                      </tr>
                    ))}
                    {!data.by_area?.length && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">No data for selected period</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

// Inventory Report Tab
const InventoryReportTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["report-inventory"],
    queryFn: async () => {
      const response = await api.get("/reports/inventory");
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Low Stock Alert */}
          {data?.low_stock?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">
                ⚠️ Low Stock Products
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {data.low_stock.map((p, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-3 border border-red-100"
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {p.brand_name}
                    </p>
                    <p className="text-xs text-gray-500">{p.product_code}</p>
                    <p className="text-red-600 font-bold mt-1">
                      {p.total_stock} left
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Product Code
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Brand Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Supplier
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Total Stock
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Min Stock
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Batches
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.products?.map((product, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {product.product_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {product.brand_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.supplier || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold ${product.is_low_stock ? "text-red-600" : "text-green-600"}`}
                      >
                        {product.total_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.maintaining_stock}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          product.is_low_stock
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.is_low_stock ? "Low Stock" : "OK"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.batches?.length || 0} batch(es)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      )}
    </div>
  );
};

// Expiry Report Tab
const ExpiryReportTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["report-expiry"],
    queryFn: async () => {
      const response = await api.get("/reports/expiry");
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {data?.summary?.expired_count || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Expired</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {data?.summary?.expiring_urgent_count || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Expiring in 7 days</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {data?.summary?.expiring_soon_count || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Expiring in 30 days</p>
            </div>
          </div>

          {/* Expired */}
          {data?.expired?.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                <h4 className="text-sm font-semibold text-red-700">
                  🚨 Expired Batches
                </h4>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Lot Number
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Expiry Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Remaining Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.expired.map((batch, i) => (
                    <tr key={i} className="bg-red-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {batch.brand_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {batch.lot_number}
                      </td>
                      <td className="px-4 py-3 text-red-600">
                        {batch.expiry_date}
                      </td>
                      <td className="px-4 py-3 text-red-600 font-bold">
                        {batch.remaining_quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}

          {/* Expiring Soon */}
          {data?.expiring_soon?.length > 0 && (
            <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden">
              <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-200">
                <h4 className="text-sm font-semibold text-yellow-700">
                  ⚠️ Expiring Soon (30 days)
                </h4>
              </div>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Lot Number
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Expiry Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Days Left
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">
                      Remaining Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.expiring_soon.map((batch, i) => (
                    <tr key={i} className="bg-yellow-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {batch.brand_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {batch.lot_number}
                      </td>
                      <td className="px-4 py-3 text-yellow-600">
                        {batch.expiry_date}
                      </td>
                      <td className="px-4 py-3 text-yellow-600 font-bold">
                        {batch.days_until_expiry}d
                      </td>
                      <td className="px-4 py-3">{batch.remaining_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}

          {data?.expired?.length === 0 && data?.expiring_soon?.length === 0 && (
            <div className="text-center py-12">
              <Clock size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400">No expiring or expired batches</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Customer Report Tab
const CustomerReportTab = () => {
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [params, setParams] = useState({ from, to });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["report-customers", params],
    queryFn: async () => {
      const response = await api.get("/reports/customers", { params });
      return response.data;
    },
  });

  const filtered = (data?.by_customer || []).filter(
    (c) => !search || c.customer?.toLowerCase().includes(search.toLowerCase()),
  );

  const exportCustomerReport = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Customer Report");

    const HEADER_COLOR = "1F4E79";
    const WHITE = "FFFFFFFF";

    ws.columns = [
      { width: 36 },
      { width: 22 },
      { width: 20 },
      { width: 20 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
    ];

    ws.mergeCells("A1:H1");
    Object.assign(ws.getCell("A1"), {
      value: "CUSTOMER REPORT",
      font: { bold: true, size: 14 },
      alignment: { horizontal: "center" },
    });

    ws.mergeCells("A2:H2");
    Object.assign(ws.getCell("A2"), {
      value: `Period: ${params.from} to ${params.to}`,
      alignment: { horizontal: "center" },
    });

    ws.addRow([]);

    const headerRow = ws.addRow([
      "CUSTOMER",
      "SPECIALIZATION",
      "CITY",
      "PROVINCE",
      "NO. OF SALES",
      "TOTAL AMOUNT",
      "TOTAL PAID",
      "BALANCE",
    ]);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_COLOR } };
      cell.font = { bold: true, color: { argb: WHITE } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, bottom: { style: "thin" },
        left: { style: "thin" }, right: { style: "thin" },
      };
    });
    headerRow.height = 20;

    filtered.forEach((c) => {
      const row = ws.addRow([
        c.customer,
        c.specialization || "",
        c.city || "",
        c.province || "",
        c.total_sales,
        Number(c.total_amount),
        Number(c.total_paid),
        Number(c.balance),
      ]);
      [6, 7, 8].forEach((col) => {
        row.getCell(col).numFmt = '#,##0.00';
        row.getCell(col).alignment = { horizontal: "right" };
      });
      row.getCell(5).alignment = { horizontal: "right" };
    });

    // Totals row
    const totalAmount = filtered.reduce((s, c) => s + Number(c.total_amount), 0);
    const totalPaid   = filtered.reduce((s, c) => s + Number(c.total_paid), 0);
    const totalBal    = filtered.reduce((s, c) => s + Number(c.balance), 0);
    const totalRow = ws.addRow(["TOTAL", "", "", "", filtered.length, totalAmount, totalPaid, totalBal]);
    [1, 5, 6, 7, 8].forEach((col) => { totalRow.getCell(col).font = { bold: true }; });
    [6, 7, 8].forEach((col) => {
      totalRow.getCell(col).numFmt = '#,##0.00';
      totalRow.getCell(col).alignment = { horizontal: "right" };
    });
    totalRow.getCell(5).alignment = { horizontal: "right" };
    totalRow.eachCell((cell) => { cell.border = { top: { style: "thin" } }; });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer_report_${params.from}_to_${params.to}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <DateFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onSearch={() => setParams({ from, to })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Customers", value: filtered.length },
              { label: "Total Amount", value: `₱${filtered.reduce((s, c) => s + Number(c.total_amount), 0).toLocaleString()}` },
              { label: "Total Paid",   value: `₱${filtered.reduce((s, c) => s + Number(c.total_paid),   0).toLocaleString()}` },
              { label: "Total Balance",value: `₱${filtered.reduce((s, c) => s + Number(c.balance),       0).toLocaleString()}` },
            ].map((card, i) => (
              <div key={i} className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-blue-600 mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Search + Export */}
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
            <button
              onClick={exportCustomerReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={14} />
              Export XLS
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Specialization</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">City</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">No. of Sales</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Amount</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Paid</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length > 0 ? filtered.map((customer, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{customer.customer}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.specialization || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{customer.city || "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{customer.total_sales}</td>
                      <td className="px-4 py-3 text-right font-medium text-blue-600">₱{Number(customer.total_amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-600">₱{Number(customer.total_paid).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-red-600">₱{Number(customer.balance).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        {search ? "No customers match your search" : "No data for selected period"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

// PO Report Tab
const POReportTab = () => {
  const [from, setFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [params, setParams] = useState({ from, to });

  const { data, isLoading } = useQuery({
    queryKey: ["report-po", params],
    queryFn: async () => {
      const response = await api.get("/reports/purchase-orders", { params });
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <DateFilter
        from={from}
        to={to}
        onFromChange={setFrom}
        onToChange={setTo}
        onSearch={() => setParams({ from, to })}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: data.summary?.total_orders },
              {
                label: "Total Amount",
                value: `₱${Number(data.summary?.total_amount || 0).toLocaleString()}`,
              },
              { label: "Received", value: data.summary?.received_count },
              { label: "Pending", value: data.summary?.ordered_count },
            ].map((card, i) => (
              <div key={i} className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    PO Number
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Supplier
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Order Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Total Amount
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders?.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-blue-600">
                      {order.po_number}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {order.supplier}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {order.order_date}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ₱{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.status === "received"
                            ? "bg-green-100 text-green-700"
                            : order.status === "ordered"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "partial"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      ) : null}
    </div>
  );
};

// Payments Report Tab
const PER_PAGE = 15;

const PaymentsReportTab = () => {
  const [aging, setAging] = useState("");
  const [paymentView, setPaymentView] = useState("unpaid"); // "unpaid" | "paid"
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [aging, paymentView, search]);

  const { data, isLoading } = useQuery({
    queryKey: ["report-payments", aging, paymentView],
    queryFn: async () => {
      const params = paymentView === "paid"
        ? { status: "paid" }
        : aging ? { aging } : {};
      const response = await api.get("/reports/payments", { params });
      return response.data;
    },
  });

  const agingFilters = [
    { value: "", label: "All Unpaid" },
    { value: "15", label: "> 15 Days" },
    { value: "30", label: "> 1 Month" },
    { value: "60", label: "> 2 Months" },
  ];

  const switchView = (view) => {
    setPaymentView(view);
    if (view === "paid") setAging("");
  };

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
        />
        {/* View toggle: Unpaid / Paid */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => switchView("unpaid")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              paymentView === "unpaid"
                ? "bg-orange-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Unpaid
          </button>
          <button
            onClick={() => switchView("paid")}
            className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
              paymentView === "paid"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Paid
          </button>
        </div>
        {/* Aging filters — only when viewing unpaid */}
        {paymentView === "unpaid" && (
          <div className="flex flex-wrap gap-2">
            {agingFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setAging(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  aging === f.value
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(paymentView === "paid" ? [
              { label: "Paid Sales",        value: data.summary?.total_paid,                                            bg: "bg-green-50",  color: "text-green-600" },
              { label: "Total Collected",   value: `₱${Number(data.summary?.total_paid_amount || 0).toLocaleString()}`, bg: "bg-green-50",  color: "text-green-700" },
              { label: "Unpaid Sales",      value: data.summary?.total_unpaid,                                          bg: "bg-orange-50", color: "text-orange-600" },
              { label: "Total Balance Due", value: `₱${Number(data.summary?.total_balance || 0).toLocaleString()}`,     bg: "bg-red-50",    color: "text-red-600" },
            ] : [
              { label: "Unpaid Sales",      value: data.summary?.total_unpaid,                                          bg: "bg-orange-50",  color: "text-orange-600" },
              { label: "Total Balance Due", value: `₱${Number(data.summary?.total_balance || 0).toLocaleString()}`,     bg: "bg-red-50",     color: "text-red-600" },
              { label: "> 15 Days",         value: data.summary?.over_15_days,                                          bg: "bg-yellow-50",  color: "text-yellow-600" },
              { label: "> 30 Days",         value: data.summary?.over_30_days,                                          bg: "bg-red-50",     color: "text-red-700" },
            ]).map((card, i) => (
              <div key={i} className={`${card.bg} rounded-xl p-4`}>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Sales Table */}
          {(() => {
            const filtered = (data.sales || []).filter((s) =>
              !search || s.customer?.toLowerCase().includes(search.toLowerCase())
            );
            const totalPages = Math.ceil(filtered.length / PER_PAGE);
            const safePage = Math.min(page, totalPages || 1);
            const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
            const paginationObj = filtered.length > 0 ? {
              current_page: safePage,
              last_page: totalPages,
              from: (safePage - 1) * PER_PAGE + 1,
              to: Math.min(safePage * PER_PAGE, filtered.length),
              total: filtered.length,
            } : null;

            return filtered.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Sale No
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Invoice
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Customer
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Sale Date
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Delivery Date
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        {paymentView === "paid" ? "Days Since Delivery" : "Days Overdue"}
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Total
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Paid
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Balance
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map((sale, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-blue-600">
                          {sale.sale_number}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {sale.invoice_number || "-"}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {sale.customer}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {sale.sale_date}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {sale.delivery_date || <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-bold ${
                              sale.days_overdue > 60
                                ? "text-red-600"
                                : sale.days_overdue > 30
                                  ? "text-orange-600"
                                  : sale.days_overdue > 15
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                            }`}
                          >
                            {sale.days_overdue}d
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">
                          ₱{Number(sale.total_amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-green-600">
                          ₱{Number(sale.amount_paid).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-bold text-red-600">
                          ₱{Number(sale.balance).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              sale.payment_status === "partial"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {sale.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={paginationObj} onPageChange={setPage} />
            </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400">
                  {search ? "No results match your search" : paymentView === "paid" ? "No paid sales found" : "No unpaid sales found"}
                </p>
              </div>
            );
          })()}
        </>
      ) : null}
    </div>
  );
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "sales" && <SalesReportTab />}
        {activeTab === "inventory" && <InventoryReportTab />}
        {activeTab === "purchase-orders" && <POReportTab />}
        {activeTab === "customers" && <CustomerReportTab />}
        {activeTab === "expiry" && <ExpiryReportTab />}
        {activeTab === "payments" && <PaymentsReportTab />}
      </div>
    </div>
  );
}
