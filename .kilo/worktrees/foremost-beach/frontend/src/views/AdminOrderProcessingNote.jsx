"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCopy,
  FiCheck,
  FiSave,
  FiRefreshCw,
  FiClipboard,
  FiPower,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../hooks/useAuth";
import {
  loadAdminSettings,
  saveAdminSettings,
  selectAdminSettingsDraft,
  selectPublicSettingsState,
} from "../store/publicSettingsSlice";
import ConfirmModal from "../components/ConfirmModal";
import {
  ORDER_PROCESSING_NOTE_STATUSES,
  getProcessingNoteStatusLabel,
  getProcessingNoteStatusColor,
  safeNoteText,
} from "../utils/orderProcessingNotes";

const sectionClass = "app-panel space-y-4 p-5 md:p-6";
const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-black";
const labelClass = "mb-1 block text-xs font-semibold text-gray-600";

const makeId = () => `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const AdminOrderProcessingNote = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const settings = useSelector(selectAdminSettingsDraft);
  const { adminStatus, saveStatus } = useSelector(selectPublicSettingsState);
  const loading = adminStatus === "idle" || adminStatus === "loading";
  const saving = saveStatus === "loading";

  const [notes, setNotes] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formStatus, setFormStatus] = useState("general");
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [copiedId, setCopiedId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const copyTimerRef = useRef(null);

  const isAdmin = useMemo(
    () => String(user?.userType || "").toLowerCase() === "admin",
    [user?.userType],
  );

  useEffect(() => {
    if (!isAdmin) return;
    if (adminStatus === "succeeded") {
      // Initialize local list from the (already normalized) draft once loaded.
      const loadedNotes = Array.isArray(settings?.orderProcessingNotes)
        ? settings.orderProcessingNotes
        : [];
      setNotes(loadedNotes);
      setDirty(false);
      return;
    }
    dispatch(loadAdminSettings())
      .unwrap()
      .then(() => {})
      .catch((message) => {
        toast.error(message || "Failed to load processing notes");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isAdmin]);

  const handleSave = useCallback(
    async (nextNotes) => {
      if (!isAdmin) return;
      try {
        await dispatch(
          saveAdminSettings({ orderProcessingNotes: nextNotes }),
        ).unwrap();
        toast.success("Processing notes saved");
        setNotes(nextNotes.map((note) => ({ ...note })));
        setDirty(false);
        setFormOpen(false);
        setEditingId(null);
        setFormTitle("");
        setFormText("");
        setFormStatus("general");
        setFormActive(true);
      } catch (error) {
        toast.error(error || "Failed to save processing notes");
      }
    },
    [dispatch, isAdmin],
  );

  const handleReset = useCallback(() => {
    const loadedNotes = Array.isArray(settings?.orderProcessingNotes)
      ? settings.orderProcessingNotes
      : [];
    setNotes(loadedNotes);
    setDirty(false);
    setFormOpen(false);
    setEditingId(null);
    setFormTitle("");
    setFormText("");
    setFormStatus("general");
    setFormActive(true);
    setConfirmReset(false);
  }, [settings?.orderProcessingNotes]);

  const openAddForm = () => {
    setEditingId(null);
    setFormStatus(statusFilter !== "all" ? statusFilter : "general");
    setFormTitle("");
    setFormText("");
    setFormActive(true);
    setFormOpen(true);
  };

  const openEditForm = (note) => {
    setEditingId(note._id);
    setFormStatus(note.status || "general");
    setFormTitle(note.title || "");
    setFormText(note.text || "");
    setFormActive(note.isActive !== false);
    setFormOpen(true);
  };

  const submitForm = (e) => {
    e.preventDefault();
    const title = formTitle.trim();
    const text = formText.trim();
    if (!text) {
      toast.error("Note text is required");
      return;
    }

    const nextNotes = [...notes];
    if (editingId) {
      const index = nextNotes.findIndex((note) => note._id === editingId);
      if (index >= 0) {
        nextNotes[index] = {
          ...nextNotes[index],
          status: formStatus,
          title: title || getProcessingNoteStatusLabel(formStatus),
          text,
          isActive: formActive,
        };
      }
    } else {
      nextNotes.unshift({
        _id: makeId(),
        status: formStatus,
        title: title || getProcessingNoteStatusLabel(formStatus),
        text,
        isActive: formActive,
      });
    }
    setNotes(nextNotes);
    setDirty(true);
    setFormOpen(false);
    setEditingId(null);
    // Persist immediately so the templates are available to Order Management.
    handleSave(nextNotes);
  };

  const toggleNoteActive = (id) => {
    setNotes((prev) => {
      const next = prev.map((note) =>
        note._id === id ? { ...note, isActive: note.isActive !== false ? false : true } : note,
      );
      return next;
    });
    setDirty(true);
  };

  const deleteNote = (id) => {
    const nextNotes = notes.filter((note) => note._id !== id);
    setNotes(nextNotes);
    setDirty(true);
    setDeleteTarget(null);
    handleSave(nextNotes);
  };

  const copyNote = (note) => {
    const text = safeNoteText(note.text);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedId(note._id);
        if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = window.setTimeout(() => setCopiedId(""), 1600);
        toast.success("Note copied to clipboard");
      })
      .catch(() => toast.error("Could not copy note"));
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  const filteredNotes = useMemo(() => {
    if (statusFilter === "all") return notes;
    return notes.filter((note) => note.status === statusFilter);
  }, [notes, statusFilter]);

  if (!isAdmin) {
    return (
      <div className="app-panel p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-black">
          Admin Access Required
        </h2>
        <p className="text-gray-600">
          Only admin can manage order processing notes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="app-hero p-6 md:p-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <FiClipboard className="h-6 w-6" />
        </div>
        <p className="app-kicker text-white/65!">Order workflow templates</p>
        <h1 className="mt-3 text-2xl font-black md:text-3xl">
          Order Processing Notes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-200 md:text-base">
          Reusable note templates that admins use when updating order statuses,
          cancelling orders, or adjusting payments. Pick a template inside
          Order Management to insert it instantly.
        </p>
      </div>

      {loading ? (
        <div className="app-panel flex min-h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="sectionClass flex flex-wrap items-center justify-between gap-3 bg-white !space-y-0 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              {[
                { value: "all", label: "All" },
                ...ORDER_PROCESSING_NOTE_STATUSES,
              ]
                .slice(0, 9)
                .map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setStatusFilter(item.value)}
                    className={`rounded-full px-3 py-1.5 transition ${
                      statusFilter === item.value
                        ? "bg-slate-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
              {dirty ? (
                <>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Unsaved changes
                  </span>
                  <button
                    onClick={() => setConfirmReset(true)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    <FiRefreshCw size={14} /> Reset
                  </button>
                  <button
                    onClick={() => handleSave(notes)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
                  >
                    <FiSave size={14} />
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={openAddForm}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  <FiPlus size={14} /> Add note
                </button>
              )}
            </div>
          </div>

          {/* Add/Edit form */}
          <AnimatePresence>
            {formOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={sectionClass}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black">
                    {editingId ? "Edit note template" : "New note template"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setFormOpen(false);
                      setEditingId(null);
                    }}
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <form onSubmit={submitForm} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>Applies to status</label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value)}
                        className={inputClass}
                      >
                        {ORDER_PROCESSING_NOTE_STATUSES.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>
                        Short title{" "}
                        <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g., Courier pick-up arranged"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Note text</label>
                    <textarea
                      rows={4}
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      placeholder="Write the reusable note template shown to the customer / kept in order history..."
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 accent-black"
                      />
                      Active (available for quick insert)
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormOpen(false);
                          setEditingId(null);
                        }}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        {editingId ? <FiEdit2 size={14} /> : <FiPlus size={14} />}
                        {editingId ? "Update note" : "Add note"}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes list */}
          <div className={`${sectionClass} overflow-hidden`}>
            {filteredNotes.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <FiClipboard className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {statusFilter === "all"
                    ? "No processing notes yet."
                    : `No notes for ${getProcessingNoteStatusLabel(statusFilter)} yet.`}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Add a template so staff can insert it while updating orders.
                </p>
                <button
                  onClick={openAddForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                >
                  <FiPlus size={14} /> Add the first note
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredNotes.map((note, index) => (
                  <motion.div
                    key={note._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.3) }}
                    className={`flex flex-col gap-3 rounded-xl border p-4 transition sm:flex-row sm:items-start sm:justify-between ${
                      note.isActive === false
                        ? "border-gray-100 bg-gray-50 opacity-70"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${getProcessingNoteStatusColor(note.status)}`}
                        >
                          {getProcessingNoteStatusLabel(note.status)}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {note.title ||
                            getProcessingNoteStatusLabel(note.status)}
                        </span>
                        {note.isActive === false ? (
                          <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                            Inactive
                          </span>
                        ) : null}
                        <button
                          onClick={() => toggleNoteActive(note._id)}
                          className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            note.isActive !== false
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                          title={note.isActive !== false ? "Deactivate" : "Activate"}
                        >
                          <FiPower size={11} />
                          {note.isActive !== false ? "Active" : "Inactive"}
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                        {note.text}
                      </p>
                    </div>

                    <div className="flex flex-none items-center gap-2">
                      <button
                        onClick={() => copyNote(note)}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                        title="Copy to clipboard"
                      >
                        {copiedId === note._id ? (
                          <FiCheck size={13} className="text-green-600" />
                        ) : (
                          <FiCopy size={13} />
                        )}
                        {copiedId === note._id ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => openEditForm(note)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
                        title="Edit"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(note)}
                        className="rounded-lg border border-gray-200 p-2 text-red-600 transition hover:bg-red-50"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete note template?"
        message={`Delete "${deleteTarget?.title || getProcessingNoteStatusLabel(deleteTarget?.status)}"? This note will be removed and saved immediately.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDanger
        isLoading={saving}
        onConfirm={() => deleteNote(deleteTarget._id)}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        isOpen={confirmReset}
        title="Discard unsaved changes?"
        message="Your locally edited notes will be reverted to the last saved version."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        isDanger
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
};

export default AdminOrderProcessingNote;