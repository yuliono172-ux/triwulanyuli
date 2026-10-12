export type TriwulanKey = 'T1' | 'T2' | 'T3' | 'T4';

export interface TriwulanOption {
  id: TriwulanKey;
  no: number;
  label: string;
  short: string;
  roman: string;
  badgeColor: string;
  judulRapor: string;
}

export const TRIWULAN_OPTIONS: TriwulanOption[] = [
  {
    id: 'T1',
    no: 1,
    label: 'TRIWULAN 1',
    short: 'T1',
    roman: 'I',
    badgeColor: 'bg-amber-500 text-white',
    judulRapor: 'LAPORAN PERKEMBANGAN SISWA TRIWULAN I'
  },
  {
    id: 'T2',
    no: 2,
    label: 'TRIWULAN 2',
    short: 'T2',
    roman: 'II',
    badgeColor: 'bg-emerald-600 text-white',
    judulRapor: 'LAPORAN PERKEMBANGAN SISWA TRIWULAN II'
  },
  {
    id: 'T3',
    no: 3,
    label: 'TRIWULAN 3',
    short: 'T3',
    roman: 'III',
    badgeColor: 'bg-blue-600 text-white',
    judulRapor: 'LAPORAN PERKEMBANGAN SISWA TRIWULAN III'
  },
  {
    id: 'T4',
    no: 4,
    label: 'TRIWULAN 4',
    short: 'T4',
    roman: 'IV',
    badgeColor: 'bg-purple-600 text-white',
    judulRapor: 'LAPORAN PERKEMBANGAN SISWA TRIWULAN IV'
  }
];

export interface IndikatorMeta {
  key: string;
  kode: string;
  nama: string;
  deskripsi: string;
  labelLengkap: string;
}

export interface AspekMeta {
  id: string;
  no: number;
  nama: string;
  kategori: string;
  deskripsi: string;
  saranKelemahan: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  indikatorList: IndikatorMeta[];
}

export const ASPEK_LIST: AspekMeta[] = [
  {
    id: 'kognitif',
    no: 1,
    nama: 'KOGNITIF',
    kategori: 'Perkembangan Kognitif & Berpikir',
    colorBg: '#ffff00',
    colorText: '#000000',
    colorBorder: '#cccc00',
    deskripsi: 'Rentang perhatian, pemahaman instruksi, rentang memori, pemecahan masalah, berpikir kritis, dan kreativitas.',
    saranKelemahan: 'Perlu bimbingan intensif dan latihan teratur dalam pemusatan fokus perhatian belajar melalui media visual menarik, serta pembiasaan memecahkan masalah bertahap dan mematuhi petunjuk instruksi secara perlahan.',
    indikatorList: [
      { key: 'rp', kode: 'RP', nama: 'Rentang Perhatian', deskripsi: 'kefokusan menerima pembelajaran', labelLengkap: 'Rentang Perhatian (RP)(kefokusan menerima pembelajaran)' },
      { key: 'pi', kode: 'PI', nama: 'Pemahaman Instruksi', deskripsi: 'Memahami instruksi / penjelasan yang diberikan', labelLengkap: 'Pemahaman Instruksi (PI)(Memahami instruksi / penjelasan yang diberikan)' },
      { key: 'rm', kode: 'RM', nama: 'Rentang Memori', deskripsi: 'Menghapal / mengingat informasi', labelLengkap: 'Rentang Memori (RM)(Menghapal / mengingat informasi)' },
      { key: 'pm', kode: 'PM', nama: 'Pemecahan Masalah', deskripsi: 'Kemampuan memecahkan kasus / permasalahan', labelLengkap: 'Pemecahan Masalah (PM)(Kemampuan memecahkan kasus / permasalahan)' },
      { key: 'kr', kode: 'KR', nama: 'Berpikir kritis', deskripsi: 'Memeriksa, meneliti, mengamati secara jeli', labelLengkap: 'Berpikir kritis (KR)(Memeriksa, meneliti, mengamati secara jeli)' },
      { key: 'ki', kode: 'KI', nama: 'Kreativitas / Inovasi', deskripsi: 'Memunculkan ide / gagasan baru, imajinasi', labelLengkap: 'Kreativitas / Inovasi (KI)(Memunculkan ide / gagasan baru, imajinasi)' },
    ]
  },
  {
    id: 'afektif',
    no: 2,
    nama: 'AFEKTIF',
    kategori: 'Perkembangan Emosional & Sikap',
    colorBg: '#4f81bd',
    colorText: '#ffffff',
    colorBorder: '#2f5597',
    deskripsi: 'Empati, stabilitas suasana hati, motivasi belajar, kesabaran, dan ketangguhan.',
    saranKelemahan: 'Perlu pendampingan berkala dalam pengelolaan emosi dan suasana hati, serta pemberian motivasi dan apresiasi positif agar memiliki ketangguhan saat menghadapi hambatan.',
    indikatorList: [
      { key: 'em', kode: 'EM', nama: 'Empati', deskripsi: 'Kemampuan memahami perasaan orang lain', labelLengkap: 'Empati (EM)(Kemampuan memahami perasaan orang lain)' },
      { key: 'sh', kode: 'SH', nama: 'Suasana Hati', deskripsi: 'Kemampuan menjaga stabilitas suasana hati', labelLengkap: 'Suasana Hati (SH)(Kemampuan menjaga stabilitas suasana hati)' },
      { key: 'mo', kode: 'MO', nama: 'Motivasi', deskripsi: 'Terjaga semangatnya di setiap situasi', labelLengkap: 'Motivasi (MO)(Terjaga semangatnya di setiap situasi)' },
      { key: 'ks', kode: 'KS', nama: 'Kesabaran', deskripsi: 'Menjaga diri dari emosi yang meledak-ledak', labelLengkap: 'Kesabaran (KS)(Menjaga diri dari emosi yang meledak-ledak)' },
      { key: 'kt', kode: 'KT', nama: 'Ketangguhan', deskripsi: 'Mampu bangkit dari kegagalan / kesedihan', labelLengkap: 'Ketangguhan (KT)(Mampu bangkit dari kegagalan / kesedihan)' },
    ]
  },
  {
    id: 'psikomotor',
    no: 3,
    nama: 'PSIKOMOTOR',
    kategori: 'Keterampilan Fisik & Motorik',
    colorBg: '#f28a8a',
    colorText: '#000000',
    colorBorder: '#da9694',
    deskripsi: 'Motorik kasar, motorik halus, pengontrolan repetitif, dan keluwesan penggunaan alat.',
    saranKelemahan: 'Disarankan melatih kerapian motorik halus (seperti menulis, melipat, meronce, dan penggunaan alat belajar) serta koordinasi fisik melalui kegiatan fisik aktif yang terarah.',
    indikatorList: [
      { key: 'mk', kode: 'MK', nama: 'Motorik Kasar', deskripsi: 'Keseimbangan, melompat, berlari', labelLengkap: 'Motorik Kasar (MK)(Keseimbangan, melompat, berlari)' },
      { key: 'mh', kode: 'MH', nama: 'Motorik Halus', deskripsi: 'Menggambar sesuai pola, menulis rapi', labelLengkap: 'Motorik Halus (MH)(Menggambar sesuai pola, menulis rapi)' },
      { key: 're', kode: 'RE', nama: 'Perilaku Repetitif', deskripsi: 'Mengendalikan diri dari perilaku berulang yang tidak perlu', labelLengkap: 'Perilaku Repetitif (RE)(Mengendalikan diri dari perilaku berulang yang tidak perlu)' },
      { key: 'kk', kode: 'KK', nama: 'Keterampilan / Keluwesan', deskripsi: 'Kemampuan dalam menggunakan fisik / peralatan di sekitarnya', labelLengkap: 'Keterampilan / Keluwesan (KK)(Kemampuan dalam menggunakan fisik / peralatan di sekitarnya)' },
    ]
  },
  {
    id: 'sosial',
    no: 4,
    nama: 'SOSIAL',
    kategori: 'Interaksi Sosial & Kepemimpinan',
    colorBg: '#595959',
    colorText: '#ffffff',
    colorBorder: '#404040',
    deskripsi: 'Kepatuhan aturan kelompok (otoritas), kepemimpinan, kepedulian tulus (altruisme), dan komunikasi ide.',
    saranKelemahan: 'Perlu pembiasaan dalam mematuhi kesepakatan tata tertib kelompok, berani mengemukakan ide gagasan di depan umum, serta menumbuhkan jiwa kepemimpinan dan kepedulian tulus.',
    indikatorList: [
      { key: 'ot', kode: 'OT', nama: 'Otoritas', deskripsi: 'Kemampuan dalam mengikuti tata tertib / peraturan kelompok yang disepakati', labelLengkap: 'Otoritas (OT)(Kemampuan dalam mengikuti tata tertib / peraturan kelompok yang disepakati)' },
      { key: 'ld', kode: 'LD', nama: 'Kepemimpinan', deskripsi: 'Kemampuan mempengaruhi dan mengarahkan oranglain', labelLengkap: 'Kepemimpinan (LD)(Kemampuan mempengaruhi dan mengarahkan oranglain)' },
      { key: 'at', kode: 'AT', nama: 'Altruisme', deskripsi: 'Memiliki kepedulian untuk membantu secara tulus', labelLengkap: 'Altruisme (AT)(Memiliki kepedulian untuk membantu secara tulus)' },
      { key: 'ko', kode: 'KO', nama: 'Komunikasi', deskripsi: 'Kemampuan menyampaikan ide dan gagasan kepada orang lain sampai paham', labelLengkap: 'Komunikasi (KO)(Kemampuan menyampaikan ide dan gagasan kepada orang lain sampai paham)' },
    ]
  },
  {
    id: 'islamicLiteracy',
    no: 5,
    nama: 'ISLAMIC LITERACY',
    kategori: 'Literasi Keislaman & Ibadah',
    colorBg: '#b1a0c7',
    colorText: '#000000',
    colorBorder: '#7030a0',
    deskripsi: 'Kecintaan Al-Qur\'an, penerapan akhlak terpuji, dan semangat beribadah harian.',
    saranKelemahan: 'Perlu bimbingan dan pembiasaan cinta Al-Qur\'an (tilawah/tahfidz rutin), keteladanan akhlak terpuji, serta kedisiplinan beribadah doa dan sholat baik di sekolah maupun di rumah.',
    indikatorList: [
      { key: 'aq', kode: 'AQ', nama: 'Kecintaan kepada Al Qur\'an', deskripsi: 'Menunjukan sikap & perilaku yang mencintai Al Qur\'an', labelLengkap: 'Kecintaan kepada Al Qur\'an (AQ)(Menunjukan sikap & perilaku yang mencintai Al Qur\'an)' },
      { key: 'ak', kode: 'AK', nama: 'Akhlak Terpuji', deskripsi: 'Menunjukkan kesediaan untuk menunjukkan akhlak yang terpuji', labelLengkap: 'Akhlak Terpuji (AK)(Menunjukkan kesediaan untuk menunjukkan akhlak yang terpuji)' },
      { key: 'ib', kode: 'IB', nama: 'Semangat Beribadah', deskripsi: 'Menunjukkan antusiasme dan semangat dalam beribadah & berdoa', labelLengkap: 'Semangat Beribadah (IB)(Menunjukkan antusiasme dan semangat dalam beribadah & berdoa)' },
    ]
  },
  {
    id: 'bilingual',
    no: 6,
    nama: 'BILINGUAL',
    kategori: 'Kemampuan Dwi-Bahasa',
    colorBg: '#92cddc',
    colorText: '#000000',
    colorBorder: '#31859b',
    deskripsi: 'Kepercayaan diri berbahasa asing dan semangat mempelajari kosa kata baru.',
    saranKelemahan: 'Disarankan terus memberi stimulasi lingkungan dwibahasa melalui dongeng, dialog ringan sehari-hari, serta media audio-visual yang menguatkan kepercayaan diri anak berbicara bahasa Inggris.',
    indikatorList: [
      { key: 'kd', kode: 'KD', nama: 'Kepercayaan Diri', deskripsi: 'Berani menggunakan bahasa dwi-bahasa dalam berinteraksi', labelLengkap: 'Kepercayaan Diri (KD)(Berani menggunakan bahasa dwi-bahasa dalam berinteraksi)' },
      { key: 'sb', kode: 'SB', nama: 'Semangat Belajar', deskripsi: 'Menunjukkan antusiasme mempelajari kosakata & ekspresi baru', labelLengkap: 'Semangat Belajar (SB)(Menunjukkan antusiasme mempelajari kosakata & ekspresi baru)' },
    ]
  },
  {
    id: 'talents',
    no: 7,
    nama: 'TALENTS',
    kategori: 'Bakat, Minat & Potensi Diri',
    colorBg: '#b7dee8',
    colorText: '#000000',
    colorBorder: '#6199af',
    deskripsi: 'Penemuan keunikan diri dan pengembangan ketertarikan/hobi yang positif.',
    saranKelemahan: 'Berikan wadah beragam aktivitas ekstrakurikuler serta eksplorasi karya agar anak semakin mengenali potensi unik dirinya dan menekuni hobi positif secara berkelanjutan.',
    indikatorList: [
      { key: 'uq', kode: 'UQ', nama: 'Keunikan Diri', deskripsi: 'Mengenal dan bangga atas kelebihan / keunikan potensi diri', labelLengkap: 'Keunikan Diri (UQ)(Mengenal dan bangga atas kelebihan / keunikan potensi diri)' },
      { key: 'in', kode: 'IN', nama: 'Ketertarikan / Hobi', deskripsi: 'Menekuni minat / hobi tertentu dengan antusias tinggi', labelLengkap: 'Ketertarikan / Hobi (IN)(Menekuni minat / hobi tertentu dengan antusias tinggi)' },
    ]
  },
  {
    id: 'experience',
    no: 8,
    nama: 'EXPERIENCE',
    kategori: 'Pengalaman Belajar Nyata',
    colorBg: '#fcd5b4',
    colorText: '#000000',
    colorBorder: '#e26b00',
    deskripsi: 'Semangat eksplorasi hal baru, sikap observatif, dan refleksi terhadap pengalaman.',
    saranKelemahan: 'Ajak anak lebih sering berinteraksi langsung dengan lingkungan alam sekitar atau proyek sains sederhana, lalu latih untuk menceritakan kembali refleksi hikmah pengalamannya.',
    indikatorList: [
      { key: 'ex', kode: 'EX', nama: 'Eksplorasi', deskripsi: 'Berani mencoba pengalaman belajar baru dan menantang', labelLengkap: 'Eksplorasi (EX)(Berani mencoba pengalaman belajar baru dan menantang)' },
      { key: 'ob', kode: 'OB', nama: 'Observatif', deskripsi: 'Peka dan teliti memperhatikan fenomena di lingkungan sekitar', labelLengkap: 'Observatif (OB)(Peka dan teliti memperhatikan fenomena di lingkungan sekitar)' },
      { key: 're', kode: 'RE', nama: 'Refleksi Pengalaman', deskripsi: 'Mampu mengambil pelajaran positif dari kejadian yang dialami', labelLengkap: 'Refleksi Pengalaman (RE)(Mampu mengambil pelajaran positif dari kejadian yang dialami)' },
    ]
  },
  {
    id: 'inklusivitas',
    no: 9,
    nama: 'INKLUSIVITAS',
    kategori: 'Nilai Inklusif & Kemanusiaan',
    colorBg: '#c4d79b',
    colorText: '#000000',
    colorBorder: '#76923c',
    deskripsi: 'Solidaritas sesama teman, sikap adil tanpa diskriminasi, dan penghormatan perbedaan.',
    saranKelemahan: 'Tanamkan nilai saling menghargai perbedaan latar belakang teman sebaya, membiasakan berbagi secara adil, dan mengajak anak aktif merangkul teman yang membutuhkan dukungan.',
    indikatorList: [
      { key: 'so', kode: 'SO', nama: 'Solidaritas', deskripsi: 'Mau berteman dengan siapa saja dan saling mendukung', labelLengkap: 'Solidaritas (SO)(Mau berteman dengan siapa saja dan saling mendukung)' },
      { key: 'fa', kode: 'FA', nama: 'Keadilan', deskripsi: 'Berperilaku adil dan tidak membeda-bedakan teman', labelLengkap: 'Keadilan (FA)(Berperilaku adil dan tidak membeda-bedakan teman)' },
      { key: 'ph', kode: 'PH', nama: 'Penghormatan', deskripsi: 'Menghargai keberagaman, pendapat, dan hak orang lain', labelLengkap: 'Penghormatan (PH)(Menghargai keberagaman, pendapat, dan hak orang lain)' },
    ]
  }
];

export const PILIHAN_PREDIKAT = ['Exceptional', 'A', 'B', 'C', 'Defisit'] as const;

export const GRADE_WEIGHTS: Record<string, number> = {
  'Exceptional': 5,
  'A': 4,
  'B': 3,
  'C': 2,
  'Defisit': 1
};

export interface SiswaAssessmentRecord {
  kognitif: {
    rp: string;
    pi: string;
    rm: string;
    pm: string;
    kr: string;
    ki: string;
    deskripsi: string;
  };
  afektif: {
    em: string;
    sh: string;
    mo: string;
    ks: string;
    kt: string;
    deskripsi: string;
  };
  psikomotor: {
    mk: string;
    mh: string;
    re: string;
    kk: string;
    deskripsi: string;
  };
  sosial: {
    ot: string;
    ld: string;
    at: string;
    ko: string;
    deskripsi: string;
  };
  islamicLiteracy: {
    aq: string;
    ak: string;
    ib: string;
    deskripsi: string;
  };
  bilingual: {
    kd: string;
    sb: string;
    deskripsi: string;
  };
  talents: {
    uq: string;
    in: string;
    deskripsi: string;
  };
  experience: {
    ex: string;
    ob: string;
    re: string;
    deskripsi: string;
  };
  inklusivitas: {
    so: string;
    fa: string;
    ph: string;
    deskripsi: string;
  };
  deskripsiRapor?: string;
  saranRapor?: string;
  overallGrades?: Record<string, string>;
}

export interface StudentRecord {
  no: number;
  nama: string;
  nis: string;
  kelas: string;
  tahunAjaran: string; // e.g. '2026/2027'
  triwulan: Record<TriwulanKey, SiswaAssessmentRecord>;
}

export interface SiswaData extends SiswaAssessmentRecord {
  no: number;
  nama: string;
  nis: string;
  kelas: string;
  tahunAjaran?: string;
  allTriwulan?: Record<TriwulanKey, SiswaAssessmentRecord>;
}

export interface IndicatorComparisonItem {
  key: string;
  kode: string;
  nama: string;
  deskripsi: string;
  labelLengkap: string;
  ratingA: string;
  scoreA: number;
  ratingB: string;
  scoreB: number;
  selisih: number;
  status: 'NAIK' | 'STAGNAN' | 'TURUN';
  statusSymbol: string;
}

export interface QuarterComparisonItem {
  id: string;
  no: number;
  nama: string;
  kategori: string;
  colorBg: string;
  colorBorder: string;
  scoreA: number;
  scoreB: number;
  selisih: number;
  persenPerubahan: number;
  status: 'NAIK' | 'STAGNAN' | 'TURUN';
  statusSymbol: string;
  gradeA: string;
  gradeB: string;
  hasDataA: boolean;
  hasDataB: boolean;
  indicators: IndicatorComparisonItem[];
}

export interface QuarterComparisonResult {
  student: StudentRecord;
  periodeA: TriwulanOption;
  periodeB: TriwulanOption;
  aspects: QuarterComparisonItem[];
  rerataA: number;
  rerataB: number;
  selisihRerata: number;
  persenRerata: number;
  statusRerata: 'NAIK' | 'STAGNAN' | 'TURUN';
  naikCount: number;
  stagnanCount: number;
  turunCount: number;
  highestGrowthAspect: QuarterComparisonItem;
  biggestDropAspect: QuarterComparisonItem;
  highestGrowthIndicator: IndicatorComparisonItem;
  biggestDropIndicator: IndicatorComparisonItem;
  deskripsiOtomatis: string;
}

export interface AllQuartersAspectRow {
  id: string;
  no: number;
  nama: string;
  t1: number | null;
  t2: number | null;
  t3: number | null;
  t4: number | null;
  selisihTotal: number;
  statusAkhir: 'NAIK' | 'STAGNAN' | 'TURUN';
}

export interface AspectAnalysis {
  id: string;
  no: number;
  nama: string;
  kategori: string;
  colorBg: string;
  colorBorder: string;
  score: number;
  percentage: number;
  grade: string;
  hasData: boolean;
  indicators: {
    key: string;
    kode: string;
    nama: string;
    deskripsi: string;
    labelLengkap: string;
    rating: string;
    score: number;
  }[];
  strengthIndicators: string[];
  weaknessIndicators: string[];
  explanation: string;
}

export interface SpiderAnalysisResult {
  aspects: AspectAnalysis[];
  averageScore: number;
  averagePercentage: number;
  overallGrade: string;
  hasData: boolean;
  topStrengths: AspectAnalysis[];
  topWeaknesses: AspectAnalysis[];
  strengthsSummary: string;
  weaknessesSummary: string;
}
