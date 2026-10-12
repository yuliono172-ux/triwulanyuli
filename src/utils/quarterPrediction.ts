import {
  SiswaData,
  TriwulanKey,
  ASPEK_LIST,
  GRADE_WEIGHTS
} from '../types/rapor';

export interface DimensionPredictionItem {
  id: string;
  no: number;
  nama: string;
  kategori: string;
  colorBorder: string;
  colorBg: string;
  currentScore: number;
  currentGrade: string;
  historicalDelta: number;
  momentum: number;
  predictedScore: number;
  predictedGrade: string;
  scoreDiff: number;
  percentChange: number;
  status: 'MELOJIT' | 'MENINGKAT' | 'STABIL' | 'PERLU_PENDAMPINGAN';
  insight: string;
}

export interface StudentQuarterPredictionResult {
  currentQuarterLabel: string;
  targetQuarterLabel: string;
  targetQuarterShort: string;
  currentAverageScore: number;
  currentOverallGrade: string;
  predictedAverageScore: number;
  predictedOverallGrade: string;
  averageDiff: number;
  averagePercentChange: number;
  confidenceLevel: 'Tinggi' | 'Moderat' | 'Dini';
  readinessStatus:
    | 'Sangat Siap Melompat'
    | 'Berkembang Positif'
    | 'Stabil Konsisten'
    | 'Memerlukan Stimulasi Intensif';
  summaryDescription: string;
  topAcceleratingAspects: DimensionPredictionItem[];
  priorityInterventionAspects: DimensionPredictionItem[];
  actionPlanTeacher: string[];
  actionPlanParents: string[];
  aspectPredictions: DimensionPredictionItem[];
}

export const getGradeFromScore = (score: number | null): string => {
  if (score === null || isNaN(score)) return '-';
  if (score >= 4.5) return 'Exceptional';
  if (score >= 3.5) return 'A';
  if (score >= 2.5) return 'B';
  if (score >= 1.5) return 'C';
  return 'Defisit';
};

export const getGradeLabelDescription = (grade: string): string => {
  switch (grade) {
    case 'Exceptional':
      return 'Luar Biasa (Melampaui Target Usia)';
    case 'A':
      return 'Sangat Baik (Unggul & Mandiri)';
    case 'B':
      return 'Baik (Berkembang Sesuai Harapan)';
    case 'C':
      return 'Mulai Berkembang (Perlu Latihan)';
    default:
      return 'Perlu Pendampingan Khusus';
  }
};

/**
 * Memprediksi capaian belajar siswa pada triwulan berikutnya berdasarkan tren
 * kenaikan/pertumbuhan historis pada 9 dimensi Spider Chart.
 */
export const predictNextQuarterAchievement = (
  siswa: SiswaData,
  activeTriwulan: TriwulanKey,
  historicalQuarters: Array<Record<string, any>>
): StudentQuarterPredictionResult => {
  // Label periode triwulan
  let currentQuarterLabel = 'Triwulan I (Awal)';
  let targetQuarterLabel = 'Triwulan II (Pertengahan)';
  let targetQuarterShort = 'TW 2';
  let confidenceLevel: 'Tinggi' | 'Moderat' | 'Dini' = 'Dini';

  if (activeTriwulan === 'T1') {
    currentQuarterLabel = 'Triwulan I (Awal)';
    targetQuarterLabel = 'Triwulan II (Pertengahan)';
    targetQuarterShort = 'TW 2';
    confidenceLevel = 'Dini';
  } else if (activeTriwulan === 'T2') {
    currentQuarterLabel = 'Triwulan II (Pertengahan)';
    targetQuarterLabel = 'Triwulan III (Penguatan)';
    targetQuarterShort = 'TW 3';
    confidenceLevel = 'Moderat';
  } else if (activeTriwulan === 'T3') {
    currentQuarterLabel = 'Triwulan III (Penguatan)';
    targetQuarterLabel = 'Triwulan IV (Evaluasi Akhir)';
    targetQuarterShort = 'TW 4';
    confidenceLevel = 'Tinggi';
  } else {
    currentQuarterLabel = 'Triwulan IV (Evaluasi Akhir)';
    targetQuarterLabel = 'Fase Lanjutan (Triwulan I Tahun Ajaran Baru)';
    targetQuarterShort = 'TW 1 Lanjutan';
    confidenceLevel = 'Tinggi';
  }

  // Hitung prediksi tiap dimensi
  const aspectPredictions: DimensionPredictionItem[] = ASPEK_LIST.map((asp) => {
    // Ambil deret nilai historis
    const q1 = Number(historicalQuarters[0]?.[asp.id] ?? historicalQuarters[0]?.['islamic_literacy'] ?? 3.5);
    const q2 = Number(historicalQuarters[1]?.[asp.id] ?? historicalQuarters[1]?.['islamic_literacy'] ?? 3.5);
    const q3 = Number(historicalQuarters[2]?.[asp.id] ?? historicalQuarters[2]?.['islamic_literacy'] ?? 3.5);
    const q4 = Number(historicalQuarters[3]?.[asp.id] ?? historicalQuarters[3]?.['islamic_literacy'] ?? 3.5);

    let currentScore = q4;
    let momentum = 0;
    let historicalDelta = 0;

    if (activeTriwulan === 'T1') {
      currentScore = q1;
      // Pada T1, momentum estimasi didasarkan pada kesiapan dasar
      historicalDelta = 0.18;
      momentum = 0.18;
    } else if (activeTriwulan === 'T2') {
      currentScore = q2;
      historicalDelta = Number((q2 - q1).toFixed(2));
      momentum = Number((historicalDelta * 0.75 + 0.08).toFixed(2));
    } else if (activeTriwulan === 'T3') {
      currentScore = q3;
      const d1 = q3 - q2;
      const d0 = q2 - q1;
      historicalDelta = Number(d1.toFixed(2));
      momentum = Number((d1 * 0.65 + d0 * 0.35).toFixed(2));
    } else {
      currentScore = q4;
      const d2 = q4 - q3;
      const d1 = q3 - q2;
      const d0 = q2 - q1;
      historicalDelta = Number(d2.toFixed(2));
      momentum = Number((d2 * 0.5 + d1 * 0.3 + d0 * 0.2).toFixed(2));
    }

    // Koreksi pembobotan skor (diminishing return jika sudah mendekati 5.0)
    let projectedAddition = 0;
    if (momentum > 0) {
      const headroom = Math.max(0, 5.0 - currentScore);
      // Batasi akselerasi agar realistis
      projectedAddition = Math.min(momentum * 0.85, headroom * 0.65, 0.42);
      if (projectedAddition < 0.05 && headroom > 0.1) {
        projectedAddition = 0.08;
      }
    } else if (momentum < 0) {
      // Penurunan dicegah drop drastis dengan dukungan bimbingan teratur
      projectedAddition = Math.max(momentum * 0.65, -0.32);
    } else {
      // Pertumbuhan natural rata-rata
      projectedAddition = currentScore < 4.8 ? 0.08 : 0.03;
    }

    const rawPredicted = Math.max(1.0, Math.min(5.0, currentScore + projectedAddition));
    const predictedScore = Number(rawPredicted.toFixed(2));
    const scoreDiff = Number((predictedScore - currentScore).toFixed(2));
    const percentChange = currentScore > 0 ? Number(((scoreDiff / currentScore) * 100).toFixed(1)) : 0;

    const currentGrade = getGradeFromScore(currentScore);
    const predictedGrade = getGradeFromScore(predictedScore);

    // Tentukan status
    let status: 'MELOJIT' | 'MENINGKAT' | 'STABIL' | 'PERLU_PENDAMPINGAN' = 'STABIL';
    if (scoreDiff >= 0.25) {
      status = 'MELOJIT';
    } else if (scoreDiff >= 0.06) {
      status = 'MENINGKAT';
    } else if (scoreDiff >= -0.05) {
      status = 'STABIL';
    } else {
      status = 'PERLU_PENDAMPINGAN';
    }

    // Insight khusus dimensi
    let insight = '';
    if (status === 'MELOJIT') {
      insight = `Momentum sangat tinggi. Berikan pengayaan materi dan tantangan mandiri agar melompat ke predikat ${predictedGrade}.`;
    } else if (status === 'MENINGKAT') {
      insight = `Tren pertumbuhan stabil positif (+${scoreDiff}). Lanjutkan pembiasaan terstruktur di kelas dan rumah.`;
    } else if (status === 'STABIL') {
      insight = `Capaian terjaga konsisten di level ${currentGrade}. Perlu stimulasi variatif agar memicu motivasi baru.`;
    } else {
      insight = `Terindikasi potensi pelambatan (-${Math.abs(scoreDiff)}). Diperlukan pendampingan personal dan pendekatan ramah anak.`;
    }

    return {
      id: asp.id,
      no: asp.no,
      nama: asp.nama,
      kategori: asp.kategori,
      colorBorder: asp.colorBorder,
      colorBg: asp.colorBg,
      currentScore,
      currentGrade,
      historicalDelta,
      momentum,
      predictedScore,
      predictedGrade,
      scoreDiff,
      percentChange,
      status,
      insight
    };
  });

  // Hitung rerata skor saat ini dan prediksi
  const currentAverageScore = Number(
    (aspectPredictions.reduce((acc, a) => acc + a.currentScore, 0) / 9).toFixed(2)
  );
  const predictedAverageScore = Number(
    (aspectPredictions.reduce((acc, a) => acc + a.predictedScore, 0) / 9).toFixed(2)
  );

  const averageDiff = Number((predictedAverageScore - currentAverageScore).toFixed(2));
  const averagePercentChange = currentAverageScore > 0
    ? Number(((averageDiff / currentAverageScore) * 100).toFixed(1))
    : 0;

  const currentOverallGrade = getGradeFromScore(currentAverageScore);
  const predictedOverallGrade = getGradeFromScore(predictedAverageScore);

  // Status kesiapan
  let readinessStatus:
    | 'Sangat Siap Melompat'
    | 'Berkembang Positif'
    | 'Stabil Konsisten'
    | 'Memerlukan Stimulasi Intensif' = 'Berkembang Positif';

  if (averageDiff >= 0.2) {
    readinessStatus = 'Sangat Siap Melompat';
  } else if (averageDiff >= 0.06) {
    readinessStatus = 'Berkembang Positif';
  } else if (averageDiff >= -0.05) {
    readinessStatus = 'Stabil Konsisten';
  } else {
    readinessStatus = 'Memerlukan Stimulasi Intensif';
  }

  // Aspek lonjakan tertinggi & aspek prioritas intervensi
  const sortedByGrowth = [...aspectPredictions].sort((a, b) => b.scoreDiff - a.scoreDiff);
  const topAcceleratingAspects = sortedByGrowth.slice(0, 3);

  const sortedByUrgency = [...aspectPredictions].sort((a, b) => a.predictedScore - b.predictedScore);
  const priorityInterventionAspects = sortedByUrgency.slice(0, 2);

  const topAspectNames = topAcceleratingAspects.map((a) => a.nama).join(', ');
  const priorityAspectNames = priorityInterventionAspects.map((a) => a.nama).join(' serta ');

  // Deskripsi ringkasan naratif
  const summaryDescription =
    `Berdasarkan analisis tren kenaikan historis pada Spider Chart, ananda ${siswa.nama} diproyeksikan memiliki potensi pertumbuhan rerata sebesar ` +
    `${averageDiff >= 0 ? `+${averageDiff}` : averageDiff} poin (${averagePercentChange >= 0 ? `+${averagePercentChange}` : averagePercentChange}%) ` +
    `menuju skor estimasi ${predictedAverageScore} / 5.0 (Predikat ${predictedOverallGrade}) pada ${targetQuarterLabel}. ` +
    `Peluang akselerasi tertinggi terpantau pada dimensi ${topAspectNames}, sementara dimensi ${priorityAspectNames} ` +
    `membutuhkan pendampingan kolaboratif agar terhindar dari potensi hambatan belajar.`;

  // Rencana aksi guru
  const actionPlanTeacher = [
    `Fokuskan pengayaan pembelajaran interaktif pada dimensi unggulan (${topAcceleratingAspects[0]?.nama || 'Kognitif'}) untuk mempertahankan rasa percaya diri siswa.`,
    `Berikan stimulasi bertahap pada dimensi prioritas (${priorityInterventionAspects[0]?.nama || 'Sosial'}) melalui kerja kelompok kecil yang suportif.`,
    `Lakukan monitoring berkala setiap dua pekan menggunakan rubrik indikator performa untuk memvalidasi pencapaian riil terhadap target prediksi.`
  ];

  // Rencana aksi orang tua
  const actionPlanParents = [
    `Apresiasi setiap pencapaian kecil anak di rumah untuk menumbuhkan motivasi intrinsik dan kecintaan belajar berkelanjutan.`,
    `Sediakan waktu 15–20 menit sehari untuk pendampingan santai tanpa tekanan pada area ${priorityInterventionAspects[0]?.nama || 'literasi dan kebiasaan harian'}.`,
    `Jalin komunikasi rutin dengan guru kelas mengenai perkembangan suasana hati dan kesiapan anak saat menghadapi kegiatan sekolah.`
  ];

  return {
    currentQuarterLabel,
    targetQuarterLabel,
    targetQuarterShort,
    currentAverageScore,
    currentOverallGrade,
    predictedAverageScore,
    predictedOverallGrade,
    averageDiff,
    averagePercentChange,
    confidenceLevel,
    readinessStatus,
    summaryDescription,
    topAcceleratingAspects,
    priorityInterventionAspects,
    actionPlanTeacher,
    actionPlanParents,
    aspectPredictions
  };
};
