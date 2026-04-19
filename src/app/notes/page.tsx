"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, StickyNote, X, ArrowLeft } from "lucide-react";
import { getNotes, saveNote, deleteNote, generateId, Note } from "@/lib/store";
import { useDataRefresh } from "@/lib/useDataRefresh";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const refresh = useCallback(() => {
    setNotes(getNotes());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useDataRefresh(refresh);

  const createNote = () => {
    const note: Note = {
      id: generateId(),
      title: "Nouvelle note",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveNote(note);
    setNotes(getNotes());
    setSelectedNote(note);
    setIsCreating(true);
  };

  const updateNote = (field: string, value: string) => {
    if (!selectedNote) return;
    const updated = { ...selectedNote, [field]: value, updatedAt: new Date().toISOString() };
    setSelectedNote(updated);
    saveNote(updated);
    setNotes(getNotes());
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    setNotes(getNotes());
    if (selectedNote?.id === id) setSelectedNote(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl md:text-3xl font-bold"
        >
          {selectedNote ? (
            <button
              onClick={() => { setSelectedNote(null); setIsCreating(false); }}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <ArrowLeft size={20} />
              Mes Notes
            </button>
          ) : (
            "Mes Notes"
          )}
        </motion.h1>
        {!selectedNote && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createNote}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 glass-btn-primary rounded-2xl font-medium transition-all text-xs md:text-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvelle note</span>
            <span className="sm:hidden">Ajouter</span>
          </motion.button>
        )}
      </div>

      {selectedNote ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <input
            type="text"
            value={selectedNote.title}
            onChange={(e) => updateNote("title", e.target.value)}
            placeholder="Titre de la note"
            className="w-full text-2xl font-bold bg-transparent border-none mb-4 px-0 focus:ring-0"
            style={{ border: "none", boxShadow: "none" }}
            autoFocus={isCreating}
          />
          <textarea
            value={selectedNote.content}
            onChange={(e) => updateNote("content", e.target.value)}
            placeholder="Commencez à écrire votre note..."
            className="w-full min-h-[400px] bg-transparent border-none text-sm leading-relaxed resize-none px-0 focus:ring-0"
            style={{ border: "none", boxShadow: "none" }}
          />
        </motion.div>
      ) : notes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-text-muted"
        >
          <StickyNote size={56} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Aucune note</p>
          <p className="text-sm mt-1">Créez votre première note</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 cursor-pointer group"
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm truncate flex-1">{note.title}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-surface-lighter text-text-muted hover:text-accent-red transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-text-muted line-clamp-3">
                {note.content || "Note vide..."}
              </p>
              <p className="text-xs text-text-muted mt-3">
                {new Date(note.updatedAt).toLocaleDateString("fr-FR")}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
