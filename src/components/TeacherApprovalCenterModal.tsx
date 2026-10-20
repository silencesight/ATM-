import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  BookOpen,
  ShoppingBag,
  Send,
  DollarSign,
  ZoomIn,
  Clock,
  Sparkles,
  CheckCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { PendingStudentRequest, Student, TeacherSettings } from '../types';
import { StudentAvatar } from './StudentAvatar';

interface TeacherApprovalCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: PendingStudentRequest[];
  students: Student[];
  settings: TeacherSettings;
  onApproveRequest: (requestId: string, teacherNote?: string) => void;
  onRejectRequest: (requestId: string, teacherNote?: string) => void;
  onApproveAllPending: () => void;
}

export const TeacherApprovalCenterModal: React.FC<TeacherApprovalCenterModalProps> = ({
  isOpen,
  onClose,
  requests,
  students,
  onApproveRequest,
  onRejectRequest,
  onApproveAllPending,
}) => {
  const [filterType, setFilterType] = useState<
    'all' | 'loan_payment' | 'loan_request' | 'store_purchase' | 'p2p_transfer' | 'history'
  >('all');
  const [notesByRequestId, setNotesByRequestId] = useState<Record<string, string>>({});
  const [zoomedPhoto, setZoomedPhoto] = useState<{
    url: string;
    studentName: string;
    creditValue: number;
  } | null>(null);

  if (!isOpen) return null;

  const pendingOnly = requests.filter((r) => r.status === 'pending');
  const historyOnly = requests.filter((r) => r.status !== 'pending');

  const displayedRequests =
    filterType === 'history'
      ? historyOnly
      : pendingOnly.filter((r) => (filterType === 'all' ? true : r.type === filterType));

  const getStudentAvatar = (studentId: string) =>
    students.find((s) => s.id === studentId)?.avatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      {/* Full-Screen Notebook Photo Lightbox */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <div
            className="max-w-4xl w-full glass-panel rounded-3xl p-4 space-y-3 specular-edge"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-headline font-bold text-on-surface">
                  {zoomedPhoto.studentName} — Notebook English Work Photo
                </h4>
                <p className="text-xs font-mono text-tertiary-fixed-dim">
                  Calculated Credit Value: E${zoomedPhoto.creditValue}.00
                </p>
              </div>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="p-2 rounded-full glass-pill text-on-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-black flex items-center justify-center p-2">
              <img
                src={zoomedPhoto.url}
                alt="Student notebook full view"
                className="max-w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col glass-panel rounded-3xl border border-primary-container/35 shadow-2xl specular-edge overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary-container/20 border border-primary-container/40 flex items-center justify-center text-primary-container">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-headline font-extrabold text-on-surface">
                  Live Student Web App Approval Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {pendingOnly.length} Pending
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Review and approve notebook photo loan payments, new loans, store orders, and friend transfers in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {pendingOnly.length > 1 && (
              <button
                type="button"
                onClick={onApproveAllPending}
                className="liquid-button-primary px-4 py-2.5 rounded-2xl text-xs font-headline font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Approve All ({pendingOnly.length})
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl glass-pill text-on-surface-variant hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-outline-variant/15 flex flex-wrap items-center gap-2 bg-surface-container-lowest/40">
          {[
            { id: 'all', label: `All Pending (${pendingOnly.length})` },
            {
              id: 'loan_payment',
              label: `Notebook Payments (${
                pendingOnly.filter((r) => r.type === 'loan_payment').length
              })`,
            },
            {
              id: 'loan_request',
              label: `New Loans (${
                pendingOnly.filter((r) => r.type === 'loan_request').length
              })`,
            },
            {
              id: 'store_purchase',
              label: `Store Orders (${
                pendingOnly.filter((r) => r.type === 'store_purchase').length
              })`,
            },
            {
              id: 'p2p_transfer',
              label: `Friend Transfers (${
                pendingOnly.filter((r) => r.type === 'p2p_transfer').length
              })`,
            },
            { id: 'history', label: `Reviewed History (${historyOnly.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as typeof filterType)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                  : 'glass-pill text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {displayedRequests.length === 0 ? (
            <div className="glass-well rounded-3xl p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-tertiary-fixed-dim mx-auto" />
              <p className="text-base font-headline font-bold text-on-surface">
                All Caught Up!
              </p>
              <p className="text-xs font-mono text-on-surface-variant">
                No student requests in this category right now. New requests from the Student Web App will appear here live!
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const noteVal = notesByRequestId[req.id] || '';
              return (
                <div
                  key={req.id}
                  className="glass-well rounded-3xl p-5 border border-outline-variant/25 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Student Info & Request Details */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <StudentAvatar
                        name={req.studentName}
                        avatarUrl={getStudentAvatar(req.studentId)}
                        size="md"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-headline font-extrabold text-on-surface">
                            {req.studentName}
                          </span>
                          {req.className && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary-container/15 text-primary-container border border-primary-container/30">
                              {req.className}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(req.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {/* Request Specific Details */}
                        {req.type === 'loan_payment' && req.loanPaymentData && (
                          <div className="space-y-3 pt-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-bold">
                              <BookOpen className="w-3.5 h-3.5" />
                              Notebook Loan Payment • Credit Value: E$
                              {req.loanPaymentData.totalCreditValue}.00
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs font-mono">
                              <span className="px-2.5 py-1 rounded-lg glass-panel">
                                Sentences: <strong>{req.loanPaymentData.sentencesCount}</strong>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg glass-panel">
                                Words: <strong>{req.loanPaymentData.wordsCount}</strong>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg glass-panel">
                                Phrasal Verbs:{' '}
                                <strong>{req.loanPaymentData.phrasalVerbsCount}</strong>
                              </span>
                              {req.loanPaymentData.hasDecoratedPresentation && (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                  ✨ Decorated Notebook Claimed
                                </span>
                              )}
                            </div>

                            {req.loanPaymentData.studentNotes && (
                              <p className="text-xs font-mono text-on-surface-variant italic">
                                Student Note: "{req.loanPaymentData.studentNotes}"
                              </p>
                            )}

                            {/* Notebook Photo Thumbnail + Lightbox Trigger */}
                            {req.loanPaymentData.notebookPhotoDataUrl && (
                              <div className="flex items-center gap-3 pt-1">
                                <div
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: req.loanPaymentData!.notebookPhotoDataUrl,
                                      studentName: req.studentName,
                                      creditValue: req.loanPaymentData!.totalCreditValue,
                                    })
                                  }
                                  className="relative group w-44 h-32 rounded-2xl overflow-hidden border-2 border-primary-container/50 cursor-pointer bg-black"
                                >
                                  <img
                                    src={req.loanPaymentData.notebookPhotoDataUrl}
                                    alt="Student Notebook"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-mono font-bold transition-opacity">
                                    <ZoomIn className="w-4 h-4" />
                                    Inspect Photo
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedPhoto({
                                      url: req.loanPaymentData!.notebookPhotoDataUrl,
                                      studentName: req.studentName,
                                      creditValue: req.loanPaymentData!.totalCreditValue,
                                    })
                                  }
                                  className="px-3.5 py-2 rounded-xl glass-pill text-xs font-mono font-bold text-primary-container hover:border-primary-container flex items-center gap-1.5 cursor-pointer"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  Open Full-Screen Notebook Photo
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {req.type === 'loan_request' && req.loanRequestData && (
                          <div className="space-y-1.5 pt-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
                              <DollarSign className="w-3.5 h-3.5" />
                              New Loan Request: E${req.loanRequestData.principal}.00 (
                              {req.loanRequestData.durationDays} days •{' '}
                              {req.loanRequestData.loanType === 'short'
                                ? 'Short Advance'
                                : 'Extended Loan'}
                              )
                            </div>
                            <p className="text-xs font-mono text-on-surface-variant">
                              Reason: "{req.loanRequestData.notes}"
                            </p>
                          </div>
                        )}

                        {req.type === 'store_purchase' && req.storePurchaseData && (
                          <div className="space-y-2 pt-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-bold">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Store Order • E${req.storePurchaseData.totalPrice}.00 Reserved
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {req.storePurchaseData.items.map((it, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg glass-panel text-xs font-mono text-on-surface"
                                >
                                  {it.itemName} × {it.quantity} (E${it.unitPrice * it.quantity})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.type === 'p2p_transfer' && req.transferData && (
                          <div className="space-y-1.5 pt-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold">
                              <Send className="w-3.5 h-3.5" />
                              Friend Transfer: Send E${req.transferData.amount}.00 →{' '}
                              {req.transferData.recipientName}
                            </div>
                            <p className="text-xs font-mono text-on-surface-variant">
                              Message: "{req.transferData.message}" (E${req.reservedAmount}.00 currently held from {req.studentName})
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Teacher Feedback & Approve / Reject Buttons */}
                    {req.status === 'pending' ? (
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
                        <input
                          type="text"
                          value={noteVal}
                          onChange={(e) =>
                            setNotesByRequestId((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          placeholder="Optional teacher note..."
                          className="glass-panel rounded-xl px-3 py-2 text-xs font-mono text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none w-full sm:w-56"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onApproveRequest(req.id, noteVal)}
                            className="flex-1 sm:flex-initial liquid-button-primary px-4 py-2.5 rounded-xl text-xs font-headline font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onRejectRequest(req.id, noteVal)}
                            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl glass-pill border border-rose-500/40 text-rose-400 hover:bg-rose-500/15 text-xs font-headline font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-right font-mono">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.reviewedAt && (
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            {new Date(req.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
