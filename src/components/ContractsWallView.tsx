import React, { useState } from 'react';
import {
  ClassroomContract,
  Classroom,
  Student,
  PendingStudentRequest,
} from '../types';
import {
  ScrollText,
  Plus,
  Trash2,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Eye,
  RotateCcw,
  Award,
  DollarSign,
  Layers,
  X,
  UserCheck,
} from 'lucide-react';

interface ContractsWallViewProps {
  contracts: ClassroomContract[];
  classrooms: Classroom[];
  students: Student[];
  pendingRequests: PendingStudentRequest[];
  selectedClassId: string;
  onSelectClassId: (id: string) => void;
  onCreateContract: (data: {
    title: string;
    instructions: string;
    rewardAmount: number;
    creditScoreBonus: number;
    totalStock: number;
    classroomId: string;
    deadline?: string;
  }) => void;
  onDeleteContract: (contractId: string) => void;
  onToggleContractActive: (contractId: string) => void;
  onReleaseContractSpot: (contractId: string, claimId: string, studentId: string) => void;
  onApproveContractClaim: (contractId: string, claimId: string, teacherNote?: string) => void;
  onRejectContractClaim: (
    contractId: string,
    claimId: string,
    teacherNote?: string,
    releaseSpot?: boolean
  ) => void;
  onManualCompleteContractFaceToFace: (contractId: string, studentId: string) => void;
}

export const ContractsWallView: React.FC<ContractsWallViewProps> = ({
  contracts,
  classrooms,
  students,
  selectedClassId,
  onSelectClassId,
  onCreateContract,
  onDeleteContract,
  onToggleContractActive,
  onReleaseContractSpot,
  onApproveContractClaim,
  onRejectContractClaim,
  onManualCompleteContractFaceToFace,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [rewardAmount, setRewardAmount] = useState(75);
  const [creditScoreBonus, setCreditScoreBonus] = useState(20);
  const [totalStock, setTotalStock] = useState(3);
  const [classroomId, setClassroomId] = useState<string>(
    selectedClassId !== 'all' && selectedClassId !== 'unassigned' ? selectedClassId : 'all'
  );
  const [deadline, setDeadline] = useState('');

  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);
  const [zoomPhotoTitle, setZoomPhotoTitle] = useState<string>('');
  const [faceToFaceContractId, setFaceToFaceContractId] = useState<string | null>(null);
  const [faceToFaceStudentId, setFaceToFaceStudentId] = useState<string>('');

  const filteredContracts = contracts.filter((c) => {
    if (selectedClassId === 'all') return true;
    return !c.classroomId || c.classroomId === 'all' || c.classroomId === selectedClassId;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) return;
    onCreateContract({
      title: title.trim(),
      instructions: instructions.trim(),
      rewardAmount: Math.max(5, Number(rewardAmount) || 50),
      creditScoreBonus: Math.max(0, Number(creditScoreBonus) || 0),
      totalStock: Math.max(1, Number(totalStock) || 1),
      classroomId: classroomId || 'all',
      deadline: deadline || undefined,
    });
    setTitle('');
    setInstructions('');
    setRewardAmount(75);
    setCreditScoreBonus(20);
    setTotalStock(3);
    setDeadline('');
    setShowCreateModal(false);
  };

  const getClassroomLabel = (cId?: string) => {
    if (!cId || cId === 'all') return 'All Courses (Universal)';
    return classrooms.find((c) => c.id === cId)?.name || 'Assigned Course';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
            <ScrollText className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Limited Stock Bounties
              </span>
              <span className="text-xs text-slate-400">
                • Notebook Photo Required for Approval
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Classroom Contracts & Events Wall
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Post limited-stock notebook contracts for students to claim on their devices. Taking a contract reserves 1 spot immediately; once they upload their notebook photo and you approve it, they earn the E$ bounty!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => onSelectClassId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Classrooms ({contracts.length})</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post New Contract
          </button>
        </div>
      </div>

      {/* Contracts Grid */}
      {filteredContracts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <ScrollText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Contracts Posted on the Wall Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create limited-stock notebook missions (e.g., &ldquo;Write 15 Sentences with Past Continuous&rdquo; or &ldquo;Draw &amp; Label a Mind Map of Unit 4&rdquo;) so students can claim spots and earn extra E$!
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create First Contract
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredContracts.map((contract) => {
            const approvedCount = contract.claims.filter((c) => c.status === 'approved').length;
            const pendingCount = contract.claims.filter(
              (c) => c.status === 'pending_approval'
            ).length;
            const reservedCount = contract.claims.filter((c) => c.status === 'reserved').length;

            return (
              <div
                key={contract.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 flex flex-col justify-between gap-4 transition-all ${
                  !contract.isActive
                    ? 'border-slate-800 opacity-70'
                    : pendingCount > 0
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          !contract.isActive
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : contract.spotsRemaining > 0
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {!contract.isActive
                          ? 'Closed'
                          : contract.spotsRemaining > 0
                          ? `${contract.spotsRemaining} / ${contract.totalStock} Spots Available`
                          : `All ${contract.totalStock} Spots Taken`}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        {getClassroomLabel(contract.classroomId)}
                      </span>
                      {contract.deadline && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          Due {contract.deadline}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleContractActive(contract.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors"
                      >
                        {contract.isActive ? 'Pause' : 'Reopen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteContract(contract.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Delete Contract"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Reward */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {contract.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 whitespace-pre-line leading-relaxed bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                        {contract.instructions}
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-3.5 py-2.5 text-right shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 block">
                        Reward
                      </span>
                      <span className="text-lg font-mono font-black text-emerald-400">
                        +${contract.rewardAmount}
                      </span>
                      {contract.creditScoreBonus > 0 && (
                        <span className="text-[10px] font-bold text-amber-300 block">
                          +{contract.creditScoreBonus} Score
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Claims / Spot Holders */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        Claimed Spots ({contract.claims.length} / {contract.totalStock})
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        {pendingCount > 0 && (
                          <span className="text-amber-300 font-extrabold">
                            {pendingCount} Awaiting Review
                          </span>
                        )}
                        {reservedCount > 0 && (
                          <span className="text-cyan-300">{reservedCount} In Progress</span>
                        )}
                        {approvedCount > 0 && (
                          <span className="text-emerald-400">{approvedCount} Completed</span>
                        )}
                      </div>
                    </div>

                    {contract.claims.length === 0 ? (
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 text-center text-xs text-slate-500">
                        No students have taken this contract yet.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {contract.claims.map((claim) => (
                          <div
                            key={claim.id}
                            className={`rounded-2xl p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                              claim.status === 'pending_approval'
                                ? 'bg-amber-500/10 border-amber-500/40'
                                : claim.status === 'approved'
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : claim.status === 'rejected'
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : 'bg-slate-950/70 border-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-white">
                                  {claim.studentName}
                                </span>
                                {claim.className && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {claim.className}
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    claim.status === 'pending_approval'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : claim.status === 'approved'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : claim.status === 'rejected'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-cyan-500/15 text-cyan-300'
                                  }`}
                                >
                                  {claim.status === 'pending_approval'
                                    ? '📸 Photo Sent — Needs Approval'
                                    : claim.status === 'approved'
                                    ? '✅ Approved & Paid'
                                    : claim.status === 'rejected'
                                    ? '❌ Needs Retry'
                                    : '⏳ Spot Reserved'}
                                </span>
                              </div>
                              {claim.studentNotes && (
                                <p className="text-[11px] text-slate-300 italic">
                                  &ldquo;{claim.studentNotes}&rdquo;
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              {claim.notebookPhotoDataUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setZoomPhotoUrl(claim.notebookPhotoDataUrl || null);
                                    setZoomPhotoTitle(
                                      `${claim.studentName} — ${contract.title}`
                                    );
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Photo
                                </button>
                              )}

                              {claim.status !== 'approved' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onApproveContractClaim(contract.id, claim.id)
                                    }
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 shadow"
                                    title="Approve & Pay Reward"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                  </button>

                                  {claim.status === 'pending_approval' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onRejectContractClaim(
                                          contract.id,
                                          claim.id,
                                          'Please check notebook instructions and re-upload photo.',
                                          false
                                        )
                                      }
                                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1"
                                      title="Ask student to retry photo"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Retry
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onReleaseContractSpot(
                                        contract.id,
                                        claim.id,
                                        claim.studentId
                                      )
                                    }
                                    className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1"
                                    title="Release spot back to the wall"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Free Spot
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Face-to-Face Quick Award Footer */}
                {contract.isActive && contract.spotsRemaining > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    {faceToFaceContractId === contract.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <select
                          value={faceToFaceStudentId}
                          onChange={(e) => setFaceToFaceStudentId(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="">Select student presenting notebook in person...</option>
                          {students
                            .filter(
                              (s) =>
                                s.cardStatus === 'active' &&
                                (!contract.classroomId ||
                                  contract.classroomId === 'all' ||
                                  s.classId === contract.classroomId) &&
                                !contract.claims.some((cl) => cl.studentId === s.id)
                            )
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.className || 'Unassigned'})
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          disabled={!faceToFaceStudentId}
                          onClick={() => {
                            if (!faceToFaceStudentId) return;
                            onManualCompleteContractFaceToFace(contract.id, faceToFaceStudentId);
                            setFaceToFaceContractId(null);
                            setFaceToFaceStudentId('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black"
                        >
                          Verify & Pay
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFaceToFaceContractId(null);
                            setFaceToFaceStudentId('');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFaceToFaceContractId(contract.id)}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Verify Student Notebook Face-to-Face (Instant Pay)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl my-auto">
            <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <ScrollText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                    Classroom Contracts Wall
                  </span>
                  <h3 className="text-base font-black text-white">Post New Notebook Contract</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Contract Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Write 10 Sentences Using Phrasal Verbs in Your Notebook"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notebook Instructions (What must they write/draw & photograph?) *
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g., Write 10 original sentences in your English notebook using unit vocabulary, underline the verbs in color, and take a clear photo of your page."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3.5 h-3.5" /> E$ Reward *
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={2000}
                    step={5}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(parseInt(e.target.value, 10) || 50)}
                    className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-sm font-mono font-black text-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mb-1">
                    <Award className="w-3.5 h-3.5" /> Score Bonus
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    step={5}
                    value={creditScoreBonus}
                    onChange={(e) => setCreditScoreBonus(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 mb-1">
                    <Layers className="w-3.5 h-3.5" /> Stock (Spots) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalStock}
                    onChange={(e) => setTotalStock(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-sm font-mono font-black text-cyan-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Target Classroom
                  </label>
                  <select
                    value={classroomId}
                    onChange={(e) => setClassroomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="all">All Classrooms (Universal)</option>
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Deadline Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Publish Contract to Wall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Zoom Lightbox */}
      {zoomPhotoUrl && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          onClick={() => setZoomPhotoUrl(null)}
        >
          <div
            className="max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">{zoomPhotoTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setZoomPhotoUrl(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img
                src={zoomPhotoUrl}
                alt="Notebook Contract Proof"
                className="max-h-[72vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
