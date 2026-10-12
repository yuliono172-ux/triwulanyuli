import {
  StudentRecord,
  SiswaAssessmentRecord,
  TriwulanKey,
  TRIWULAN_OPTIONS,
  ASPEK_LIST,
  GRADE_WEIGHTS,
  AspectAnalysis,
  SpiderAnalysisResult,
  QuarterComparisonItem,
  IndicatorComparisonItem,
  QuarterComparisonResult,
  AllQuartersAspectRow
} from '../types/rapor';

export const getAspectNumericGrade = (val: string): number => {
  return GRADE_WEIGHTS[val] || 0;
};

export const calculateAspectScoreFromRecord = (
  aspectRecord: Record<string, string>,
  keys: string[]
): { score: number | null; hasData: boolean; average: number } => {
  const filledValues = keys
    .map((k) => aspectRecord[k])
    .filter((v) => Boolean(v && GRADE_WEIGHTS[v]));

  if (filledValues.length === 0) {
    return { score: null, hasData: false, average: 0 };
  }

  const sum = filledValues.reduce((acc, v) => acc + (GRADE_WEIGHTS[v] || 0), 0);
  const avg = sum / filledValues.length;
  return {
    score: Number(avg.toFixed(2)),
    hasData: true,
    average: avg
  };
};

export const getGradeFromScore = (score: number | null): string => {
  if (score === null) return '-';
  if (score >= 4.5) return 'Exceptional';
  if (score >= 3.5) return 'A';
  if (score >= 2.5) return 'B';
  if (score >= 1.5) return 'C';
  return 'Defisit';
};

export const getStudentSpiderAnalysis = (
  assessment: SiswaAssessmentRecord,
  namaSiswa: string = 'Siswa'
): SpiderAnalysisResult => {
  let totalScoreSum = 0;
  let hasAnyData = false;
  let validAspectCount = 0;

  const aspects: AspectAnalysis[] = ASPEK_LIST.map((asp) => {
    const sec = (assessment[asp.id as keyof SiswaAssessmentRecord] as Record<string, string>) || {};
    const filledIndicators = asp.indikatorList.map((ind) => {
      const rating = sec[ind.key] || '';
      const score = GRADE_WEIGHTS[rating] || 0;
      return {
        ...ind,
        rating,
        score
      };
    });

    const activeIndicators = filledIndicators.filter((i) => i.score > 0);
    const hasData = activeIndicators.length > 0;

    let score = 0;
    let percentage = 0;
    let grade = '-';

    if (hasData) {
      hasAnyData = true;
      const sum = activeIndicators.reduce((acc, curr) => acc + curr.score, 0);
      score = Number((sum / activeIndicators.length).toFixed(2));
      percentage = Math.round((score / 5) * 100);
      grade = getGradeFromScore(score);
      totalScoreSum += score;
      validAspectCount += 1;
    }

    const strengthIndicators = filledIndicators
      .filter((ind) => ind.rating === 'Exceptional' || ind.rating === 'A')
      .map((ind) => `${ind.nama} (${ind.rating})`);

    const weaknessIndicators = filledIndicators
      .filter((ind) => ind.rating === 'Defisit' || ind.rating === 'C')
      .map((ind) => `${ind.nama} (${ind.rating})`);

    let explanation = '';
    if (!hasData) {
      explanation = 'Data penilaian untuk dimensi ini belum diisi.';
    } else if (grade === 'Exceptional') {
      explanation = `Capaian luar biasa (skor ${score} / 5.0). Seluruh indikator dikuasai dengan konsisten melampaui harapan usia.`;
    } else if (grade === 'A') {
      explanation = `Capaian sangat baik (skor ${score} / 5.0). Menunjukkan keunggulan menonjol dengan kemandirian tinggi.`;
    } else if (grade === 'B') {
      explanation = `Capaian berkembang sesuai tahapan (skor ${score} / 5.0). Karakter dan keterampilan berkembang stabil.`;
    } else if (grade === 'C') {
      explanation = `Mulai berkembang (skor ${score} / 5.0). Memerlukan stimulasi aktif dan latihan bertahap.`;
    } else {
      explanation = `Perlu pendampingan khusus (skor ${score} / 5.0). Memerlukan bimbingan intensif dan kerjasama aktif orang tua di rumah.`;
    }

    return {
      id: asp.id,
      no: asp.no,
      nama: asp.nama,
      kategori: asp.kategori,
      colorBg: asp.colorBg,
      colorBorder: asp.colorBorder,
      score,
      percentage,
      grade,
      hasData,
      indicators: filledIndicators,
      strengthIndicators,
      weaknessIndicators,
      explanation
    };
  });

  const averageScore = validAspectCount > 0
    ? Number((totalScoreSum / validAspectCount).toFixed(2))
    : 0;
  const averagePercentage = Math.round((averageScore / 5) * 100);
  const overallGrade = getGradeFromScore(hasAnyData ? averageScore : null);

  const sortedAspects = [...aspects].filter((a) => a.hasData).sort((a, b) => b.score - a.score);
  const topStrengths = sortedAspects.slice(0, 3);
  const strengthIds = new Set(topStrengths.map((s) => s.id));
  
  // Ambil kelemahan dari aspek yang tidak masuk keunggulan
  const remainingForWeaknesses = [...sortedAspects].filter((a) => !strengthIds.has(a.id)).reverse();
  const topWeaknesses = (remainingForWeaknesses.length > 0 ? remainingForWeaknesses : [...sortedAspects].reverse()).slice(0, 3);

  const strengthsSummary = topStrengths.length > 0
    ? `Ananda menunjukkan keunggulan paling menonjol pada aspek ${topStrengths.map((s) => `${s.nama} (${s.score}/5.0)`).join(', ')}.`
    : 'Belum ada data capaian kekuatan yang tercatat.';

  const weaknessesSummary = topWeaknesses.length > 0
    ? `Fokus stimulasi dan bimbingan terarah disarankan pada aspek ${topWeaknesses.map((w) => `${w.nama} (${w.score}/5.0)`).join(', ')}.`
    : 'Seluruh aspek berada dalam capaian memuaskan.';

  return {
    aspects,
    averageScore,
    averagePercentage,
    overallGrade,
    hasData: hasAnyData,
    topStrengths,
    topWeaknesses,
    strengthsSummary,
    weaknessesSummary
  };
};

export const compareTwoQuarters = (
  student: StudentRecord,
  quarterAId: TriwulanKey,
  quarterBId: TriwulanKey
): QuarterComparisonResult => {
  const periodeA = TRIWULAN_OPTIONS.find((t) => t.id === quarterAId) || TRIWULAN_OPTIONS[0];
  const periodeB = TRIWULAN_OPTIONS.find((t) => t.id === quarterBId) || TRIWULAN_OPTIONS[1];

  const dataA = student.triwulan[quarterAId] || {};
  const dataB = student.triwulan[quarterBId] || {};

  const analysisA = getStudentSpiderAnalysis(dataA, student.nama);
  const analysisB = getStudentSpiderAnalysis(dataB, student.nama);

  let naikCount = 0;
  let stagnanCount = 0;
  let turunCount = 0;

  const allIndicatorComparisons: IndicatorComparisonItem[] = [];

  const aspectComparisons: QuarterComparisonItem[] = ASPEK_LIST.map((asp) => {
    const aspA = analysisA.aspects.find((a) => a.id === asp.id);
    const aspB = analysisB.aspects.find((a) => a.id === asp.id);

    const scoreA = aspA && aspA.hasData ? aspA.score : 0;
    const scoreB = aspB && aspB.hasData ? aspB.score : 0;
    const hasDataA = Boolean(aspA?.hasData);
    const hasDataB = Boolean(aspB?.hasData);

    const selisih = Number((scoreB - scoreA).toFixed(2));
    const persenPerubahan = scoreA > 0 ? Number(((selisih / scoreA) * 100).toFixed(1)) : 0;

    let status: 'NAIK' | 'STAGNAN' | 'TURUN' = 'STAGNAN';
    let statusSymbol = '→';

    if (selisih > 0.001) {
      status = 'NAIK';
      statusSymbol = '↑';
      naikCount += 1;
    } else if (selisih < -0.001) {
      status = 'TURUN';
      statusSymbol = '↓';
      turunCount += 1;
    } else {
      status = 'STAGNAN';
      statusSymbol = '→';
      stagnanCount += 1;
    }

    const secA = (dataA[asp.id as keyof SiswaAssessmentRecord] as Record<string, string>) || {};
    const secB = (dataB[asp.id as keyof SiswaAssessmentRecord] as Record<string, string>) || {};

    const indicators: IndicatorComparisonItem[] = asp.indikatorList.map((ind) => {
      const ratingA = secA[ind.key] || '';
      const ratingB = secB[ind.key] || '';
      const scA = GRADE_WEIGHTS[ratingA] || 0;
      const scB = GRADE_WEIGHTS[ratingB] || 0;
      const indSelisih = Number((scB - scA).toFixed(1));

      let indStatus: 'NAIK' | 'STAGNAN' | 'TURUN' = 'STAGNAN';
      let indSymbol = '→';

      if (indSelisih > 0) {
        indStatus = 'NAIK';
        indSymbol = '↑';
      } else if (indSelisih < 0) {
        indStatus = 'TURUN';
        indSymbol = '↓';
      }

      const item: IndicatorComparisonItem = {
        key: ind.key,
        kode: ind.kode,
        nama: ind.nama,
        deskripsi: ind.deskripsi,
        labelLengkap: ind.labelLengkap,
        ratingA: ratingA || '--',
        scoreA: scA,
        ratingB: ratingB || '--',
        scoreB: scB,
        selisih: indSelisih,
        status: indStatus,
        statusSymbol: indSymbol
      };
      allIndicatorComparisons.push(item);
      return item;
    });

    return {
      id: asp.id,
      no: asp.no,
      nama: asp.nama,
      kategori: asp.kategori,
      colorBg: asp.colorBg,
      colorBorder: asp.colorBorder,
      scoreA,
      scoreB,
      selisih,
      persenPerubahan,
      status,
      statusSymbol,
      gradeA: aspA?.grade || '-',
      gradeB: aspB?.grade || '-',
      hasDataA,
      hasDataB,
      indicators
    };
  });

  const rerataA = analysisA.averageScore;
  const rerataB = analysisB.averageScore;
  const selisihRerata = Number((rerataB - rerataA).toFixed(2));
  const persenRerata = rerataA > 0 ? Number(((selisihRerata / rerataA) * 100).toFixed(1)) : 0;

  const statusRerata: 'NAIK' | 'STAGNAN' | 'TURUN' =
    selisihRerata > 0.001 ? 'NAIK' : selisihRerata < -0.001 ? 'TURUN' : 'STAGNAN';

  const sortedAspectsByGrowth = [...aspectComparisons].sort((a, b) => b.selisih - a.selisih);
  const highestGrowthAspect = sortedAspectsByGrowth[0] || aspectComparisons[0];
  const biggestDropAspect = sortedAspectsByGrowth[sortedAspectsByGrowth.length - 1] || aspectComparisons[0];

  const sortedIndicatorsByGrowth = [...allIndicatorComparisons].sort((a, b) => b.selisih - a.selisih);
  const highestGrowthIndicator = sortedIndicatorsByGrowth[0] || allIndicatorComparisons[0];
  const biggestDropIndicator = sortedIndicatorsByGrowth[sortedIndicatorsByGrowth.length - 1] || allIndicatorComparisons[0];

  // Deskripsi Otomatis (Requirement 12)
  let deskripsiOtomatis = '';
  if (naikCount >= 5) {
    deskripsiOtomatis = `Secara umum perkembangan Ananda ${student.nama} menunjukkan peningkatan yang sangat baik dan positif. Dari 9 aspek yang dibandingkan antara ${periodeA.label} dan ${periodeB.label}, sebanyak ${naikCount} aspek mengalami kenaikan, ${stagnanCount} aspek stagnan (stabil), dan ${turunCount} aspek mengalami penurunan. Peningkatan paling menonjol dicapai pada aspek ${highestGrowthAspect.nama} (${highestGrowthAspect.selisih >= 0 ? `+${highestGrowthAspect.selisih}` : highestGrowthAspect.selisih}), serta indikator ${highestGrowthIndicator.nama} (${highestGrowthIndicator.selisih >= 0 ? `+${highestGrowthIndicator.selisih}` : highestGrowthIndicator.selisih}).`;
  } else if (turunCount >= 5) {
    deskripsiOtomatis = `Secara umum terdapat beberapa aspek yang perlu mendapatkan perhatian karena mengalami penurunan dibandingkan periode sebelumnya. Dari 9 aspek yang dibandingkan antara ${periodeA.label} dan ${periodeB.label}, sebanyak ${turunCount} aspek mengalami penurunan, ${stagnanCount} aspek tetap, dan ${naikCount} aspek menunjukkan peningkatan. Fokus pendampingan dan bimbingan prioritas disarankan pada aspek ${biggestDropAspect.nama} (${biggestDropAspect.selisih}), khususnya pada indikator ${biggestDropIndicator.nama}.`;
  } else if (naikCount > turunCount) {
    deskripsiOtomatis = `Secara umum perkembangan siswa menunjukkan tren peningkatan bertahap. Dari 9 aspek yang dievaluasi, ${naikCount} aspek mengalami kenaikan, ${stagnanCount} aspek stabil, dan ${turunCount} aspek mengalami sedikit penurunan. Capaian terbaik terlihat pada dimensi ${highestGrowthAspect.nama} (+${highestGrowthAspect.selisih}), sementara aspek ${biggestDropAspect.nama} (${biggestDropAspect.selisih}) membutuhkan penguatan pendampingan berkelanjutan.`;
  } else if (turunCount > naikCount) {
    deskripsiOtomatis = `Secara umum capaian siswa memerlukan stimulasi tambahan pada beberapa bidang fokus. Tercatat ${turunCount} aspek mengalami sedikit penurunan, ${stagnanCount} aspek stabil, dan ${naikCount} aspek berhasil meningkat. Disarankan adanya koordinasi antara guru dan orang tua untuk memberikan motivasi belajar terutama pada aspek ${biggestDropAspect.nama}.`;
  } else {
    deskripsiOtomatis = `Secara umum perkembangan siswa berada dalam kondisi stabil dan konsisten antara ${periodeA.label} dan ${periodeB.label}. Dari 9 aspek yang dibandingkan, ${stagnanCount} aspek berada pada tingkat capaian yang sama, ${naikCount} aspek mengalami kenaikan, dan ${turunCount} aspek mengalami penurunan seimbang.`;
  }

  return {
    student,
    periodeA,
    periodeB,
    aspects: aspectComparisons,
    rerataA,
    rerataB,
    selisihRerata,
    persenRerata,
    statusRerata,
    naikCount,
    stagnanCount,
    turunCount,
    highestGrowthAspect,
    biggestDropAspect,
    highestGrowthIndicator,
    biggestDropIndicator,
    deskripsiOtomatis
  };
};

export const getAllQuartersComparison = (student: StudentRecord): {
  aspects: AllQuartersAspectRow[];
  quarterRerata: { t1: number | null; t2: number | null; t3: number | null; t4: number | null };
  chartData: {
    periode: string;
    label: string;
    short: string;
    hasData: boolean;
    rerata: number | null;
    [key: string]: any;
  }[];
} => {
  const analysisT1 = getStudentSpiderAnalysis(student.triwulan.T1, student.nama);
  const analysisT2 = getStudentSpiderAnalysis(student.triwulan.T2, student.nama);
  const analysisT3 = getStudentSpiderAnalysis(student.triwulan.T3, student.nama);
  const analysisT4 = getStudentSpiderAnalysis(student.triwulan.T4, student.nama);

  const aspects: AllQuartersAspectRow[] = ASPEK_LIST.map((asp) => {
    const asp1 = analysisT1.aspects.find((a) => a.id === asp.id);
    const asp2 = analysisT2.aspects.find((a) => a.id === asp.id);
    const asp3 = analysisT3.aspects.find((a) => a.id === asp.id);
    const asp4 = analysisT4.aspects.find((a) => a.id === asp.id);

    const t1 = asp1?.hasData ? asp1.score : null;
    const t2 = asp2?.hasData ? asp2.score : null;
    const t3 = asp3?.hasData ? asp3.score : null;
    const t4 = asp4?.hasData ? asp4.score : null;

    // Calculate delta between first available quarter and latest available quarter
    const available = [t1, t2, t3, t4].filter((v): v is number => v !== null);
    let selisihTotal = 0;
    let statusAkhir: 'NAIK' | 'STAGNAN' | 'TURUN' = 'STAGNAN';

    if (available.length >= 2) {
      const first = available[0];
      const last = available[available.length - 1];
      selisihTotal = Number((last - first).toFixed(2));
      if (selisihTotal > 0.001) statusAkhir = 'NAIK';
      else if (selisihTotal < -0.001) statusAkhir = 'TURUN';
    }

    return {
      id: asp.id,
      no: asp.no,
      nama: asp.nama,
      t1,
      t2,
      t3,
      t4,
      selisihTotal,
      statusAkhir
    };
  });

  const quarterRerata = {
    t1: analysisT1.hasData ? analysisT1.averageScore : null,
    t2: analysisT2.hasData ? analysisT2.averageScore : null,
    t3: analysisT3.hasData ? analysisT3.averageScore : null,
    t4: analysisT4.hasData ? analysisT4.averageScore : null
  };

  const chartData = [
    {
      periode: 'T1',
      label: 'Triwulan 1',
      short: 'T1',
      hasData: analysisT1.hasData,
      rerata: quarterRerata.t1,
      kognitif: aspects.find((a) => a.id === 'kognitif')?.t1 ?? null,
      afektif: aspects.find((a) => a.id === 'afektif')?.t1 ?? null,
      psikomotor: aspects.find((a) => a.id === 'psikomotor')?.t1 ?? null,
      sosial: aspects.find((a) => a.id === 'sosial')?.t1 ?? null,
      islamic_literacy: aspects.find((a) => a.id === 'islamicLiteracy')?.t1 ?? null,
      bilingual: aspects.find((a) => a.id === 'bilingual')?.t1 ?? null,
      talents: aspects.find((a) => a.id === 'talents')?.t1 ?? null,
      experience: aspects.find((a) => a.id === 'experience')?.t1 ?? null,
      inklusivitas: aspects.find((a) => a.id === 'inklusivitas')?.t1 ?? null
    },
    {
      periode: 'T2',
      label: 'Triwulan 2',
      short: 'T2',
      hasData: analysisT2.hasData,
      rerata: quarterRerata.t2,
      kognitif: aspects.find((a) => a.id === 'kognitif')?.t2 ?? null,
      afektif: aspects.find((a) => a.id === 'afektif')?.t2 ?? null,
      psikomotor: aspects.find((a) => a.id === 'psikomotor')?.t2 ?? null,
      sosial: aspects.find((a) => a.id === 'sosial')?.t2 ?? null,
      islamic_literacy: aspects.find((a) => a.id === 'islamicLiteracy')?.t2 ?? null,
      bilingual: aspects.find((a) => a.id === 'bilingual')?.t2 ?? null,
      talents: aspects.find((a) => a.id === 'talents')?.t2 ?? null,
      experience: aspects.find((a) => a.id === 'experience')?.t2 ?? null,
      inklusivitas: aspects.find((a) => a.id === 'inklusivitas')?.t2 ?? null
    },
    {
      periode: 'T3',
      label: 'Triwulan 3',
      short: 'T3',
      hasData: analysisT3.hasData,
      rerata: quarterRerata.t3,
      kognitif: aspects.find((a) => a.id === 'kognitif')?.t3 ?? null,
      afektif: aspects.find((a) => a.id === 'afektif')?.t3 ?? null,
      psikomotor: aspects.find((a) => a.id === 'psikomotor')?.t3 ?? null,
      sosial: aspects.find((a) => a.id === 'sosial')?.t3 ?? null,
      islamic_literacy: aspects.find((a) => a.id === 'islamicLiteracy')?.t3 ?? null,
      bilingual: aspects.find((a) => a.id === 'bilingual')?.t3 ?? null,
      talents: aspects.find((a) => a.id === 'talents')?.t3 ?? null,
      experience: aspects.find((a) => a.id === 'experience')?.t3 ?? null,
      inklusivitas: aspects.find((a) => a.id === 'inklusivitas')?.t3 ?? null
    },
    {
      periode: 'T4',
      label: 'Triwulan 4',
      short: 'T4',
      hasData: analysisT4.hasData,
      rerata: quarterRerata.t4,
      kognitif: aspects.find((a) => a.id === 'kognitif')?.t4 ?? null,
      afektif: aspects.find((a) => a.id === 'afektif')?.t4 ?? null,
      psikomotor: aspects.find((a) => a.id === 'psikomotor')?.t4 ?? null,
      sosial: aspects.find((a) => a.id === 'sosial')?.t4 ?? null,
      islamic_literacy: aspects.find((a) => a.id === 'islamicLiteracy')?.t4 ?? null,
      bilingual: aspects.find((a) => a.id === 'bilingual')?.t4 ?? null,
      talents: aspects.find((a) => a.id === 'talents')?.t4 ?? null,
      experience: aspects.find((a) => a.id === 'experience')?.t4 ?? null,
      inklusivitas: aspects.find((a) => a.id === 'inklusivitas')?.t4 ?? null
    }
  ];

  return {
    aspects,
    quarterRerata,
    chartData
  };
};
