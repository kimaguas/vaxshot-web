import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2, UserCog } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/ui/Pagination";
import {
  PERMISSION_MODULES,
  ROLE_PERMISSION_PRESETS,
} from "../../utils/permissions";

const roleColors = {
  admin:   "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  staff:   "bg-green-100 text-green-700",
  viewer:  "bg-gray-100 text-gray-600",
};

const UserModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    name:                  user?.name || "",
    username:              user?.username || "",
    email:                 user?.email || "",
    password:              "",
    password_confirmation: "",
    role:                  user?.role || "staff",
    permissions:           user?.permissions
      ? [...user.permissions]
      : [...(ROLE_PERMISSION_PRESETS["staff"] || [])],
  });

  const handleRoleChange = (newRole) => {
    setForm({
      ...form,
      role:        newRole,
      permissions: [...(ROLE_PERMISSION_PRESETS[newRole] || [])],
    });
  };

  const togglePermission = (name) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(name)
        ? prev.permissions.filter((p) => p !== name)
        : [...prev.permissions, name],
    }));
  };

  const toggleModule = (modulePerms) => {
    const names = modulePerms.map((p) => p.name);
    const allChecked = names.every((n) => form.permissions.includes(n));
    setForm((prev) => ({
      ...prev,
      permissions: allChecked
        ? prev.permissions.filter((p) => !names.includes(p))
        : [...new Set([...prev.permissions, ...names])],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user && form.password !== form.password_confirmation) {
      toast.error("Passwords do not match!");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full sm:max-w-xl lg:max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            {user ? "Edit User" : "Add New User"}
          </h3>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Two-column info fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  placeholder="e.g. jdelacruz"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {user ? "(leave blank to keep)" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!user}
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password {user ? "" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) =>
                    setForm({ ...form, password_confirmation: e.target.value })
                  }
                  required={!user}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role preset
              </label>
              <select
                value={form.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Selecting a role auto-fills the permissions below. You can then customise them individually.
              </p>
            </div>

            {/* Permission checklist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Permissions
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({form.permissions.length} selected)
                  </span>
                </label>
                <div className="flex gap-3 text-xs text-blue-600">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        permissions: PERMISSION_MODULES.flatMap((m) =>
                          m.permissions.map((p) => p.name)
                        ),
                      })
                    }
                    className="hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, permissions: [] })}
                    className="hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {PERMISSION_MODULES.map(({ module, permissions }) => {
                  const allChecked = permissions.every((p) =>
                    form.permissions.includes(p.name)
                  );
                  const someChecked = permissions.some((p) =>
                    form.permissions.includes(p.name)
                  );

                  return (
                    <div key={module} className="p-3">
                      {/* Module header with select-all toggle */}
                      <button
                        type="button"
                        onClick={() => toggleModule(permissions)}
                        className="flex items-center gap-2 mb-2 w-full text-left"
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            allChecked
                              ? "bg-blue-600 border-blue-600"
                              : someChecked
                              ? "bg-blue-200 border-blue-400"
                              : "border-gray-300"
                          }`}
                        >
                          {(allChecked || someChecked) && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="currentColor"
                              viewBox="0 0 12 12"
                            >
                              <path d="M3.5 6.5L5.5 8.5L8.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {module}
                        </span>
                      </button>

                      {/* Individual permission checkboxes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
                        {permissions.map(({ name, label }) => (
                          <label
                            key={name}
                            className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 select-none"
                          >
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(name)}
                              onChange={() => togglePermission(name)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {user ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal]             = useState(false);
  const [selected, setSelected]               = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["users", search, page],
    queryFn: async () => {
      const response = await api.get("/users", { params: { search, page } });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User created successfully!");
      setShowModal(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User updated successfully!");
      setShowModal(false);
      setSelected(null);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User deleted successfully!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to delete user"),
  });

  const handleSave = (form) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const users = data?.users || [];
  const pagination = data?.pagination || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
          />
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Username</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Permissions</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <UserCog size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400">No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <React.Fragment key={user.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        {user.id === currentUser?.id && (
                          <p className="text-xs text-blue-500">You</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    @{user.username || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        roleColors[user.role] || roleColors.viewer
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500">
                      {user.permissions?.length ?? 0} permission{user.permissions?.length !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.created_at}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelected(user);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit user & permissions"
                      >
                        <Edit size={16} />
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {deleteConfirmId === user.id && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Trash2 size={18} className="text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-red-700">Delete this user?</p>
                            <p className="text-xs text-red-500 mt-0.5">
                              "{user.name}" will be permanently deleted. This cannot be undone.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-white transition-colors"
                          >
                            Keep User
                          </button>
                          <button
                            onClick={() => { setDeleteConfirmId(null); deleteMutation.mutate(user.id); }}
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
        <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
      </div>

      {showModal && (
        <UserModal
          user={selected}
          onClose={() => {
            setShowModal(false);
            setSelected(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
