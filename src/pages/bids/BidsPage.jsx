import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  Plus, Search, Edit, Trash2, Eye, Printer, Gavel,
  LayoutGrid, List, X, AlertTriangle, Clock, Upload, FileImage, Paperclip,
} from "lucide-react";
import Pagination from "../../components/ui/Pagination";

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (v) => Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

const deadlineStatus = (dateStr) => {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0)  return "overdue";
  if (diff <= 3) return "soon";
  return "ok";
};

const STATUS_META = {
  new:         { label: "New",         color: "bg-gray-100 text-gray-600" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  submitted:   { label: "Submitted",   color: "bg-blue-100 text-blue-700" },
  won:         { label: "Won",         color: "bg-green-100 text-green-700" },
  lose:        { label: "Lose",        color: "bg-red-100 text-red-700" },
  no_feedback: { label: "No Feedback", color: "bg-orange-100 text-orange-700" },
  cancelled:   { label: "Cancelled",   color: "bg-gray-200 text-gray-500" },
  rejected:    { label: "Rejected",    color: "bg-red-200 text-red-800" },
};

const KANBAN_COLS = [
  { key: "new",         label: "New",         statuses: ["new"],                                          color: "bg-gray-50 border-gray-300" },
  { key: "in_progress", label: "In Progress",  statuses: ["in_progress"],                                  color: "bg-yellow-50 border-yellow-200" },
  { key: "submitted",   label: "Submitted",     statuses: ["submitted"],                                    color: "bg-blue-50 border-blue-200" },
  { key: "won",         label: "Won",           statuses: ["won"],                                          color: "bg-green-50 border-green-200" },
  { key: "closed",      label: "Closed",        statuses: ["lose", "no_feedback", "cancelled", "rejected"], color: "bg-red-50 border-red-200" },
];

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? { label: status, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${m.color}`}>
      {m.label}
    </span>
  );
}

function DeadlineChip({ dateStr }) {
  const ds = deadlineStatus(dateStr);
  if (!ds || ds === "ok") return <span className="text-gray-600 text-xs">{dateStr ?? "—"}</span>;
  if (ds === "overdue")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
        <AlertTriangle size={11} /> {dateStr}
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-yellow-600">
      <Clock size={11} /> {dateStr}
    </span>
  );
}

// ─── print ──────────────────────────────────────────────────────────────────

function printBid(bid) {
  const rows = bid.items.map((item) => `
    <tr>
      <td>${item.item_description}</td>
      <td class="center">${item.unit ?? ""}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">₱${fmt(item.abc_budget)}</td>
      <td class="right">₱${fmt(item.total_abc_amount)}</td>
      <td class="right">₱${fmt(item.bid_price)}</td>
      <td class="right">₱${fmt(item.total_bid_amount)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head>
  <meta charset="utf-8">
  <title>Bid Summary — ${bid.bid_number}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:28px 36px}
    .header{display:flex;align-items:center;gap:16px;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:20px}
    .header img{height:60px}
    .header-text h1{font-size:15px;font-weight:bold;letter-spacing:1px}
    .header-text p{font-size:10px;color:#555;margin-top:2px}
    .section{font-size:11px;font-weight:bold;letter-spacing:.5px;margin:18px 0 6px;text-transform:uppercase}
    .dt{width:100%;border-collapse:collapse}
    .dt td{border:1px solid #999;padding:4px 8px}
    .dt td.lbl{font-weight:bold;width:28%;background:#f5f5f5}
    .ot{width:100%;border-collapse:collapse;margin-top:4px}
    .ot th{border:1px solid #000;padding:5px 8px;background:#e8e8e8;font-size:10px;font-weight:bold}
    .ot td{border:1px solid #999;padding:4px 8px;font-size:10px}
    .center{text-align:center}.right{text-align:right}
    .ot tr.total td{font-weight:bold;background:#f5f5f5}
    .sigs{display:flex;gap:40px;margin-top:30px}
    .sig{flex:1;border-top:1px solid #000;padding-top:4px;font-size:10px;text-align:center}
    @media print{body{padding:16px 24px}@page{margin:10mm;size:A4 landscape}}
  </style></head><body>
  <div class="header">
    <img src="${window.location.origin}/logo.png" onerror="this.style.display='none'">
    <div class="header-text">
      <h1>VAXSHOT CORPORATION</h1>
      <p>Bid Summary Sheet</p>
    </div>
    <div style="margin-left:auto;text-align:right;font-size:10px;color:#555">
      <div><b>${bid.bid_number}</b></div>
      <div>Printed: ${new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})}</div>
    </div>
  </div>

  <div class="section">Bid Information</div>
  <table class="dt">
    <tr><td class="lbl">Project Title</td><td colspan="3">${bid.project_title}</td></tr>
    <tr>
      <td class="lbl">Procuring Entity</td><td>${bid.agency}</td>
      <td class="lbl">Bid Ref No.</td><td>${bid.bid_reference_no ?? ""}</td>
    </tr>
    <tr><td class="lbl">Address</td><td colspan="3">${bid.address ?? ""}</td></tr>
    <tr>
      <td class="lbl">Procurement Ref No.</td><td>${bid.procurement_reference_no ?? ""}</td>
      <td class="lbl">Status</td><td>${STATUS_META[bid.status]?.label ?? bid.status}</td>
    </tr>
    <tr>
      <td class="lbl">Contact Person</td><td>${bid.contact_person ?? ""}</td>
      <td class="lbl">Contact No.</td><td>${bid.contact_no ?? ""}</td>
    </tr>
    <tr>
      <td class="lbl">Bid Posted Date</td><td>${bid.bid_posted_date_fmt ?? ""}</td>
      <td class="lbl">Pre-bid Conference Date/Time</td><td>${bid.pre_bid_date_fmt ?? ""}</td>
    </tr>
    <tr>
      <td class="lbl">Bid Deadline Date/Time</td><td>${bid.bid_deadline_fmt ?? ""}</td>
    </tr>
    <tr>
      <td class="lbl">Bid Submitted Date/Time</td><td>${bid.bid_submission_date_fmt ?? ""}</td>
      <td class="lbl">Bid Opening Date/Time</td><td>${bid.bid_opening_date_fmt ?? ""}</td>
    </tr>
    <tr>
      <td class="lbl">Delivery Date</td><td>${bid.delivery_date_fmt ?? ""}</td>
      <td class="lbl">Notes</td><td>${bid.notes ?? ""}</td>
    </tr>
  </table>

  <div class="section">Line Items</div>
  <table class="ot">
    <thead><tr>
      <th style="text-align:left;width:30%">Item Description</th>
      <th>Unit</th><th>Qty</th>
      <th>ABC Budget</th><th>Total ABC Amount</th>
      <th>Bid Price</th><th>Total Bid Amount</th>
    </tr></thead>
    <tbody>
      ${rows}
      <tr class="total">
        <td colspan="4" style="text-align:right;padding-right:12px">Total ABC Amount:</td>
        <td class="right">₱${fmt(bid.total_abc_amount)}</td>
        <td style="text-align:right;padding-right:12px">Grand Total (Bid):</td>
        <td class="right">₱${fmt(bid.grand_total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="sigs">
    <div class="sig">Prepared By</div>
    <div class="sig">Noted By</div>
    <div class="sig">Approved By</div>
  </div>

  <script>window.onload=()=>{window.print()}<\/script>
</body></html>`;

  const win = window.open("", "_blank", "width=1024,height=950");
  win.document.write(html);
  win.document.close();
}

// ─── empty line item ─────────────────────────────────────────────────────────

const emptyItem = () => ({ item_description: "", quantity: 1, unit: "", abc_budget: "", bid_price: "" });

// ─── ProductAutocomplete ─────────────────────────────────────────────────────
// Lets users search the product catalog and fills item_description on select.
// Falls back to free-text if no product matches (e.g. when editing existing items).

function ProductAutocomplete({ products, value, onChange }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = products.filter((p) =>
    p.brand_name.toLowerCase().includes((open ? query : value).toLowerCase())
  );

  const handleFocus = () => {
    setQuery("");
    setOpen(true);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (p) => {
    onChange(p.brand_name);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <input
        value={open ? query : value}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="Search or type product..."
        className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((p) => (
            <li
              key={p.id}
              onMouseDown={() => handleSelect(p)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 ${
                value === p.brand_name ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700"
              }`}
            >
              {p.brand_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── ImportModal ─────────────────────────────────────────────────────────────

function ImportModal({ onClose, onExtracted }) {
  const fileRef   = useRef(null);
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drag,    setDrag]    = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/bids/extract-from-file", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onExtracted(res.data.extracted ?? {}, file);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Extraction failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Import Bid from Document</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a PhilGEPS Bid Notice image or PDF</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
              drag ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {preview ? (
              <img src={preview} alt="preview" className="max-h-48 rounded-lg object-contain shadow" />
            ) : file ? (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <FileImage size={40} className="text-blue-500" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-gray-400" />
                <p className="text-sm text-gray-600 text-center">
                  Drag & drop or <span className="text-blue-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF, PDF — max 20 MB</p>
              </>
            )}
          </div>

          {file && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <FileImage size={14} className="text-blue-500 shrink-0" />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                className="ml-auto text-gray-400 hover:text-red-500 shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400">
            AI will read the document and pre-fill the bid form. You can review and edit all fields before saving.
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleExtract} disabled={!file || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Reading document...
              </>
            ) : (
              <>
                <Upload size={14} /> Extract & Fill Form
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BidModal (add/edit) ─────────────────────────────────────────────────────

function BidModal({ bid, onClose, onSave, isPending, onUploadAttachment, onDeleteAttachment, isUploadingAttachment, isDeletingAttachment }) {
  const attachFileRef = useRef(null);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [form, setForm] = useState({
    project_title:            bid?.project_title            ?? "",
    agency:                   bid?.agency                   ?? "",
    address:                  bid?.address                  ?? "",
    bid_reference_no:         bid?.bid_reference_no         ?? "",
    procurement_reference_no: bid?.procurement_reference_no ?? "",
    contact_person:           bid?.contact_person           ?? "",
    contact_no:               bid?.contact_no               ?? "",
    bid_posted_date:          bid?.bid_posted_date          ?? "",
    pre_bid_date:             bid?.pre_bid_date             ?? "",
    bid_deadline:             bid?.bid_deadline             ?? "",
    bid_submission_date:      bid?.bid_submission_date      ?? "",
    bid_opening_date:         bid?.bid_opening_date         ?? "",
    delivery_date:            bid?.delivery_date            ?? "",
    status:                   bid?.status                   ?? "new",
    notes:                    bid?.notes                    ?? "",
  });

  const [items, setItems] = useState(
    bid?.items?.length
      ? bid.items.map((i) => ({
          item_description: i.item_description,
          quantity:         i.quantity,
          unit:             i.unit ?? "",
          abc_budget:       i.abc_budget,
          bid_price:        i.bid_price,
        }))
      : [emptyItem()]
  );

  const { data: productsData } = useQuery({
    queryKey: ["products-for-bid"],
    queryFn: async () => {
      const res = await api.get("/products", { params: { status: "active", per_page: 500 } });
      return res.data;
    },
  });
  const products = productsData?.products ?? [];

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setItem = (idx, k, v) =>
    setItems((p) => p.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  const addItem    = () => setItems((p) => [...p, emptyItem()]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const grandTotal = items.reduce(
    (s, it) => s + (Number(it.bid_price) || 0) * (Number(it.quantity) || 0), 0
  );
  const totalAbcAmount = items.reduce(
    (s, it) => s + (Number(it.abc_budget) || 0) * (Number(it.quantity) || 0), 0
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = (v) => (v === "" || v == null) ? null : v;
    onSave({
      project_title:            form.project_title,
      agency:                   form.agency,
      status:                   form.status,
      address:                  n(form.address),
      bid_reference_no:         n(form.bid_reference_no),
      procurement_reference_no: n(form.procurement_reference_no),
      contact_person:           n(form.contact_person),
      contact_no:               n(form.contact_no),
      notes:                    n(form.notes),
      bid_posted_date:          n(form.bid_posted_date),
      pre_bid_date:             n(form.pre_bid_date),
      bid_deadline:             n(form.bid_deadline),
      bid_submission_date:      n(form.bid_submission_date),
      bid_opening_date:         n(form.bid_opening_date),
      delivery_date:            n(form.delivery_date),
      items: items
        .filter((it) => it.item_description || Number(it.abc_budget) || Number(it.bid_price))
        .map((it) => ({
          item_description: n(it.item_description),
          quantity:         Number(it.quantity) || 1,
          unit:             n(it.unit),
          abc_budget:       Number(it.abc_budget) || 0,
          bid_price:        Number(it.bid_price) || 0,
        })),
    }, pendingFiles);
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {bid ? "Edit Bid" : "New Bid"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Bid Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bid Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Project Title *</label>
                <input required value={form.project_title} onChange={(e) => set("project_title", e.target.value)}
                  placeholder="e.g. Supply of Vaccines for Q3" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Procuring Entity *</label>
                <input required value={form.agency} onChange={(e) => set("agency", e.target.value)}
                  placeholder="e.g. Municipality of San Miguel, Bulacan" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bid Reference No.</label>
                <input value={form.bid_reference_no} onChange={(e) => set("bid_reference_no", e.target.value)}
                  placeholder="e.g. BID-2026-001" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Procurement Reference No.</label>
                <input value={form.procurement_reference_no} onChange={(e) => set("procurement_reference_no", e.target.value)}
                  className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)}
                  placeholder="Agency address" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
                <input value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact No.</label>
                <input value={form.contact_no} onChange={(e) => set("contact_no", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bid Posted Date</label>
                <input type="date" value={form.bid_posted_date} onChange={(e) => set("bid_posted_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pre-bid Conference Date/Time</label>
                <input type="datetime-local" value={form.pre_bid_date} onChange={(e) => set("pre_bid_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bid Deadline Date/Time</label>
                <input type="datetime-local" value={form.bid_deadline} onChange={(e) => set("bid_deadline", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bid Submitted Date/Time</label>
                <input type="datetime-local" value={form.bid_submission_date} onChange={(e) => set("bid_submission_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bid Opening Date/Time</label>
                <input type="datetime-local" value={form.bid_opening_date} onChange={(e) => set("bid_opening_date", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Date</label>
                <input type="date" value={form.delivery_date} onChange={(e) => set("delivery_date", e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes / Remarks</label>
                <textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  className={inputCls} placeholder="Optional remarks..." />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Line Items</p>
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "820px" }}>
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Item Description</th>
                    <th className="px-3 py-2 text-center" style={{ width: 88 }}>Qty</th>
                    <th className="px-3 py-2 text-center" style={{ width: 72 }}>Unit</th>
                    <th className="px-3 py-2 text-right" style={{ width: 110 }}>ABC Budget</th>
                    <th className="px-3 py-2 text-right" style={{ width: 130 }}>Total ABC Amount</th>
                    <th className="px-3 py-2 text-right" style={{ width: 110 }}>Bid Price</th>
                    <th className="px-3 py-2 text-right" style={{ width: 130 }}>Total Bid Amount</th>
                    <th className="px-3 py-2" style={{ width: 28 }} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const qty          = Number(item.quantity) || 0;
                    const itemAbcTotal = (Number(item.abc_budget) || 0) * qty;
                    const itemBidTotal = (Number(item.bid_price)  || 0) * qty;
                    return (
                      <tr key={idx}>
                        <td className="px-2 py-1.5">
                          <ProductAutocomplete
                            products={products}
                            value={item.item_description}
                            onChange={(v) => setItem(idx, "item_description", v)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            value={item.quantity}
                            onChange={(e) => setItem(idx, "quantity", e.target.value.replace(/\D/g, ""))}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.unit}
                            onChange={(e) => setItem(idx, "unit", e.target.value)}
                            placeholder="pcs"
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={item.abc_budget}
                            onChange={(e) => setItem(idx, "abc_budget", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-3 py-1.5 text-right text-orange-600 text-sm font-medium">
                          ₱{fmt(itemAbcTotal)}
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={item.bid_price}
                            onChange={(e) => setItem(idx, "bid_price", e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                        </td>
                        <td className="px-3 py-1.5 text-right text-blue-700 font-medium text-sm">
                          ₱{fmt(itemBidTotal)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {items.length > 1 && (
                            <button type="button" onClick={() => removeItem(idx)}
                              className="text-red-400 hover:text-red-600">
                              <X size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold text-sm">
                    <td colSpan={3} className="px-3 py-2 text-right text-gray-600">Totals:</td>
                    <td className="px-3 py-2 text-right text-gray-400 text-xs">—</td>
                    <td className="px-3 py-2 text-right text-orange-600">₱{fmt(totalAbcAmount)}</td>
                    <td className="px-3 py-2 text-right text-gray-400 text-xs">—</td>
                    <td className="px-3 py-2 text-right text-blue-700">₱{fmt(grandTotal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button type="button" onClick={addItem}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <Plus size={14} /> Add Item
            </button>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Attachments</p>
              <input ref={attachFileRef} type="file" multiple className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (bid?.id) {
                    files.forEach((f) => onUploadAttachment(f));
                  } else {
                    setPendingFiles((prev) => [...prev, ...files]);
                  }
                  e.target.value = "";
                }} />
              <button type="button" onClick={() => attachFileRef.current?.click()}
                disabled={isUploadingAttachment}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50">
                <Paperclip size={12} /> {isUploadingAttachment ? "Uploading..." : "Add File"}
              </button>
            </div>

            {/* Edit mode: existing attachments */}
            {bid?.id && (
              bid?.attachments?.length ? (
                <div className="space-y-1">
                  {bid.attachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <a href={att.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm truncate">
                        <FileImage size={14} className="shrink-0" />
                        <span className="truncate">{att.original_name}</span>
                        <span className="text-gray-400 text-xs shrink-0">{(att.file_size / 1024).toFixed(1)} KB</span>
                      </a>
                      <button type="button" onClick={() => onDeleteAttachment(att.id)} disabled={isDeletingAttachment}
                        className="text-red-400 hover:text-red-600 disabled:opacity-50 ml-3 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400 italic">No attachments yet</p>
            )}

            {/* Add mode: pending files */}
            {!bid?.id && (
              pendingFiles.length ? (
                <div className="space-y-1">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 text-sm text-gray-700 truncate">
                        <FileImage size={14} className="shrink-0" />
                        <span className="truncate">{f.name}</span>
                        <span className="text-gray-400 text-xs shrink-0">{(f.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button type="button"
                        onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 ml-3 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-gray-400 italic">No files selected — will be uploaded after saving</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isPending ? "Saving..." : bid ? "Update Bid" : "Create Bid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ViewModal ───────────────────────────────────────────────────────────────

function ViewModal({ bid, onClose, onEdit, onDelete, onStatusChange, hasPermission, isStatusPending }) {
  const fields = [
    ["Bid No.",              bid.bid_number],
    ["Bid Ref No.",          bid.bid_reference_no],
    ["Procurement Ref No.",  bid.procurement_reference_no],
    ["Project Title",        bid.project_title],
    ["Procuring Entity",     bid.agency],
    ["Address",              bid.address],
    ["Contact Person",       bid.contact_person],
    ["Contact No.",          bid.contact_no],
    ["Bid Posted Date",              bid.bid_posted_date_fmt],
    ["Pre-bid Conference Date/Time",  bid.pre_bid_date_fmt],
    ["Bid Deadline Date/Time",       bid.bid_deadline_fmt],
    ["Bid Submitted Date/Time", bid.bid_submission_date_fmt],
    ["Bid Opening Date/Time",     bid.bid_opening_date_fmt],
    ["Delivery Date",        bid.delivery_date_fmt],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{bid.bid_number}</h2>
            <p className="text-sm text-gray-500">{bid.project_title}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={bid.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2"><X size={20} /></button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
              <p className="text-xs text-orange-600 font-medium uppercase mb-1">Total ABC Amount</p>
              <p className="text-xl font-bold text-orange-700">₱{fmt(bid.total_abc_amount)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-xs text-blue-600 font-medium uppercase mb-1">Grand Total (Bid)</p>
              <p className="text-xl font-bold text-blue-700">₱{fmt(bid.grand_total)}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {fields.map(([label, value]) => value ? (
              <div key={label}>
                <p className="text-xs text-gray-400 font-medium uppercase">{label}</p>
                <p className="text-sm text-gray-800 mt-0.5">{value}</p>
              </div>
            ) : null)}
          </div>

          {/* Notes */}
          {bid.notes && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes / Remarks</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2">{bid.notes}</p>
            </div>
          )}

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Line Items</p>
            <div className="border border-gray-100 rounded-lg overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: "700px" }}>
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Item Description</th>
                    <th className="px-3 py-2 text-center">Unit</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">ABC Budget</th>
                    <th className="px-3 py-2 text-right">Total ABC Amount</th>
                    <th className="px-3 py-2 text-right">Bid Price</th>
                    <th className="px-3 py-2 text-right">Total Bid Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bid.items?.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-800">{item.item_description}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{item.unit ?? "—"}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-600">₱{fmt(item.abc_budget)}</td>
                      <td className="px-3 py-2 text-right font-medium text-orange-600">₱{fmt(item.total_abc_amount)}</td>
                      <td className="px-3 py-2 text-right text-gray-700">₱{fmt(item.bid_price)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-blue-700">₱{fmt(item.total_bid_amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold text-sm">
                    <td colSpan={4} className="px-3 py-2 text-right text-gray-600">Total ABC Amount:</td>
                    <td className="px-3 py-2 text-right text-orange-600">₱{fmt(bid.total_abc_amount)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">Grand Total:</td>
                    <td className="px-3 py-2 text-right text-blue-700">₱{fmt(bid.grand_total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Quick status change */}
          {hasPermission("edit_bids") && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Change Status:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <button key={k} disabled={bid.status === k || isStatusPending}
                    onClick={() => onStatusChange(k)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      bid.status === k
                        ? `${v.color} border-transparent cursor-default`
                        : "border-gray-300 text-gray-600 hover:border-gray-400 disabled:opacity-40"
                    }`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {bid.attachments?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachments</p>
              <div className="space-y-1">
                {bid.attachments.map((att) => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-blue-600 hover:text-blue-800 text-sm">
                    <FileImage size={14} className="shrink-0" />
                    <span className="truncate">{att.original_name}</span>
                    <span className="text-gray-400 text-xs shrink-0">{(att.file_size / 1024).toFixed(1)} KB</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div className="flex gap-2">
            {hasPermission("edit_bids") && (
              <button onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Edit size={14} /> Edit
              </button>
            )}
            {hasPermission("delete_bids") && (
              <button onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
          <button onClick={() => printBid(bid)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── KanbanCard ──────────────────────────────────────────────────────────────

function KanbanCard({ bid, onClick }) {
  const ds = deadlineStatus(bid.bid_deadline);
  const daysLeft = bid.bid_deadline
    ? Math.ceil((new Date(bid.bid_deadline) - new Date()) / 86400000)
    : null;
  return (
    <div onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md cursor-pointer transition-shadow space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-blue-600">{bid.bid_number}</span>
        <StatusBadge status={bid.status} />
      </div>
      <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{bid.project_title}</p>
      <p className="text-xs text-gray-500">{bid.agency}</p>
      {bid.bid_deadline && (
        <div className={`flex items-center gap-1 text-xs rounded px-1.5 py-0.5 w-fit ${
          ds === "overdue" ? "bg-red-50 text-red-600" :
          ds === "soon"    ? "bg-yellow-50 text-yellow-700" :
          "bg-gray-50 text-gray-500"
        }`}>
          {ds === "overdue" && <AlertTriangle size={10} />}
          {ds === "soon"    && <Clock size={10} />}
          Deadline: {bid.bid_deadline_fmt ?? bid.bid_deadline}
        </div>
      )}
      {daysLeft !== null && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          daysLeft < 0  ? "text-red-600" :
          daysLeft === 0 ? "text-red-500" :
          daysLeft <= 3  ? "text-orange-600" :
          daysLeft <= 7  ? "text-yellow-700" :
          "text-gray-500"
        }`}>
          <AlertTriangle size={11} />
          {daysLeft < 0
            ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} overdue`
            : daysLeft === 0 ? "Due today!"
            : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
        </div>
      )}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
        <span className="text-orange-600 font-medium">ABC: ₱{fmt(bid.total_abc_amount)}</span>
        <span className="font-bold text-blue-700">₱{fmt(bid.grand_total)}</span>
      </div>
    </div>
  );
}

// ─── SummaryCard ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, sub }) {
  const colors = {
    gray:   { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700" },
    blue:   { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-700" },
    green:  { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  };
  const c = colors[color] ?? colors.gray;
  return (
    <div className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
      <p className={`text-sm font-medium ${c.text} mb-1`}>{label}</p>
      {sub && <p className="text-xs text-gray-400 mb-2">{sub}</p>}
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function BidsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();

  const [view,         setView]         = useState("kanban");
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page,         setPage]         = useState(1);
  const [showModal,    setShowModal]    = useState(false);
  const [selected,     setSelected]     = useState(null);
  const [editMode,     setEditMode]     = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);
  const [showImport,        setShowImport]        = useState(false);
  const [prefillData,       setPrefillData]       = useState(null);
  const [pendingImportFile, setPendingImportFile] = useState(null);
  const pendingNewFilesRef = useRef([]);

  const params = useMemo(() => {
    const p = { page };
    if (search)       p.search = search;
    if (statusFilter) p.status = statusFilter;
    return p;
  }, [search, statusFilter, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["bids", params],
    queryFn: async () => {
      const res = await api.get("/bids", { params });
      return res.data;
    },
  });

  const bids       = data?.bids      ?? [];
  const pagination = data?.pagination ?? null;
  const summary    = data?.summary   ?? {};

  // Kanban uses a separate "all" fetch (no pagination)
  const { data: allData } = useQuery({
    queryKey: ["bids-all", search, statusFilter],
    queryFn: async () => {
      const res = await api.get("/bids", {
        params: { per_page: 999, search: search || undefined, status: statusFilter || undefined },
      });
      return res.data;
    },
    enabled: view === "kanban",
  });
  const allBids = allData?.bids ?? [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["bids"] });
    qc.invalidateQueries({ queryKey: ["bids-all"] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/bids", data),
    onSuccess: async (res) => {
      invalidate();
      setShowModal(false);
      setPrefillData(null);
      toast.success("Bid created");
      const newBid = res.data.bid;
      const allFiles = [...pendingNewFilesRef.current];
      if (pendingImportFile) allFiles.push(pendingImportFile);
      pendingNewFilesRef.current = [];
      setPendingImportFile(null);
      for (const file of allFiles) {
        const fd = new FormData();
        fd.append("file", file);
        try {
          await api.post(`/bids/${newBid.id}/attachments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        } catch {}
      }
      if (allFiles.length > 0) {
        toast.success(`${allFiles.length} file${allFiles.length > 1 ? "s" : ""} saved as attachment${allFiles.length > 1 ? "s" : ""}`);
      }
    },
    onError: () => toast.error("Failed to create bid"),
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ bidId, file }) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post(`/bids/${bidId}/attachments`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: (_, vars) => {
      api.get(`/bids/${vars.bidId}`).then((r) => setSelected(r.data.bid));
      toast.success("Attachment uploaded");
    },
    onError: () => toast.error("Failed to upload attachment"),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: ({ bidId, attachmentId }) => api.delete(`/bids/${bidId}/attachments/${attachmentId}`),
    onSuccess: (_, vars) => {
      api.get(`/bids/${vars.bidId}`).then((r) => setSelected(r.data.bid));
      toast.success("Attachment deleted");
    },
    onError: () => toast.error("Failed to delete attachment"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/bids/${id}`, data),
    onSuccess: (res) => {
      invalidate();
      setSelected(res.data.bid);
      setEditMode(false);
      toast.success("Bid updated");
    },
    onError: () => toast.error("Failed to update bid"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/bids/${id}/status`, { status }),
    onSuccess: (res) => { invalidate(); setSelected(res.data.bid); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/bids/${id}`),
    onSuccess: () => { invalidate(); setDeleteId(null); setSelected(null); toast.success("Bid deleted"); },
    onError: () => toast.error("Failed to delete bid"),
  });

  const openView = (bid) => {
    setSelected(bid);
    setEditMode(false);
    api.get(`/bids/${bid.id}`).then((r) => setSelected(r.data.bid)).catch(() => {});
  };

  const rowBg = (bid) => {
    const ds = deadlineStatus(bid.bid_deadline);
    if (ds === "overdue") return "bg-red-50";
    if (ds === "soon")    return "bg-yellow-50";
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      {hasPermission("create_bids") && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Upload size={15} /> Import from Document
          </button>
          <button
            onClick={() => { setPrefillData(null); setShowModal(true); setSelected(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={16} /> New Bid
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total Bids"    value={summary.total ?? 0}                     color="gray" />
        <SummaryCard label="Active"         value={summary.active ?? 0}                    color="blue"   sub="new + in progress + submitted" />
        <SummaryCard label="Won"            value={summary.won ?? 0}                       color="green" />
        <SummaryCard label="Pipeline Value" value={`₱${fmt(summary.pipeline_value ?? 0)}`} color="purple" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "kanban" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            <LayoutGrid size={15} /> Kanban
          </button>
          <button onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
            <List size={15} /> List
          </button>
        </div>

        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search bid #, project, agency..."
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* ── Kanban ── */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {KANBAN_COLS.map((col) => {
            const colBids = allBids.filter((b) => col.statuses.includes(b.status));
            return (
              <div key={col.key} className={`rounded-xl border ${col.color} p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                  <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    {colBids.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colBids.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No bids</p>
                  )}
                  {colBids.map((bid) => (
                    <KanbanCard key={bid.id} bid={bid} onClick={() => openView(bid)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List ── */}
      {view === "list" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : bids.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Gavel size={40} className="mb-3 opacity-30" />
                <p className="text-sm">No bids found</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left w-8">#</th>
                    <th className="px-4 py-3 text-left">Bid No.</th>
                    <th className="px-4 py-3 text-left">Project Title</th>
                    <th className="px-4 py-3 text-left">Agency</th>
                    <th className="px-4 py-3 text-left">Bid Deadline Date/Time</th>
                    <th className="px-4 py-3 text-left">Bid Opening</th>
                    <th className="px-4 py-3 text-right">Total ABC Amount</th>
                    <th className="px-4 py-3 text-right">Grand Total</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bids.map((bid, idx) => (
                    <tr key={bid.id} className={`hover:bg-gray-50 transition-colors ${rowBg(bid)}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(pagination?.from ?? 1) + idx}
                      </td>
                      <td className="px-4 py-3 font-medium text-blue-600">{bid.bid_number}</td>
                      <td className="px-4 py-3 text-gray-800 max-w-xs truncate">{bid.project_title}</td>
                      <td className="px-4 py-3 text-gray-600">{bid.agency}</td>
                      <td className="px-4 py-3">
                        <DeadlineChip dateStr={bid.bid_deadline_fmt ?? bid.bid_deadline} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{bid.bid_opening_date_fmt ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-orange-600 font-medium">₱{fmt(bid.total_abc_amount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">₱{fmt(bid.grand_total)}</td>
                      <td className="px-4 py-3"><StatusBadge status={bid.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openView(bid)} title="View"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye size={15} />
                          </button>
                          {hasPermission("edit_bids") && (
                            <button onClick={() => { setSelected(bid); setEditMode(true); }} title="Edit"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit size={15} />
                            </button>
                          )}
                          <button onClick={() => printBid(bid)} title="Print"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Printer size={15} />
                          </button>
                          {hasPermission("delete_bids") && (
                            <button onClick={() => setDeleteId(bid.id)} title="Delete"
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {pagination && <Pagination pagination={pagination} onPageChange={setPage} />}
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onExtracted={(data, file) => {
            setPrefillData(data);
            setPendingImportFile(file);
            setShowImport(false);
            setSelected(null);
            setShowModal(true);
            toast.success("Document read — please review the pre-filled fields.");
          }}
        />
      )}

      {/* Add Modal */}
      {showModal && (
        <BidModal
          bid={prefillData ? { ...prefillData } : undefined}
          onClose={() => { setShowModal(false); setPrefillData(null); }}
          onSave={(data, files) => { pendingNewFilesRef.current = files || []; createMutation.mutate(data); }}
          isPending={createMutation.isPending}
        />
      )}

      {/* View Modal */}
      {selected && !editMode && (
        <ViewModal
          bid={selected}
          onClose={() => setSelected(null)}
          onEdit={() => setEditMode(true)}
          onDelete={() => setDeleteId(selected.id)}
          onStatusChange={(status) => statusMutation.mutate({ id: selected.id, status })}
          hasPermission={hasPermission}
          isStatusPending={statusMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {selected && editMode && (
        <BidModal
          bid={selected}
          onClose={() => setEditMode(false)}
          onSave={(data) => updateMutation.mutate({ id: selected.id, data })}
          isPending={updateMutation.isPending}
          onUploadAttachment={(file) => uploadAttachmentMutation.mutate({ bidId: selected.id, file })}
          onDeleteAttachment={(attachmentId) => deleteAttachmentMutation.mutate({ bidId: selected.id, attachmentId })}
          isUploadingAttachment={uploadAttachmentMutation.isPending}
          isDeletingAttachment={deleteAttachmentMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Delete Bid</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete this bid? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
