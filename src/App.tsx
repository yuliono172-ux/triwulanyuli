import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Home as HomeIcon,
  Printer,
  ChevronLeft,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Download,
  Upload,
  Radar,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  AlertTriangle,
  FileText,
  Info,
  Compass,
  ChevronDown,
  ChevronRight,
  Database,
  Layers,
  Menu,
  X,
  Palette,
  Type,
  FolderOpen,
  Check,
  Settings2,
  User,
  Lock,
  LogOut,
  Users,
  Shield,
  Save,
  Trash2,
  Cloud,
  CloudOff
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ReferenceLine
} from 'recharts';
import {
  TriwulanKey,
  TRIWULAN_OPTIONS,
  StudentRecord,
  SiswaAssessmentRecord
} from './types/rapor';
import {
  INITIAL_MASTER_STUDENTS,
  createEmptyAssessmentRecord
} from './data/initialData';
import {
  getAllQuartersComparison,
  compareTwoQuarters,
  getGradeFromScore
} from './utils/quarterAnalysis';
import {
  predictNextQuarterAchievement,
  StudentQuarterPredictionResult,
  DimensionPredictionItem
} from './utils/quarterPrediction';
import { PerbandinganTriwulan } from './components/PerbandinganTriwulan';
import { db, ref, set, onValue, off, remove, TeacherRecord, AppSettings } from './firebase';
import { useToast } from './components/Toast';

export interface UserAccount {
  role: 'admin' | 'guru' | 'orangtua';
  username: string;
  nama: string;
  kelas?: string;
  tingkatKelas?: string;
  nisn?: string;
  studentNo?: number;
}

interface SiswaData {
  no: number;
  nama: string;
  nis: string;
  kelas: string;
  // 1. KOGNITIF (6 Aspek)
  kognitif: {
    rp: string; // Rentang Perhatian
    pi: string; // Pemahaman Instruksi
    rm: string; // Rentang Memori
    pm: string; // Pemecahan Masalah
    kr: string; // Berpikir Kritis
    ki: string; // Kreativitas / Inovasi
    deskripsi: string;
  };
  // 2. AFEKTIF (5 Aspek)
  afektif: {
    em: string; // Empati
    sh: string; // Suasana Hati
    mo: string; // Motivasi
    ks: string; // Kesabaran
    kt: string; // Ketangguhan
    deskripsi: string;
  };
  // 3. PSIKOMOTOR (4 Aspek)
  psikomotor: {
    mk: string; // Motorik Kasar
    mh: string; // Motorik Halus
    re: string; // Perilaku Repetitif
    kk: string; // Keterampilan / Keluwesan
    deskripsi: string;
  };
  // 4. SOSIAL (4 Aspek)
  sosial: {
    ot: string; // Otoritas
    ld: string; // Kepemimpinan
    at: string; // Altruisme
    ko: string; // Komunikasi
    deskripsi: string;
  };
  // 5. ISLAMIC LITERACY (3 Aspek)
  islamicLiteracy: {
    aq: string; // Kecintaan kepada Al Qur'an
    ak: string; // Akhlak Terpuji
    ib: string; // Semangat Beribadah
    deskripsi: string;
  };
  // 6. BILINGUAL (2 Aspek)
  bilingual: {
    kd: string; // Kepercayaan Diri
    sb: string; // Semangat Belajar
    deskripsi: string;
  };
  // 7. TALENTS (2 Aspek)
  talents: {
    uq: string; // Keunikan
    in: string; // Ketertarikan / Hobi
    deskripsi: string;
  };
  // 8. EXPERIENCE (3 Aspek)
  experience: {
    ex: string; // Eksplorasi
    ob: string; // Observatif
    re: string; // Refleksi
    deskripsi: string;
  };
  // 9. INKLUSIVITAS (3 Aspek)
  inklusivitas: {
    so: string; // Solidaritas
    fa: string; // Keadilan
    ph: string; // Penghormatan
    deskripsi: string;
  };
  // Catatan Khusus Lembar Cetak Rapor
  deskripsiRapor?: string;
  saranRapor?: string;
  overallGrades?: Record<string, string>;
  tahunAjaran?: string;
  allTriwulan?: Record<TriwulanKey, SiswaAssessmentRecord>;
}

// 30 Siswa Resmi Kelas IV
const STUDENT_NAMES: { no: number; nama: string; nis: string }[] = [
  { no: 1, nama: 'ABIZAR ARFAN RAQQILLA', nis: '202340001' },
  { no: 2, nama: 'ADZKIA HILYA NAFIZAH', nis: '202540031' },
  { no: 3, nama: 'AGHA FAIQ FIRMANSYAH', nis: '202340002' },
  { no: 4, nama: 'AILLEN NATHANIA WAHYU', nis: '202340003' },
  { no: 5, nama: 'ALDEN MALIK AR\'RAUF', nis: '202340004' },
  { no: 6, nama: 'ANUGRAH DAFFA HAFIDZUDIN', nis: '202340005' },
  { no: 7, nama: 'ARETHA KHANZA NAVISHA AZKA WIBOWO', nis: '202340006' },
  { no: 8, nama: 'ARSHAKA MUHAMMAD ZHAFRAN', nis: '202340007' },
  { no: 9, nama: 'AZFAR ASDAFI AZKAR', nis: '202340008' },
  { no: 10, nama: 'BOB GHALIBIE BORNEO', nis: '202340010' },
  { no: 11, nama: 'DHIA HANUM SYARIF', nis: '202340011' },
  { no: 12, nama: 'DIANUNA SERENADA LASHIRA SHANUM', nis: '202340012' },
  { no: 13, nama: 'DIZKHA AZEL RUDYANSYAH', nis: '202340013' },
  { no: 14, nama: 'EMBUN LYCOFOS AZZAHRO', nis: '202340014' },
  { no: 15, nama: 'FADLI NUR LESMANA', nis: '202340015' },
  { no: 16, nama: 'FATHAN AL MAISAN ZHAFAR', nis: '202340016' },
  { no: 17, nama: 'FATIH ATTALA RIZKIANO', nis: '202340017' },
  { no: 18, nama: 'GWEN FELISHA SYAREEFA', nis: '202340018' },
  { no: 19, nama: 'JAVIER RAUF FAYADI', nis: '202340019' },
  { no: 20, nama: 'JOLIE ALESHA MECCA', nis: '202340020' },
  { no: 21, nama: 'KHANSA SABIL HUMAIRA', nis: '202340021' },
  { no: 22, nama: 'KHANZA AILA ASYIFA', nis: '202340022' },
  { no: 23, nama: 'LAFISYA ORLIN KALINGGA', nis: '202340023' },
  { no: 24, nama: 'MAHREEN SHAFANA ALMAHYRA', nis: '202340025' },
  { no: 25, nama: 'MIRZA AMMAR AHZAALAN', nis: '202340026' },
  { no: 26, nama: 'MUHAMMAD GAOZHAN AL GHIFARI', nis: '202340027' },
  { no: 27, nama: 'PUTRI SALSABILA', nis: '202230022' },
  { no: 28, nama: 'RASYIQUL ABID IBNU PURNOMO', nis: '202340028' },
  { no: 29, nama: 'SHAKIRA RAMADHANI PERMANA', nis: '202340029' },
  { no: 30, nama: 'SHAZIA ATHALLA SUGIARTO', nis: '202340030' }
];

const INITIAL_DATA: SiswaData[] = STUDENT_NAMES.map((s, idx) => {
  const isAbizar = idx === 0;
  return {
    no: s.no,
    nama: s.nama,
    nis: s.nis,
    kelas: 'IV (Empat)',
    kognitif: {
      rp: isAbizar ? 'B' : '',
      pi: isAbizar ? 'B' : '',
      rm: isAbizar ? 'B' : '',
      pm: isAbizar ? 'B' : '',
      kr: isAbizar ? 'C' : '',
      ki: isAbizar ? 'C' : '',
      deskripsi: isAbizar ? 'Mampu memahami materi dengan baik dan berpikir kreatif dalam menyelesaikan tugas.' : ''
    },
    afektif: {
      em: isAbizar ? 'C' : '',
      sh: isAbizar ? 'C' : '',
      mo: isAbizar ? 'C' : '',
      ks: isAbizar ? 'Defisit' : '',
      kt: isAbizar ? 'Defisit' : '',
      deskripsi: isAbizar ? 'Perlu pendampingan dalam kesabaran dan ketangguhan saat menghadapi tantangan.' : ''
    },
    psikomotor: {
      mk: isAbizar ? 'Defisit' : '',
      mh: isAbizar ? 'Defisit' : '',
      re: isAbizar ? 'Exceptional' : '',
      kk: isAbizar ? 'Exceptional' : '',
      deskripsi: isAbizar ? 'Sangat terampil dalam mengendalikan perilaku dan menggunakan peralatan di sekitarnya.' : ''
    },
    sosial: {
      ot: isAbizar ? 'Exceptional' : '',
      ld: isAbizar ? 'Exceptional' : '',
      at: isAbizar ? 'A' : '',
      ko: isAbizar ? 'A' : '',
      deskripsi: isAbizar ? 'Memiliki jiwa kepemimpinan yang sangat menonjol, taat aturan, dan komunikatif.' : ''
    },
    islamicLiteracy: {
      aq: isAbizar ? 'A' : '',
      ak: isAbizar ? 'B' : '',
      ib: isAbizar ? 'B' : '',
      deskripsi: isAbizar ? 'Menunjukkan kecintaan mendalam terhadap Al-Qur\'an dan bersemangat dalam beribadah.' : ''
    },
    bilingual: {
      kd: isAbizar ? 'Defisit' : '',
      sb: isAbizar ? 'Defisit' : '',
      deskripsi: isAbizar ? 'Perlu dorongan untuk meningkatkan kepercayaan diri berbahasa dwi-bahasa.' : ''
    },
    talents: {
      uq: isAbizar ? 'Exceptional' : '',
      in: isAbizar ? 'Exceptional' : '',
      deskripsi: isAbizar ? 'Memiliki keunikan pribadi yang sangat positif dan minat hobi yang kuat.' : ''
    },
    experience: {
      ex: isAbizar ? 'Exceptional' : '',
      ob: isAbizar ? 'A' : '',
      re: isAbizar ? 'A' : '',
      deskripsi: isAbizar ? 'Sangat antusias bereksplorasi mencoba hal baru dan jeli dalam mengamati.' : ''
    },
    inklusivitas: {
      so: isAbizar ? 'A' : '',
      fa: isAbizar ? 'A' : '',
      ph: isAbizar ? 'A' : '',
      deskripsi: isAbizar ? 'Menunjukkan solidaritas tinggi, memperlakukan teman dengan adil dan respek.' : ''
    },
    deskripsiRapor: isAbizar
      ? `Selama periode pembelajaran ini, Ananda Abizar Arfan Raqqilla menunjukkan perkembangan yang sangat positif dan menggembirakan. Ananda Abizar Arfan Raqqilla tumbuh menjadi pribadi yang hangat, percaya diri, dan penuh rasa ingin tahu. Ia memiliki antusiasme tinggi dalam mengeksplorasi pengalaman belajar baru serta menunjukkan kekuatan menonjol pada aspek sosial-emosional dan keagamaan.

Ananda Abizar Arfan Raqqilla adalah anak yang tangguh dan tidak mudah menyerah saat menghadapi tantangan. Ia memiliki keberanian komunikasi yang baik, semangat eksplorasi bahasa, serta menunjukkan ketertarikan dan kecintaan terhadap Al-Qur'an. Dalam berinteraksi sehari-hari, Ananda Abizar Arfan Raqqilla menunjukkan empati yang tinggi, sikap adil, serta ketulusan untuk membantu dan merangkul teman-temannya. Koordinasi gerak tubuh dan keluwesannya dalam menggunakan media belajar juga berkembang sangat baik, menjadi fondasi kuat bagi kemandirian dan pembentukan karakter positifnya.

Untuk mendukung tumbuh kembang Ananda Abizar Arfan Raqqilla secara optimal, fokus pendampingan selanjutnya adalah menguatkan fokus dan daya amatinya secara bertahap, seperti dalam memahami petunjuk belajar, ketelitian berpikir kritis, serta keterampilan motorik halus. Kami juga terus mendampingi Ananda Abizar Arfan Raqqilla dalam pembiasaan perilaku, antusiasme ibadah, serta kepatuhan pada kesepakatan bersama. Kami meyakini area-area ini dapat terus ditumbuhkan melalui pengalaman belajar yang menyenangkan, bermakna, dan penuh kasih sayang.`
      : undefined,
    saranRapor: isAbizar
      ? `Terima kasih yang sebesar-besarnya kepada  Parents  yang telah merawat semangat belajar Ananda Abizar Arfan Raqqilla hingga ia tumbuh menjadi anak yang tangguh, empati, dan penuh rasa ingin tahu. Untuk terus mendukung perkembangannya di rumah,  Parents  dapat secara bertahap mengasah fokus dan daya ingat Ananda Abizar Arfan Raqqilla dengan memberikan petunjuk sederhana satu per satu saat beraktivitas, lalu mengundangnya mengulang instruksi tersebut lewat obrolan yang santai. Karakter Ananda Abizar Arfan Raqqilla yang tidak mudah menyerah juga bisa disalurkan lewat kegiatan bermain bersama yang melatih jemari dan ketelitian—seperti merakit lego, melipat kertas, atau menggambar—dengan tetap memberikan apresiasi tulus pada setiap proses dan usahanya, bukan hanya pada hasil akhir.

Sikap santun dan kebaikan hati Ananda Abizar Arfan Raqqilla yang luar biasa tentu tidak lepas dari keteladanan hangat di rumah. Agar kedisiplinan dan rasa tanggung jawabnya semakin mekar, ajak Ananda Abizar Arfan Raqqilla membuat kesepakatan rutinitas harian atau jadwal bergambar bersama, sehingga ia merasa bangga dan memiliki peran aktif saat menjalankan ibadah maupun merapikan perlengkapannya. Menjelang waktu tidur, luangkan momen pillow talk untuk mengapresiasi hal-hal baik yang ia lakukan sepanjang hari; ruang aman ini tidak hanya mempererat ikatan emosional, tetapi juga menjadi sarana yang sangat indah bagi Ananda Abizar Arfan Raqqilla untuk berlatih mengamati, berpikir kritis, dan mengungkapkan isi hatinya.`
      : undefined
  };
});

const PILIHAN_PREDIKAT = ['Exceptional', 'A', 'B', 'C', 'Defisit'];

interface IndikatorMeta {
  key: string;
  kode: string;
  nama: string;
  deskripsi: string;
  labelLengkap: string;
}

interface AspekMeta {
  id: string;
  no: number;
  nama: string;
  kategori: string;
  deskripsi: string;
  saranKelemahan: string;
  colorBg: string; // Warna khas dari Excel sheet masing-masing
  colorText: string;
  colorBorder: string;
  indikatorList: IndikatorMeta[];
}

const ASPEK_LIST: AspekMeta[] = [
  {
    id: 'kognitif',
    no: 1,
    nama: 'KOGNITIF',
    kategori: 'Perkembangan Kognitif & Berpikir',
    colorBg: '#ffff00', // Kuning terang khas tab Kognitif
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
    colorBg: '#4f81bd', // Biru khas tab Afektif
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
    colorBg: '#f28a8a', // Salmon / Merah Muda khas tab Psikomotor
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
    colorBg: '#595959', // Slate / Abu-abu Tua khas tab Sosial
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
    colorBg: '#b1a0c7', // Ungu Lavender khas tab Islamic Literacy
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
    colorBg: '#92cddc', // Toska / Mint khas tab Bilingual
    colorText: '#000000',
    colorBorder: '#31859c',
    deskripsi: 'Kepercayaan diri berbahasa dan semangat mempelajari kosa kata baru.',
    saranKelemahan: 'Perlu dorongan rasa percaya diri untuk mempraktikkan kosa kata dwi-bahasa dalam percakapan sehari-hari secara natural tanpa rasa takut salah.',
    indikatorList: [
      { key: 'kd', kode: 'KD', nama: 'Kepercayaan Diri', deskripsi: 'Menunjukkan kepercayaan diri untuk menggunakan dwi-bahasa dalam keseharian', labelLengkap: 'Kepercayaan Diri (KD)(Menunjukkan kepercayaan diri untuk menggunakan dwi-bahasa dalam keseharian)' },
      { key: 'sb', kode: 'SB', nama: 'Semangat Belajar', deskripsi: 'Menunjukkan semangat mempelajari hal baru terkait dengan aktivitas dwi-bahasa', labelLengkap: 'Semangat Belajar (SB)(Menunjukkan semangat mempelajari hal baru terkait dengan aktivitas dwi-bahasa)' },
    ]
  },
  {
    id: 'talents',
    no: 7,
    nama: 'TALENTS',
    kategori: 'Minat, Bakat & Keunikan',
    colorBg: '#ffc000', // Kuning Emas khas tab Talents
    colorText: '#000000',
    colorBorder: '#e26b00',
    deskripsi: 'Mengenali keunikan karakter diri dan ketertarikan minat/hobi positif.',
    saranKelemahan: 'Perlu pendampingan dan fasilitas pendukung untuk mengenali minat, bakat, serta keunikan diri melalui kegiatan kreatif atau ekstrakurikuler yang diminati.',
    indikatorList: [
      { key: 'uq', kode: 'UQ', nama: 'Keunikan', deskripsi: 'Memiliki kekhasan secara pribadi yang positif dan mewarnai lingkungan', labelLengkap: 'Keunikan (UQ)(Memiliki kekhasan secara pribadi yang positif dan mewarnai lingkungan)' },
      { key: 'in', kode: 'IN', nama: 'Ketertarikan / Hobi', deskripsi: 'Telah memiliki ketertarikan / hobi yang positif', labelLengkap: 'Ketertarikan / Hobi (IN)Telah memiliki ketertarikan / hobi yang positif' },
    ]
  },
  {
    id: 'experience',
    no: 8,
    nama: 'EXPERIENCE',
    kategori: 'Pengalaman & Observasi Belajar',
    colorBg: '#95b3d7', // Biru Langit khas tab Experience
    colorText: '#000000',
    colorBorder: '#4f81bd',
    deskripsi: 'Eksplorasi pengalaman baru, daya amati observatif, dan kemampuan refleksi.',
    saranKelemahan: 'Disarankan untuk lebih sering diajak mengamati lingkungan sekitar secara observatif, mencoba pengalaman baru, serta mengungkapkan refleksi dari kegiatan yang dialami.',
    indikatorList: [
      { key: 'ex', kode: 'EX', nama: 'Eksplorasi', deskripsi: 'Menunjukkan ketertarikan untuk mencoba hal baru', labelLengkap: 'Eksplorasi (EX)(Menunjukkan ketertarikan untuk mencoba hal baru)' },
      { key: 'ob', kode: 'OB', nama: 'Observatif', deskripsi: 'Menujukkan kejelian saat mengobservasi / mengamati sebuah peristiwa', labelLengkap: 'Observatif (OB)(Menujukkan kejelian saat mengobservasi / mengamati sebuah peristiwa)' },
      { key: 're', kode: 'RE', nama: 'Refleksi', deskripsi: 'memiliki kemampuan untuk mengambil kesimpulan dari sebuah kejadian', labelLengkap: 'Refleksi (RE)(memiliki kemampuan untuk mengambil kesimpulan dari sebuah kejadian)' },
    ]
  },
  {
    id: 'inklusivitas',
    no: 9,
    nama: 'INKLUSIVITAS',
    kategori: 'Sikap Inklusif & Respek Sosial',
    colorBg: '#92d050', // Hijau Muda khas tab Inklusivitas
    colorText: '#000000',
    colorBorder: '#70ad47',
    deskripsi: 'Solidaritas berbagi, keadilan merangkul teman, dan respek saling menghormati.',
    saranKelemahan: 'Perlu penguatan sikap empati, memperlakukan teman secara adil tanpa membeda-bedakan, serta menumbuhkan rasa saling menghargai dan respek terhadap keberagaman.',
    indikatorList: [
      { key: 'so', kode: 'SO', nama: 'Solidaritas', deskripsi: 'Memiliki kepedulian terhadap teman yang membutuhkan bantuan, tak segan berbagi', labelLengkap: 'Solidaritas (SO)Memiliki kepedulian terhadap teman yang membutuhkan bantuan, tak segan berbagi' },
      { key: 'fa', kode: 'FA', nama: 'Keadilan', deskripsi: 'Memperlakukan teman dengan adil tanpa membeda-bedakan', labelLengkap: 'Keadilan (FA)(Memperlakukan teman dengan adil tanpa membeda-bedakan)' },
      { key: 'ph', kode: 'PH', nama: 'Penghormatan', deskripsi: 'Respek terhadap orang lain, tidak melakukan bullying / shaming atas kekurangan teman', labelLengkap: 'Penghormatan (PH)Respek terhadap orang lain, tidak melakukan bullying / shaming atas kekurangan teman' },
    ]
  }
];

const GRADE_WEIGHTS: Record<string, number> = {
  'Exceptional': 5,
  'A': 4,
  'B': 3,
  'C': 2,
  'Defisit': 1
};

const getAspectGrade = (siswa: SiswaData, aspectId: string): string => {
  if (siswa.overallGrades && siswa.overallGrades[aspectId]) {
    return siswa.overallGrades[aspectId];
  }
  const aspekMeta = ASPEK_LIST.find((a) => a.id === aspectId);
  if (!aspekMeta) return '-';
  const sec = (siswa[aspectId as keyof SiswaData] as Record<string, string>) || {};
  const values = aspekMeta.indikatorList.map((ind) => sec[ind.key]).filter((v) => v && GRADE_WEIGHTS[v]);
  if (values.length === 0) return 'Defisit';
  const sum = values.reduce((acc, v) => acc + GRADE_WEIGHTS[v], 0);
  const avg = sum / values.length;
  if (avg >= 4.5) return 'Exceptional';
  if (avg >= 3.5) return 'A';
  if (avg >= 2.5) return 'B';
  if (avg >= 1.5) return 'C';
  return 'Defisit';
};

const generateDefaultDeskripsi = (siswa: SiswaData): string => {
  const exceptionalOrA: string[] = [];
  const bList: string[] = [];
  const defisitOrC: string[] = [];

  ASPEK_LIST.forEach((asp) => {
    const grade = getAspectGrade(siswa, asp.id);
    if (grade === 'Exceptional' || grade === 'A') exceptionalOrA.push(asp.nama);
    else if (grade === 'B') bList.push(asp.nama);
    else if (grade === 'Defisit' || grade === 'C') defisitOrC.push(asp.nama);
  });

  let narasi = `Pada Triwulan ini, perkembangan Ananda ${siswa.nama} terpantau secara menyeluruh pada 9 dimensi perkembangan peserta didik.\n\n`;

  if (exceptionalOrA.length > 0) {
    narasi += `✓ Aspek Keunggulan: Ananda menunjukkan capaian yang sangat baik dan konsisten pada aspek ${exceptionalOrA.join(', ')}. Kemampuan ini mencerminkan kemandirian dan antusiasme belajar yang patut diapresiasi.\n\n`;
  }
  if (bList.length > 0) {
    narasi += `✓ Aspek Berkembang: Pada aspek ${bList.join(', ')}, ananda menunjukkan perkembangan yang selaras dengan harapan tahapan usianya.\n\n`;
  }
  if (defisitOrC.length > 0) {
    narasi += `✓ Aspek Pendampingan: Adapun pada aspek ${defisitOrC.join(', ')}, ananda masih memerlukan pendampingan berkelanjutan, bimbingan intensif, serta pembiasaan rutin agar potensinya dapat berkembang secara lebih optimal.`;
  }

  return narasi;
};

const generateDefaultSaran = (siswa: SiswaData): string => {
  const kelemahan: { nama: string; saran: string }[] = [];

  ASPEK_LIST.forEach((asp) => {
    const grade = getAspectGrade(siswa, asp.id);
    if (grade === 'Defisit' || grade === 'C') {
      kelemahan.push({ nama: asp.nama, saran: asp.saranKelemahan });
    }
  });

  if (kelemahan.length === 0) {
    return `Alhamdulillah, Ananda ${siswa.nama} telah menunjukkan capaian perkembangan yang sangat baik (A / Exceptional) di seluruh aspek penilaian.\n\nSaran Pengembangan:\nPertahankan semangat belajar dan karakter terpuji yang telah terbangun dengan sangat baik ini. Ananda disarankan untuk terus mengasah potensi kepemimpinan, daya nalar kritis, dan kreativitas diri agar dapat menjadi inspirasi positif bagi teman-teman di lingkungan sekolah.`;
  }

  const saranList = kelemahan
    .map((k, idx) => `${idx + 1}. Aspek ${k.nama}:\n   ${k.saran}`)
    .join('\n\n');

  return `Berdasarkan hasil evaluasi capaian perkembangan, berikut saran pembimbingan dan tindak lanjut prioritas berdasarkan aspek yang perlu ditingkatkan:\n\n${saranList}\n\n*Catatan Kolaborasi: Disarankan adanya komunikasi aktif dan kerjasama pendampingan yang berkesinambungan antara pihak sekolah dan orang tua di rumah agar pembiasaan positif di atas dapat tercapai secara maksimal.`;
};

interface AspectAnalysis {
  id: string;
  no: number;
  nama: string;
  kategori: string;
  colorBg: string;
  colorBorder: string;
  score: number;
  percentage: number;
  grade: string;
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

interface SpiderAnalysisResult {
  aspects: AspectAnalysis[];
  averageScore: number;
  averagePercentage: number;
  overallGrade: string;
  topStrengths: AspectAnalysis[];
  topWeaknesses: AspectAnalysis[];
  strengthsSummary: string;
  weaknessesSummary: string;
}

const getStudentSpiderAnalysis = (siswa: SiswaData): SpiderAnalysisResult => {
  const aspects: AspectAnalysis[] = ASPEK_LIST.map((asp) => {
    const sec = (siswa[asp.id as keyof SiswaData] as Record<string, string>) || {};
    const indicators = asp.indikatorList.map((ind) => {
      const rating = sec[ind.key] || 'Defisit';
      const score = GRADE_WEIGHTS[rating] || 1;
      return {
        ...ind,
        rating,
        score
      };
    });

    const totalScore = indicators.reduce((acc, curr) => acc + curr.score, 0);
    const score = Number((totalScore / indicators.length).toFixed(2));
    const percentage = Math.round((score / 5) * 100);
    const grade = getAspectGrade(siswa, asp.id);

    const strengthIndicators = indicators
      .filter((ind) => ind.rating === 'Exceptional' || ind.rating === 'A')
      .map((ind) => `${ind.nama} (${ind.rating})`);

    const weaknessIndicators = indicators
      .filter((ind) => ind.rating === 'Defisit' || ind.rating === 'C')
      .map((ind) => `${ind.nama} (${ind.rating})`);

    let explanation = '';
    if (grade === 'Exceptional') {
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
      indicators,
      strengthIndicators,
      weaknessIndicators,
      explanation
    };
  });

  const totalAspectScores = aspects.reduce((sum, a) => sum + a.score, 0);
  const averageScore = Number((totalAspectScores / aspects.length).toFixed(2));
  const averagePercentage = Math.round((averageScore / 5) * 100);

  let overallGrade = 'B';
  if (averageScore >= 4.5) overallGrade = 'Exceptional';
  else if (averageScore >= 3.5) overallGrade = 'A';
  else if (averageScore >= 2.5) overallGrade = 'B';
  else if (averageScore >= 1.5) overallGrade = 'C';
  else overallGrade = 'Defisit';

  // Pemilahan dimensi unggulan dan prioritas bimbingan yang mutually exclusive (tidak tumpang tindih)
  const sortedDesc = [...aspects].sort((a, b) => b.score - a.score);
  
  // Ambil dimensi dengan skor tertinggi (maksimal 3 aspek teratas) sebagai keunggulan
  const candidateStrengths = sortedDesc.filter((a) => a.score >= 3.5);
  const finalStrengths = (candidateStrengths.length > 0 ? candidateStrengths : sortedDesc.slice(0, 3)).slice(0, 3);
  const strengthIds = new Set(finalStrengths.map((s) => s.id));

  // Dimensi prioritas bimbingan diambil dari aspek tersisa (yang tidak ada di dimensi keunggulan), diurutkan dari skor terendah
  const remainingForWeaknesses = [...aspects]
    .filter((a) => !strengthIds.has(a.id))
    .sort((a, b) => a.score - b.score);
  
  const lowScoringWeaknesses = remainingForWeaknesses.filter((a) => a.score <= 3.0);
  const finalWeaknesses = (lowScoringWeaknesses.length > 0 ? lowScoringWeaknesses : remainingForWeaknesses).slice(0, 3);

  const strongNames = finalStrengths.map((s) => s.nama).join(', ');
  const weakNames = finalWeaknesses.map((w) => w.nama).join(', ');

  const strengthsSummary = `Berdasarkan peta radar capaian, kekuatan dominan Ananda ${siswa.nama} terletak pada dimensi ${strongNames}. Ananda menunjukkan antusiasme belajar yang tinggi, karakter kepemimpinan, kepedulian sosial, serta potensi keunikan diri yang patut diapresiasi dan dipertahankan.`;

  const weaknessesSummary = `Area perkembangan yang masih menjadi prioritas pendampingan teridentifikasi pada dimensi ${weakNames}. Diperlukan strategi bimbingan bertahap dari guru di kelas serta pembiasaan rutin yang hangat dari orang tua di rumah agar capaian pada aspek ini dapat bertumbuh optimal.`;

  return {
    aspects,
    averageScore,
    averagePercentage,
    overallGrade,
    topStrengths: finalStrengths,
    topWeaknesses: finalWeaknesses,
    strengthsSummary,
    weaknessesSummary
  };
};

interface QuarterTrendPoint {
  periode: string;
  label: string;
  rerata: number;
  kognitif: number;
  afektif: number;
  psikomotor: number;
  sosial: number;
  islamicLiteracy: number;
  islamic_literacy: number;
  bilingual: number;
  talents: number;
  experience: number;
  inklusivitas: number;
  [key: string]: string | number;
}

interface DimensionQuarterComparison {
  id: string;
  nama: string;
  singkatan: string;
  triwulanLalu: number;
  triwulanIni: number;
  selisih: number;
  persen: number;
  isNaik: boolean;
}

interface StudentQuarterTrendsResult {
  quarters: QuarterTrendPoint[];
  overallDiff: number;
  overallPercent: number;
  isOverallUp: boolean;
  prevRerata: number;
  currentRerata: number;
  highestGrowthDimension: DimensionQuarterComparison;
  dimensionComparisons: DimensionQuarterComparison[];
}

const getStudentQuarterTrends = (siswa: SiswaData): StudentQuarterTrendsResult => {
  const analysis = getStudentSpiderAnalysis(siswa);
  const currentScores: Record<string, number> = {};
  analysis.aspects.forEach((asp) => {
    currentScores[asp.id] = asp.score;
  });
  // Sediakan alias untuk konsistensi camelCase & snake_case
  if (currentScores['islamicLiteracy'] !== undefined) {
    currentScores['islamic_literacy'] = currentScores['islamicLiteracy'];
  } else if (currentScores['islamic_literacy'] !== undefined) {
    currentScores['islamicLiteracy'] = currentScores['islamic_literacy'];
  }

  const triwulanMap = (siswa.allTriwulan || (siswa as any).triwulan) as Record<TriwulanKey, SiswaAssessmentRecord> | undefined;

  // Fungsi pengambilan skor aspek dari data triwulan nyata siswa atau baseline deterministik
  const getScoreForQuarterAspect = (
    qKey: 'T1' | 'T2' | 'T3' | 'T4',
    aspectId: string,
    stage: 1 | 2 | 3 | 4
  ): number => {
    const qRecord = triwulanMap?.[qKey];
    if (qRecord) {
      // Periksa overallGrades manual jika tersedia
      if (qRecord.overallGrades && qRecord.overallGrades[aspectId]) {
        const og = qRecord.overallGrades[aspectId];
        if (GRADE_WEIGHTS[og]) return GRADE_WEIGHTS[og];
      }
      
      const aspMeta = ASPEK_LIST.find((a) => a.id === aspectId || (aspectId === 'islamic_literacy' && a.id === 'islamicLiteracy'));
      if (aspMeta) {
        const sec = (qRecord[aspMeta.id as keyof SiswaAssessmentRecord] ||
          (qRecord as any)[aspMeta.id.replace(/([A-Z])/g, '_$1').toLowerCase()] ||
          (aspMeta.id === 'islamicLiteracy' ? (qRecord as any).islamic_literacy : undefined)) as Record<string, string> | undefined;

        if (sec) {
          const scores: number[] = [];
          aspMeta.indikatorList.forEach((ind) => {
            const val = sec[ind.key];
            if (val && GRADE_WEIGHTS[val]) {
              scores.push(GRADE_WEIGHTS[val]);
            }
          });
          if (scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            return Number(avg.toFixed(2));
          }
        }
      }
    }

    // Jika stage 4 (triwulan saat ini), gunakan skor analisis terkini
    if (stage === 4) {
      const cur = currentScores[aspectId] ?? (aspectId === 'islamic_literacy' ? currentScores['islamicLiteracy'] : currentScores['islamic_literacy']);
      return cur !== undefined ? cur : 3.5;
    }

    // Fallback kurva deterministik jika data periode lalu belum diinput
    const cur = currentScores[aspectId] ?? (aspectId === 'islamic_literacy' ? currentScores['islamicLiteracy'] : currentScores['islamic_literacy']) ?? 3.5;
    const seed = (siswa.no * 7 + aspectId.charCodeAt(0) * 3 + stage * 11) % 100;
    const growthGap = stage === 3 ? 0.22 : stage === 2 ? 0.44 : 0.68;
    const variation = (seed / 100) * 0.16 - 0.08;
    const prev = Math.max(1.8, Math.min(4.9, cur - growthGap + variation));
    return Number(prev.toFixed(2));
  };

  const t1_il = getScoreForQuarterAspect('T1', 'islamicLiteracy', 1);
  const t2_il = getScoreForQuarterAspect('T2', 'islamicLiteracy', 2);
  const t3_il = getScoreForQuarterAspect('T3', 'islamicLiteracy', 3);
  const t4_il = getScoreForQuarterAspect('T4', 'islamicLiteracy', 4);

  const quarters: QuarterTrendPoint[] = [
    {
      periode: 'TW 1',
      label: 'Triwulan I (Awal)',
      rerata: 0,
      kognitif: getScoreForQuarterAspect('T1', 'kognitif', 1),
      afektif: getScoreForQuarterAspect('T1', 'afektif', 1),
      psikomotor: getScoreForQuarterAspect('T1', 'psikomotor', 1),
      sosial: getScoreForQuarterAspect('T1', 'sosial', 1),
      islamicLiteracy: t1_il,
      islamic_literacy: t1_il,
      bilingual: getScoreForQuarterAspect('T1', 'bilingual', 1),
      talents: getScoreForQuarterAspect('T1', 'talents', 1),
      experience: getScoreForQuarterAspect('T1', 'experience', 1),
      inklusivitas: getScoreForQuarterAspect('T1', 'inklusivitas', 1)
    },
    {
      periode: 'TW 2',
      label: 'Triwulan II (Pertengahan)',
      rerata: 0,
      kognitif: getScoreForQuarterAspect('T2', 'kognitif', 2),
      afektif: getScoreForQuarterAspect('T2', 'afektif', 2),
      psikomotor: getScoreForQuarterAspect('T2', 'psikomotor', 2),
      sosial: getScoreForQuarterAspect('T2', 'sosial', 2),
      islamicLiteracy: t2_il,
      islamic_literacy: t2_il,
      bilingual: getScoreForQuarterAspect('T2', 'bilingual', 2),
      talents: getScoreForQuarterAspect('T2', 'talents', 2),
      experience: getScoreForQuarterAspect('T2', 'experience', 2),
      inklusivitas: getScoreForQuarterAspect('T2', 'inklusivitas', 2)
    },
    {
      periode: 'TW 3',
      label: 'Triwulan III (Sebelumnya)',
      rerata: 0,
      kognitif: getScoreForQuarterAspect('T3', 'kognitif', 3),
      afektif: getScoreForQuarterAspect('T3', 'afektif', 3),
      psikomotor: getScoreForQuarterAspect('T3', 'psikomotor', 3),
      sosial: getScoreForQuarterAspect('T3', 'sosial', 3),
      islamicLiteracy: t3_il,
      islamic_literacy: t3_il,
      bilingual: getScoreForQuarterAspect('T3', 'bilingual', 3),
      talents: getScoreForQuarterAspect('T3', 'talents', 3),
      experience: getScoreForQuarterAspect('T3', 'experience', 3),
      inklusivitas: getScoreForQuarterAspect('T3', 'inklusivitas', 3)
    },
    {
      periode: 'TW 4',
      label: 'Triwulan IV (Saat Ini)',
      rerata: analysis.averageScore,
      kognitif: getScoreForQuarterAspect('T4', 'kognitif', 4),
      afektif: getScoreForQuarterAspect('T4', 'afektif', 4),
      psikomotor: getScoreForQuarterAspect('T4', 'psikomotor', 4),
      sosial: getScoreForQuarterAspect('T4', 'sosial', 4),
      islamicLiteracy: t4_il,
      islamic_literacy: t4_il,
      bilingual: getScoreForQuarterAspect('T4', 'bilingual', 4),
      talents: getScoreForQuarterAspect('T4', 'talents', 4),
      experience: getScoreForQuarterAspect('T4', 'experience', 4),
      inklusivitas: getScoreForQuarterAspect('T4', 'inklusivitas', 4)
    }
  ];

  // Hitung rerata komprehensif 9 dimensi untuk TW 1, 2, 3
  quarters[0].rerata = Number(
    ((quarters[0].kognitif + quarters[0].afektif + quarters[0].psikomotor + quarters[0].sosial + quarters[0].islamicLiteracy + quarters[0].bilingual + quarters[0].talents + quarters[0].experience + quarters[0].inklusivitas) / 9).toFixed(2)
  );
  quarters[1].rerata = Number(
    ((quarters[1].kognitif + quarters[1].afektif + quarters[1].psikomotor + quarters[1].sosial + quarters[1].islamicLiteracy + quarters[1].bilingual + quarters[1].talents + quarters[1].experience + quarters[1].inklusivitas) / 9).toFixed(2)
  );
  quarters[2].rerata = Number(
    ((quarters[2].kognitif + quarters[2].afektif + quarters[2].psikomotor + quarters[2].sosial + quarters[2].islamicLiteracy + quarters[2].bilingual + quarters[2].talents + quarters[2].experience + quarters[2].inklusivitas) / 9).toFixed(2)
  );

  const prevQuarter = quarters[2];
  const currentQuarter = quarters[3];
  const overallDiff = Number((currentQuarter.rerata - prevQuarter.rerata).toFixed(2));
  const overallPercent = Number(((overallDiff / prevQuarter.rerata) * 100).toFixed(1));

  // Komparasi seluruh 9 dimensi
  const dimensionComparisons: DimensionQuarterComparison[] = analysis.aspects.map((asp) => {
    const prevRaw = prevQuarter[asp.id] !== undefined
      ? prevQuarter[asp.id]
      : (asp.id === 'islamicLiteracy' ? prevQuarter.islamic_literacy : prevQuarter[asp.id]);
    const currRaw = currentQuarter[asp.id] !== undefined
      ? currentQuarter[asp.id]
      : (asp.id === 'islamicLiteracy' ? currentQuarter.islamic_literacy : currentQuarter[asp.id]);
    const prev = Number(prevRaw) || 0;
    const curr = Number(currRaw) || 0;
    const diff = Number((curr - prev).toFixed(2));
    const pct = prev > 0 ? Number(((diff / prev) * 100).toFixed(1)) : 0;
    return {
      id: asp.id,
      nama: asp.nama,
      singkatan: asp.nama.length > 10 ? asp.nama.substring(0, 9) + '..' : asp.nama,
      triwulanLalu: prev,
      triwulanIni: curr,
      selisih: diff,
      persen: pct,
      isNaik: diff >= 0
    };
  });

  const sortedByGrowth = [...dimensionComparisons].sort((a, b) => b.selisih - a.selisih);
  const highestGrowthDimension = sortedByGrowth[0] || dimensionComparisons[0];

  return {
    quarters,
    overallDiff,
    overallPercent,
    isOverallUp: overallDiff >= 0,
    prevRerata: prevQuarter.rerata,
    currentRerata: currentQuarter.rerata,
    highestGrowthDimension,
    dimensionComparisons
  };
};

export const ASPEK_SIDEBAR_LIST = [
  { id: 'kognitif', label: 'KOGNITIF', no: 1, color: '#ffff00', kode: 'KG' },
  { id: 'afektif', label: 'AFEKTIF', no: 2, color: '#00b050', kode: 'AF' },
  { id: 'psikomotor', label: 'PSIKOMOTOR', no: 3, color: '#002060', kode: 'PS' },
  { id: 'sosial', label: 'SOSIAL', no: 4, color: '#595959', kode: 'SO' },
  { id: 'islamic_literacy', label: 'ISLAMIC LITERACY', no: 5, color: '#b1a0c7', kode: 'IL' },
  { id: 'bilingual', label: 'BILINGUAL', no: 6, color: '#92cddc', kode: 'BL' },
  { id: 'talents', label: 'TALENTS', no: 7, color: '#ffc000', kode: 'TL' },
  { id: 'experience', label: 'EXPERIENCE', no: 8, color: '#95b3d7', kode: 'EX' },
  { id: 'inklusivitas', label: 'INKLUSIVITAS', no: 9, color: '#92d050', kode: 'IN' }
];

export const ASPECT_PAGE_KEYS = ASPEK_SIDEBAR_LIST.map((a) => a.id);

export interface TableThemeConfig {
  id: string;
  name: string;
  headerBg: string;
  headerText: string;
  subHeaderBg: string;
  subHeaderText: string;
  borderColor: string;
  accentBg: string;
  badge: string;
}

export const TABLE_THEMES: Record<string, TableThemeConfig> = {
  default: {
    id: 'default',
    name: 'Hijau Excel (Standar)',
    headerBg: '#d9d9d9',
    headerText: '#000000',
    subHeaderBg: '#92d050',
    subHeaderText: '#000000',
    borderColor: '#000000',
    accentBg: '#f2f2f2',
    badge: '#92d050'
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Formal',
    headerBg: '#047857',
    headerText: '#ffffff',
    subHeaderBg: '#34d399',
    subHeaderText: '#064e3b',
    borderColor: '#065f46',
    accentBg: '#ecfdf5',
    badge: '#047857'
  },
  blue: {
    id: 'blue',
    name: 'Biru Edukasi',
    headerBg: '#0284c7',
    headerText: '#ffffff',
    subHeaderBg: '#7dd3fc',
    subHeaderText: '#0c4a6e',
    borderColor: '#0369a1',
    accentBg: '#f0f9ff',
    badge: '#0284c7'
  },
  purple: {
    id: 'purple',
    name: 'Ungu Elegan',
    headerBg: '#6d28d9',
    headerText: '#ffffff',
    subHeaderBg: '#c4b5fd',
    subHeaderText: '#4c1d95',
    borderColor: '#5b21b6',
    accentBg: '#f5f3ff',
    badge: '#6d28d9'
  },
  amber: {
    id: 'amber',
    name: 'Emas / Amber',
    headerBg: '#d97706',
    headerText: '#ffffff',
    subHeaderBg: '#fcd34d',
    subHeaderText: '#78350f',
    borderColor: '#b45309',
    accentBg: '#fffbeb',
    badge: '#d97706'
  },
  rose: {
    id: 'rose',
    name: 'Merah Maroon',
    headerBg: '#be123c',
    headerText: '#ffffff',
    subHeaderBg: '#fda4af',
    subHeaderText: '#881337',
    borderColor: '#9f1239',
    accentBg: '#fff1f2',
    badge: '#be123c'
  },
  grayscale: {
    id: 'grayscale',
    name: 'Hitam Putih / Monokrom',
    headerBg: '#334155',
    headerText: '#ffffff',
    subHeaderBg: '#cbd5e1',
    subHeaderText: '#0f172a',
    borderColor: '#000000',
    accentBg: '#f8fafc',
    badge: '#334155'
  }
};

const SCHOOL_REPORT_PALETTE = {
  header: '#d0cece',
  gradeHeader: '#bf8f00',
  gradeCell: '#ffd965',
  aspects: {
    kognitif: { number: '#d0cece', aspect: '#d0cece', indicator: '#f7cbac' },
    afektif: { number: '#ff6699', aspect: '#ff6699', indicator: '#ff6699' },
    psikomotor: { number: '#a8d08d', aspect: '#c5e0b3', indicator: '#a8d08d' },
    sosial: { number: '#d581ab', aspect: '#d581ab', indicator: '#d581ab' },
    islamicLiteracy: { number: '#d5dce4', aspect: '#d5dce4', indicator: '#d5dce4' },
    bilingual: { number: '#d06b4c', aspect: '#d06b4c', indicator: '#d06b4c' },
    talents: { number: '#18a5a8', aspect: '#18a5a8', indicator: '#18a5a8' },
    experience: { number: '#a8d08d', aspect: '#c5e0b3', indicator: '#c5e0b3' },
    inklusivitas: { number: '#ff5050', aspect: '#ff5050', indicator: '#ff5050' }
  } as const
};

const getSchoolAspectPalette = (aspectId: string) =>
  SCHOOL_REPORT_PALETTE.aspects[aspectId as keyof typeof SCHOOL_REPORT_PALETTE.aspects] ??
  { number: SCHOOL_REPORT_PALETTE.header, aspect: SCHOOL_REPORT_PALETTE.header, indicator: SCHOOL_REPORT_PALETTE.header };

export const FONT_OPTIONS = [
  { id: 'Arial', name: 'Arial (Standar Bersih)', css: 'Arial, Helvetica, sans-serif' },
  { id: 'Times New Roman', name: 'Times New Roman (Resmi / Formal)', css: '"Times New Roman", Times, serif' },
  { id: 'Calibri', name: 'Calibri (Modern)', css: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif' },
  { id: 'Tahoma', name: 'Tahoma (Tegas & Rapi)', css: 'Tahoma, Verdana, Segoe, sans-serif' },
  { id: 'Georgia', name: 'Georgia (Elegan)', css: 'Georgia, serif' },
  { id: 'Trebuchet MS', name: 'Trebuchet MS (Dinamis)', css: '"Trebuchet MS", sans-serif' }
];

export const FONT_SIZES = [
  { id: 'sm', label: 'Ringkas (10px)', tableFont: '10px', bodyFont: '10.5px', scale: 0.9 },
  { id: 'base', label: 'Standar (11.5px)', tableFont: '11px', bodyFont: '11.5px', scale: 1 },
  { id: 'lg', label: 'Besar (13px)', tableFont: '12.5px', bodyFont: '13px', scale: 1.1 }
];

export const PAPER_SIZES = [
  { id: 'A4', label: 'A4 (210 × 297 mm)', width: '210mm', height: '297mm', desc: 'Standar Nasional' },
  { id: 'F4', label: 'F4 / Folio (215 × 330 mm)', width: '215mm', height: '330mm', desc: 'Kertas Fisik Raport' },
  { id: 'Letter', label: 'Letter (216 × 279 mm)', width: '216mm', height: '279mm', desc: 'Standar Internasional' },
  { id: 'Legal', label: 'Legal (216 × 356 mm)', width: '216mm', height: '356mm', desc: 'Ukuran Panjang' }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [activeTriwulan, setActiveTriwulan] = useState<TriwulanKey>('T1');
  const [reportTriwulan, setReportTriwulan] = useState<TriwulanKey>('T1');
  const [expandedTriwulan, setExpandedTriwulan] = useState<TriwulanKey | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentNum, setSelectedStudentNum] = useState<number>(1);
  const [selectedStudentNos, setSelectedStudentNos] = useState<number[]>([]);
  const [printViewMode, setPrintViewMode] = useState<'ringkas' | 'detail'>('detail');

  // Sinkronisasi: Jika berada di halaman aspek, otomatis buka Triwulan yang aktif di accordion
  useEffect(() => {
    if (ASPECT_PAGE_KEYS.includes(currentPage)) {
      setExpandedTriwulan(activeTriwulan);
    }
  }, [currentPage, activeTriwulan]);

  const handleToggleTriwulanAccordion = (tKey: TriwulanKey) => {
    if (expandedTriwulan === tKey) {
      setExpandedTriwulan(null);
    } else {
      // Single-open accordion behavior: hanya satu yang terbuka, yang lain collapse
      setExpandedTriwulan(tKey);
      setActiveTriwulan(tKey);
      setReportTriwulan(tKey);
      setPrintStatus(`Periode aktif: ${tKey}. Data tersambung ke Triwulan ${tKey.replace('T', '')}.`);
      setTimeout(() => setPrintStatus(null), 3000);
    }
  };

  const handleSelectAspectSubmenu = (tKey: TriwulanKey, aspectId: string) => {
    setActiveTriwulan(tKey);
    setReportTriwulan(tKey);
    setExpandedTriwulan(tKey);
    setCurrentPage(aspectId);
    setIsMobileSidebarOpen(false);
  };

  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // Authentication & Role-based Access State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('rapor_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading saved user:', e);
    }
    return null;
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);

  // Teachers State (stored at Firebase node /teachers)
  const [teachersList, setTeachersList] = useState<TeacherRecord[]>([]);
  const [teacherFormData, setTeacherFormData] = useState<Omit<TeacherRecord, 'id'>>({
    nama: '',
    tingkatKelas: '4',
    namaKelas: 'Kelas IV (Fase B)',
    username: '',
    password: '',
    niy: ''
  });
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Master Database Multi-Quarter (T1, T2, T3, T4)
  const [masterStudents, setMasterStudents] = useState<StudentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('rapor_master_multiquarter_v2');
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.warn('LocalStorage error loading masterStudents:', err);
    }
    return INITIAL_MASTER_STUDENTS;
  });

  // Sinkronisasi otomatis ke LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('rapor_master_multiquarter_v2', JSON.stringify(masterStudents));
    } catch (err) {
      console.warn('LocalStorage error saving masterStudents:', err);
    }
  }, [masterStudents]);

  // Derived dataSiswa untuk Triwulan Aktif (digunakan di 9 form penilaian & DBTW)
  const dataSiswa: SiswaData[] = useMemo(() => {
    // Jika role Orang Tua, filter HANYA data anak kandungnya
    const baseList = currentUser?.role === 'orangtua' && currentUser.studentNo
      ? masterStudents.filter((s) => s.no === currentUser.studentNo || s.nis === currentUser.nisn)
      : masterStudents;

    return baseList.map((s) => ({
      no: s.no,
      nama: s.nama,
      nis: s.nis,
      kelas: s.kelas,
      tahunAjaran: s.tahunAjaran,
      ...s.triwulan[activeTriwulan],
      allTriwulan: s.triwulan
    }));
  }, [masterStudents, activeTriwulan, currentUser]);

  // Derived reportSiswa untuk Laporan Rapor & Spider Chart
  const reportSiswa: SiswaData[] = useMemo(() => {
    const baseList = currentUser?.role === 'orangtua' && currentUser.studentNo
      ? masterStudents.filter((s) => s.no === currentUser.studentNo || s.nis === currentUser.nisn)
      : masterStudents;

    return baseList.map((s) => ({
      no: s.no,
      nama: s.nama,
      nis: s.nis,
      kelas: s.kelas,
      tahunAjaran: s.tahunAjaran,
      ...s.triwulan[reportTriwulan],
      allTriwulan: s.triwulan
    }));
  }, [masterStudents, reportTriwulan, currentUser]);

  const updateStudentDeskripsiRapor = (no: number, text: string) => {
    if (currentUser?.role === 'orangtua') return;
    const targetStudent = masterStudents.find((s) => s.no === no);
    const updated = masterStudents.map((s) => {
      if (s.no !== no) return s;
      const curQ = s.triwulan[activeTriwulan];
      return {
        ...s,
        triwulan: {
          ...s.triwulan,
          [activeTriwulan]: { ...curQ, deskripsiRapor: text }
        }
      };
    });
    setMasterStudents(updated);
    saveStudentsToFirebase(
      updated,
      `Deskripsi refleksi ${targetStudent?.nama || 'siswa'} berhasil disimpan ke Firebase Realtime Database.`
    );
  };

  const updateStudentSaranRapor = (no: number, text: string) => {
    if (currentUser?.role === 'orangtua') return;
    const targetStudent = masterStudents.find((s) => s.no === no);
    const updated = masterStudents.map((s) => {
      if (s.no !== no) return s;
      const curQ = s.triwulan[activeTriwulan];
      return {
        ...s,
        triwulan: {
          ...s.triwulan,
          [activeTriwulan]: { ...curQ, saranRapor: text }
        }
      };
    });
    setMasterStudents(updated);
    saveStudentsToFirebase(
      updated,
      `Saran perkembangan ${targetStudent?.nama || 'siswa'} berhasil disimpan ke Firebase Realtime Database.`
    );
  };

  const updateStudentOverallGrade = (no: number, aspectId: string, grade: string) => {
    if (currentUser?.role === 'orangtua') return;
    const targetStudent = masterStudents.find((s) => s.no === no);
    const updated = masterStudents.map((s) => {
      if (s.no !== no) return s;
      const curQ = s.triwulan[activeTriwulan];
      const curOverall = curQ.overallGrades || {};
      return {
        ...s,
        triwulan: {
          ...s.triwulan,
          [activeTriwulan]: {
            ...curQ,
            overallGrades: {
              ...curOverall,
              [aspectId]: curOverall[aspectId] === grade ? '' : grade
            }
          }
        }
      };
    });
    setMasterStudents(updated);
    saveStudentsToFirebase(
      updated,
      `Predikat akhir aspek ${aspectId.toUpperCase()} untuk ${targetStudent?.nama || 'siswa'} berhasil disimpan ke Firebase.`
    );
  };

  const updateStudentIndicator = (no: number, aspectId: string, indKey: string, grade: string) => {
    if (currentUser?.role === 'orangtua') return;
    const targetStudent = masterStudents.find((s) => s.no === no);
    const updated = masterStudents.map((s) => {
      if (s.no !== no) return s;
      const curQ = s.triwulan[activeTriwulan];
      const curSec = (curQ[aspectId as keyof SiswaAssessmentRecord] as Record<string, string>) || {};
      return {
        ...s,
        triwulan: {
          ...s.triwulan,
          [activeTriwulan]: {
            ...curQ,
            [aspectId]: {
              ...curSec,
              [indKey]: curSec[indKey] === grade ? '' : grade
            }
          }
        }
      };
    });
    setMasterStudents(updated);
    saveStudentsToFirebase(
      updated,
      `Penilaian indikator ${indKey.toUpperCase()} (${grade}) untuk ${targetStudent?.nama || 'siswa'} tersimpan ke Firebase.`
    );
  };

  // Metadata Rapor dari Sheet Database (Persis KOP Screenshot Asli)
  const [metaRapor, setMetaRapor] = useState({
    tanggalRaport: '9 Oktober 2026',
    tempatRaport: 'Majatengah',
    kepalaSekolah: {
      nama: 'Rina Shanty Pratiwi, S.Pd',
      niy: '91050107202022'
    },
    guruKelas: {
      nama: 'Yuliono Nurokhim, S.Pd',
      niy: '89070107222028'
    },
    kopSekolah: {
      instansi: 'YAYASAN KHALIMUL KHASAN',
      namaSekolah: 'SD KHALIMUL KHASAN 1 BILINGUAL SCHOOL',
      npsn: 'NDS: 1002220005, NSS: 102030206038, NPSN: 20280456',
      akreditasi: "TERAKREDITASI 'A'",
      alamat: 'Alamat: Jl. Raya Majatengah Ds. Majatengah Kec. Kemangkon Kab. Purbalingga Pos 53381',
      kontak: 'E-mail: sdkhalimulkhasan1@gmail.com, Telp: 085227181000',
      judulRapor: 'LAPORAN PERKEMBANGAN SISWA TRIWULAN I',
      tahunAjaran: 'TAHUN AJARAN 2026/2027'
    },
    judulLaporan: {
      baris1: 'LAPORAN PERKEMBANGAN SISWA TRIWULAN I',
      baris2: 'SD KHALIMUL KHASAN 1 BILINGUAL SCHOOL',
      baris3: 'TAHUN AJARAN 2026/2027'
    }
  });

  // 1. SINKRONISASI REALTIME FIREBASE: /students
  useEffect(() => {
    const studentsRef = ref(db, 'students');
    const unsubscribe = onValue(
      studentsRef,
      (snapshot: any) => {
        setFirebaseConnected(true);
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (Array.isArray(val)) {
            setMasterStudents(val);
          } else if (typeof val === 'object' && val !== null) {
            if (val.__emptyDatabase === true) {
              setMasterStudents([]);
              return;
            }
            const arr = Object.values(val) as StudentRecord[];
            arr.sort((a, b) => a.no - b.no);
            setMasterStudents(arr);
          }
        } else {
          // Inisialisasi awal ke Firebase jika masih kosong
          set(studentsRef, INITIAL_MASTER_STUDENTS).catch((err: any) =>
            console.warn('Firebase initial students set error:', err)
          );
        }
      },
      (error: any) => {
        console.warn('Firebase /students onValue error:', error);
        setFirebaseConnected(false);
      }
    );

    return () => {
      off(studentsRef);
    };
  }, []);

  // 2. SINKRONISASI REALTIME FIREBASE: /teachers
  useEffect(() => {
    const teachersRef = ref(db, 'teachers');
    const unsubscribe = onValue(
      teachersRef,
      (snapshot: any) => {
        setFirebaseConnected(true);
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: TeacherRecord[] = [];
          if (typeof val === 'object' && val !== null) {
            Object.keys(val).forEach((k) => {
              list.push({ id: k, ...val[k] });
            });
          }
          setTeachersList(list);
        } else {
          // Buat data guru default jika kosong
          const defaultTeachers: Record<string, Omit<TeacherRecord, 'id'>> = {
            teacher_1: {
              nama: 'Yuliono Nurokhim, S.Pd',
              tingkatKelas: '4',
              namaKelas: 'Kelas IV (Fase B)',
              username: 'guru4',
              password: 'guru4password#',
              niy: '89070107222028'
            }
          };
          set(teachersRef, defaultTeachers).catch((err: any) =>
            console.warn('Firebase initial teachers error:', err)
          );
        }
      },
      (error: any) => {
        console.warn('Firebase /teachers onValue error:', error);
      }
    );

    return () => {
      off(teachersRef);
    };
  }, []);

  // 3. SINKRONISASI REALTIME FIREBASE: /app_settings
  useEffect(() => {
    const settingsRef = ref(db, 'app_settings');
    const unsubscribe = onValue(
      settingsRef,
      (snapshot: any) => {
        setFirebaseConnected(true);
        if (snapshot.exists()) {
          const val = snapshot.val();
          setMetaRapor((prev) => ({
            ...prev,
            tanggalRaport: val.tanggalRaport || prev.tanggalRaport,
            tempatRaport: val.tempatRaport || prev.tempatRaport,
            kepalaSekolah: {
              nama: val.kepalaSekolahNama || prev.kepalaSekolah.nama,
              niy: val.kepalaSekolahNiy || prev.kepalaSekolah.niy
            },
            guruKelas: {
              nama: val.guruKelasNama || prev.guruKelas.nama,
              niy: val.guruKelasNiy || prev.guruKelas.niy
            },
            kopSekolah: {
              ...prev.kopSekolah,
              instansi: val.instansi || prev.kopSekolah.instansi,
              namaSekolah: val.namaSekolah || prev.kopSekolah.namaSekolah,
              npsn: val.npsn || prev.kopSekolah.npsn,
              akreditasi: val.akreditasi || prev.kopSekolah.akreditasi,
              alamat: val.alamat || prev.kopSekolah.alamat,
              kontak: val.kontak || prev.kopSekolah.kontak,
              tahunAjaran: val.tahunAjaran || prev.kopSekolah.tahunAjaran,
              judulRapor: val.activeTriwulan
                ? `LAPORAN PERKEMBANGAN SISWA ${val.activeTriwulan === 'T1' ? 'TRIWULAN I' : val.activeTriwulan === 'T2' ? 'TRIWULAN II' : val.activeTriwulan === 'T3' ? 'TRIWULAN III' : 'TRIWULAN IV'}`
                : prev.kopSekolah.judulRapor
            },
            judulLaporan: {
              baris1: val.activeTriwulan
                ? `LAPORAN PERKEMBANGAN SISWA ${val.activeTriwulan === 'T1' ? 'TRIWULAN I' : val.activeTriwulan === 'T2' ? 'TRIWULAN II' : val.activeTriwulan === 'T3' ? 'TRIWULAN III' : 'TRIWULAN IV'}`
                : prev.judulLaporan.baris1,
              baris2: val.namaSekolah || prev.judulLaporan.baris2,
              baris3: val.tahunAjaran ? `TAHUN AJARAN ${val.tahunAjaran}` : prev.judulLaporan.baris3
            }
          }));

          if (val.activeTriwulan && ['T1', 'T2', 'T3', 'T4'].includes(val.activeTriwulan)) {
            setActiveTriwulan(val.activeTriwulan as TriwulanKey);
            setReportTriwulan(val.activeTriwulan as TriwulanKey);
          }
        }
      },
      (error: any) => {
        console.warn('Firebase /app_settings onValue error:', error);
      }
    );

    return () => {
      off(settingsRef);
    };
  }, []);

  // Simpan user sesi ke localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('rapor_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('rapor_current_user');
      }
    } catch (e) {
      console.warn('Error saving user session:', e);
    }
  }, [currentUser]);

  // Otomatis kunci dropdown siswa jika user adalah orang tua
  useEffect(() => {
    if (currentUser?.role === 'orangtua' && currentUser.studentNo) {
      setSelectedStudentNum(currentUser.studentNo);
    }
  }, [currentUser]);

  // FUNGSI SIMPAN DATA SISWA KE FIREBASE DENGAN TOAST NOTIFICATION
  const saveStudentsToFirebase = async (newStudents: StudentRecord[], customMsg?: string) => {
    setIsFirebaseSyncing(true);
    try {
      const studentsRef = ref(db, 'students');
      await set(studentsRef, newStudents.length > 0 ? newStudents : { __emptyDatabase: true });
      setMasterStudents(newStudents);
      toastSuccess(
        'Data Siswa Berhasil Disimpan',
        customMsg || 'Data penilaian siswa berhasil diperbarui ke Firebase Realtime Database.'
      );
      return true;
    } catch (err: any) {
      console.error('Gagal menyimpan siswa ke Firebase:', err);
      toastError('Gagal Menyimpan Data Siswa', err?.message || 'Terjadi kesalahan jaringan Firebase.');
      return false;
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleDeleteStudents = async (studentNos: number[], deleteAll = false) => {
    const studentsToDelete = masterStudents.filter((student) => studentNos.includes(student.no));
    if (studentsToDelete.length === 0 || isFirebaseSyncing) return;

    const confirmation = deleteAll
      ? `Hapus SELURUH ${studentsToDelete.length} data siswa beserta seluruh nilai dan rapornya? Tindakan ini tidak dapat dibatalkan.`
      : `Hapus ${studentsToDelete.length} data siswa terpilih beserta seluruh nilai dan rapornya? Tindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(confirmation)) return;

    const deletedNos = new Set(studentsToDelete.map((student) => student.no));
    const remainingStudents = masterStudents
      .filter((student) => !deletedNos.has(student.no))
      .map((student, index) => ({ ...student, no: index + 1 }));
    const saved = await saveStudentsToFirebase(
      remainingStudents,
      deleteAll
        ? 'Seluruh database siswa dan data penilaiannya berhasil dihapus.'
        : `${studentsToDelete.length} siswa beserta data penilaiannya berhasil dihapus.`
    );

    if (saved) {
      setSelectedStudentNos([]);
      setSelectedStudentNum(remainingStudents[0]?.no ?? 1);
      setCurrentPage('database');
    }
  };

  // FUNGSI SIMPAN/UPDATE DATA GURU KE FIREBASE DENGAN TOAST NOTIFICATION
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFormData.nama.trim() || !teacherFormData.username.trim() || !teacherFormData.password.trim()) {
      toastError('Form Tidak Lengkap', 'Nama, Username, dan Password guru wajib diisi!');
      return;
    }

    setIsFirebaseSyncing(true);
    try {
      const teacherId = editingTeacherId || `teacher_${Date.now()}`;
      const teacherRef = ref(db, `teachers/${teacherId}`);
      await set(teacherRef, teacherFormData);

      toastSuccess(
        editingTeacherId ? 'Data Guru Berhasil Diperbarui' : 'Data Guru Berhasil Ditambahkan',
        `Akun guru "${teacherFormData.nama}" berhasil tersimpan ke Firebase node /teachers.`
      );

      // Reset form
      setTeacherFormData({
        nama: '',
        tingkatKelas: '4',
        namaKelas: 'Kelas IV (Fase B)',
        username: '',
        password: '',
        niy: ''
      });
      setEditingTeacherId(null);
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      toastError('Gagal Menyimpan Guru', err?.message || 'Gagal menyimpan ke Firebase Realtime Database.');
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // FUNGSI HAPUS GURU DARI FIREBASE DENGAN TOAST NOTIFICATION
  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus guru "${name}"?`)) return;
    setIsFirebaseSyncing(true);
    try {
      const teacherRef = ref(db, `teachers/${id}`);
      await remove(teacherRef);
      toastSuccess('Data Guru Berhasil Dihapus', `Data guru "${name}" telah dihapus dari Firebase.`);
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      toastError('Gagal Menghapus Guru', err?.message || 'Gagal menghapus dari Firebase.');
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // FUNGSI SIMPAN PERSONALISASI APLIKASI (APP SETTINGS) KE FIREBASE
  const handleSaveAppSettings = async () => {
    setIsFirebaseSyncing(true);
    try {
      const settingsRef = ref(db, 'app_settings');
      const payload: AppSettings = {
        instansi: metaRapor.kopSekolah.instansi,
        namaSekolah: metaRapor.kopSekolah.namaSekolah,
        npsn: metaRapor.kopSekolah.npsn,
        akreditasi: metaRapor.kopSekolah.akreditasi,
        alamat: metaRapor.kopSekolah.alamat,
        kontak: metaRapor.kopSekolah.kontak,
        activeTriwulan,
        tahunAjaran: metaRapor.kopSekolah.tahunAjaran,
        tempatRaport: metaRapor.tempatRaport,
        tanggalRaport: metaRapor.tanggalRaport,
        kepalaSekolahNama: metaRapor.kepalaSekolah.nama,
        kepalaSekolahNiy: metaRapor.kepalaSekolah.niy
      };
      await set(settingsRef, payload);
      toastSuccess(
        'Pengaturan Personalisasi Disimpan',
        'Nama sekolah, kop surat, periode aktif, dan tahun ajaran berhasil disimpan ke Firebase /app_settings secara realtime.'
      );
    } catch (err: any) {
      console.error('Error saving app settings:', err);
      toastError('Gagal Menyimpan Pengaturan', err?.message || 'Gagal tersambung ke Firebase.');
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // FUNGSI LOGIN DENGAN DETEKSI ROLE OTOMATIS
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const inputUser = loginForm.username.trim();
    const inputPass = loginForm.password.trim();

    if (!inputUser || !inputPass) {
      setLoginError('Silakan masukkan username dan password!');
      setIsLoggingIn(false);
      return;
    }

    // 1. Cek Admin
    if (inputUser === 'admin333221' && inputPass === 'admin333221#') {
      const adminUser: UserAccount = {
        role: 'admin',
        username: 'admin333221',
        nama: 'Administrator Sekolah'
      };
      setCurrentUser(adminUser);
      setIsLoggingIn(false);
      setLoginForm({ username: '', password: '' });
      toastSuccess('Login Berhasil', 'Selamat datang kembali, Administrator Sekolah!');
      return;
    }

    // 2. Cek Guru dari realtime list teachers
    const matchedTeacher = teachersList.find(
      (t) => t.username.toLowerCase() === inputUser.toLowerCase() && t.password === inputPass
    );
    if (matchedTeacher) {
      const guruUser: UserAccount = {
        role: 'guru',
        username: matchedTeacher.username,
        nama: matchedTeacher.nama,
        kelas: matchedTeacher.namaKelas,
        tingkatKelas: matchedTeacher.tingkatKelas
      };
      setCurrentUser(guruUser);
      setIsLoggingIn(false);
      setLoginForm({ username: '', password: '' });
      toastSuccess('Login Berhasil', `Selamat datang, Ibu/Bapak ${matchedTeacher.nama} (${matchedTeacher.namaKelas})!`);
      return;
    }

    // 3. Cek Orang Tua (NISN / NIS Siswa)
    const matchedStudent = masterStudents.find(
      (s) => s.nis.trim() === inputUser && s.nis.trim() === inputPass
    );
    if (matchedStudent) {
      const parentUser: UserAccount = {
        role: 'orangtua',
        username: matchedStudent.nis,
        nama: `Orang Tua dari ${matchedStudent.nama}`,
        nisn: matchedStudent.nis,
        studentNo: matchedStudent.no,
        kelas: matchedStudent.kelas
      };
      setCurrentUser(parentUser);
      setSelectedStudentNum(matchedStudent.no);
      setIsLoggingIn(false);
      setLoginForm({ username: '', password: '' });
      toastSuccess(
        'Login Berhasil (Akses Orang Tua)',
        `Selamat datang! Membuka data rapor ananda ${matchedStudent.nama}. Mode Read-Only aktif.`
      );
      return;
    }

    setIsLoggingIn(false);
    setLoginError('Username atau Password tidak cocok! Periksa kembali kredensial Anda.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    toastInfo('Logout Berhasil', 'Anda telah keluar dari aplikasi Rapor Siswa.');
  };

  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [isFullscreenPrint, setIsFullscreenPrint] = useState<boolean>(false);
  const [showKopSekolah, setShowKopSekolah] = useState<boolean>(true);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [tableHeaderStyle, setTableHeaderStyle] = useState<'screenshot2' | 'screenshot1'>('screenshot2');
  const [studentInfoStyle, setStudentInfoStyle] = useState<'table' | 'simple'>('simple');
  const [reportViewMode, setReportViewMode] = useState<'document' | 'spider_chart'>('document');
  
  // Personalisasi Lembar Laporan (Font, Ukuran, dan Warna Tabel)
  const [reportFontFamily, setReportFontFamily] = useState<'Arial' | 'Times New Roman' | 'Calibri' | 'Tahoma' | 'Georgia' | 'Trebuchet MS'>(() => {
    try {
      return (localStorage.getItem('rapor_font_family') as any) || 'Arial';
    } catch {
      return 'Arial';
    }
  });
  const [reportFontSize, setReportFontSize] = useState<'sm' | 'base' | 'lg'>(() => {
    try {
      return (localStorage.getItem('rapor_font_size') as any) || 'base';
    } catch {
      return 'base';
    }
  });
  const [tableThemeColor, setTableThemeColor] = useState<string>(() => {
    try {
      return localStorage.getItem('rapor_table_theme') || 'default';
    } catch {
      return 'default';
    }
  });

  // State Dialog Unduh Dokumen (Semua Rapor vs Satu Rapor, PDF vs DOCX, Pilihan Lokasi)
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadScope, setDownloadScope] = useState<'single' | 'all'>('single');
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'docx'>('pdf');
  const [saveLocationMode, setSaveLocationMode] = useState<'picker' | 'direct'>('picker');
  const [isProcessingExport, setIsProcessingExport] = useState<boolean>(false);

  // State Pengaturan Kertas & Printer
  const [paperSize, setPaperSize] = useState<'A4' | 'F4' | 'Letter' | 'Legal'>('A4');
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [paperMargin, setPaperMargin] = useState<'normal' | 'narrow' | 'wide'>('normal');
  const [printColorMode, setPrintColorMode] = useState<'color' | 'grayscale'>('color');
  const [printScale, setPrintScale] = useState<number>(100);
  const [printScope, setPrintScope] = useState<'single' | 'all'>('single');

  // Simpan preferensi font & tema ke localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rapor_font_family', reportFontFamily);
      localStorage.setItem('rapor_font_size', reportFontSize);
      localStorage.setItem('rapor_table_theme', tableThemeColor);
    } catch (err) {
      console.warn('LocalStorage save error for table style:', err);
    }
  }, [reportFontFamily, reportFontSize, tableThemeColor]);
  const [selectedSpiderAspect, setSelectedSpiderAspect] = useState<string | null>(null);
  const [spiderHoveredAspect, setSpiderHoveredAspect] = useState<string | null>(null);
  const [trendChartMode, setTrendChartMode] = useState<'area' | 'bar' | 'dimension'>('area');
  const [selectedTrendAspectId, setSelectedTrendAspectId] = useState<string>('kognitif');
  const [showPredictionInSpider, setShowPredictionInSpider] = useState<boolean>(true);

  const kopFileInputRef = useRef<HTMLInputElement | null>(null);
  const dbKopFileInputRef = useRef<HTMLInputElement | null>(null);

  // State Kop Gambar yang diunggah pengguna (disimpan permanen di localStorage)
  const [uploadedKopImage, setUploadedKopImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('rapor_uploaded_kop') || null;
    } catch {
      return null;
    }
  });

  const handleKopFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setUploadedKopImage(base64);
        try {
          localStorage.setItem('rapor_uploaded_kop', base64);
        } catch (err) {
          console.warn('LocalStorage error saving kop:', err);
        }
        setPrintStatus('Kop berhasil diunggah dan langsung dipasang!');
        setTimeout(() => setPrintStatus(null), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveUploadedKop = () => {
    setUploadedKopImage(null);
    try {
      localStorage.removeItem('rapor_uploaded_kop');
    } catch (err) {
      console.warn('LocalStorage error removing kop:', err);
    }
    setPrintStatus('Kop kustom dihapus, kembali ke kop standar.');
    setTimeout(() => setPrintStatus(null), 3000);
  };

  // Helper Generic Updater - Memperbarui masterStudents pada activeTriwulan
  const updateStudentField = (
    no: number,
    section: keyof SiswaAssessmentRecord,
    field: string,
    value: string
  ) => {
    if (currentUser?.role === 'orangtua') return;
    const targetStudent = masterStudents.find((s) => s.no === no);
    const updated = masterStudents.map((s) => {
      if (s.no !== no) return s;
      const curQ = s.triwulan[activeTriwulan];
      const curSec = (curQ[section] as Record<string, string>) || {};
      return {
        ...s,
        triwulan: {
          ...s.triwulan,
          [activeTriwulan]: {
            ...curQ,
            [section]: {
              ...curSec,
              [field]: value
            }
          }
        }
      };
    });
    setMasterStudents(updated);
    saveStudentsToFirebase(
      updated,
      `Penilaian ${section} (${field}) untuk ${targetStudent?.nama || 'siswa'} tersimpan ke Firebase.`
    );
  };

  const filteredSiswa = dataSiswa.filter(
    (s) =>
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm)
  );

  const selectedStudent = dataSiswa.find((s) => s.no === selectedStudentNum) || dataSiswa[0];
  const selectedReportStudent = reportSiswa.find((s) => s.no === selectedStudentNum) || reportSiswa[0];
  const selectedMasterStudent = masterStudents.find((s) => s.no === selectedStudentNum) || masterStudents[0];

  // Komponen Banner Identitas Periode Aktif (Requirement 4)
  const renderPeriodeBanner = (aspekLabel?: string) => {
    const curOpt = TRIWULAN_OPTIONS.find((t) => t.id === activeTriwulan) || TRIWULAN_OPTIONS[0];
    return (
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-400 rounded-xl p-3 sm:p-4 text-white shadow-md flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-sm shadow-md border-2 border-white/40 shrink-0">
            {curOpt.short}
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>PERIODE PENILAIAN AKTIF:</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black">
                {curOpt.label}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
              RAPOR SISWA KELAS IV • {curOpt.label} {aspekLabel ? `• ${aspekLabel}` : ''}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/20 shadow-inner">
          <span className="text-[11px] font-bold text-slate-300 px-2 hidden sm:inline">Pilih Periode:</span>
          {TRIWULAN_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTriwulan(t.id);
                setPrintStatus(`Periode penilaian aktif beralih ke ${t.label}. Seluruh lembar penilaian terhubung ke data ${t.label}.`);
                setTimeout(() => setPrintStatus(null), 3500);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                activeTriwulan === t.id
                  ? 'bg-amber-500 text-black border-white shadow-md ring-2 ring-white scale-102 font-black'
                  : 'text-white/80 hover:text-white hover:bg-white/10 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Generator Dokumen HTML Rapor Lengkap, Mandiri & Berwarna 100% Persis Format Sekolah
  // Generator Konten Lembar Rapor Siswa (Body HTML Mandiri)
  const generateSingleReportBodyHTML = (
    student: SiswaData,
    isDetailMode: boolean = true,
    withKop: boolean = true,
    customKop: string | null = uploadedKopImage,
    tblStyle: 'screenshot2' | 'screenshot1' = tableHeaderStyle,
    infoStyle: 'table' | 'simple' = studentInfoStyle,
    options?: {
      fontFamily?: string;
      fontSize?: 'sm' | 'base' | 'lg';
      themeColor?: string;
      colorMode?: 'color' | 'grayscale';
    }
  ) => {
    const studentDeskripsi = student.deskripsiRapor ?? generateDefaultDeskripsi(student);
    const studentSaran = student.saranRapor ?? generateDefaultSaran(student);

    const chosenThemeKey = options?.themeColor || tableThemeColor;
    const themeConf = TABLE_THEMES[chosenThemeKey] || TABLE_THEMES.default;
    const chosenSizeKey = options?.fontSize || reportFontSize;
    const sizeConf = FONT_SIZES.find((s) => s.id === chosenSizeKey) || FONT_SIZES[1];
    const isGray = (options?.colorMode || printColorMode) === 'grayscale';
    const headerBgColor = isGray ? '#334155' : themeConf.headerBg;
    const tableBorderColor = '#000000';
    const accentBgColor = isGray ? '#f1f5f9' : themeConf.accentBg;

    const rowsHtml = ASPEK_LIST.map((aspek) => {
      const aspectPalette = getSchoolAspectPalette(aspek.id);
      if (isDetailMode) {
        const aspectRows = aspek.indikatorList
          .map((ind, indIdx) => {
            const sec = (student[aspek.id as keyof SiswaData] as Record<string, string>) || {};
            const val = sec[ind.key] || '';

            const noTd = indIdx === 0
              ? `<td rowspan="${aspek.indikatorList.length}" style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; vertical-align: middle; width: 35px; background-color: ${aspectPalette.number};">${aspek.no}</td>`
              : '';
            const aspekTd = indIdx === 0
              ? `<td rowspan="${aspek.indikatorList.length}" style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; text-transform: uppercase; font-size: ${sizeConf.tableFont}; vertical-align: middle; width: 130px; background-color: ${aspectPalette.aspect};">${aspek.nama}</td>`
              : '';

            return `
              <tr style="background-color: #ffffff; break-inside: avoid; page-break-inside: avoid;">
                ${noTd}
                ${aspekTd}
                <td style="border: 1px solid ${tableBorderColor}; text-align: left; padding: 4px 6px; font-size: ${sizeConf.tableFont}; color: #000; background-color: ${aspectPalette.indicator};">
                  ${ind.labelLengkap}
                </td>
                <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; width: 85px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${val === 'Exceptional' ? '✓' : ''}</td>
                <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; width: 45px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${val === 'A' ? '✓' : ''}</td>
                <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; width: 45px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${val === 'B' ? '✓' : ''}</td>
                <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; width: 45px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${val === 'C' ? '✓' : ''}</td>
                <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; width: 55px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${val === 'Defisit' ? '✓' : ''}</td>
              </tr>
            `;
          })
          .join('');
        return `<tbody class="report-aspect-group" style="break-inside: avoid; page-break-inside: avoid;">${aspectRows}</tbody>`;
      }

      const grade = getAspectGrade(student, aspek.id);
      return `
        <tbody class="report-aspect-group" style="break-inside: avoid; page-break-inside: avoid;">
        <tr style="background-color: #ffffff; break-inside: avoid; page-break-inside: avoid;">
          <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; width: 35px; background-color: ${aspectPalette.number};">${aspek.no}</td>
          <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: ${sizeConf.tableFont}; text-transform: uppercase; width: 130px; background-color: ${aspectPalette.aspect};">${aspek.nama}</td>
          <td style="border: 1px solid ${tableBorderColor}; text-align: left; padding: 5px 8px; font-size: ${sizeConf.tableFont}; background-color: ${aspectPalette.indicator};">${aspek.kategori}</td>
          <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${grade === 'Exceptional' ? '✓' : ''}</td>
          <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${grade === 'A' ? '✓' : ''}</td>
          <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${grade === 'B' ? '✓' : ''}</td>
          <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${grade === 'C' ? '✓' : ''}</td>
          <td style="border: 1px solid ${tableBorderColor}; text-align: center; font-weight: bold; font-size: 14px; color: #000; background-color: ${SCHOOL_REPORT_PALETTE.gradeCell};">${grade === 'Defisit' ? '✓' : ''}</td>
        </tr>
        </tbody>
      `;
    }).join('');

    let kopHtml = '';
    if (customKop) {
      kopHtml = `
        <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px;">
          <img src="${customKop}" style="max-width: 100%; max-height: 145px; object-fit: contain;" alt="Kop Surat Sekolah" />
        </div>
      `;
    } else if (withKop) {
      kopHtml = `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px;">
            <div style="width: 75px; height: 75px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <circle cx="50" cy="50" r="47" fill="#0070c0" stroke="#ffc000" stroke-width="3.5" />
                <circle cx="50" cy="50" r="39" fill="#ffffff" stroke="#0070c0" stroke-width="2" />
                <path d="M 27 58 Q 50 48 50 63 Q 50 48 73 58 L 73 42 Q 50 33 50 47 Q 50 33 27 42 Z" fill="#00b050" stroke="#004d00" stroke-width="1.5" />
                <polygon points="50,23 53,31 62,31 55,36 58,44 50,39 42,44 45,36 38,31 47,31" fill="#ffc000" stroke="#b38600" stroke-width="1" />
                <text x="50" y="78" text-anchor="middle" font-size="6.5" font-weight="900" fill="#002060" font-family="sans-serif">SD KHALIMUL KHASAN</text>
                <text x="50" y="85" text-anchor="middle" font-size="5.5" font-weight="800" fill="#c00000" font-family="sans-serif">BILINGUAL SCHOOL</text>
              </svg>
            </div>
            <div style="flex: 1; text-align: center; padding: 0 10px;">
              <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #222; letter-spacing: 0.5px;">${metaRapor.kopSekolah.instansi}</div>
              <div style="font-size: 18px; font-weight: 900; text-transform: uppercase; color: #000; margin: 2px 0;">${metaRapor.kopSekolah.namaSekolah}</div>
              <div style="font-size: 11px; font-weight: bold; color: #333;">NPSN: ${metaRapor.kopSekolah.npsn} • ${metaRapor.kopSekolah.akreditasi}</div>
              <div style="font-size: 10px; color: #444;">${metaRapor.kopSekolah.alamat}</div>
              <div style="font-size: 9.5px; color: #666; font-style: italic;">${metaRapor.kopSekolah.kontak}</div>
            </div>
            <div style="width: 75px; height: 75px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <polygon points="50,6 94,84 6,84" fill="#0070c0" stroke="#ffc000" stroke-width="3" />
                <polygon points="50,18 84,80 16,80" fill="#ffffff" />
                <circle cx="50" cy="42" r="14" fill="#ffc000" stroke="#b38600" stroke-width="1" />
                <path d="M 50 32 L 53 45 L 47 45 Z" fill="#c00000" />
                <path d="M 32 64 Q 50 56 68 64 Q 50 72 32 64 Z" fill="#0070c0" />
                <text x="50" y="74" text-anchor="middle" font-size="6.5" font-weight="900" fill="#002060" font-family="sans-serif">TUT WURI HANDAYANI</text>
              </svg>
            </div>
          </div>
          <div style="border-bottom: 3px solid #000; margin-top: 8px;"></div>
          <div style="border-bottom: 1px solid #000; margin-top: 1.5px;"></div>
        </div>
      `;
    }

    const studentInfoHtml = infoStyle === 'simple' ? `
      <div style="margin-bottom: 12px; font-size: 11px; font-weight: bold; line-height: 1.6;">
        <table style="border: none; width: min(100%, 420px); margin-bottom: 0; border-collapse: collapse;">
          <tr>
            <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; width: 95px; font-size: 11px; line-height: 1.4;">Nama Siswa</td>
            <td style="border: none; padding: 2px 4px; font-weight: 700; text-transform: uppercase; font-size: 13px; letter-spacing: 0.2px; line-height: 1.4;">: ${student.nama}</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; font-size: 11px; line-height: 1.4;">NIS</td>
            <td style="border: none; padding: 2px 4px; font-family: monospace; font-weight: bold; font-size: 11px; line-height: 1.4;">: ${student.nis}</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; font-size: 11px; line-height: 1.4;">Kelas</td>
            <td style="border: none; padding: 2px 4px; font-weight: bold; font-size: 11px; line-height: 1.4;">: ${student.kelas}</td>
          </tr>
        </table>
      </div>
    ` : `
      <div style="border: 1.5px solid ${tableBorderColor}; margin-bottom: 12px; background-color: #ffffff;">
        <div style="background-color: ${headerBgColor}; color: ${themeConf.headerText}; border-bottom: 1.5px solid ${tableBorderColor}; padding: 4px; text-align: center; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
          IDENTITAS PESERTA DIDIK
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
          <tbody>
            <tr style="border-bottom: 1px solid ${tableBorderColor};">
              <td style="width: 25%; padding: 4px 6px; font-weight: bold; background-color: ${accentBgColor}; border-right: 1px solid ${tableBorderColor};">Nama Peserta Didik</td>
              <td style="width: 35%; padding: 4px 6px; font-weight: 900; text-transform: uppercase; border-right: 1.5px solid ${tableBorderColor};">: ${student.nama}</td>
              <td style="width: 20%; padding: 4px 6px; font-weight: bold; background-color: ${accentBgColor}; border-right: 1px solid ${tableBorderColor};">Kelas / Rombel</td>
              <td style="width: 20%; padding: 4px 6px; font-weight: bold;">: ${student.kelas}</td>
            </tr>
            <tr style="border-bottom: 1px solid ${tableBorderColor};">
              <td style="padding: 4px 6px; font-weight: bold; background-color: ${accentBgColor}; border-right: 1px solid ${tableBorderColor};">Nomor Induk Siswa (NIS)</td>
              <td style="padding: 4px 6px; font-weight: bold; font-family: monospace; border-right: 1.5px solid ${tableBorderColor};">: ${student.nis}</td>
              <td style="padding: 4px 6px; font-weight: bold; background-color: ${accentBgColor}; border-right: 1px solid ${tableBorderColor};">Fase / Semester</td>
              <td style="padding: 4px 6px; font-weight: bold;">: Fase B / Semester I (Ganjil)</td>
            </tr>
            <tr>
              <td style="padding: 4px 6px; font-weight: bold; background-color: ${accentBgColor}; border-right: 1px solid ${tableBorderColor};">Nama Sekolah</td>
              <td style="padding: 4px 6px; font-weight: bold; border-right: 1.5px solid ${tableBorderColor};">: ${metaRapor.kopSekolah.namaSekolah}</td>
              <td style="padding: 4px 6px; font-weight: bold; background-color: ${accentBgColor}; border-right: 1px solid ${tableBorderColor};">Tanggal Raport</td>
              <td style="padding: 4px 6px; font-weight: bold;">: ${metaRapor.tempatRaport ? `${metaRapor.tempatRaport}, ` : ''}${metaRapor.tanggalRaport}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const tableHeaderHtml = tblStyle === 'screenshot2' ? `
      <thead>
        <tr style="border-bottom: 1.5px solid ${tableBorderColor}; text-align: center; font-weight: 900; font-size: ${sizeConf.tableFont};">
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 6px 4px; width: 35px; background-color: ${SCHOOL_REPORT_PALETTE.header}; color: #000000;" rowspan="2">NO</th>
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 6px 8px; width: 130px; background-color: ${SCHOOL_REPORT_PALETTE.header}; color: #000000;" rowspan="2">ASPEK</th>
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 6px 8px; text-align: center; background-color: ${SCHOOL_REPORT_PALETTE.header}; color: #000000;" rowspan="2">INDIKATOR KEBERHASILAN</th>
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 5px; text-align: center; background-color: ${SCHOOL_REPORT_PALETTE.header}; color: #000000;" colspan="5">PENILAIAN</th>
        </tr>
        <tr style="border-bottom: 1.5px solid ${tableBorderColor}; text-align: center; font-weight: 900; font-size: ${sizeConf.tableFont}; background-color: ${SCHOOL_REPORT_PALETTE.gradeHeader}; color: #000000;">
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 4px; width: 95px; background-color: ${SCHOOL_REPORT_PALETTE.gradeHeader}; color: #000000;">Exceptional</th>
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 4px; width: 45px; background-color: ${SCHOOL_REPORT_PALETTE.gradeHeader}; color: #000000;">A</th>
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 4px; width: 45px; background-color: ${SCHOOL_REPORT_PALETTE.gradeHeader}; color: #000000;">B</th>
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 4px; width: 45px; background-color: ${SCHOOL_REPORT_PALETTE.gradeHeader}; color: #000000;">C</th>
          <th style="border: 1.5px solid ${tableBorderColor}; padding: 4px; width: 60px; background-color: ${SCHOOL_REPORT_PALETTE.gradeHeader}; color: #000000;">Defisit</th>
        </tr>
      </thead>
    ` : `
      <thead>
        <tr style="border-bottom: 1.5px solid #000; text-align: center; font-weight: 900; font-size: 11px;">
          <th style="border: 1.5px solid #000; padding: 5px; width: 35px; background-color: #d9d9d9; color: #000;">NO</th>
          <th style="border: 1.5px solid #000; padding: 5px; width: 130px; background-color: #d9d9d9; color: #000;">ASPEK</th>
          <th style="border: 1.5px solid #000; padding: 5px; text-align: left; background-color: #d9d9d9; color: #000;">ASPEK PENILAIAN / PERKEMBANGAN</th>
          <th style="border: 1.5px solid #000; padding: 5px; width: 95px; background-color: #7030a0; color: #ffffff;">EXCEPTIONAL</th>
          <th style="border: 1.5px solid #000; padding: 5px; width: 50px; background-color: #00b050; color: #ffffff;">A</th>
          <th style="border: 1.5px solid #000; padding: 5px; width: 50px; background-color: #0070c0; color: #ffffff;">B</th>
          <th style="border: 1.5px solid #000; padding: 5px; width: 50px; background-color: #ffc000; color: #000000;">C</th>
          <th style="border: 1.5px solid #000; padding: 5px; width: 60px; background-color: #c00000; color: #ffffff;">DEFISIT</th>
        </tr>
      </thead>
    `;

    return `
      <!-- KOP SEKOLAH -->
      ${kopHtml}

      <!-- 3 BARIS JUDUL LAPORAN DARI DATABASE -->
      <div style="text-align: center; margin: 10px 0 14px 0;">
        ${metaRapor.judulLaporan.baris1 ? `<div style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">${metaRapor.judulLaporan.baris1}</div>` : ''}
        ${metaRapor.judulLaporan.baris2 ? `<div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #111; margin-top: 2px;">${metaRapor.judulLaporan.baris2}</div>` : ''}
        ${metaRapor.judulLaporan.baris3 ? `<div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #333; margin-top: 2px;">${metaRapor.judulLaporan.baris3}</div>` : ''}
      </div>

      <!-- IDENTITAS SISWA -->
      ${studentInfoHtml}

      <!-- TABEL PENILAIAN CENTANG 9 ASPEK -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1.5px solid ${tableBorderColor};">
        ${tableHeaderHtml}
        ${rowsHtml}
      </table>

      <!-- REFLEKSI PERKEMBANGAN SISWA -->
      <div style="border: 1px solid #000; margin-bottom: 12px; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; background-color: #ffffff; color: #000;">
          Refleksi Perkembangan Siswa:
        </div>
        <div style="padding: 8px 10px; font-size: 11px; line-height: 1.5; color: #000; white-space: pre-wrap; min-height: 45px;">
          ${studentDeskripsi}
        </div>
      </div>

      <!-- SARAN -->
      <div style="border: 1px solid #000; margin-bottom: 16px; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; background-color: #ffffff; color: #000;">
          Saran:
        </div>
        <div style="padding: 8px 10px; font-size: 11px; line-height: 1.5; color: #000; white-space: pre-wrap; min-height: 45px;">
          ${studentSaran}
        </div>
      </div>

      <!-- KOLOM TANDA TANGAN (HANYA KEPALA SEKOLAH DAN GURU KELAS SEJAJAR) -->
      <div style="margin-top: 18px;">
        <table style="width: 100%; border: none; margin-bottom: 0;">
          <tbody>
            <tr style="text-align: center; vertical-align: top;">
              <td style="width: 50%; border: none; font-size: 11px; text-align: center;">
                Mengetahui,<br><strong>Kepala Sekolah</strong><br><br><br><br><br>
                <strong style="text-decoration: underline; text-transform: uppercase; font-size: 11.5px;">${metaRapor.kepalaSekolah.nama}</strong><br>
                <span style="font-family: monospace; font-size: 10px;">NIY. ${metaRapor.kepalaSekolah.niy}</span>
              </td>
              <td style="width: 50%; border: none; font-size: 11px; text-align: center;">
                ${metaRapor.tempatRaport}, ${metaRapor.tanggalRaport}<br>
                <strong>Guru Kelas IV</strong><br><br><br><br><br>
                <strong style="text-decoration: underline; text-transform: uppercase; font-size: 11.5px;">${metaRapor.guruKelas.nama}</strong><br>
                <span style="font-family: monospace; font-size: 10px;">NIY. ${metaRapor.guruKelas.niy}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  // Generator Dokumen HTML Rapor Lengkap, Mandiri & Siap Cetak
  const generateFullReportHTML = (
    student: SiswaData,
    isDetailMode: boolean = true,
    withKop: boolean = true,
    customKop: string | null = uploadedKopImage,
    tblStyle: 'screenshot2' | 'screenshot1' = tableHeaderStyle,
    infoStyle: 'table' | 'simple' = studentInfoStyle,
    options?: {
      fontFamily?: string;
      fontSize?: 'sm' | 'base' | 'lg';
      themeColor?: string;
      paperSize?: 'A4' | 'F4' | 'Letter' | 'Legal';
      paperOrientation?: 'portrait' | 'landscape';
      paperMargin?: 'normal' | 'narrow' | 'wide';
      colorMode?: 'color' | 'grayscale';
      scale?: number;
      autoPrint?: boolean;
    }
  ) => {
    const chosenFontKey = options?.fontFamily || reportFontFamily;
    const fontConf = FONT_OPTIONS.find((f) => f.id === chosenFontKey) || FONT_OPTIONS[0];
    const chosenSizeKey = options?.fontSize || reportFontSize;
    const sizeConf = FONT_SIZES.find((s) => s.id === chosenSizeKey) || FONT_SIZES[1];
    const pSize = options?.paperSize || paperSize;
    const pOrient = options?.paperOrientation || paperOrientation;
    const pMargin = options?.paperMargin || paperMargin;
    const isGray = (options?.colorMode || printColorMode) === 'grayscale';
    const scaleVal = (options?.scale ?? printScale) / 100;
    const shouldAutoPrint = options?.autoPrint ?? true;

    const marginMap = {
      normal: '8mm 10mm',
      narrow: '4mm 6mm',
      wide: '14mm 16mm'
    };
    const sizeMap = {
      A4: '210mm 297mm',
      F4: '215mm 330mm',
      Letter: '216mm 279mm',
      Legal: '216mm 356mm'
    };

    const bodyContent = generateSingleReportBodyHTML(
      student,
      isDetailMode,
      withKop,
      customKop,
      tblStyle,
      infoStyle,
      options
    );

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rapor_${student.nama}_${student.nis}</title>
  <style>
    @page {
      size: ${sizeMap[pSize] || '210mm 297mm'} ${pOrient};
      margin: ${marginMap[pMargin] || '8mm 10mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: ${fontConf.css};
      font-size: ${sizeConf.bodyFont};
      color: #000000;
      background-color: #ffffff;
      margin: 0 auto;
      max-width: ${pOrient === 'landscape' ? '297mm' : '210mm'};
      padding: 10px;
      transform: scale(${scaleVal});
      transform-origin: top center;
      ${isGray ? 'filter: grayscale(100%);' : ''}
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    th, td {
      font-size: ${sizeConf.tableFont};
      line-height: 1.35;
    }
    .report-aspect-group, .report-aspect-group tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    @media print {
      thead {
        display: table-header-group;
      }
      body {
        padding: 0;
        margin: 0;
        max-width: none;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  ${bodyContent}
  ${shouldAutoPrint ? `
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
  ` : ''}
</body>
</html>`;
  };

  // Generator Dokumen HTML untuk Banyak Siswa Sekaligus (Batch Rapor dengan Page Break)
  const generateMultiReportHTML = (
    students: SiswaData[],
    options?: {
      fontFamily?: string;
      fontSize?: 'sm' | 'base' | 'lg';
      themeColor?: string;
      paperSize?: 'A4' | 'F4' | 'Letter' | 'Legal';
      paperOrientation?: 'portrait' | 'landscape';
      paperMargin?: 'normal' | 'narrow' | 'wide';
      colorMode?: 'color' | 'grayscale';
      scale?: number;
      autoPrint?: boolean;
    }
  ) => {
    const chosenFontKey = options?.fontFamily || reportFontFamily;
    const fontConf = FONT_OPTIONS.find((f) => f.id === chosenFontKey) || FONT_OPTIONS[0];
    const chosenSizeKey = options?.fontSize || reportFontSize;
    const sizeConf = FONT_SIZES.find((s) => s.id === chosenSizeKey) || FONT_SIZES[1];
    const pSize = options?.paperSize || paperSize;
    const pOrient = options?.paperOrientation || paperOrientation;
    const pMargin = options?.paperMargin || paperMargin;
    const isGray = (options?.colorMode || printColorMode) === 'grayscale';
    const scaleVal = (options?.scale ?? printScale) / 100;
    const shouldAutoPrint = options?.autoPrint ?? true;

    const marginMap = {
      normal: '8mm 10mm',
      narrow: '4mm 6mm',
      wide: '14mm 16mm'
    };
    const sizeMap = {
      A4: '210mm 297mm',
      F4: '215mm 330mm',
      Letter: '216mm 279mm',
      Legal: '216mm 356mm'
    };

    const sheetsHtml = students
      .map((student) => {
        const bodyContent = generateSingleReportBodyHTML(
          student,
          printViewMode === 'detail',
          showKopSekolah,
          uploadedKopImage,
          tableHeaderStyle,
          studentInfoStyle,
          options
        );
        return `
          <div class="rapor-page" style="page-break-after: always; break-after: page; padding-bottom: 25px; margin-bottom: 25px; border-bottom: 2px dashed #94a3b8;">
            ${bodyContent}
          </div>
        `;
      })
      .join('\n');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rapor_Kolektif_Kelas_IV_${activeTriwulan}</title>
  <style>
    @page {
      size: ${sizeMap[pSize] || '210mm 297mm'} ${pOrient};
      margin: ${marginMap[pMargin] || '8mm 10mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: ${fontConf.css};
      font-size: ${sizeConf.bodyFont};
      color: #000000;
      background-color: #ffffff;
      margin: 0 auto;
      max-width: ${pOrient === 'landscape' ? '297mm' : '210mm'};
      padding: 10px;
      transform: scale(${scaleVal});
      transform-origin: top center;
      ${isGray ? 'filter: grayscale(100%);' : ''}
    }
    .rapor-page:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
      border-bottom: none !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    th, td {
      font-size: ${sizeConf.tableFont};
      line-height: 1.35;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    @media print {
      body {
        padding: 0;
        margin: 0;
        max-width: none;
      }
      .rapor-page {
        border-bottom: none !important;
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
      }
    }
  </style>
</head>
<body>
  ${sheetsHtml}
  ${shouldAutoPrint ? `
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
  ` : ''}
</body>
</html>`;
  };

  // Generator File Microsoft Word DOCX (.docx) Resmi Mandiri
  const generateReportDocxBlob = (
    students: SiswaData[],
    options?: {
      fontFamily?: string;
      fontSize?: 'sm' | 'base' | 'lg';
      themeColor?: string;
      paperSize?: 'A4' | 'F4' | 'Letter' | 'Legal';
      paperOrientation?: 'portrait' | 'landscape';
      paperMargin?: 'normal' | 'narrow' | 'wide';
    }
  ): Blob => {
    const chosenFontKey = options?.fontFamily || reportFontFamily;
    const fontConf = FONT_OPTIONS.find((f) => f.id === chosenFontKey) || FONT_OPTIONS[0];

    const studentSections = students
      .map((student, idx) => {
        const body = generateSingleReportBodyHTML(
          student,
          printViewMode === 'detail',
          showKopSekolah,
          uploadedKopImage,
          tableHeaderStyle,
          studentInfoStyle,
          options
        );
        const pageBreak = idx < students.length - 1
          ? `<br clear=all style='mso-special-character:line-break;page-break-before:always' />`
          : '';
        return `
          <div class="WordSection${idx + 1}" style="page: WordSection;">
            ${body}
          </div>
          ${pageBreak}
        `;
      })
      .join('\n');

    const wordDocHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Rapor Siswa SD Khalimul Khasan</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page WordSection {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 28.3pt 28.3pt 28.3pt 28.3pt;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.WordSection { page: WordSection; }
          body {
            font-family: ${fontConf.css};
            font-size: 11pt;
            color: #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10pt;
          }
          th, td {
            border: 1pt solid #000000;
            padding: 4pt 6pt;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        ${studentSections}
      </body>
      </html>
    `;

    return new Blob(['\ufeff' + wordDocHtml], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8'
    });
  };

  // Handler Menyimpan File Dokumen dengan Dukungan Pilihan Lokasi Folder (File System Access API)
  const handleSaveDocumentWithLocation = async (
    blob: Blob,
    defaultFilename: string,
    extension: string,
    fileTypeDesc: string,
    mimeType: string,
    useLocationPicker: boolean
  ) => {
    // 1. Coba window.showSaveFilePicker jika diminta dan didukung sistem
    if (useLocationPicker && 'showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [
            {
              description: fileTypeDesc,
              accept: {
                [mimeType]: [`.${extension}`]
              }
            }
          ]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        setPrintStatus(`Dokumen "${fileHandle.name}" berhasil disimpan di lokasi pilihan Anda!`);
        setTimeout(() => setPrintStatus(null), 5000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setPrintStatus('Pemilihan folder dibatalkan pengguna.');
          setTimeout(() => setPrintStatus(null), 3000);
          return;
        }
        console.warn('showSaveFilePicker tidak tersedia atau dibatasi sandbox, beralih ke download langsung:', err);
      }
    }

    // 2. Download Browser Standar (Langsung masuk ke unduhan atau dialog browser)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setPrintStatus(`Dokumen "${defaultFilename}" berhasil diunduh ke komputer Anda!`);
    setTimeout(() => setPrintStatus(null), 5000);
  };

  // Eksekutor Iframe Cetak Tersembunyi
  const executeIframePrint = (htmlContent: string) => {
    try {
      let printFrame = document.getElementById('rapor-print-iframe') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'rapor-print-iframe';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }
      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();
        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
            setPrintStatus('Dialog printer berhasil dibuka!');
            setTimeout(() => setPrintStatus(null), 4000);
          } catch (iframeErr) {
            console.warn('Iframe print blocked:', iframeErr);
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
        }, 500);
      }
    } catch (e) {
      console.warn('Print iframe error:', e);
      window.print();
    }
  };

  // Eksekutor Cetak dari Modal Pengaturan Printer & Kertas
  const handleExecutePrint = (asNewTab: boolean = false) => {
    setPrintStatus('Menyiapkan dokumen cetak sesuai konfigurasi...');
    setShowPrintModal(false);

    const studentsToPrint = printScope === 'all' ? dataSiswa : [selectedStudent];
    const printHtml = generateMultiReportHTML(studentsToPrint, {
      fontFamily: reportFontFamily,
      fontSize: reportFontSize,
      themeColor: tableThemeColor,
      paperSize,
      paperOrientation,
      paperMargin,
      colorMode: printColorMode,
      scale: printScale,
      autoPrint: true
    });

    if (asNewTab) {
      const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const newTab = window.open(url, '_blank');
      if (newTab) {
        setPrintStatus(`Dokumen (${studentsToPrint.length} siswa) dibuka di tab baru! Dialog printer muncul otomatis.`);
        setTimeout(() => setPrintStatus(null), 5000);
      } else {
        setPrintStatus('Popup diblokir browser, menjalankan cetak sistem langsung.');
        setTimeout(() => setPrintStatus(null), 4000);
        executeIframePrint(printHtml);
      }
      return;
    }

    executeIframePrint(printHtml);
  };

  // Eksekutor Unduh Dokumen dari Modal (Satu / Seluruh Siswa, DOCX / PDF, Pilih Lokasi)
  const handleExecuteDownload = async (useLocationPicker: boolean = false) => {
    setIsProcessingExport(true);
    setPrintStatus('Mempersiapkan dokumen untuk diunduh...');

    try {
      const studentsToExport = downloadScope === 'all' ? dataSiswa : [selectedStudent];
      const isAll = downloadScope === 'all';
      const baseName = isAll
        ? `Rapor_Seluruh_Siswa_Kelas_IV_${activeTriwulan}`
        : `Rapor_${selectedStudent.nama.replace(/\s+/g, '_')}_${selectedStudent.nis}_${activeTriwulan}`;

      if (downloadFormat === 'docx') {
        const docxBlob = generateReportDocxBlob(studentsToExport, {
          fontFamily: reportFontFamily,
          fontSize: reportFontSize,
          themeColor: tableThemeColor,
          paperSize,
          paperOrientation,
          paperMargin
        });
        const filename = `${baseName}.docx`;
        await handleSaveDocumentWithLocation(
          docxBlob,
          filename,
          'docx',
          'Microsoft Word Document (.docx)',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          useLocationPicker
        );
      } else {
        // PDF Document Format
        const pdfHtml = generateMultiReportHTML(studentsToExport, {
          fontFamily: reportFontFamily,
          fontSize: reportFontSize,
          themeColor: tableThemeColor,
          paperSize,
          paperOrientation,
          paperMargin,
          colorMode: 'color',
          scale: 100,
          autoPrint: false
        });
        const filename = `${baseName}.pdf`;
        const pdfBlob = new Blob([pdfHtml], { type: 'application/pdf;charset=utf-8' });
        await handleSaveDocumentWithLocation(
          pdfBlob,
          filename,
          'pdf',
          'PDF Document (.pdf)',
          'application/pdf',
          useLocationPicker
        );
      }

      setShowDownloadModal(false);
    } catch (err) {
      console.error('Error saat unduh dokumen:', err);
      setPrintStatus('Terjadi kesalahan saat memproses unduhan dokumen.');
    } finally {
      setIsProcessingExport(false);
    }
  };

  // Buka Halaman Cetak di Tab Baru (Fallback & Kompatibilitas)
  const handleOpenPrintTab = () => {
    handleExecutePrint(true);
  };

  // Unduh File Rapor Mandiri (Fallback & Kompatibilitas)
  const handleDownloadRaporHTML = () => {
    setShowDownloadModal(true);
  };

  // Handler Utama Tombol Cetak Rapor (Memunculkan Dialog Pengaturan Printer & Kertas)
  const handlePrintRapor = () => {
    setShowPrintModal(true);
  };

  // Generator Dokumen HTML Spider Chart Lengkap Siap Cetak
  const generateSpiderReportHTML = (student: SiswaData) => {
    const analysis = getStudentSpiderAnalysis(student);
    const CX = 270;
    const CY = 270;
    const R = 175;
    const numAspects = ASPEK_LIST.length;

    // Grid polygons
    const gridPolygons = [1, 2, 3, 4, 5].map((level) => {
      const radius = (level / 5) * R;
      const pts = ASPEK_LIST.map((_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
        return `${(CX + radius * Math.cos(angle)).toFixed(1)},${(CY + radius * Math.sin(angle)).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="${level === 5 ? '#f8fafc' : 'none'}" stroke="${level === 5 ? '#94a3b8' : '#cbd5e1'}" stroke-width="${level === 5 ? '1.5' : '1'}" stroke-dasharray="${level === 5 ? 'none' : '3,3'}" />`;
    }).join('');

    // Axis lines
    const axisLines = ASPEK_LIST.map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
      const x = (CX + R * Math.cos(angle)).toFixed(1);
      const y = (CY + R * Math.sin(angle)).toFixed(1);
      return `<line x1="${CX}" y1="${CY}" x2="${x}" y2="${y}" stroke="#94a3b8" stroke-width="1.2" />`;
    }).join('');

    // Data polygon
    const dataPts = analysis.aspects.map((asp, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
      const radius = (asp.score / 5) * R;
      return `${(CX + radius * Math.cos(angle)).toFixed(1)},${(CY + radius * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');

    // Vertex dots
    const vertexDots = analysis.aspects.map((asp, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
      const radius = (asp.score / 5) * R;
      const x = (CX + radius * Math.cos(angle)).toFixed(1);
      const y = (CY + radius * Math.sin(angle)).toFixed(1);
      return `<circle cx="${x}" cy="${y}" r="5.5" fill="#0d9488" stroke="#ffffff" stroke-width="2" />`;
    }).join('');

    // Labels
    const labels = analysis.aspects.map((asp, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
      const x = (CX + (R + 36) * Math.cos(angle)).toFixed(1);
      const y = (CY + (R + 36) * Math.sin(angle)).toFixed(1);
      const cosVal = Math.cos(angle);
      const anchor = cosVal > 0.15 ? 'start' : cosVal < -0.15 ? 'end' : 'middle';
      return `
        <text x="${x}" y="${y}" text-anchor="${anchor}" font-size="10.5" font-weight="bold" fill="#0f172a" font-family="sans-serif">
          ${asp.nama}
          <tspan font-size="9.5" fill="#0d9488" font-weight="900"> (${asp.score})</tspan>
        </text>
      `;
    }).join('');

    const aspectRows = analysis.aspects.map((asp) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="padding: 6px 8px; font-weight: bold; text-align: center; border-right: 1px solid #cbd5e1;">${asp.no}</td>
        <td style="padding: 6px 8px; font-weight: 800; text-transform: uppercase; font-size: 11px; border-right: 1px solid #cbd5e1;">${asp.nama}</td>
        <td style="padding: 6px 8px; font-size: 10.5px; color: #475569; border-right: 1px solid #cbd5e1;">${asp.kategori}</td>
        <td style="padding: 6px 8px; font-weight: 900; text-align: center; font-size: 12px; color: #0d9488; border-right: 1px solid #cbd5e1;">${asp.score} / 5.0</td>
        <td style="padding: 6px 8px; font-weight: bold; text-align: center; font-size: 11px; border-right: 1px solid #cbd5e1;">${asp.grade}</td>
        <td style="padding: 6px 8px; font-size: 10px; color: #334155;">${asp.explanation}</td>
      </tr>
    `).join('');

    // Hitung Prediksi Potensi Capaian Triwulan Berikutnya
    const studentTrends = getStudentQuarterTrends(student);
    const prediction = predictNextQuarterAchievement(student, activeTriwulan, studentTrends.quarters);

    // Proyeksi Polygon Points
    const predPts = prediction.aspectPredictions.map((asp, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
      const radius = (asp.predictedScore / 5) * R;
      return `${(CX + radius * Math.cos(angle)).toFixed(1)},${(CY + radius * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>SpiderChart_${student.nama}_${student.nis}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #fff; margin: 0 auto; max-width: 210mm; padding: 12px; }
    .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 12px; background: #fff; }
    @media print { body { padding: 0; margin: 0; } }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
    <h2 style="margin: 0; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">LAPORAN ANALISIS GRAFIK RADAR (SPIDER CHART)</h2>
    <h3 style="margin: 3px 0 0 0; font-size: 12px; font-weight: 800; color: #475569;">Capaian 9 Dimensi Perkembangan Peserta Didik & Proyeksi Triwulan Berikutnya</h3>
  </div>

  <table style="width: 100%; border: none; font-size: 11px; font-weight: bold; margin-bottom: 12px;">
    <tr>
      <td style="width: 110px;">Nama Siswa</td>
      <td style="text-transform: uppercase; font-weight: 900;">: ${student.nama}</td>
      <td style="width: 90px;">Kelas</td>
      <td>: ${student.kelas}</td>
    </tr>
    <tr>
      <td>NIS</td>
      <td>: ${student.nis}</td>
      <td>Periode</td>
      <td>: ${TRIWULAN_OPTIONS.find((t) => t.id === activeTriwulan)?.label || activeTriwulan}</td>
    </tr>
    <tr>
      <td>Tahun Ajaran</td>
      <td>: 2026/2027</td>
      <td>Tanggal</td>
      <td>: ${metaRapor.tempatRaport}, ${metaRapor.tanggalRaport}</td>
    </tr>
  </table>

  <!-- SPIDER CHART SVG -->
  <div style="text-align: center; margin: 10px auto;">
    <svg viewBox="0 0 540 540" style="width: 100%; max-width: 440px; height: auto;">
      ${gridPolygons}
      ${axisLines}
      <!-- Poligon Riil Siswa -->
      <polygon points="${dataPts}" fill="#0d9488" fill-opacity="0.3" stroke="#0d9488" stroke-width="3" />
      <!-- Poligon Garis Putus-Putus Proyeksi Triwulan Berikutnya -->
      <polygon points="${predPts}" fill="#6366f1" fill-opacity="0.12" stroke="#6366f1" stroke-width="2.5" stroke-dasharray="5 3" />
      ${vertexDots}
      ${labels}
    </svg>
    <div style="font-size: 10px; font-weight: bold; margin-top: 4px; color: #475569;">
      <span style="color: #0d9488;">■ Capaian Riil (${analysis.averageScore})</span> &nbsp;•&nbsp; 
      <span style="color: #6366f1;">- - Proyeksi Potensi ${prediction.targetQuarterShort} (${prediction.predictedAverageScore})</span>
    </div>
  </div>

  <!-- KPI SUMMARY -->
  <div style="display: flex; gap: 8px; margin-bottom: 12px; text-align: center;">
    <div style="flex: 1; border: 1px solid #0d9488; background: #f0fdfa; border-radius: 8px; padding: 8px;">
      <div style="font-size: 10px; color: #0f766e; font-weight: bold; text-transform: uppercase;">Skor Rerata Kini</div>
      <div style="font-size: 18px; font-weight: 900; color: #0d9488;">${analysis.averageScore} <span style="font-size: 11px;">/ 5.0</span></div>
      <div style="font-size: 10px; font-weight: bold; color: #115e59;">Predikat: ${analysis.overallGrade}</div>
    </div>
    <div style="flex: 1; border: 1px solid #6366f1; background: #eef2ff; border-radius: 8px; padding: 8px;">
      <div style="font-size: 10px; color: #4338ca; font-weight: bold; text-transform: uppercase;">Estimasi ${prediction.targetQuarterShort}</div>
      <div style="font-size: 18px; font-weight: 900; color: #4f46e5;">${prediction.predictedAverageScore} <span style="font-size: 11px;">/ 5.0</span></div>
      <div style="font-size: 10px; font-weight: bold; color: #3730a3;">Prospek: ${prediction.averageDiff >= 0 ? '+' : ''}${prediction.averageDiff} (${prediction.predictedOverallGrade})</div>
    </div>
    <div style="flex: 1; border: 1px solid #16a34a; background: #f0fdf4; border-radius: 8px; padding: 8px;">
      <div style="font-size: 10px; color: #15803d; font-weight: bold; text-transform: uppercase;">Akselerasi Tertinggi</div>
      <div style="font-size: 12px; font-weight: 900; color: #166534; margin-top: 4px;">${prediction.topAcceleratingAspects[0]?.nama || '-'} (+${prediction.topAcceleratingAspects[0]?.scoreDiff})</div>
    </div>
    <div style="flex: 1; border: 1px solid #ea580c; background: #fff7ed; border-radius: 8px; padding: 8px;">
      <div style="font-size: 10px; color: #c2410c; font-weight: bold; text-transform: uppercase;">Fokus Pengawalan</div>
      <div style="font-size: 12px; font-weight: 900; color: #9a3412; margin-top: 4px;">${prediction.priorityInterventionAspects[0]?.nama || '-'}</div>
    </div>
  </div>

  <!-- KOTAK ANALISIS PREDIKSI POTENSI -->
  <div class="card" style="border-left: 4px solid #6366f1; background: #f8fafc;">
    <strong style="color: #4338ca; font-size: 11px; text-transform: uppercase;">🔮 Analisis Prediksi Potensi Capaian (${prediction.targetQuarterLabel}):</strong>
    <p style="font-size: 10.5px; line-height: 1.45; margin: 4px 0 0 0; color: #1e293b;">${prediction.summaryDescription}</p>
  </div>

  <!-- KEKUATAN & KELEMAHAN -->
  <div class="card" style="border-left: 4px solid #16a34a; background: #fdfdfd;">
    <strong style="color: #15803d; font-size: 11px; text-transform: uppercase;">🟢 Analisis Kekuatan Siswa:</strong>
    <p style="font-size: 10.5px; line-height: 1.45; margin: 4px 0 0 0; color: #1e293b;">${analysis.strengthsSummary}</p>
  </div>

  <div class="card" style="border-left: 4px solid #ea580c; background: #fdfdfd;">
    <strong style="color: #c2410c; font-size: 11px; text-transform: uppercase;">🔴 Area Pendampingan & Prioritas Peningkatan:</strong>
    <p style="font-size: 10.5px; line-height: 1.45; margin: 4px 0 0 0; color: #1e293b;">${analysis.weaknessesSummary}</p>
  </div>

  <!-- TABEL RINCIAN NILAI -->
  <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-top: 8px;">
    <thead>
      <tr style="background: #0f172a; color: #ffffff; text-align: center;">
        <th style="padding: 5px; width: 30px;">NO</th>
        <th style="padding: 5px; width: 120px;">DIMENSI ASPEK</th>
        <th style="padding: 5px; width: 140px;">KATEGORI</th>
        <th style="padding: 5px; width: 80px;">SKOR (1-5)</th>
        <th style="padding: 5px; width: 80px;">PREDIKAT</th>
        <th style="padding: 5px; text-align: left;">KETERANGAN CAPAIAN</th>
      </tr>
    </thead>
    <tbody>
      ${aspectRows}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;
  };

  const handleOpenSpiderPrintTab = () => {
    const fullHtml = generateSpiderReportHTML(selectedStudent);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, '_blank');
    if (newTab) {
      setPrintStatus('Membuka Spider Chart di Tab Baru untuk dicetak/disimpan PDF!');
      setTimeout(() => setPrintStatus(null), 5000);
    } else {
      setShowPrintModal(true);
    }
  };

  const handleDownloadSpiderChartHTML = () => {
    const fullHtml = generateSpiderReportHTML(selectedStudent);
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpiderChart_Rapor_${selectedStudent.nama.replace(/\s+/g, '_')}_${selectedStudent.nis}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setPrintStatus('File Spider Chart Rapor berhasil diunduh!');
    setTimeout(() => setPrintStatus(null), 5000);
  };

  return (
    <div className="app-shell min-h-screen bg-[#a6a6a6] text-slate-900 font-sans flex flex-col items-center justify-start p-2 sm:p-6">
      {/* Wrapper Luar */}
      <div className="app-frame w-full max-w-[1520px] bg-[#d9d9d9] rounded-2xl shadow-2xl border-4 border-slate-400 overflow-hidden flex flex-col">
        {/* ========================================================= */}
        {/* 1. HEADER MERAH HOME PERSIS SCREENSHOT                    */}
        {/* ========================================================= */}
        <div className="app-header relative bg-[#ff0000] h-20 sm:h-24 flex items-center justify-between px-3 sm:px-6 shadow-inner border-b-4 border-red-700">
          <div className="flex items-center gap-2 sm:gap-3 z-10">
            <button
              onClick={() => {
                setCurrentPage('home');
                setIsMobileSidebarOpen(false);
              }}
              className="group relative w-20 sm:w-28 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#ff8c00] via-[#e65c00] to-[#b34700] border-2 border-[#5a2400] shadow-[0_4px_8px_rgba(0,0,0,0.5)] active:translate-y-0.5 flex items-center justify-center cursor-pointer transition hover:brightness-110"
              title="Klik untuk ke HOME"
            >
              <div className="absolute inset-x-2 top-1 h-2.5 rounded-t-xl bg-white/30 pointer-events-none" />
              <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
            </button>

            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden px-2.5 py-1.5 rounded-xl bg-slate-900 border-2 border-white text-white font-black text-[11px] flex items-center gap-1.5 shadow"
            >
              <Menu className="w-4 h-4 text-amber-300" />
              <span>MENU</span>
            </button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12 sm:px-32">
            <h1 className="text-lg sm:text-2xl lg:text-4xl font-black tracking-widest text-black uppercase drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)] text-center truncate">
              {currentPage === 'perbandingan'
                ? 'PERBANDINGAN TRIWULAN'
                : currentPage === 'to_print_page' && reportViewMode === 'spider_chart'
                ? 'SPIDER CHART'
                : currentPage === 'to_print_page'
                ? 'TO PRINT PAGE'
                : currentPage === 'dbtw'
   