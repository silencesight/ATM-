import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Download,
  Printer,
  CheckSquare,
  Square,
  Search,
  Filter,
  Users,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { Student, Loan, TeacherSettings } from '../types';
import { getCreditTier } from '../utils/creditCalculator';

interface StudentReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  loans: Loan[];
  settings?: TeacherSettings;
}

export const StudentReportsModal: React.FC<StudentReportsModalProps> = ({
  isOpen,
  onClose,
  students,
  loans,
  settings,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(students.map((s) => s.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [reportFormat, setReportFormat] = useState<'csv' | 'html' | 'json'>('csv');
  const [showPreview, setShowPreview] = useState(false);

  // Available classes
  const classes = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.className || 'General')));
    return ['ALL', ...list];
  }, [students]);

  // Filtered student list for selection
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.cardNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass =
        classFilter === 'ALL' || (s.className || 'General') === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, searchQuery, classFilter]);

  if (!isOpen) return null;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Selected student entities
  const targetedStudents = students.filter((s) => selectedIds.includes(s.id));

  // Generate CSV data
  const generateCSV = () => {
    const headers = [
      'Student ID',
      'Student Name',
      'Class Group',
      'Card Number',
      'Card Status',
      'Current Balance (E$)',
      'Credit Score',
      'Credit Tier',
      'Current Credit Limit (E$)',
      'Credit Limit Rises Count',
      'Total Limit Raised (E$)',
      'Total Loans Taken',
      'Active Loans Count',
      'Paid Loans Count',
      'Total Principal Borrowed (E$)',
      'Total Interest Paid (E$)',
      'Punctual Repayments',
      'Delays Count',
      'Total English Rewards Earned (E$)',
      'Store Purchases Count',
    ];

    const rows = targetedStudents.map((s) => {
      const stLoans = loans.filter((l) => l.studentId === s.id);
      const activeLoans = stLoans.filter((l) => l.status === 'active');
      const paidLoans = stLoans.filter((l) => l.status === 'paid');
      const totalPrincipal = stLoans.reduce((sum, l) => sum + l.principal, 0);
      const totalInterest = paidLoans.reduce(
        (sum, l) => sum + Math.max(0, l.totalDue - l.principal),
        0
      );
      const rises = s.creditLimitRaisesHistory || [];
      const totalRises = rises.reduce((sum, r) => sum + r.increaseAmount, 0);
      const rewards = s.englishRewardsHistory || [];
      const totalRewards = rewards.reduce((sum, r) => sum + r.amount, 0);
      const tier = getCreditTier(s.creditScore);

      return [
        `"${s.id}"`,
        `"${s.name}"`,
        `"${s.className || 'General'}"`,
        `"${s.cardNumber}"`,
        `"${s.cardStatus}"`,
        s.currentBalance,
        s.creditScore,
        `"${tier.name}"`,
        s.maxLoanLimit,
        rises.length,
        totalRises,
        stLoans.length,
        activeLoans.length,
        paidLoans.length,
        totalPrincipal,
        totalInterest,
        s.punctualPaymentsCount || 0,
        s.delaysCount || 0,
        totalRewards,
        (s.storePurchasesHistory || []).length,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `student_credit_dossier_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download JSON
  const handleDownloadJSON = () => {
    const reportData = targetedStudents.map((s) => {
      const stLoans = loans.filter((l) => l.studentId === s.id);
      return {
        student: s,
        loans: stLoans,
        tier: getCreditTier(s.creditScore),
        generatedAt: new Date().toISOString(),
      };
    });

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `student_full_audit_dossier_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate & Print/Save Full Printable HTML Report
  const handlePrintHTML = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable student report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Student Credit & Academic Financial Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            padding: 30px;
            background: #ffffff;
            font-size: 13px;
          }
          h1, h2, h3 { margin: 0 0 8px 0; }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 15px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .institution {
            font-size: 20px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta { font-size: 11px; color: #475569; margin-top: 4px; }
          .student-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          .student-head {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          .name { font-size: 16px; font-weight: 700; }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 16px;
          }
          .metric {
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .metric-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .metric-val { font-size: 15px; font-weight: 700; color: #0f172a; }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 6px 10px;
            text-align: left;
          }
          th { background: #f1f5f9; font-weight: 700; }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 14px 0 6px 0;
            color: #334155;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; background: #f1f5f9; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <span>Student Comprehensive Credit Dossier (${targetedStudents.length} student records)</span>
          <button onclick="window.print()" style="padding: 8px 16px; background: #0f172a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">Print / Save as PDF</button>
        </div>

        <div class="header">
          <div>
            <div class="institution">Financial Literacy Education Credit Portal</div>
            <div class="meta">Official Academic Financial Dossier • Generated on ${new Date().toLocaleString()}</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">Records Selected: ${targetedStudents.length}</div>
          </div>
        </div>

        ${targetedStudents
          .map((s) => {
            const stLoans = loans.filter((l) => l.studentId === s.id);
            const rises = s.creditLimitRaisesHistory || [];
            const rewards = s.englishRewardsHistory || [];
            const tier = getCreditTier(s.creditScore);

            return `
              <div class="student-card">
                <div class="student-head">
                  <div>
                    <div class="name">${s.name}</div>
                    <div class="meta">ID: ${s.id} • Card: ${s.cardNumber} • Class: ${s.className || 'General'}</div>
                  </div>
                  <div>
                    <span class="badge" style="background: #e0f2fe; border-color: #7dd3fc; color: #0369a1;">
                      Tier: ${tier.name} (${s.creditScore} pts)
                    </span>
                  </div>
                </div>

                <div class="grid">
                  <div class="metric">
                    <div class="metric-label">Account Balance</div>
                    <div class="metric-val">E$${s.currentBalance}.00</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Credit Limit</div>
                    <div class="metric-val">E$${s.maxLoanLimit}.00</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Rises Granted</div>
                    <div class="metric-val">${rises.length} (+E$${rises.reduce((sum, r) => sum + r.increaseAmount, 0)})</div>
                  </div>
                  <div class="metric">
                    <div class="metric-label">Repayment Record</div>
                    <div class="metric-val">${s.punctualPaymentsCount || 0} Punctual / ${s.delaysCount || 0} Delays</div>
                  </div>
                </div>

                <!-- Credit Limit Rises Table -->
                <div class="section-title">Credit Limit Rises Record (${rises.length})</div>
                ${
                  rises.length > 0
                    ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Previous Limit</th>
                        <th>New Limit</th>
                        <th>Rise Granted</th>
                        <th>Commendation / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rises
                        .map(
                          (r) => `
                        <tr>
                          <td>${new Date(r.timestamp).toLocaleDateString()}</td>
                          <td>E$${r.previousLimit}.00</td>
                          <td><strong>E$${r.newLimit}.00</strong></td>
                          <td style="color: #059669; font-weight: bold;">+E$${r.increaseAmount}.00</td>
                          <td>${r.reason}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `
                    : '<div style="color: #64748b; font-size: 11px; font-style: italic;">No credit limit rises recorded yet.</div>'
                }

                <!-- Loan History Table -->
                <div class="section-title">Loan Activity & Repayments (${stLoans.length})</div>
                ${
                  stLoans.length > 0
                    ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Loan ID</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Total Due</th>
                        <th>Repaid</th>
                        <th>Status</th>
                        <th>Delays</th>
                        <th>Settlement Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${stLoans
                        .map(
                          (l) => `
                        <tr>
                          <td>${l.id.slice(0, 8)}...</td>
                          <td>E$${l.principal}.00</td>
                          <td>${l.effectiveInterestRate}%</td>
                          <td>E$${l.totalDue}.00</td>
                          <td>E$${l.amountRepaid}.00</td>
                          <td><strong style="text-transform: uppercase;">${l.status}</strong></td>
                          <td>${l.delaysCount}</td>
                          <td>${l.paidAt ? new Date(l.paidAt).toLocaleDateString() : 'Active/Pending'}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `
                    : '<div style="color: #64748b; font-size: 11px; font-style: italic;">No loans registered.</div>'
                }

                <!-- English Rewards -->
                <div class="section-title">In-Class English Rewards (${rewards.length} records)</div>
                ${
                  rewards.length > 0
                    ? `
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Activity / Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rewards
                        .slice(0, 5)
                        .map(
                          (rw) => `
                        <tr>
                          <td>${new Date(rw.createdAt).toLocaleDateString()}</td>
                          <td style="color: #059669; font-weight: bold;">+E$${rw.amount}.00</td>
                          <td>${rw.reason}</td>
                        </tr>
                      `
                        )
                        .join('')}
                    </tbody>
                  </table>
                `
                    : '<div style="color: #64748b; font-size: 11px; font-style: italic;">No English classroom awards recorded.</div>'
                }
              </div>
            `;
          })
          .join('')}
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Student Comprehensive Reports
                </h3>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold">
                  Dossier Export
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Download complete performance, credit limit rises, loans, and participation reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Controls: Search, Class Filter, Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name, card #, or ID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  Class: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-mono text-teal-400 hover:underline flex items-center gap-1.5"
                >
                  {selectedIds.length === filteredStudents.length ? (
                    <>
                      <CheckSquare className="w-4 h-4" /> Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4" /> Select All ({filteredStudents.length})
                    </>
                  )}
                </button>
              </div>
              <span className="text-xs font-mono text-slate-400">
                <strong className="text-white">{selectedIds.length}</strong> of{' '}
                {students.length} students selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {filteredStudents.map((st) => {
                const isSelected = selectedIds.includes(st.id);
                const risesCount = (st.creditLimitRaisesHistory || []).length;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleToggleStudent(st.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between gap-2 font-mono ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500/60 shadow-sm'
                        : 'bg-slate-950 border-slate-800/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-teal-500 border-teal-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{st.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {st.className || 'General'} • Limit: E${st.maxLoanLimit}
                        </p>
                      </div>
                    </div>
                    {risesCount > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                        +{risesCount} rises
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Download Options */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Download className="w-4 h-4 text-teal-400" />
              Choose Export Format
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CSV */}
              <button
                type="button"
                onClick={handleDownloadCSV}
                disabled={selectedIds.length === 0}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-white group-hover:text-teal-400">
                    Spreadsheet (CSV)
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Excel &amp; Google Sheets ready table with credit metrics, limits, and settlement rates.
                </p>
              </button>

              {/* Printable HTML / PDF */}
              <button
                type="button"
                onClick={handlePrintHTML}
                disabled={selectedIds.length === 0}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-white group-hover:text-teal-400">
                    PDF / Print Report
                  </span>
                  <Printer className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Formatted printable multi-page dossier with itemized tables for rises and loans.
                </p>
              </button>

              {/* JSON Audit */}
              <button
                type="button"
                onClick={handleDownloadJSON}
                disabled={selectedIds.length === 0}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono text-white group-hover:text-teal-400">
                    Full Audit (JSON)
                  </span>
                  <FileText className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Raw programmatic data containing all nested sub-records, timestamps, and notes.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Selected: <strong className="text-teal-400">{selectedIds.length}</strong> students ready for export
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-mono"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
