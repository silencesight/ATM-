import React, { useState } from 'react';
import {
  X,
  Plus,
  Users,
  Layers,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  School,
  AlertCircle
} from 'lucide-react';
import { Classroom, Student } from '../types';

interface ClassManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  students: Student[];
  onCreateClassroom: (newClass: Omit<Classroom, 'id' | 'createdAt'>) => void;
  onUpdateClassroom: (updatedClass: Classroom) => void;
  onDeleteClassroom: (classId: string) => void;
  onReassignStudents: (fromClassId: string, toClassId: string) => void;
}

const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400' },
  { id: 'cyan', label: 'Cyber Cyan', bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-400' },
  { id: 'amber', label: 'Amber Gold', bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-400' },
  { id: 'purple', label: 'Neon Purple', bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
  { id: 'rose', label: 'Ruby Rose', bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-400' },
  { id: 'blue', label: 'Sapphire Blue', bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
  { id: 'orange', label: 'Solar Orange', bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400' },
];

export const ClassManagerModal: React.FC<ClassManagerModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  students,
  onCreateClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
  onReassignStudents,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('1st BGU');
  const [section, setSection] = useState('A');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('emerald');

  // Deletion confirm state
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  if (!isOpen) return null;

  const startCreate = () => {
    setName('');
    setGradeLevel('1st BGU');
    setSection('C');
    setDescription('');
    setColor('emerald');
    setEditingClassId(null);
    setIsCreating(true);
  };

  const startEdit = (c: Classroom) => {
    setName(c.name);
    setGradeLevel(c.gradeLevel || '1st BGU');
    setSection(c.section || 'A');
    setDescription(c.description || '');
    setColor(c.color || 'emerald');
    setEditingClassId(c.id);
    setIsCreating(true);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingClassId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClassId) {
      const existing = classrooms.find((c) => c.id === editingClassId);
      if (existing) {
        onUpdateClassroom({
          ...existing,
          name: name.trim(),
          gradeLevel: gradeLevel.trim(),
          section: section.trim(),
          description: description.trim(),
          color,
        });
      }
    } else {
      onCreateClassroom({
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        section: section.trim(),
        description: description.trim(),
        color,
      });
    }

    cancelForm();
  };

  const handleConfirmDelete = (classId: string) => {
    const studentsInClass = students.filter((s) => s.classId === classId);
    if (studentsInClass.length > 0 && reassignTargetId) {
      onReassignStudents(classId, reassignTargetId);
    }
    onDeleteClassroom(classId);
    setDeletingClassId(null);
    setReassignTargetId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                Classroom Management
              </h2>
              <p className="text-xs text-slate-400">
                Organize students into distinct classes (e.g., 1st BGU, 2nd BGU)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Action Bar */}
          {!isCreating && (
            <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">
                  {classrooms.length} Active Classes Configured
                </div>
                <div className="text-[11px] text-slate-400">
                  Filter roster, store purchases, and print cards by class
                </div>
              </div>
              <button
                onClick={startCreate}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                Create New Class
              </button>
            </div>
          )}

          {/* Creation / Edit Form */}
          {isCreating && (
            <form onSubmit={handleSubmit} className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono-code uppercase font-black text-amber-300">
                  {editingClassId ? 'Edit Class Details' : 'Create New Class'}
                </span>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono-code uppercase font-bold text-slate-300 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 1st BGU - Group C"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code uppercase font-bold text-slate-300 mb-1">
                    Grade / Level
                  </label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="e.g. 1st BGU, 2nd BGU"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code uppercase font-bold text-slate-300 mb-1">
                    Section / Parallel
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A, B, Morning"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono-code uppercase font-bold text-slate-300 mb-1">
                    Description / Schedule Note
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Morning Baccalaureate English Section"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono-code uppercase font-bold text-slate-300 mb-2">
                    Color Badge Theme
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setColor(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${
                          color === c.id
                            ? `${c.border} bg-slate-800 text-white ring-1 ring-amber-500`
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {editingClassId ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          )}

          {/* List of Classes */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono-code uppercase tracking-wider font-bold text-slate-400">
              Configured Classes ({classrooms.length})
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {classrooms.map((c) => {
                const assignedCount = students.filter(
                  (s) => s.classId === c.id || s.className === c.name
                ).length;
                const colorDef =
                  COLOR_OPTIONS.find((col) => col.id === c.color) || COLOR_OPTIONS[0];

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-3.5 h-10 rounded-full ${colorDef.bg} shrink-0`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-100 text-sm">
                            {c.name}
                          </h4>
                          {c.gradeLevel && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                              {c.gradeLevel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {c.description || 'Standard academic section'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono-code font-bold text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        {assignedCount} Student{assignedCount === 1 ? '' : 's'}
                      </span>

                      <button
                        onClick={() => startEdit(c)}
                        title="Edit Class"
                        className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingClassId(c.id)}
                        title="Delete Class"
                        disabled={classrooms.length <= 1}
                        className="p-2 rounded-lg bg-slate-850 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Confirm Modal Dialog */}
          {deletingClassId && (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                Confirm Class Deletion
              </div>
              <p className="text-xs text-slate-300">
                Are you sure you want to delete this class?
                {students.filter((s) => s.classId === deletingClassId).length > 0 && (
                  <span className="block mt-1 text-amber-300">
                    There are currently{' '}
                    {students.filter((s) => s.classId === deletingClassId).length} students in this class.
                    Select a target class to reassign them to:
                  </span>
                )}
              </p>

              {students.filter((s) => s.classId === deletingClassId).length > 0 && (
                <div>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-bold"
                  >
                    <option value="">Select target class to move students...</option>
                    {classrooms
                      .filter((c) => c.id !== deletingClassId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeletingClassId(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDelete(deletingClassId)}
                  disabled={
                    students.filter((s) => s.classId === deletingClassId).length > 0 &&
                    !reassignTargetId
                  }
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg disabled:opacity-40"
                >
                  Confirm Delete & Reassign
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
          >
            Close Class Manager
          </button>
        </div>
      </div>
    </div>
  );
};
