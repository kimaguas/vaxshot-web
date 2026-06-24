import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Star, Mail } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const BODY_TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "clean"],
];
const SIG_TOOLBAR    = [["bold", "italic", "underline"], ["link", "clean"]];
const HEADER_TOOLBAR = [
  ["bold", "italic", "underline"],
  [{ align: [] }, { color: [] }],
  ["link", "clean"],
];

const CATEGORIES = [
  { value: "companies",            label: "Companies" },
  { value: "healthcare_providers", label: "Healthcare Providers" },
  { value: "doctors",              label: "Doctors" },
  { value: "government_units",     label: "Government Units" },
  { value: "corporate",            label: "Corporate" },
  { value: "other",                label: "Other" },
];

const categoryLabel = (value) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value;

// ─── Modal ────────────────────────────────────────────────────────────────────
const EmailTemplateModal = ({ onClose, onSave, isPending, initial }) => {
  const isEdit = !!initial;

  const [form, setForm] = useState({
    name:        initial?.name        ?? "",
    category:    initial?.category    ?? "companies",
    subject:     initial?.subject     ?? "",
    body:        initial?.body        ?? "",
    signature:   initial?.signature   ?? "",
    is_default:  initial?.is_default  ?? false,
    header_html: initial?.header_html ?? "",
  });

  const headerModules = useMemo(() => ({ toolbar: HEADER_TOOLBAR }), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEdit ? "Edit Email Template" : "New Email Template"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Healthcare Provider Template"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Subject *
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              placeholder="e.g. Price Quotation - {quotation_number}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Header
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Customize the header shown at the top of the email (logo, company name, etc.). Leave empty to use the default Vaxshot header.
            </p>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <ReactQuill
                theme="snow"
                value={form.header_html}
                onChange={(val) => setForm({ ...form, header_html: val })}
                modules={headerModules}
                style={{ minHeight: "120px" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Body *
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <ReactQuill
                theme="snow"
                value={form.body}
                onChange={(val) => setForm({ ...form, body: val })}
                modules={{ toolbar: BODY_TOOLBAR }}
                style={{ minHeight: "200px" }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Available placeholders:{" "}
              <code className="bg-gray-100 px-1 rounded">{"{customer_name}"}</code>{" "}
              <code className="bg-gray-100 px-1 rounded">{"{contact_name}"}</code>{" "}
              <code className="bg-gray-100 px-1 rounded">{"{quotation_number}"}</code>{" "}
              <code className="bg-gray-100 px-1 rounded">{"{quotation_date}"}</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signature *
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <ReactQuill
                theme="snow"
                value={form.signature}
                onChange={(val) => setForm({ ...form, signature: val })}
                modules={{ toolbar: SIG_TOOLBAR }}
                style={{ minHeight: "100px" }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">
              Set as default template (pre-selected when sending quotations)
            </label>
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
              {isPending ? "Saving..." : isEdit ? "Update Template" : "Save Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmailTemplatesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate]           = useState(false);
  const [editTarget, setEditTarget]           = useState(null);
  const [categoryFilter, setCategoryFilter]   = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const res = await api.get("/email-templates");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/email-templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["email-templates"]);
      toast.success("Template created successfully!");
      setShowCreate(false);
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      toast.error(errors ? Object.values(errors)[0][0] : err.response?.data?.message || "Failed to create template");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/email-templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["email-templates"]);
      toast.success("Template updated successfully!");
      setEditTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/email-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["email-templates"]);
      toast.success("Template deleted!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete template");
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const allTemplates = data?.templates ?? [];
  const filtered = categoryFilter
    ? allTemplates.filter((t) => t.category === categoryFilter)
    : allTemplates;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage reusable email body templates for quotation emails
          </p>
        </div>
        {hasPermission("create_email_templates") && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Template
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Subject</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Default</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading templates...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Mail size={32} className="text-gray-300" />
                      <p className="font-medium">No templates found</p>
                      <p className="text-sm">Create your first email template to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  deleteConfirmId === t.id ? (
                    <tr key={t.id}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Trash2 size={18} className="text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-red-700">Delete this template?</p>
                              <p className="text-xs text-red-500 mt-0.5">
                                <span className="font-medium">"{t.name}"</span> will be permanently deleted. This cannot be undone.
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
                              onClick={() => { setDeleteConfirmId(null); handleDelete(t.id); }}
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
                  ) : (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setEditTarget(t)}
                          className="text-sm font-medium text-blue-600 hover:underline text-left"
                        >
                          {t.name}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {categoryLabel(t.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 truncate block max-w-xs">{t.subject}</span>
                      </td>
                      <td className="px-6 py-4">
                        {t.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <Star size={10} fill="currentColor" />
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission("edit_email_templates") && (
                            <button
                              onClick={() => setEditTarget(t)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit template"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {hasPermission("delete_email_templates") && (
                            <button
                              onClick={() => setDeleteConfirmId(t.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete template"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <EmailTemplateModal
          onClose={() => setShowCreate(false)}
          onSave={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <EmailTemplateModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(data) => updateMutation.mutate({ id: editTarget.id, data })}
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}
