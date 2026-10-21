import React, { useState } from 'react';
import {
  StudentRecord,
  TriwulanKey,
  TRIWULAN_OPTIONS,
  ASPEK_LIST,
  QuarterComparisonItem
} from '../types/rapor';
import {
  compareTwoQuarters,
  getAllQuartersComparison
} from '../utils/quarterAnalysis';
import {
  ChevronLeft,
  Printer,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Activity,
  BarChart3,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ReferenceLine
} from 'recharts';

interface PerbandinganTriwulanProps {
  students: StudentRecord[];
  selectedStudentNo: number;
  onSelectStudent: (no: number) => void;
  onNavigateHome: () => void;
}

export const PerbandinganTriwulan: React.FC<PerbandinganTriwulanProps> = ({
  students,
  selectedStudentNo,
  onSelectStudent,
  onNavigateHome
}) => {
  const currentStudent = students.find((s) => s.no === selectedStudentNo) || students[0];

  // Comparison modes: 2 quarters vs all quarters
  const [comparisonMode, setComparisonMode] = useState<'two_quarters' | 'all_quarters'>('two_quarters');
  const [periodA, setPeriodA] = useState<TriwulanKey>('T1');
  const [periodB, setPeriodB] = useState<TriwulanKey>('T2');

  // Chart settings
  const [chartViewMode, setChartViewMode] = useState<'rerata' | 'dimension' | 'multiline'>('rerata');
  const [selectedChartAspectId, setSelectedChartAspectId] = useState<string>('kognitif');

  // Accordion state for indicators drilldown
  const [expandedAspects, setExpandedAspects] = useState<Record<string, boolean>>({
    kognitif: true,
    afektif: true
  });

  const toggleAspect = (aspectId: string) => {
    setExpandedAspects((prev) => ({
      ...prev,
      [aspectId]: !prev[aspectId]
    }));
  };

  const expandAllAspects = () => {
    const all: Record<string, boolean> = {};
    ASPEK_LIST.forEach((a) => {
      all[a.id] = true;
    });
    setExpandedAspects(all);
  };

  const collapseAllAspects = () => {
    setExpandedAspects({});
  };

  // Preset comparison handler (Requirement 9)
  const setPreset = (a: TriwulanKey, b: TriwulanKey) => {
    setComparisonMode('two_quarters');
    setPeriodA(a);
    setPeriodB(b);
  };

  // Calculations
  const comparison = compareTwoQuarters(currentStudent, periodA, periodB);
  const allQuarters = getAllQuartersComparison(currentStudent);

  // Colors for multiline chart
  const ASPECT_LINE_COLORS: Record<string, string> = {
    kognitif: '#eab308',
    afektif: '#3b82f6',
    psikomotor: '#ef4444',
    sosial: '#64748b',
    islamicLiteracy: '#a855f7',
    bilingual: '#06b6d4',
    talents: '#0284c7',
    experience: '#f97316',
    inklusivitas: '#84cc16'
  };

  return (
    <div className="comparison-dashboard bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-6">
      {/* 1. HEADER HALAMAN & KONTROL NAVIGASI */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> HOME
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-teal-100 text-teal-800 text-xs font-bold">
                📈 SISTEM KOMPARASI PERIODE
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                PERBANDINGAN TREN NILAI ANTAR-TRIWULAN
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Analisis komparatif 9 dimensi perkembangan dan 32 indikator penilaian (Triwulan 1 s/d 4)
            </p>
          </div>
        </div>

        {/* Pemilih Siswa & Tombol Cetak */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 hidden sm:inline">Pilih Siswa:</span>
          <button
            onClick={() => {
              if (selectedStudentNo > 1) onSelectStudent(selectedStudentNo - 1);
            }}
            disabled={selectedStudentNo <= 1}
            className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
            title="Siswa Sebelumnya"
          >
            ◀
          </button>

          <select
            value={selectedStudentNo}
            onChange={(e) => onSelectStudent(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-bold border-2 border-black rounded-lg bg-white max-w-[260px] truncate shadow-xs cursor-pointer"
          >
            {students.map((s) => (
              <option key={s.no} value={s.no}>
                {s.no}. {s.nama} ({s.nis})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (selectedStudentNo < students.length) onSelectStudent(selectedStudentNo + 1);
            }}
            disabled={selectedStudentNo >= students.length}
            className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
            title="Siswa Berikutnya"
          >
            ▶
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* IDENTITAS SISWA TERPILIH (TAMPIL PADA CETAK & LAYAR) */}
      <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3.5 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Nama Peserta Didik</span>
            <span className="font-black text-slate-900 uppercase text-sm">{currentStudent.nama}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Nomor Induk (NIS)</span>
            <span className="font-mono font-bold text-slate-800">{currentStudent.nis}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Kelas & Fase</span>
            <span className="font-bold text-slate-800">{currentStudent.kelas} (Fase B)</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Tahun Pelajaran</span>
            <span className="font-bold text-emerald-800">{currentStudent.tahunAjaran}</span>
          </div>
        </div>
      </div>

      {/* 2. PANEL PILIHAN PERBANDINGAN (REQUIREMENT 9) */}
      <div className="comparison-controls bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-xl border-2 border-indigo-400 text-white shadow-md print:hidden space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide text-white">
                PILIHAN MODE PERBANDINGAN TRIWULAN
              </h3>
              <p className="text-[11px] text-indigo-300">
                Pilih opsi preset perbandingan atau atur periode khusus sesuai kebutuhan Anda:
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/40">
            {comparisonMode === 'two_quarters'
              ? `Komparasi: ${comparison.periodeA.label} vs ${comparison.periodeB.label}`
              : 'Komparasi: Seluruh Periode (T1 → T2 → T3 → T4)'}
          </span>
        </div>

        {/* Preset Buttons (Requirement 9) */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase text-indigo-200 tracking-wider block">
            Pilihan Perbandingan Cepat (Preset):
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPreset('T1', 'T2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                comparisonMode === 'two_quarters' && periodA === 'T1' && periodB === 'T2'
                  ? 'bg-amber-500 text-black border-white shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Triwulan 1 vs 2
            </button>
            <button
              onClick={() => setPreset('T2', 'T3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                comparisonMode === 'two_quarters' && periodA === 'T2' && periodB === 'T3'
                  ? 'bg-amber-500 text-black border-white shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Triwulan 2 vs 3
            </button>
            <button
              onClick={() => setPreset('T3', 'T4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                comparisonMode === 'two_quarters' && periodA === 'T3' && periodB === 'T4'
                  ? 'bg-amber-500 text-black border-white shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Triwulan 3 vs 4
            </button>
            <button
              onClick={() => setPreset('T1', 'T3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                comparisonMode === 'two_quarters' && periodA === 'T1' && periodB === 'T3'
                  ? 'bg-amber-500 text-black border-white shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Triwulan 1 vs 3
            </button>
            <button
              onClick={() => setPreset('T1', 'T4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                comparisonMode === 'two_quarters' && periodA === 'T1' && periodB === 'T4'
                  ? 'bg-amber-500 text-black border-white shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Triwulan 1 vs 4
            </button>
            <button
              onClick={() => setPreset('T2', 'T4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                comparisonMode === 'two_quarters' && periodA === 'T2' && periodB === 'T4'
                  ? 'bg-amber-500 text-black border-white shadow-md ring-2 ring-amber-300 font-black'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              Triwulan 2 vs 4
            </button>
            <button
              onClick={() => setComparisonMode('all_quarters')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                comparisonMode === 'all_quarters'
                  ? 'bg-emerald-400 text-slate-950 border-white shadow-lg ring-2 ring-emerald-300 scale-102'
                  : 'bg-teal-700/60 text-teal-200 border-teal-500/50 hover:bg-teal-700'
              }`}
            >
              <span>📊 Bandingkan Semua Triwulan (T1 → T2 → T3 → T4)</span>
            </button>
          </div>
        </div>

        {/* Custom Period Selectors (Requirement 6) */}
        {comparisonMode === 'two_quarters' && (
          <div className="bg-black/40 p-3 rounded-lg border border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* PERIODE A */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-300 block">
                PERIODE A (Dasar Evaluasi):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRIWULAN_OPTIONS.map((t) => (
                  <button
                    key={`periodA-${t.id}`}
                    onClick={() => setPeriodA(t.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                      periodA === t.id
                        ? 'bg-amber-500 text-black border-white ring-2 ring-amber-300'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* PERIODE B */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-teal-300 block">
                PERIODE B (Periode Capaian):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TRIWULAN_OPTIONS.map((t) => (
                  <button
                    key={`periodB-${t.id}`}
                    onClick={() => setPeriodB(t.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                      periodB === t.id
                        ? 'bg-teal-400 text-black border-white ring-2 ring-teal-300'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. RINGKASAN PERKEMBANGAN SISWA (REQUIREMENT 11) */}
      {comparisonMode === 'two_quarters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                RINGKASAN PERKEMBANGAN SISWA ({comparison.periodeA.label} VS {comparison.periodeB.label})
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-600">
              Evaluasi 9 Dimensi Lengkap
            </span>
          </div>

          {/* KPI Cards: Naik, Stagnan, Turun, Delta Rerata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Card Naik */}
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-800 uppercase">
                  ✓ Mengalami Kenaikan
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-2xl font-black text-emerald-700 my-1">
                {comparison.naikCount} <span className="text-xs font-bold text-emerald-900">Dimensi</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                Capaian meningkat positif
              </span>
            </div>

            {/* Card Stagnan */}
            <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-800 uppercase">
                  → Stagnan (Tetap)
                </span>
                <Activity className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-2xl font-black text-blue-700 my-1">
                {comparison.stagnanCount} <span className="text-xs font-bold text-blue-900">Dimensi</span>
              </div>
              <span className="text-[10px] text-blue-700 font-semibold block">
                Konsisten stabil sesuai periode lalu
              </span>
            </div>

            {/* Card Turun */}
            <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-rose-800 uppercase">
                  ↓ Mengalami Penurunan
                </span>
                <TrendingDown className="w-4 h-4 text-rose-700" />
              </div>
              <div className="text-2xl font-black text-rose-700 my-1">
                {comparison.turunCount} <span className="text-xs font-bold text-rose-900">Dimensi</span>
              </div>
              <span className="text-[10px] text-rose-700 font-semibold block">
                Perlu fokus pendampingan
              </span>
            </div>

            {/* Card Delta Rerata */}
            <div className={`border-2 rounded-xl p-3 shadow-xs ${
              comparison.statusRerata === 'NAIK'
                ? 'bg-teal-50 border-teal-500 text-teal-950'
                : comparison.statusRerata === 'TURUN'
                ? 'bg-amber-50 border-amber-500 text-amber-950'
                : 'bg-slate-50 border-slate-400 text-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase">
                  Pertumbuhan Rerata
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/10">
                  {comparison.statusRerata}
                </span>
              </div>
              <div className="text-xl font-black my-1 flex items-center gap-1">
                <span>{comparison.selisihRerata >= 0 ? `+${comparison.selisihRerata}` : comparison.selisihRerata}</span>
                <span className="text-xs font-bold">
                  ({comparison.persenRerata >= 0 ? `+${comparison.persenRerata}` : comparison.persenRerata}%)
                </span>
              </div>
              <span className="text-[10px] font-medium block">
                Dari {comparison.rerataA} ke {comparison.rerataB} (skala 5.0)
              </span>
            </div>
          </div>

          {/* Highlight Aspek & Indikator dengan Perubahan Terbesar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Kenaikan Terbesar */}
            <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-xl">🏆</span>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase block">
                  ASPEK DENGAN KENAIKAN TERBESAR:
                </span>
                <div className="font-black text-slate-900 text-sm">
                  {comparison.highestGrowthAspect.nama}{' '}
                  <span className="text-emerald-700 font-extrabold">
                    ({comparison.highestGrowthAspect.selisih >= 0 ? `+${comparison.highestGrowthAspect.selisih}` : comparison.highestGrowthAspect.selisih})
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Indikator terkuat: <strong>{comparison.highestGrowthIndicator.nama}</strong> ({comparison.highestGrowthIndicator.selisih >= 0 ? `+${comparison.highestGrowthIndicator.selisih}` : comparison.highestGrowthIndicator.selisih})
                </p>
              </div>
            </div>

            {/* Penurunan / Area Bimbingan Terbesar */}
            <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5">
              <span className="text-xl">🎯</span>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase block">
                  ASPEK DENGAN PENURUNAN TERBESAR / FOKUS BIMBINGAN:
                </span>
                <div className="font-black text-slate-900 text-sm">
                  {comparison.biggestDropAspect.nama}{' '}
                  <span className={comparison.biggestDropAspect.selisih < 0 ? 'text-rose-700 font-extrabold' : 'text-slate-700 font-extrabold'}>
                    ({comparison.biggestDropAspect.selisih >= 0 ? `+${comparison.biggestDropAspect.selisih}` : comparison.biggestDropAspect.selisih})
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Indikator prioritas pendampingan: <strong>{comparison.biggestDropIndicator.nama}</strong> ({comparison.biggestDropIndicator.selisih >= 0 ? `+${comparison.biggestDropIndicator.selisih}` : comparison.biggestDropIndicator.selisih})
                </p>
              </div>
            </div>
          </div>

          {/* 4. DESKRIPSI OTOMATIS BERDASARKAN HASIL PERBANDINGAN (REQUIREMENT 12) */}
          <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-black text-xs uppercase tracking-wide">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>DESKRIPSI OTOMATIS REFLEKSI PERKEMBANGAN SISWA:</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
              "{comparison.deskripsiOtomatis}"
            </p>
          </div>
        </div>
      )}

      {/* 5. TAMPILAN GRAFIK PERKEMBANGAN DENGAN RECHARTS (REQUIREMENT 10) */}
      <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm print:break-inside-avoid">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                📊 GRAFIK PERKEMBANGAN NILAI SISWA (RECHARTS)
              </h4>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Visualisasi tren perkembangan nilai berdasarkan data riil dari Triwulan 1 s/d Triwulan 4 (Skala 1.0 - 5.0)
            </p>
          </div>

          {/* Mode Switcher Grafis */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-300 shadow-2xs print:hidden">
            <button
              onClick={() => setChartViewMode('rerata')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                chartViewMode === 'rerata'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Rerata Keseluruhan</span>
            </button>
            <button
              onClick={() => setChartViewMode('dimension')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                chartViewMode === 'dimension'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Per Aspek Dimensi</span>
            </button>
            <button
              onClick={() => setChartViewMode('multiline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                chartViewMode === 'multiline'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Semua 9 Dimensi</span>
            </button>
          </div>
        </div>

        {/* Pemilih Aspek jika Mode 'dimension' aktif */}
        {chartViewMode === 'dimension' && (
          <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 print:hidden text-xs">
            <span className="font-bold text-slate-700">Pilih Dimensi Perkembangan:</span>
            <select
              value={selectedChartAspectId}
              onChange={(e) => setSelectedChartAspectId(e.target.value)}
              className="px-3 py-1 bg-slate-50 border-2 border-teal-600 rounded-lg font-bold text-slate-900 cursor-pointer text-xs"
            >
              {ASPEK_LIST.map((asp) => (
                <option key={asp.id} value={asp.id}>
                  Dimensi {asp.no}: {asp.nama} ({asp.kategori})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Area Grafik Recharts */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          {/* Status Data Belum Tersedia jika ada quarter kosong */}
          {allQuarters.chartData.some((d) => !d.hasData) && (
            <div className="mb-2 p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Catatan: Beberapa periode belum memiliki input nilai lengkap (ditandai 'Data belum tersedia' dan tidak dihitung nol).
              </span>
            </div>
          )}

          <div className="w-full h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === 'rerata' ? (
                <AreaChart
                  data={allQuarters.chartData}
                  margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorRerata" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(val: any) => [val !== null ? `${val} / 5.0` : 'Data belum tersedia', 'Rerata Nilai']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <ReferenceLine
                    y={3.5}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: 'KKM 3.5', position: 'insideTopLeft', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rerata"
                    name="Rerata Skor"
                    stroke="#0f766e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRerata)"
                    dot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: '#042f2e', stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </AreaChart>
              ) : chartViewMode === 'dimension' ? (
                <LineChart
                  data={allQuarters.chartData}
                  margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(val: any) => [
                      val !== null ? `${val} / 5.0` : 'Data belum tersedia',
                      ASPEK_LIST.find((a) => a.id === selectedChartAspectId)?.nama || 'Skor'
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <ReferenceLine
                    y={3.5}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: 'KKM 3.5', position: 'insideTopLeft', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedChartAspectId === 'islamicLiteracy' ? 'islamic_literacy' : selectedChartAspectId}
                    name={ASPEK_LIST.find((a) => a.id === selectedChartAspectId)?.nama}
                    stroke={ASPECT_LINE_COLORS[selectedChartAspectId] || '#2563eb'}
                    strokeWidth={3.5}
                    dot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              ) : (
                <LineChart
                  data={allQuarters.chartData}
                  margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [val !== null ? `${val} / 5.0` : 'Belum tersedia', name]}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <RechartsLegend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="kognitif" name="Kognitif" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="afektif" name="Afektif" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="psikomotor" name="Psikomotor" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="sosial" name="Sosial" stroke="#64748b" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="islamic_literacy" name="Islamic Lit." stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="bilingual" name="Bilingual" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="talents" name="Talents" stroke="#0284c7" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="experience" name="Experience" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                  <Line type="monotone" dataKey="inklusivitas" name="Inklusivitas" stroke="#84cc16" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. TABEL KOMPARASI 2 TRIWULAN (REQUIREMENTS 6, 7, 8) */}
      {comparisonMode === 'two_quarters' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase">
                TABEL PERBANDINGAN NILAI LENGKAP SAMPAI LEVEL INDIKATOR
              </h3>
              <p className="text-xs text-slate-500">
                Membandingkan nilai numerik aktual {comparison.periodeA.label} vs {comparison.periodeB.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={expandAllAspects}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 border rounded cursor-pointer"
              >
                + Buka Semua Indikator
              </button>
              <button
                onClick={collapseAllAspects}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 border rounded cursor-pointer"
              >
                - Tutup Semua Indikator
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border-2 border-black rounded-lg">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-center font-bold">
                  <th className="p-2 border-r border-slate-700 w-10">NO</th>
                  <th className="p-2 border-r border-slate-700 min-w-[180px] text-left">DIMENSI / INDIKATOR</th>
                  <th className="p-2 border-r border-slate-700 w-28 bg-amber-950/80">
                    {comparison.periodeA.label}
                  </th>
                  <th className="p-2 border-r border-slate-700 w-28 bg-teal-950/80">
                    {comparison.periodeB.label}
                  </th>
                  <th className="p-2 border-r border-slate-700 w-28">PERUBAHAN</th>
                  <th className="p-2 border-r border-slate-700 w-28">STATUS</th>
                  <th className="p-2 w-24">DETAIL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {comparison.aspects.map((asp) => {
                  const isExpanded = expandedAspects[asp.id] ?? false;

                  return (
                    <React.Fragment key={asp.id}>
                      {/* BARIS UTAMA DIMENSI ASPEK */}
                      <tr className="bg-slate-100/90 font-bold hover:bg-slate-200/80 transition">
                        <td className="p-2 text-center border-r border-slate-300">{asp.no}</td>
                        <td className="p-2 border-r border-slate-300 font-black text-slate-900 uppercase">
                          <div className="flex items-center justify-between">
                            <span>{asp.nama}</span>
                            <span className="text-[10px] text-slate-500 font-semibold lowercase">
                              ({asp.kategori})
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center border-r border-slate-300 font-mono font-bold">
                          {asp.hasDataA ? `${asp.scoreA} (${asp.gradeA})` : <span className="text-slate-400">Belum ada</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-300 font-mono font-bold">
                          {asp.hasDataB ? `${asp.scoreB} (${asp.gradeB})` : <span className="text-slate-400">Belum ada</span>}
                        </td>
                        <td className="p-2 text-center border-r border-slate-300 font-mono font-black">
                          <span className={asp.status === 'NAIK' ? 'text-emerald-700' : asp.status === 'TURUN' ? 'text-rose-700' : 'text-slate-700'}>
                            {asp.selisih >= 0 ? `+${asp.selisih}` : asp.selisih}
                          </span>
                        </td>
                        <td className="p-2 text-center border-r border-slate-300">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black uppercase text-white ${
                              asp.status === 'NAIK'
                                ? 'bg-emerald-600'
                                : asp.status === 'TURUN'
                                ? 'bg-rose-600'
                                : 'bg-slate-600'
                            }`}
                          >
                            <span>{asp.statusSymbol}</span>
                            <span>{asp.status}</span>
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => toggleAspect(asp.id)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10px] font-bold flex items-center justify-center gap-1 w-full cursor-pointer shadow-2xs"
                          >
                            <span>{isExpanded ? 'Tutup' : 'Rincian'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* BARIS SUB-INDIKATOR (REQUIREMENT 8) */}
                      {isExpanded &&
                        asp.indicators.map((ind) => (
                          <tr key={ind.key} className="bg-white hover:bg-slate-50 text-[11px]">
                            <td className="p-1.5 text-center text-slate-400 border-r border-slate-200">
                              •
                            </td>
                            <td className="p-1.5 pl-6 border-r border-slate-200">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-black border">
                                  {ind.kode}
                                </span>
                                <span>{ind.nama}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 pl-5.5">{ind.deskripsi}</p>
                            </td>
                            <td className="p-1.5 text-center border-r border-slate-200 font-mono">
                              <span className="font-bold text-slate-700">{ind.ratingA}</span>{' '}
                              <span className="text-[10px] text-slate-500">({ind.scoreA}.0)</span>
                            </td>
                            <td className="p-1.5 text-center border-r border-slate-200 font-mono">
                              <span className="font-bold text-slate-700">{ind.ratingB}</span>{' '}
                              <span className="text-[10px] text-slate-500">({ind.scoreB}.0)</span>
                            </td>
                            <td className="p-1.5 text-center border-r border-slate-200 font-mono font-bold">
                              <span className={ind.status === 'NAIK' ? 'text-emerald-700' : ind.status === 'TURUN' ? 'text-rose-700' : 'text-slate-600'}>
                                {ind.selisih >= 0 ? `+${ind.selisih}` : ind.selisih}
                              </span>
                            </td>
                            <td className="p-1.5 text-center border-r border-slate-200">
                              <span
                                className={`inline-flex items-center gap-0.5 px-2 py-0.2 rounded text-[10px] font-bold ${
                                  ind.status === 'NAIK'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : ind.status === 'TURUN'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                              >
                                <span>{ind.statusSymbol}</span>
                                <span>{ind.status}</span>
                              </span>
                            </td>
                            <td className="p-1.5 text-center text-slate-400 text-[10px]">
                              -
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 7. TABEL KOMPARASI SEMUA TRIWULAN (T1 -> T2 -> T3 -> T4) (REQUIREMENT 9) */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 uppercase">
                REKAPITULASI PERKEMBANGAN SEPANJANG TAHUN (T1 → T2 → T3 → T4)
              </h3>
              <p className="text-xs text-slate-500">
                Melihat alur progres dan tren nilai siswa secara komprehensif dari awal hingga akhir tahun
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-teal-100 text-teal-800 rounded-full border border-teal-300">
              4 Periode Triwulan
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-black rounded-lg">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-center font-bold">
                  <th className="p-2 border-r border-slate-700 w-10">NO</th>
                  <th className="p-2 border-r border-slate-700 min-w-[180px] text-left">DIMENSI ASPEK</th>
                  <th className="p-2 border-r border-slate-700 w-24 bg-amber-950/80">TRIWULAN 1</th>
                  <th className="p-2 border-r border-slate-700 w-24 bg-emerald-950/80">TRIWULAN 2</th>
                  <th className="p-2 border-r border-slate-700 w-24 bg-blue-950/80">TRIWULAN 3</th>
                  <th className="p-2 border-r border-slate-700 w-24 bg-purple-950/80">TRIWULAN 4</th>
                  <th className="p-2 border-r border-slate-700 w-28">TREN PERTUMBUHAN</th>
                  <th className="p-2 w-28">STATUS AKHIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {allQuarters.aspects.map((asp) => (
                  <tr key={asp.id} className="hover:bg-slate-50">
                    <td className="p-2 text-center font-bold border-r border-slate-200">{asp.no}</td>
                    <td className="p-2 font-black text-slate-900 uppercase border-r border-slate-200">
                      {asp.nama}
                    </td>
                    <td className="p-2 text-center border-r border-slate-200 font-mono font-bold">
                      {asp.t1 !== null ? `${asp.t1}` : <span className="text-slate-400">Belum ada</span>}
                    </td>
                    <td className="p-2 text-center border-r border-slate-200 font-mono font-bold">
                      {asp.t2 !== null ? `${asp.t2}` : <span className="text-slate-400">Belum ada</span>}
                    </td>
                    <td className="p-2 text-center border-r border-slate-200 font-mono font-bold">
                      {asp.t3 !== null ? `${asp.t3}` : <span className="text-slate-400">Belum ada</span>}
                    </td>
                    <td className="p-2 text-center border-r border-slate-200 font-mono font-bold">
                      {asp.t4 !== null ? `${asp.t4}` : <span className="text-slate-400">Belum ada</span>}
                    </td>
                    <td className="p-2 text-center border-r border-slate-200 font-mono font-black">
                      <span className={asp.statusAkhir === 'NAIK' ? 'text-emerald-700' : asp.statusAkhir === 'TURUN' ? 'text-rose-700' : 'text-slate-700'}>
                        {asp.selisihTotal >= 0 ? `+${asp.selisihTotal}` : asp.selisihTotal}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-black uppercase text-white ${
                          asp.statusAkhir === 'NAIK'
                            ? 'bg-emerald-600'
                            : asp.statusAkhir === 'TURUN'
                            ? 'bg-rose-600'
                            : 'bg-slate-600'
                        }`}
                      >
                        <span>{asp.statusAkhir === 'NAIK' ? '↑' : asp.statusAkhir === 'TURUN' ? '↓' : '→'}</span>
                        <span>{asp.statusAkhir}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
