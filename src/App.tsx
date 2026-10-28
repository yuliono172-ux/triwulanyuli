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
import { db, ref, set, onValue, remove, TeacherRecord, AppSettings } from './firebase';
import { useToast } from './components/Toast';
import { readSheet } from 'read-excel-file/browser';
import { strToU8, zipSync } from 'fflate';

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
  if (siswa.overallGrades && Object.prototype.hasOwnProperty.call(GRADE_WEIGHTS, siswa.overallGrades[aspectId])) {
    return siswa.overallGrades[aspectId];
  }
  const aspekMeta = ASPEK_LIST.find((a) => a.id === aspectId);
  if (!aspekMeta) return '-';
  const sec = (siswa?.[aspectId as keyof SiswaData] as Record<string, string> | undefined) || {};
  const values = aspekMeta.indikatorList
    .map((ind) => sec[ind.key])
    .filter((value): value is string => Boolean(value && Object.prototype.hasOwnProperty.call(GRADE_WEIGHTS, value)));
  if (values.length === 0) return '-';
  const sum = values.reduce((acc, v) => acc + GRADE_WEIGHTS[v], 0);
  const avg = sum / values.length;
  if (avg >= 4.5) return 'Exceptional';
  if (avg >= 3.5) return 'A';
  if (avg >= 2.5) return 'B';
  if (avg >= 1.5) return 'C';
  return 'Defisit';
};

const formatStudentName = (name: string) =>
  name
    .trim()
    .toLocaleLowerCase('id-ID')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('id-ID'));

const generateAspectDescription = (
  studentName: string,
  aspectId: string,
  section: Record<string, string>
): string => {
  const aspect = ASPEK_LIST.find((item) => item.id === aspectId);
  if (!aspect) return '';

  const ratedIndicators = aspect.indikatorList
    .map((indicator) => ({ ...indicator, grade: section[indicator.key] }))
    .filter((indicator) => PILIHAN_PREDIKAT.includes(indicator.grade));
  if (ratedIndicators.length === 0) return '';

  const name = formatStudentName(studentName);
  const clauses: string[] = [];
  const strong = ratedIndicators.filter(({ grade }) => grade === 'Exceptional' || grade === 'A');
  const developing = ratedIndicators.filter(({ grade }) => grade === 'B');
  const support = ratedIndicators.filter(({ grade }) => grade === 'C' || grade === 'Defisit');
  const describeIndicators = (indicators: typeof ratedIndicators) =>
    indicators.map(({ nama, grade }) => `${nama} (${grade})`).join(', ');

  if (strong.length > 0) {
    clauses.push(`menunjukkan capaian yang baik pada ${describeIndicators(strong)}`);
  }
  if (developing.length > 0) {
    clauses.push(`terus mengembangkan kemampuan pada ${describeIndicators(developing)}`);
  }
  if (support.length > 0) {
    clauses.push(`masih memerlukan latihan dan pendampingan bertahap pada ${describeIndicators(support)}`);
  }

  return `Pada aspek ${aspect.nama}, Ananda ${name} ${clauses.join('; ')}.`;
};

const getAspectDescriptions = (siswa: SiswaData): string[] =>
  ASPEK_LIST.map((aspect) => {
    const section = (siswa[aspect.id as keyof SiswaData] as Record<string, string> | undefined) || {};
    return section.deskripsi?.trim() || generateAspectDescription(siswa.nama, aspect.id, section);
  }).filter(Boolean);

const generateDefaultDeskripsi = (siswa: SiswaData): string => {
  const aspectDescriptions = getAspectDescriptions(siswa);
  const introduction = `Pada periode penilaian ini, Ananda ${formatStudentName(siswa.nama)} menunjukkan perkembangan berdasarkan indikator yang telah dinilai.`;

  return aspectDescriptions.length > 0
    ? `${introduction}\n\n${aspectDescriptions.join('\n\n')}`
    : `${introduction}\n\nBelum ada nilai indikator yang dapat digunakan untuk menyusun deskripsi aspek.`;
};

const getReportDescription = (siswa: SiswaData): string => {
  const savedDescription = siswa.deskripsiRapor?.trim();
  const aspectDescriptions = getAspectDescriptions(siswa);
  if (!savedDescription) return generateDefaultDeskripsi(siswa);

  const missingAspectDescriptions = aspectDescriptions.filter((description) => !savedDescription.includes(description));
  return missingAspectDescriptions.length > 0
    ? `${savedDescription}\n\nRincian capaian per aspek:\n\n${missingAspectDescriptions.join('\n\n')}`
    : savedDescription;
};

const generateDefaultSaran = (siswa: SiswaData): string => {
  const kelemahan: { nama: string; saran: string }[] = [];
  let assessedAspectCount = 0;

  ASPEK_LIST.forEach((asp) => {
    const grade = getAspectGrade(siswa, asp.id);
    if (grade !== '-') assessedAspectCount += 1;
    if (grade === 'Defisit' || grade === 'C') {
      kelemahan.push({ nama: asp.nama, saran: asp.saranKelemahan });
    }
  });

  if (assessedAspectCount === 0) {
    return `Belum ada nilai indikator yang dapat digunakan untuk menyusun saran perkembangan Ananda ${siswa.nama}.`;
  }

  if (kelemahan.length === 0) {
    return `Ananda ${siswa.nama} telah menunjukkan perkembangan yang baik pada aspek-aspek yang dinilai.\n\nSaran Pengembangan:\nPertahankan semangat belajar dan karakter positif, serta terus asah potensi kepemimpinan, daya nalar kritis, dan kreativitas diri.`;
  }

  const saranList = kelemahan
    .map((k, idx) => `${idx + 1}. Aspek ${k.nama}:\n   ${k.saran}`)
    .join('\n\n');

  return `Berdasarkan hasil evaluasi capaian perkembangan, berikut saran pembimbingan dan tindak lanjut prioritas berdasarkan aspek yang perlu ditingkatkan:\n\n${saranList}\n\n*Catatan Kolaborasi: Disarankan adanya komunikasi aktif dan kerjasama pendampingan yang berkesinambungan antara pihak sekolah dan orang tua di rumah agar pembiasaan positif di atas dapat tercapai secara maksimal.`;
};

const splitReportText = (text: string) =>
  text.split(/\r?\n\s*\r?\n/).map((paragraph) => paragraph.trim()).filter(Boolean);

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] || character);

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

interface SpiderAnalysisResult {
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

const getStudentSpiderAnalysis = (siswa: SiswaData): SpiderAnalysisResult => {
  const aspects: AspectAnalysis[] = ASPEK_LIST.map((asp) => {
    const sec = (siswa?.[asp.id as keyof SiswaData] as Record<string, string> | undefined) || {};
    const indicators = asp.indikatorList.map((ind) => {
      const rating = sec[ind.key] || '';
      const score = Object.prototype.hasOwnProperty.call(GRADE_WEIGHTS, rating) ? GRADE_WEIGHTS[rating] : 0;
      return {
        ...ind,
        rating,
        score
      };
    });

    const ratedIndicators = indicators.filter((indicator) => indicator.score > 0);
    const manualGrade = siswa?.overallGrades?.[asp.id];
    const manualScore = manualGrade && Object.prototype.hasOwnProperty.call(GRADE_WEIGHTS, manualGrade)
      ? GRADE_WEIGHTS[manualGrade]
      : 0;
    const hasData = ratedIndicators.length > 0 || manualScore > 0;
    const totalScore = ratedIndicators.reduce((acc, curr) => acc + curr.score, 0);
    const score = hasData
      ? Number((manualScore || totalScore / ratedIndicators.length).toFixed(2))
      : 0;
    const percentage = Math.round((score / 5) * 100);
    const grade = hasData ? getAspectGrade(siswa, asp.id) : '-';

    const strengthIndicators = indicators
      .filter((ind) => ind.rating === 'Exceptional' || ind.rating === 'A')
      .map((ind) => `${ind.nama} (${ind.rating})`);

    const weaknessIndicators = indicators
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
      indicators,
      strengthIndicators,
      weaknessIndicators,
      explanation
    };
  });

  const ratedAspects = aspects.filter((aspect) => aspect.hasData);
  const totalAspectScores = ratedAspects.reduce((sum, aspect) => sum + aspect.score, 0);
  const averageScore = ratedAspects.length > 0
    ? Number((totalAspectScores / ratedAspects.length).toFixed(2))
    : 0;
  const averagePercentage = Math.round((averageScore / 5) * 100);

  let overallGrade = '-';
  if (ratedAspects.length > 0) {
    if (averageScore >= 4.5) overallGrade = 'Exceptional';
    else if (averageScore >= 3.5) overallGrade = 'A';
    else if (averageScore >= 2.5) overallGrade = 'B';
    else if (averageScore >= 1.5) overallGrade = 'C';
    else overallGrade = 'Defisit';
  }

  // Pemilahan dimensi unggulan dan prioritas bimbingan yang mutually exclusive (tidak tumpang tindih)
  const sortedDesc = ratedAspects.sort((a, b) => b.score - a.score);
  
  // Ambil dimensi dengan skor tertinggi (maksimal 3 aspek teratas) sebagai keunggulan
  const candidateStrengths = sortedDesc.filter((a) => a.score >= 3.5);
  const finalStrengths = (candidateStrengths.length > 0 ? candidateStrengths : sortedDesc.slice(0, 3)).slice(0, 3);
  const strengthIds = new Set(finalStrengths.map((s) => s.id));

  // Dimensi prioritas bimbingan diambil dari aspek tersisa (yang tidak ada di dimensi keunggulan), diurutkan dari skor terendah
  const remainingForWeaknesses = [...ratedAspects]
    .filter((a) => !strengthIds.has(a.id))
    .sort((a, b) => a.score - b.score);
  
  const lowScoringWeaknesses = remainingForWeaknesses.filter((a) => a.score <= 3.0);
  const finalWeaknesses = (lowScoringWeaknesses.length > 0 ? lowScoringWeaknesses : remainingForWeaknesses).slice(0, 3);

  const strongNames = finalStrengths.map((s) => s.nama).join(', ');
  const weakNames = finalWeaknesses.map((w) => w.nama).join(', ');

  const strengthsSummary = strongNames
    ? `Berdasarkan peta radar capaian, kekuatan dominan Ananda ${siswa.nama} terletak pada dimensi ${strongNames}. Ananda menunjukkan antusiasme belajar yang tinggi, karakter kepemimpinan, kepedulian sosial, serta potensi keunikan diri yang patut diapresiasi dan dipertahankan.`
    : 'Belum ada data capaian kekuatan yang tercatat.';

  const weaknessesSummary = weakNames
    ? `Area perkembangan yang masih menjadi prioritas pendampingan teridentifikasi pada dimensi ${weakNames}. Diperlukan strategi bimbingan bertahap dari guru di kelas serta pembiasaan rutin yang hangat dari orang tua di rumah agar capaian pada aspek ini dapat bertumbuh optimal.`
    : 'Belum ada data untuk menentukan area pendampingan.';

  return {
    aspects,
    averageScore,
    averagePercentage,
    overallGrade,
    hasData: ratedAspects.length > 0,
    topStrengths: finalStrengths,
    topWeaknesses: finalWeaknesses,
    strengthsSummary,
    weaknessesSummary
  };
};

interface QuarterTrendPoint {
  periode: string;
  label: string;
  rerata: number | null;
  kognitif: number | null;
  afektif: number | null;
  psikomotor: number | null;
  sosial: number | null;
  islamicLiteracy: number | null;
  islamic_literacy: number | null;
  bilingual: number | null;
  talents: number | null;
  experience: number | null;
  inklusivitas: number | null;
  [key: string]: string | number | null;
}

interface DimensionQuarterComparison {
  id: string;
  nama: string;
  singkatan: string;
  triwulanLalu: number | null;
  triwulanIni: number | null;
  selisih: number | null;
  persen: number | null;
  isNaik: boolean;
}

interface StudentQuarterTrendsResult {
  quarters: QuarterTrendPoint[];
  overallDiff: number | null;
  overallPercent: number | null;
  isOverallUp: boolean | null;
  prevRerata: number | null;
  currentRerata: number | null;
  highestGrowthDimension: DimensionQuarterComparison | null;
  dimensionComparisons: DimensionQuarterComparison[];
}

const getStudentQuarterTrends = (siswa: SiswaData, activeTriwulan: TriwulanKey): StudentQuarterTrendsResult => {
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

  const activeStage = Number(activeTriwulan.slice(1));
  const getScoreForQuarterAspect = (
    qKey: 'T1' | 'T2' | 'T3' | 'T4',
    aspectId: string,
    stage: 1 | 2 | 3 | 4
  ): number | null => {
    const qRecord = triwulanMap?.[qKey];
    if (qRecord) {
      // Periksa overallGrades manual jika tersedia
      if (qRecord.overallGrades && qRecord.overallGrades[aspectId]) {
        const og = qRecord.overallGrades[aspectId];
        if (Object.prototype.hasOwnProperty.call(GRADE_WEIGHTS, og)) return GRADE_WEIGHTS[og];
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
            if (val && Object.prototype.hasOwnProperty.call(GRADE_WEIGHTS, val)) {
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

    if (stage === activeStage) {
      const cur = currentScores[aspectId] ?? (aspectId === 'islamic_literacy' ? currentScores['islamicLiteracy'] : currentScores['islamic_literacy']);
      return cur > 0 ? cur : null;
    }

    return null;
  };

  const t1_il = getScoreForQuarterAspect('T1', 'islamicLiteracy', 1);
  const t2_il = getScoreForQuarterAspect('T2', 'islamicLiteracy', 2);
  const t3_il = getScoreForQuarterAspect('T3', 'islamicLiteracy', 3);
  const t4_il = getScoreForQuarterAspect('T4', 'islamicLiteracy', 4);

  const quarters: QuarterTrendPoint[] = [
    {
      periode: 'TW 1',
      label: 'Triwulan I (Awal)',
      rerata: null,
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
      rerata: null,
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
      label: 'Triwulan III',
      rerata: null,
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
      label: 'Triwulan IV',
      rerata: null,
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

  quarters.forEach((quarter) => {
    const scores = ASPEK_LIST
      .map((aspect) => quarter[aspect.id])
      .filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
    quarter.rerata = scores.length > 0
      ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
      : null;
  });

  const currentQuarterIndex = activeStage - 1;
  const prevQuarter = currentQuarterIndex > 0 ? quarters[currentQuarterIndex - 1] : null;
  const currentQuarter = quarters[currentQuarterIndex];
  const hasOverallComparison = Boolean(prevQuarter?.rerata && currentQuarter?.rerata !== null);
  const overallDiff = hasOverallComparison
    ? Number((currentQuarter.rerata! - prevQuarter!.rerata!).toFixed(2))
    : null;
  const overallPercent = hasOverallComparison && prevQuarter?.rerata
    ? Number(((overallDiff! / prevQuarter.rerata) * 100).toFixed(1))
    : null;

  // Komparasi seluruh 9 dimensi
  const dimensionComparisons: DimensionQuarterComparison[] = analysis.aspects.map((asp) => {
    const prevRaw = prevQuarter?.[asp.id];
    const currRaw = currentQuarter[asp.id];
    const prev = typeof prevRaw === 'number' ? prevRaw : null;
    const curr = typeof currRaw === 'number' ? currRaw : null;
    const hasScores = typeof prev === 'number' && typeof curr === 'number';
    const diff = hasScores ? Number((curr - prev).toFixed(2)) : null;
    const pct = hasScores && prev > 0 && diff !== null ? Number(((diff / prev) * 100).toFixed(1)) : null;
    return {
      id: asp.id,
      nama: asp.nama,
      singkatan: asp.nama.length > 10 ? asp.nama.substring(0, 9) + '..' : asp.nama,
      triwulanLalu: prev ?? null,
      triwulanIni: curr ?? null,
      selisih: diff,
      persen: pct,
      isNaik: diff !== null && diff >= 0
    };
  });

  const sortedByGrowth = dimensionComparisons
    .filter((dimension): dimension is DimensionQuarterComparison & { selisih: number } => dimension.selisih !== null)
    .sort((a, b) => b.selisih - a.selisih);
  const highestGrowthDimension = sortedByGrowth[0] || null;

  return {
    quarters,
    overallDiff,
    overallPercent,
    isOverallUp: overallDiff === null ? null : overallDiff >= 0,
    prevRerata: prevQuarter?.rerata ?? null,
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

const mergeAssessmentSection = <T extends object>(defaults: T, value: unknown): T => ({
  ...defaults,
  ...(value && typeof value === 'object' ? value : {})
}) as T;

const normalizeAssessmentRecord = (value: unknown): SiswaAssessmentRecord => {
  const defaults = createEmptyAssessmentRecord();
  const source = value && typeof value === 'object'
    ? value as Partial<SiswaAssessmentRecord>
    : {};

  return {
    ...defaults,
    ...source,
    kognitif: mergeAssessmentSection(defaults.kognitif, source.kognitif),
    afektif: mergeAssessmentSection(defaults.afektif, source.afektif),
    psikomotor: mergeAssessmentSection(defaults.psikomotor, source.psikomotor),
    sosial: mergeAssessmentSection(defaults.sosial, source.sosial),
    islamicLiteracy: mergeAssessmentSection(defaults.islamicLiteracy, source.islamicLiteracy),
    bilingual: mergeAssessmentSection(defaults.bilingual, source.bilingual),
    talents: mergeAssessmentSection(defaults.talents, source.talents),
    experience: mergeAssessmentSection(defaults.experience, source.experience),
    inklusivitas: mergeAssessmentSection(defaults.inklusivitas, source.inklusivitas)
  };
};

const normalizeStudentRecords = (value: unknown): StudentRecord[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((student): student is Record<string, any> => Boolean(student && typeof student === 'object'))
    .map((student, index) => {
      const quarters = student.triwulan && typeof student.triwulan === 'object'
        ? student.triwulan
        : {};

      return {
        ...student,
        no: Number(student.no) || index + 1,
        nama: typeof student.nama === 'string' ? student.nama : '',
        nis: typeof student.nis === 'string' ? student.nis : '',
        kelas: typeof student.kelas === 'string' ? student.kelas : 'IV (Empat)',
        tahunAjaran: typeof student.tahunAjaran === 'string' ? student.tahunAjaran : '2026/2027',
        triwulan: {
          T1: normalizeAssessmentRecord(quarters.T1),
          T2: normalizeAssessmentRecord(quarters.T2),
          T3: normalizeAssessmentRecord(quarters.T3),
          T4: normalizeAssessmentRecord(quarters.T4)
        }
      };
    })
    .sort((left, right) => left.no - right.no);
};

const STUDENT_IMPORT_HEADERS = ['NO', 'NAMA', 'NIS', 'KELAS', 'TAHUN AJARAN'] as const;

const createStudentExcelTemplate = () => {
  const cells = STUDENT_IMPORT_HEADERS.map((header, index) => {
    const column = String.fromCharCode(65 + index);
    return `<c r="${column}1" t="inlineStr"><is><t>${header}</t></is></c>`;
  }).join('');
  const workbookFiles = {
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    'xl/workbook.xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Database Siswa" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/worksheets/sheet1.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData><row r="1" ht="24" customHeight="1">${cells}</row></sheetData><autoFilter ref="A1:E1"/></worksheet>`)
  };

  return new Blob([zipSync(workbookFiles)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
};

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
      if (saved) return normalizeStudentRecords(JSON.parse(saved));
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
    judulLaporan: {
      baris1: 'LAPORAN PERKEMBANGAN SISWA TRIWULAN I',
      baris2: '',
      baris3: 'TAHUN AJARAN 2026/2027'
    }
  });

  // 1. SINKRONISASI REALTIME FIREBASE: /students
  useEffect(() => {
    const studentsRef = ref(db, 'students');
    const unsubscribe = onValue(
      studentsRef,
      (snapshot) => {
        setFirebaseConnected(true);
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (Array.isArray(val)) {
            setMasterStudents(normalizeStudentRecords(val));
          } else if (typeof val === 'object' && val !== null) {
            if (val.__emptyDatabase === true) {
              setMasterStudents([]);
              return;
            }
            setMasterStudents(normalizeStudentRecords(Object.values(val)));
          }
        } else {
          // Inisialisasi awal ke Firebase jika masih kosong
          set(studentsRef, INITIAL_MASTER_STUDENTS).catch((err: unknown) =>
            console.warn('Firebase initial students set error:', err)
          );
        }
      },
      (error) => {
        console.warn('Firebase /students onValue error:', error);
        setFirebaseConnected(false);
      }
    );

    return unsubscribe;
  }, []);

  // 2. SINKRONISASI REALTIME FIREBASE: /teachers
  useEffect(() => {
    const teachersRef = ref(db, 'teachers');
    const unsubscribe = onValue(
      teachersRef,
      (snapshot) => {
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
          set(teachersRef, defaultTeachers).catch((err: unknown) =>
            console.warn('Firebase initial teachers error:', err)
          );
        }
      },
      (error) => {
        console.warn('Firebase /teachers onValue error:', error);
      }
    );

    return unsubscribe;
  }, []);

  // 3. SINKRONISASI REALTIME FIREBASE: /app_settings
  useEffect(() => {
    const settingsRef = ref(db, 'app_settings');
    const unsubscribe = onValue(
      settingsRef,
      (snapshot) => {
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
            judulLaporan: {
              baris1: val.activeTriwulan
                ? `LAPORAN PERKEMBANGAN SISWA ${val.activeTriwulan === 'T1' ? 'TRIWULAN I' : val.activeTriwulan === 'T2' ? 'TRIWULAN II' : val.activeTriwulan === 'T3' ? 'TRIWULAN III' : 'TRIWULAN IV'}`
                : prev.judulLaporan.baris1,
              baris2: prev.judulLaporan.baris2,
              baris3: prev.judulLaporan.baris3
            }
          }));

          if (val.activeTriwulan && ['T1', 'T2', 'T3', 'T4'].includes(val.activeTriwulan)) {
            setActiveTriwulan(val.activeTriwulan as TriwulanKey);
            setReportTriwulan(val.activeTriwulan as TriwulanKey);
          }
        }
      },
      (error) => {
        console.warn('Firebase /app_settings onValue error:', error);
      }
    );

    return unsubscribe;
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
      const normalizedStudents = normalizeStudentRecords(newStudents);
      await set(studentsRef, normalizedStudents.length > 0 ? normalizedStudents : { __emptyDatabase: true });
      setMasterStudents(normalizedStudents);
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
        activeTriwulan,
        tempatRaport: metaRapor.tempatRaport,
        tanggalRaport: metaRapor.tanggalRaport,
        kepalaSekolahNama: metaRapor.kepalaSekolah.nama,
        kepalaSekolahNiy: metaRapor.kepalaSekolah.niy,
        guruKelasNama: metaRapor.guruKelas.nama,
        guruKelasNiy: metaRapor.guruKelas.niy
      };
      await set(settingsRef, payload);
      toastSuccess(
        'Pengaturan Personalisasi Disimpan',
        'Periode aktif, tanggal raport, dan data penandatangan berhasil disimpan ke Firebase /app_settings.'
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
  const studentImportInputRef = useRef<HTMLInputElement | null>(null);

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
      const nextSec = { ...curSec, [field]: value };
      const aspect = ASPEK_LIST.find((item) => item.id === section);
      if (aspect?.indikatorList.some((indicator) => indicator.key === field)) {
        const previousGeneratedDescription = generateAspectDescription(s.nama, aspect.id, curSec);
        if (!curSec.deskripsi?.trim() || curSec.deskripsi === previousGeneratedDescription) {
          nextSec.deskripsi = generateAspectDescription(s.nama, aspect.id, nextSec);
        }
      }
      return {
        ...s,
        triwulan: {
          ...s.triwulan,
          [activeTriwulan]: {
            ...curQ,
            [section]: nextSec
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

  const renderAspectDescriptionEditor = (siswa: SiswaData, aspectId: string) => {
    const section = (siswa[aspectId as keyof SiswaData] as Record<string, string> | undefined) || {};
    const isReadOnly = currentUser?.role === 'orangtua';

    return (
      <div className="space-y-1">
        <button
          type="button"
          disabled={isReadOnly}
          onClick={() => {
            const description = generateAspectDescription(siswa.nama, aspectId, section);
            if (!description) {
              toastInfo('Nilai belum tersedia', 'Isi predikat indikator pada aspek ini terlebih dahulu.');
              return;
            }
            updateStudentField(siswa.no, aspectId as keyof SiswaAssessmentRecord, 'deskripsi', description);
            toastSuccess('Deskripsi dibuat', 'Deskripsi disusun secara lokal dari nilai indikator.');
          }}
          title="Disusun secara lokal dari nilai indikator; data tidak dikirim ke layanan AI."
          className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Buat otomatis
        </button>
        <textarea
          rows={2}
          value={section.deskripsi || ''}
          readOnly={isReadOnly}
          onChange={(event) => updateStudentField(siswa.no, aspectId as keyof SiswaAssessmentRecord, 'deskripsi', event.target.value)}
          className="w-full text-[11px] p-1 border rounded focus:outline-none"
          placeholder="Deskripsi aspek..."
        />
      </div>
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
    const studentDeskripsi = getReportDescription(student);
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
    if (withKop && customKop) {
      kopHtml = `
        <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 4px;">
          <img src="${customKop}" style="max-width: 100%; max-height: 145px; object-fit: contain;" alt="Kop Surat Sekolah" />
        </div>
      `;
    }

    const studentInfoHtml = infoStyle === 'simple' ? `
      <div style="margin-bottom: 12px; font-size: 11px; font-weight: bold; line-height: 1.6;">
        <table style="border: none; width: min(100%, 420px); margin-bottom: 0; border-collapse: collapse; table-layout: fixed;">
          <colgroup><col style="width: 100px;"><col style="width: 12px;"><col></colgroup>
          <tr>
            <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; font-size: 12px; line-height: 1.4;">Nama Siswa</td>
            <td style="border: none; padding: 2px 0; font-weight: bold; font-size: 12px; line-height: 1.4;">:</td>
            <td style="border: none; padding: 2px 4px; font-weight: bold; text-transform: uppercase; font-size: 12px; line-height: 1.4;">${student.nama}</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; font-size: 12px; line-height: 1.4;">NIS</td>
            <td style="border: none; padding: 2px 0; font-weight: bold; font-size: 12px; line-height: 1.4;">:</td>
            <td style="border: none; padding: 2px 4px; font-weight: bold; font-size: 12px; line-height: 1.4;">${student.nis}</td>
          </tr>
          <tr>
            <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; font-size: 12px; line-height: 1.4;">Kelas</td>
            <td style="border: none; padding: 2px 0; font-weight: bold; font-size: 12px; line-height: 1.4;">:</td>
            <td style="border: none; padding: 2px 4px; font-weight: bold; font-size: 12px; line-height: 1.4;">${student.kelas}</td>
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
        ${metaRapor.judulLaporan.baris1 ? `<div style="font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; color: #000;">${metaRapor.judulLaporan.baris1}</div>` : ''}
        ${metaRapor.judulLaporan.baris2 ? `<div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #111; margin-top: 2px;">${metaRapor.judulLaporan.baris2}</div>` : ''}
        ${metaRapor.judulLaporan.baris3 ? `<div style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #333; margin-top: 2px;">${metaRapor.judulLaporan.baris3}</div>` : ''}
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
        <div style="padding: 8px 10px; font-size: 11px; line-height: 1.5; color: #000; min-height: 45px;">
          ${splitReportText(studentDeskripsi).map((paragraph) => `<p class="report-text-paragraph">${escapeHtml(paragraph)}</p>`).join('')}
        </div>
      </div>

      <!-- SARAN -->
      <div style="border: 1px solid #000; margin-bottom: 16px; background-color: #ffffff;">
        <div style="border-bottom: 1px solid #000; padding: 4px 8px; font-weight: bold; font-size: 11px; text-transform: uppercase; background-color: #ffffff; color: #000;">
          Saran:
        </div>
        <div style="padding: 8px 10px; font-size: 11px; line-height: 1.5; color: #000; min-height: 45px;">
          ${splitReportText(studentSaran).map((paragraph) => `<p class="report-text-paragraph">${escapeHtml(paragraph)}</p>`).join('')}
        </div>
      </div>

      <!-- KOLOM TANDA TANGAN (HANYA KEPALA SEKOLAH DAN GURU KELAS SEJAJAR) -->
      <div style="margin-top: 18px;">
        <table style="width: 100%; border: none; margin-bottom: 0;">
          <tbody>
            <tr style="text-align: center; vertical-align: top;">
              <td style="width: 50%; border: none; font-size: 11px; text-align: center;">
                Mengetahui,<br><strong>Kepala Sekolah</strong><br><br><br><br><br>
                <strong style="text-decoration: underline; text-transform: uppercase; font-size: 12px;">${metaRapor.kepalaSekolah.nama}</strong><br>
                <span style="font-size: 12px;">NIY. ${metaRapor.kepalaSekolah.niy}</span>
              </td>
              <td style="width: 50%; border: none; font-size: 11px; text-align: center;">
                ${metaRapor.tempatRaport}, ${metaRapor.tanggalRaport}<br>
                <strong>Guru Kelas IV</strong><br><br><br><br><br>
                <strong style="text-decoration: underline; text-transform: uppercase; font-size: 12px;">${metaRapor.guruKelas.nama}</strong><br>
                <span style="font-size: 12px;">NIY. ${metaRapor.guruKelas.niy}</span>
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
    .report-text-paragraph {
      margin: 0 0 6px;
      white-space: pre-wrap;
      break-inside: avoid;
      page-break-inside: avoid;
      orphans: 3;
      widows: 3;
    }
    .report-text-paragraph:last-child {
      margin-bottom: 0;
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

  const handleDownloadStudentTemplate = () => {
    const url = URL.createObjectURL(createStudentExcelTemplate());
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-database-siswa.xlsx';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleStudentExcelImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      toastError('Format File Tidak Didukung', 'Pilih file Excel .xlsx. File CSV tidak digunakan.');
      return;
    }

    try {
      const rows = await readSheet(file, 1);
      const normalizeHeader = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
      const headerAliases: Record<string, string> = {
        NO: 'no',
        NOMOR: 'no',
        'NOMOR URUT': 'no',
        NAMA: 'nama',
        'NAMA SISWA': 'nama',
        NIS: 'nis',
        NISN: 'nis',
        KELAS: 'kelas',
        ROMBEL: 'kelas',
        'TAHUN AJARAN': 'tahunAjaran',
        'TAHUN AKADEMIK': 'tahunAjaran'
      };
      const headerRowIndex = rows.findIndex((row) => row.some((cell) => headerAliases[normalizeHeader(cell)]));

      if (headerRowIndex < 0) {
        toastError('Header Tidak Ditemukan', 'Gunakan template Excel dengan header NAMA dan NIS.');
        return;
      }

      const columns: Record<string, number> = {};
      rows[headerRowIndex].forEach((cell, index) => {
        const key = headerAliases[normalizeHeader(cell)];
        if (key && columns[key] === undefined) columns[key] = index;
      });

      if (columns.nama === undefined || columns.nis === undefined) {
        toastError('Header Belum Lengkap', 'Kolom NAMA dan NIS wajib tersedia pada file Excel.');
        return;
      }

      const importedRows: Array<{ no?: number; nama: string; nis: string; kelas: string; tahunAjaran: string }> = [];
      const invalidRows: number[] = [];
      const seenNis = new Set<string>();

      rows.slice(headerRowIndex + 1).forEach((row, rowOffset) => {
        if (row.every((cell) => String(cell ?? '').trim() === '')) return;

        const nama = String(row[columns.nama] ?? '').trim();
        const nis = String(row[columns.nis] ?? '').trim();
        if (!nama || !nis || seenNis.has(nis)) {
          invalidRows.push(headerRowIndex + rowOffset + 2);
          return;
        }

        seenNis.add(nis);
        const noValue = columns.no === undefined ? '' : String(row[columns.no] ?? '').trim();
        const parsedNo = /^\d+$/.test(noValue) ? Number(noValue) : undefined;
        importedRows.push({
          no: parsedNo && parsedNo > 0 ? parsedNo : undefined,
          nama,
          nis,
          kelas: columns.kelas === undefined ? '' : String(row[columns.kelas] ?? '').trim(),
          tahunAjaran: columns.tahunAjaran === undefined ? '' : String(row[columns.tahunAjaran] ?? '').trim()
        });
      });

      if (invalidRows.length > 0) {
        toastError(
          'Data Excel Perlu Diperiksa',
          `Nama/NIS kosong atau NIS ganda pada baris: ${invalidRows.slice(0, 8).join(', ')}${invalidRows.length > 8 ? ', ...' : ''}. Tidak ada data yang diimpor.`
        );
        return;
      }

      if (importedRows.length === 0) {
        toastError('Data Excel Kosong', 'Tambahkan minimal satu baris siswa di bawah header template.');
        return;
      }

      const mergedStudents = [...masterStudents];
      const usedNumbers = new Set(masterStudents.map((student) => student.no));
      let nextNumber = Math.max(0, ...usedNumbers) + 1;
      let addedCount = 0;
      let updatedCount = 0;

      importedRows.forEach((row) => {
        const existingIndex = mergedStudents.findIndex((student) => student.nis.trim() === row.nis);
        if (existingIndex >= 0) {
          const existing = mergedStudents[existingIndex];
          mergedStudents[existingIndex] = {
            ...existing,
            nama: row.nama.toUpperCase(),
            nis: row.nis,
            kelas: row.kelas || existing.kelas,
            tahunAjaran: row.tahunAjaran || existing.tahunAjaran
          };
          updatedCount += 1;
          return;
        }

        let no = row.no && !usedNumbers.has(row.no) ? row.no : nextNumber;
        while (usedNumbers.has(no)) no += 1;
        usedNumbers.add(no);
        nextNumber = Math.max(nextNumber, no + 1);
        mergedStudents.push({
          no,
          nama: row.nama.toUpperCase(),
          nis: row.nis,
          kelas: row.kelas || 'IV (Empat)',
          tahunAjaran: row.tahunAjaran || '2026/2027',
          triwulan: {
            T1: createEmptyAssessmentRecord(),
            T2: createEmptyAssessmentRecord(),
            T3: createEmptyAssessmentRecord(),
            T4: createEmptyAssessmentRecord()
          }
        });
        addedCount += 1;
      });

      mergedStudents.sort((left, right) => left.no - right.no);
      await saveStudentsToFirebase(
        mergedStudents,
        `Impor Excel selesai: ${addedCount} siswa ditambahkan dan ${updatedCount} data identitas diperbarui. Nilai triwulan tetap dipertahankan.`
      );
    } catch (error) {
      console.error('Gagal membaca file Excel siswa:', error);
      toastError('Gagal Membaca Excel', 'Pastikan file .xlsx valid dan memiliki header pada lembar pertama.');
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
    const studentTrends = getStudentQuarterTrends(student, activeTriwulan);
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
                ? 'REKAP NILAI (DBTW)'
                : ASPECT_PAGE_KEYS.includes(currentPage)
                ? `${currentPage.replace('_', ' ').toUpperCase()} • ${activeTriwulan}`
                : currentPage.replace('_', ' ').toUpperCase()}
            </h1>
          </div>

          {/* Quick Context Pill & User Role in Header */}
          <div className="flex items-center gap-2 z-10">
            {/* Firebase Connection Status */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border backdrop-blur-xs ${
                firebaseConnected
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-400 text-rose-200'
              }`}
              title={firebaseConnected ? 'Terhubung ke Firebase Realtime Database' : 'Jaringan Firebase Terputus'}
            >
              <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="hidden md:inline">{firebaseConnected ? 'RTDB Aktif' : 'Offline'}</span>
            </div>

            {/* Periode Aktif */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950/75 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/30 text-right shadow">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <span className="text-[10px] text-slate-300 block leading-tight font-semibold">PERIODE AKTIF:</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  {TRIWULAN_OPTIONS.find((t) => t.id === activeTriwulan)?.label || activeTriwulan}
                </span>
              </div>
            </div>

            {/* User Session Pill & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-slate-950/90 text-white px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-amber-400 shadow-md">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-bold text-amber-300 uppercase leading-tight flex items-center justify-end gap-1">
                    {currentUser.role === 'admin' ? (
                      <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-black">ADMIN</span>
                    ) : currentUser.role === 'guru' ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-black">GURU</span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[9px] font-black">ORANG TUA</span>
                    )}
                    <span>{currentUser.nama}</span>
                  </div>
                  <div className="text-[9px] text-slate-300 font-mono">
                    {currentUser.username}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 transition shadow cursor-pointer"
                  title="Keluar dari akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline text-[10px]">KELUAR</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. BODY UTAMA: SIDEBAR PERMANEN + AREA KONTEN             */}
        {/* ========================================================= */}
        <div className="app-workspace flex flex-col md:flex-row flex-1 min-h-[820px] bg-[#d9d9d9]">
          {/* ======================================================= */}
          {/* PERMANENT LEFT-HAND SIDEBAR (COLLAPSIBLE ACCORDION)       */}
          {/* ======================================================= */}
          <aside
            className={`app-sidebar print:hidden w-full md:w-56 lg:w-60 bg-gradient-to-b from-[#1e2530] via-[#171d26] to-[#0f1319] text-white border-r-4 border-slate-600 shadow-2xl flex flex-col shrink-0 select-none ${
              isMobileSidebarOpen ? 'block' : 'hidden md:flex'
            }`}
          >
            {/* Header Sidebar */}
            <div className="p-2 border-b border-slate-700 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-black shadow-sm border border-white/20 text-[11px]">
                  SD
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-wide text-white">
                    MENU NAVIGASI
                  </h3>
                  <p className="text-[9px] text-amber-300 font-medium">
                    Rapor Siswa Terpadu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Context Triwulan Aktif di Sidebar */}
            <div className="px-2 py-1 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Konteks Data:
              </span>
              <span className="font-black text-amber-400 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-600/70 uppercase tracking-wide text-[9px]">
                {activeTriwulan} ({TRIWULAN_OPTIONS.find((t) => t.id === activeTriwulan)?.label})
              </span>
            </div>

            {/* List Navigasi Utama */}
            <div className="p-2 space-y-1 flex-1 overflow-y-auto max-h-[calc(100vh-190px)] scrollbar-thin">
              {/* 1. HOME */}
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg font-black text-[11px] uppercase tracking-wide flex items-center gap-2 transition border cursor-pointer ${
                  currentPage === 'home'
                    ? 'bg-gradient-to-r from-[#00a2ed] to-[#0077b6] text-white border-white shadow-[0_2px_8px_rgba(0,162,237,0.5)] ring-2 ring-sky-300'
                    : 'bg-gradient-to-b from-[#ff8c00] via-[#e65c00] to-[#b34700] text-white border-[#5a2400] hover:brightness-110 shadow-xs'
                }`}
              >
                <HomeIcon className="w-4 h-4 shrink-0 text-white drop-shadow" />
                <span>HOME</span>
              </button>

              {/* 2. DATABASE */}
              <button
                onClick={() => {
                  setCurrentPage('database');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg font-black text-[11px] uppercase tracking-wide flex items-center gap-2 transition border cursor-pointer ${
                  currentPage === 'database'
                    ? 'bg-gradient-to-r from-[#00a2ed] to-[#0077b6] text-white border-white shadow-[0_2px_8px_rgba(0,162,237,0.5)] ring-2 ring-sky-300'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700/90 hover:text-white shadow-xs'
                }`}
              >
                <Database className="w-4 h-4 shrink-0 text-amber-400" />
                <span>DATABASE</span>
              </button>

              {/* Section Header: Periode Penilaian Accordion */}
              <div className="pt-1.5 pb-0.5">
                <div className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-between border-b border-slate-700/80">
                  <span>PERIODE TRIWULAN</span>
                  <span className="text-[9px] text-amber-400 font-bold">4 PERIODE</span>
                </div>
              </div>

              {/* 4. TRIWULAN 1 s.d 4 (SINGLE-OPEN ACCORDION + 9 ASPEK SUBMENUS) */}
              {TRIWULAN_OPTIONS.map((t) => {
                const isExpanded = expandedTriwulan === t.id;
                const isTriwulanActive = activeTriwulan === t.id;

                return (
                  <div
                    key={`sidebar-triwulan-${t.id}`}
                    className={`rounded-xl border transition overflow-hidden ${
                      isTriwulanActive
                        ? 'border-amber-400/90 bg-slate-900/90 shadow-md ring-1 ring-amber-400/40'
                        : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600'
                    }`}
                  >
                    {/* Header Triwulan Accordion */}
                    <button
                      onClick={() => handleToggleTriwulanAccordion(t.id)}
                      className={`w-full py-1.5 px-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wide transition cursor-pointer group ${
                        isTriwulanActive
                          ? isExpanded
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black'
                            : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                          : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={`Klik untuk ${isExpanded ? 'menutup' : 'membuka'} aspek ${t.label}`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Ikon Chevron Collapse/Expand */}
                        <span className="w-4 h-4 flex items-center justify-center shrink-0">
                          {isExpanded ? (
                            <ChevronDown className={`w-4 h-4 ${isTriwulanActive && isExpanded ? 'text-slate-950' : 'text-amber-400'}`} />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
                          )}
                        </span>
                        <span className="tracking-wider">{t.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isTriwulanActive && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider ${
                              isExpanded
                                ? 'bg-black text-amber-300'
                                : 'bg-amber-500 text-black'
                            }`}
                          >
                            AKTIF
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isTriwulanActive && isExpanded
                              ? 'bg-black/20 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {t.id}
                        </span>
                      </div>
                    </button>

                    {/* Submenu 9 Aspek (Single-Open Accordion Body) */}
                    {isExpanded && (
                      <div className="p-1 bg-slate-950/80 border-t border-slate-800 space-y-1">
                        <div className="text-[9px] text-slate-400 font-semibold px-1.5 py-0.5 flex items-center justify-between italic">
                          <span>9 Aspek Penilaian:</span>
                          <span className="text-amber-300 text-[9px] font-bold">Konteks {t.id}</span>
                        </div>

                        {ASPEK_SIDEBAR_LIST.map((aspek, idx) => {
                          const isLast = idx === ASPEK_SIDEBAR_LIST.length - 1;
                          const isSubActive = isTriwulanActive && currentPage === aspek.id;

                          return (
                            <button
                              key={`sub-${t.id}-${aspek.id}`}
                              onClick={() => handleSelectAspectSubmenu(t.id, aspek.id)}
                              className={`w-full text-left py-1 px-1.5 rounded-md text-[11px] font-bold transition flex items-center justify-between group cursor-pointer border ${
                                isSubActive
                                  ? 'bg-[#00a2ed] text-white border-white shadow-md ring-2 ring-sky-300 scale-[1.01]'
                                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border-transparent hover:border-slate-700'
                              }`}
                              title={`Buka Lembar Penilaian ${aspek.label} (${t.label})`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-[10px] text-slate-500 font-mono select-none">
                                  {isLast ? '└──' : '├──'}
                                </span>
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs border border-black/30"
                                  style={{ backgroundColor: aspek.color }}
                                  title={aspek.label}
                                />
                                <span className="truncate tracking-wide text-[11px]">
                                  {aspek.label}
                                </span>
                              </div>

                              {isSubActive && (
                                <span className="text-[9px] font-black uppercase bg-white text-[#006ca0] px-1.5 py-0.5 rounded shadow-xs tracking-wider shrink-0">
                                  AKTIF
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Section Header: Laporan & Analisis */}
              <div className="pt-1.5 pb-0.5">
                <div className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-700/80">
                  ANALISIS & RAPOR RESMI
                </div>
              </div>

              {/* 5. PERBANDINGAN TRIWULAN */}
              <button
                onClick={() => {
                  setCurrentPage('perbandingan');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg font-black text-[11px] uppercase tracking-wide flex items-center justify-between transition border cursor-pointer ${
                  currentPage === 'perbandingan'
                    ? 'bg-gradient-to-r from-[#00a2ed] to-[#0077b6] text-white border-white shadow-[0_2px_8px_rgba(0,162,237,0.5)] ring-2 ring-sky-300'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700/90 hover:text-white shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>PERBANDINGAN TW</span>
                </div>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-1.5 py-0.5 rounded font-mono font-bold">
                  T1-T4
                </span>
              </button>

              {/* 6. SPIDER CHART */}
              <button
                onClick={() => {
                  setCurrentPage('to_print_page');
                  setReportViewMode('spider_chart');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg font-black text-[11px] uppercase tracking-wide flex items-center justify-between transition border cursor-pointer ${
                  currentPage === 'to_print_page' && reportViewMode === 'spider_chart'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-white shadow-[0_2px_8px_rgba(20,184,166,0.5)] ring-2 ring-teal-300'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700/90 hover:text-white shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 shrink-0 text-teal-400" />
                  <span>SPIDER CHART</span>
                </div>
                <span className="text-[9px] bg-teal-950 text-teal-300 border border-teal-700 px-1.5 py-0.5 rounded font-mono font-bold">
                  RADAR
                </span>
              </button>

              {/* 7. TO PRINT PAGE */}
              <button
                onClick={() => {
                  setCurrentPage('to_print_page');
                  setReportViewMode('document');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg font-black text-[11px] uppercase tracking-wide flex items-center justify-between transition border cursor-pointer ${
                  currentPage === 'to_print_page' && reportViewMode === 'document'
                    ? 'bg-gradient-to-r from-[#00a2ed] to-[#0077b6] text-white border-white shadow-[0_2px_8px_rgba(0,162,237,0.5)] ring-2 ring-sky-300'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700/90 hover:text-white shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>TO PRINT PAGE</span>
                </div>
                <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-700 px-1.5 py-0.5 rounded font-mono font-bold">
                  CETAK
                </span>
              </button>

              {/* 8. REKAP (DBTW) */}
              <button
                onClick={() => {
                  setCurrentPage('dbtw');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg font-black text-[11px] uppercase tracking-wide flex items-center gap-2 transition border cursor-pointer ${
                  currentPage === 'dbtw'
                    ? 'bg-gradient-to-r from-[#00a2ed] to-[#0077b6] text-white border-white shadow-[0_2px_8px_rgba(0,162,237,0.5)] ring-2 ring-sky-300'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700/90 hover:text-white shadow-xs'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>REKAP (DBTW)</span>
              </button>

              {/* 9. PENGELOLAAN DATA GURU (AKSES ADMIN FIREBASE) */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setCurrentPage('guru_manage');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full py-1.5 px-2.5 rounded-lg font-black text-[11px] uppercase tracking-wide flex items-center justify-between transition border cursor-pointer ${
                    currentPage === 'guru_manage'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-white shadow-[0_2px_8px_rgba(147,51,234,0.5)] ring-2 ring-purple-300'
                      : 'bg-purple-950/70 text-purple-200 border-purple-700/70 hover:bg-purple-900/80 hover:text-white shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0 text-purple-300" />
                    <span>DATA GURU (ADMIN)</span>
                  </div>
                  <span className="text-[9px] bg-purple-900 text-purple-200 border border-purple-500 px-1.5 py-0.5 rounded font-mono font-bold">
                    CRUD
                  </span>
                </button>
              )}
            </div>

            {/* Sidebar Footer Info */}
            <div className="p-2 bg-slate-950/90 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Kelas:</span>
                <span className="text-white font-bold">IV (Empat)</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Tahun Ajaran:</span>
                <span className="text-amber-300 font-bold">2026/2027</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Total Siswa:</span>
                <span className="text-emerald-400 font-bold">{masterStudents.length} Siswa</span>
              </div>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* 3. AREA KONTEN MASING-MASING HALAMAN                      */}
          {/* ========================================================= */}
          <main className="app-main p-3 sm:p-6 flex-1 min-w-0 overflow-y-auto bg-[#ececec]">
          {dataSiswa.length === 0 && currentPage !== 'database' ? (
            <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Database className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-800">Database siswa kosong</h2>
              <p className="mt-2 text-sm text-slate-600">
                Tambahkan siswa atau impor data melalui halaman database sebelum membuka rapor dan penilaian.
              </p>
              <button
                onClick={() => setCurrentPage('database')}
                className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
              >
                Buka Database Siswa
              </button>
            </div>
          ) : (
            <>
          {/* ======================================================= */}
          {/* TAB 0: HOME / DASHBOARD TRIWULAN AKTIF                  */}
          {/* ======================================================= */}
          {currentPage === 'home' && (() => {
            const currentStudentMaster = masterStudents.find((s) => s.no === selectedStudentNum) || masterStudents[0];
            const currentStudentData = dataSiswa.find((s) => s.no === selectedStudentNum) || dataSiswa[0];
            const activeTriwulanLabel = TRIWULAN_OPTIONS.find((t) => t.id === activeTriwulan)?.label || activeTriwulan;

            // Logika Periode Pembanding (Triwulan Sebelumnya)
            const prevQuarterKey: TriwulanKey | null =
              activeTriwulan === 'T2' ? 'T1' :
              activeTriwulan === 'T3' ? 'T2' :
              activeTriwulan === 'T4' ? 'T3' : null;
            const prevQuarterLabel = prevQuarterKey
              ? TRIWULAN_OPTIONS.find((t) => t.id === prevQuarterKey)?.label || prevQuarterKey
              : null;

            // Perbandingan data aktual vs Triwulan sebelumnya
            const prevComparison = prevQuarterKey
              ? compareTwoQuarters(currentStudentMaster, prevQuarterKey, activeTriwulan)
              : null;

            // Kelengkapan Penilaian (Data kosong TIDAK dianggap 0)
            let totalIndicatorsCount = 0;
            let filledIndicatorsCount = 0;
            const unfilledIndicatorsList: { aspectName: string; indName: string; indKey: string; aspectId: string }[] = [];

            // Metrik 9 Aspek
            const aspectMetricsList = ASPEK_LIST.map((asp) => {
              const sec = (currentStudentData[asp.id as keyof SiswaData] as Record<string, string>) || {};
              let aspTotal = 0;
              let aspFilled = 0;
              const filledScores: number[] = [];

              asp.indikatorList.forEach((ind) => {
                totalIndicatorsCount++;
                aspTotal++;
                const rating = sec[ind.key];
                if (rating && typeof rating === 'string' && rating.trim() !== '' && GRADE_WEIGHTS[rating]) {
                  filledIndicatorsCount++;
                  aspFilled++;
                  filledScores.push(GRADE_WEIGHTS[rating]);
                } else {
                  unfilledIndicatorsList.push({
                    aspectName: asp.nama,
                    indName: ind.nama,
                    indKey: ind.key,
                    aspectId: asp.id
                  });
                }
              });

              const hasData = filledScores.length > 0;
              const avgScore = hasData
                ? Number((filledScores.reduce((a, b) => a + b, 0) / filledScores.length).toFixed(2))
                : null;
              const grade = hasData ? getGradeFromScore(avgScore) : '-';
              const progressPct = avgScore !== null ? Math.round((avgScore / 5) * 100) : 0;

              // Data komparasi vs triwulan lalu
              const compItem = prevComparison?.aspects.find((c) => c.id === asp.id);

              return {
                ...asp,
                hasData,
                avgScore,
                grade,
                progressPct,
                aspFilled,
                aspTotal,
                compItem
              };
            });

            const completionPct = totalIndicatorsCount > 0
              ? Math.round((filledIndicatorsCount / totalIndicatorsCount) * 100)
              : 0;

            // Rerata keseluruhan aspek yang sudah terisi
            const assessedAspects = aspectMetricsList.filter((a) => a.hasData && a.avgScore !== null);
            const overallAverage = assessedAspects.length > 0
              ? Number((assessedAspects.reduce((acc, a) => acc + (a.avgScore || 0), 0) / assessedAspects.length).toFixed(2))
              : null;
            const overallGrade = overallAverage !== null ? getGradeFromScore(overallAverage) : '-';

            // Sorting untuk analisis prioritas
            const sortedByScore = [...assessedAspects].sort((a, b) => (a.avgScore || 0) - (b.avgScore || 0));
            const lowestAspect = sortedByScore[0] || null;
            const highestAspect = sortedByScore[sortedByScore.length - 1] || null;

            // Data Preview Radar / Spider Chart (9 Dimensi)
            const CX = 130;
            const CY = 130;
            const R = 82;
            const numAspects = ASPEK_LIST.length;

            const radarGridPolygons = [0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
              return ASPEK_LIST.map((_, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
                const r = R * level;
                return `${(CX + r * Math.cos(angle)).toFixed(1)},${(CY + r * Math.sin(angle)).toFixed(1)}`;
              }).join(' ');
            });

            const radarDataPoints = aspectMetricsList.map((asp, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
              const val = asp.avgScore ?? 1.0;
              const r = (val / 5) * R;
              return {
                x: Number((CX + r * Math.cos(angle)).toFixed(1)),
                y: Number((CY + r * Math.sin(angle)).toFixed(1)),
                score: asp.avgScore,
                nama: asp.nama,
                kode: (ASPEK_SIDEBAR_LIST.find((s) => s.id === asp.id)?.kode) || asp.nama.slice(0, 2),
                labelX: Number((CX + (R + 18) * Math.cos(angle)).toFixed(1)),
                labelY: Number((CY + (R + 18) * Math.sin(angle)).toFixed(1))
              };
            });

            const radarPolygonPointsStr = radarDataPoints.map((p) => `${p.x},${p.y}`).join(' ');

            return (
              <div className="dashboard-page space-y-5">
                {/* =================================================== */}
                {/* 1. HEADER DASHBOARD PENILAIAN TRIWULAN AKTIF         */}
                {/* =================================================== */}
                <div className="dashboard-hero app-dashboard-hero bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl border-4 border-[#00a2ed] p-5 sm:p-6 shadow-xl text-white">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                          {activeTriwulanLabel} • TAHUN AJARAN 2026/2027
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-wide text-white mt-1">
                        DASHBOARD PENILAIAN PERKEMBANGAN
                      </h2>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Ringkasan evaluasi capaian 9 dimensi, status pengisian, dan tren perkembangan peserta didik.
                      </p>
                    </div>

                    {/* Pemilih Siswa Aktif di Dashboard */}
                    <div className="bg-slate-800/90 border-2 border-slate-600 rounded-xl p-2.5 flex flex-wrap items-center gap-2 shadow-inner">
                      <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap">
                        Siswa Aktif:
                      </span>
                      <button
                        onClick={() => {
                          if (currentUser?.role === 'orangtua') return;
                          if (selectedStudentNum > 1) setSelectedStudentNum((prev) => prev - 1);
                        }}
                        disabled={selectedStudentNum <= 1 || currentUser?.role === 'orangtua'}
                        className="px-2.5 py-1 text-xs font-bold border border-slate-500 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 cursor-pointer"
                        title="Siswa Sebelumnya"
                      >
                        ◀
                      </button>

                      <select
                        value={selectedStudentNum}
                        disabled={currentUser?.role === 'orangtua'}
                        onChange={(e) => setSelectedStudentNum(Number(e.target.value))}
                        className={`px-3 py-1 text-xs font-black border-2 rounded-lg text-white max-w-[240px] truncate shadow-sm focus:outline-none ${
                          currentUser?.role === 'orangtua'
                            ? 'border-blue-400 bg-slate-800 opacity-90 cursor-not-allowed'
                            : 'border-amber-400 bg-slate-900 cursor-pointer'
                        }`}
                        title={currentUser?.role === 'orangtua' ? 'Akses Orang Tua: Terkunci ke NISN siswa' : 'Pilih Siswa'}
                      >
                        {dataSiswa.map((s) => (
                          <option key={s.no} value={s.no}>
                            {s.no}. {s.nama} ({s.nis})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => {
                          if (currentUser?.role === 'orangtua') return;
                          if (selectedStudentNum < dataSiswa.length) setSelectedStudentNum((prev) => prev + 1);
                        }}
                        disabled={selectedStudentNum >= dataSiswa.length || currentUser?.role === 'orangtua'}
                        className="px-2.5 py-1 text-xs font-bold border border-slate-500 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 cursor-pointer"
                        title="Siswa Berikutnya"
                      >
                        ▶
                      </button>

                      {currentUser?.role === 'orangtua' ? (
                        <span className="text-[10px] bg-blue-500 text-white font-black px-2 py-1 rounded-md uppercase tracking-wider ml-1">
                          🔒 TERKUNCI (ANAK ANDA)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-400 text-black font-black px-2 py-1 rounded-md uppercase tracking-wider ml-1">
                          KELAS IV (FASE B)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* =================================================== */}
                {/* 2. BARIS ATAS: 3 KARTU STATUS & PERKEMBANGAN        */}
                {/* =================================================== */}
                <div className="dashboard-kpis grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* KARTU 1: STATUS KELENGKAPAN PENILAIAN */}
                  <div className="dashboard-kpi dashboard-kpi-completion bg-white rounded-xl border-2 border-slate-400 p-4 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          STATUS PENILAIAN
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          completionPct === 100
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {completionPct === 100 ? 'Lengkap 100%' : 'Perlu Dilengkapi'}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div className="text-2xl font-black text-slate-900">
                          {completionPct}%
                        </div>
                        <div className="text-xs font-bold text-slate-600">
                          <span className="text-emerald-700 font-black">{filledIndicatorsCount}</span> / {totalIndicatorsCount} indikator telah dinilai
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-3 mt-2 overflow-hidden border border-slate-300">
                        <div
                          className={`h-full transition-all duration-500 ${
                            completionPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                          }`}
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px]">
                      {unfilledIndicatorsList.length > 0 ? (
                        <span className="text-amber-800 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Perhatian: {unfilledIndicatorsList.length} indikator belum diisi pada {activeTriwulanLabel}.</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Seluruh indikator telah dinilai lengkap tanpa data defisit kosong.</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KARTU 2: RERATA CAPAIAN & PREDIKAT */}
                  <div className="dashboard-kpi dashboard-kpi-average bg-white rounded-xl border-2 border-slate-400 p-4 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-cyan-600" />
                          RERATA CAPAIAN 9 ASPEK
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 uppercase">
                          {activeTriwulanLabel}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between">
                        <div className="text-2xl font-black text-cyan-800">
                          {overallAverage !== null ? overallAverage : '-'} <span className="text-xs text-slate-500">/ 5.0</span>
                        </div>
                        <div className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white uppercase shadow-xs">
                          PREDIKAT: {overallGrade}
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-3 mt-2 overflow-hidden border border-slate-300">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-600 transition-all duration-500"
                          style={{ width: `${overallAverage !== null ? (overallAverage / 5) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="font-semibold truncate">
                        {highestAspect ? `Puncak Capaian: ${highestAspect.nama} (${highestAspect.avgScore})` : 'Data penilaian siap diinput.'}
                      </span>
                    </div>
                  </div>

                  {/* KARTU 3: RINGKASAN PERKEMBANGAN DARI TRIWULAN SEBELUMNYA */}
                  <div className="dashboard-kpi dashboard-kpi-trend bg-white rounded-xl border-2 border-slate-400 p-4 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          {prevQuarterLabel ? `PERKEMBANGAN DARI ${prevQuarterLabel}` : 'PERKEMBANGAN PERIODE'}
                        </span>
                        {prevQuarterLabel && (
                          <span className="text-[10px] font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                            {prevQuarterKey} → {activeTriwulan}
                          </span>
                        )}
                      </div>

                      {prevComparison ? (
                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-1.5">
                              <span className="text-xs font-black text-emerald-800 block">↑ {prevComparison.naikCount}</span>
                              <span className="text-[9px] font-bold text-emerald-700 uppercase">Meningkat</span>
                            </div>
                            <div className="bg-slate-100 border border-slate-300 rounded-lg p-1.5">
                              <span className="text-xs font-black text-slate-800 block">→ {prevComparison.stagnanCount}</span>
                              <span className="text-[9px] font-bold text-slate-600 uppercase">Stagnan</span>
                            </div>
                            <div className="bg-rose-50 border border-rose-300 rounded-lg p-1.5">
                              <span className="text-xs font-black text-rose-800 block">↓ {prevComparison.turunCount}</span>
                              <span className="text-[9px] font-bold text-rose-700 uppercase">Menurun</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-700 space-y-0.5 pt-1">
                            {prevComparison.highestGrowthAspect?.hasDataA && prevComparison.highestGrowthAspect.hasDataB && (
                              <div className="flex items-center justify-between font-bold text-emerald-800 truncate">
                                <span className="truncate">{prevComparison.highestGrowthAspect.nama}</span>
                                <span className="shrink-0 font-mono text-[10px] bg-emerald-100 px-1.5 rounded">
                                  {prevComparison.highestGrowthAspect.scoreA} → {prevComparison.highestGrowthAspect.scoreB} ({prevComparison.highestGrowthAspect.selisih >= 0 ? `+${prevComparison.highestGrowthAspect.selisih}` : prevComparison.highestGrowthAspect.selisih})
                                </span>
                              </div>
                            )}
                            {prevComparison.biggestDropAspect?.hasDataA && prevComparison.biggestDropAspect.hasDataB && prevComparison.biggestDropAspect.selisih < 0 && (
                              <div className="flex items-center justify-between font-bold text-rose-800 truncate">
                                <span className="truncate">{prevComparison.biggestDropAspect.nama}</span>
                                <span className="shrink-0 font-mono text-[10px] bg-rose-100 px-1.5 rounded">
                                  {prevComparison.biggestDropAspect.scoreA} → {prevComparison.biggestDropAspect.scoreB} ({prevComparison.biggestDropAspect.selisih})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                          <span className="text-xs text-slate-600 font-semibold italic block">
                            Belum tersedia data pembanding.
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            ({activeTriwulanLabel} merupakan periode awal penilaian).
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => setCurrentPage('perbandingan')}
                        className="text-[11px] font-black text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                      >
                        Lihat Analisis Detail Perbandingan <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* =================================================== */}
                {/* 3. GRID 9 ASPEK PENILAIAN (KARTU RINGKASAN)        */}
                {/* =================================================== */}
                <div className="dashboard-aspects-panel bg-white rounded-2xl border-2 border-slate-400 p-4 sm:p-5 shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wider">
                        RINGKASAN 9 DIMENSI PENILAIAN ({activeTriwulanLabel})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Klik pada kartu aspek untuk membuka lembar penilaian detail pada periode {activeTriwulanLabel}.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                      9 Dimensi Terpantau
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {aspectMetricsList.map((asp) => {
                      return (
                        <div
                          key={`card-aspek-${asp.id}`}
                          onClick={() => handleSelectAspectSubmenu(activeTriwulan, asp.id)}
                          className="dashboard-aspect-card rounded-xl border-2 border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-white p-3.5 shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-6 h-6 rounded-lg text-black font-black text-xs flex items-center justify-center shadow-xs border border-black/20"
                                  style={{ backgroundColor: asp.colorBg }}
                                >
                                  {asp.no}
                                </span>
                                <div>
                                  <h4 className="text-xs font-black uppercase text-slate-900 group-hover:text-blue-700 transition tracking-wide">
                                    {asp.nama}
                                  </h4>
                                  <span className="text-[10px] text-slate-500 font-semibold block truncate max-w-[160px]">
                                    {asp.kategori}
                                  </span>
                                </div>
                              </div>

                              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                                asp.grade === 'Exceptional' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                                asp.grade === 'A' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                                asp.grade === 'B' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                asp.grade === 'C' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                asp.grade === 'Defisit' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                                'bg-slate-200 text-slate-600'
                              }`}>
                                {asp.grade}
                              </span>
                            </div>

                            {/* Nilai / Rata-rata Aspek */}
                            <div className="mt-3 flex items-baseline justify-between">
                              <div className="text-xl font-black text-slate-900">
                                {asp.avgScore !== null ? asp.avgScore : <span className="text-xs font-bold text-slate-400 italic">Belum Dinilai</span>}
                                {asp.avgScore !== null && <span className="text-xs text-slate-500 font-normal"> / 5.0</span>}
                              </div>

                              {asp.compItem && asp.compItem.hasDataA && asp.compItem.hasDataB && (
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  asp.compItem.selisih > 0 ? 'bg-emerald-100 text-emerald-800' :
                                  asp.compItem.selisih < 0 ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {asp.compItem.selisih >= 0 ? `+${asp.compItem.selisih}` : asp.compItem.selisih} {asp.compItem.statusSymbol}
                                </span>
                              )}
                            </div>

                            {/* Progress bar sederhana */}
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${asp.progressPct}%`,
                                  backgroundColor: asp.colorBorder || '#00a2ed'
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{asp.aspFilled} dari {asp.aspTotal} indikator terisi</span>
                            <span className="font-bold text-blue-700 group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                              Buka Form →
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* =================================================== */}
                {/* 4. PREVIEW RADAR / SPIDER CHART + PERHATIAN/SARAN   */}
                {/* =================================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* PREVIEW RADAR / SPIDER CHART */}
                  <div className="dashboard-detail-card dashboard-radar-card bg-white rounded-2xl border-2 border-slate-400 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Radar className="w-5 h-5 text-teal-600" />
                          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                            PREVIEW SPIDER CHART ({activeTriwulanLabel})
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentPage('to_print_page');
                            setReportViewMode('spider_chart');
                          }}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow transition cursor-pointer"
                        >
                          <span>LIHAT DETAIL</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Radar SVG Mini Preview */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
                        <div className="relative w-56 h-56 sm:w-60 sm:h-60 shrink-0">
                          <svg viewBox="0 0 260 260" className="w-full h-full">
                            {/* Grid Polygon Rings */}
                            {radarGridPolygons.map((pts, i) => (
                              <polygon
                                key={`radar-grid-${i}`}
                                points={pts}
                                fill={i === 4 ? '#f8fafc' : 'none'}
                                stroke="#cbd5e1"
                                strokeWidth="1"
                                strokeDasharray={i === 4 ? 'none' : '2,2'}
                              />
                            ))}

                            {/* Axis Lines */}
                            {radarDataPoints.map((p, i) => {
                              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
                              return (
                                <line
                                  key={`radar-axis-${i}`}
                                  x1={CX}
                                  y1={CY}
                                  x2={(CX + R * Math.cos(angle)).toFixed(1)}
                                  y2={(CY + R * Math.sin(angle)).toFixed(1)}
                                  stroke="#cbd5e1"
                                  strokeWidth="1"
                                />
                              );
                            })}

                            {/* Polygon Capaian Siswa Aktual */}
                            <polygon
                              points={radarPolygonPointsStr}
                              fill="#0d9488"
                              fillOpacity="0.35"
                              stroke="#0d9488"
                              strokeWidth="2.5"
                            />

                            {/* Titik Vertex */}
                            {radarDataPoints.map((p, i) => (
                              <circle
                                key={`radar-dot-${i}`}
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="#0f766e"
                                stroke="#ffffff"
                                strokeWidth="1.5"
                              />
                            ))}

                            {/* Label Kode Aspek */}
                            {radarDataPoints.map((p, i) => (
                              <text
                                key={`radar-lbl-${i}`}
                                x={p.labelX}
                                y={p.labelY}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="9"
                                fontWeight="bold"
                                fill="#334155"
                              >
                                {p.kode}
                              </text>
                            ))}
                          </svg>
                        </div>

                        {/* Ringkasan Skor Radar */}
                        <div className="space-y-2 text-xs flex-1">
                          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                            <span className="text-[10px] font-black text-teal-800 uppercase block">
                              Indeks Capaian Rerata
                            </span>
                            <div className="text-xl font-black text-teal-900 my-0.5">
                              {overallAverage !== null ? overallAverage : '-'} / 5.0
                            </div>
                            <span className="text-[10px] font-bold text-teal-700">
                              Predikat: {overallGrade}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Dimensi Tertinggi:</span>
                              <span className="font-bold text-emerald-700">{highestAspect ? `${highestAspect.nama} (${highestAspect.avgScore})` : '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Dimensi Terendah:</span>
                              <span className="font-bold text-rose-700">{lowestAspect ? `${lowestAspect.nama} (${lowestAspect.avgScore})` : '-'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span>*Menampilkan grafik radar 9 dimensi periode {activeTriwulanLabel}</span>
                      <span className="font-bold text-teal-700 cursor-pointer" onClick={() => { setCurrentPage('to_print_page'); setReportViewMode('spider_chart'); }}>Buka Halaman Lengkap →</span>
                    </div>
                  </div>

                  {/* BAGIAN PERHATIAN & REKOMENDASI */}
                  <div className="dashboard-detail-card dashboard-recommendations-card bg-white rounded-2xl border-2 border-slate-400 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                            PERHATIAN & REKOMENDASI PRIORITAS
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                          {activeTriwulanLabel}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2.5 text-xs">
                        {/* 1. Aspek Terendah */}
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                          <span className="p-1 rounded bg-rose-200 text-rose-900 font-bold text-xs shrink-0">📉</span>
                          <div>
                            <span className="font-black text-rose-900 uppercase block text-[11px]">
                              Aspek Perlu Stimulasi (Skor Terendah):
                            </span>
                            <p className="text-slate-700 text-[11px] mt-0.5">
                              {lowestAspect ? (
                                <>Dimensi <strong className="text-rose-900">{lowestAspect.nama}</strong> memiliki skor {lowestAspect.avgScore} / 5.0 (Predikat: {lowestAspect.grade}). {lowestAspect.saranKelemahan}</>
                              ) : 'Belum ada data skor yang diinput.'}
                            </p>
                          </div>
                        </div>

                        {/* 2. Aspek Kenaikan Terbesar */}
                        {prevComparison?.highestGrowthAspect?.hasDataA && prevComparison.highestGrowthAspect.hasDataB && prevComparison.highestGrowthAspect.selisih > 0 && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                            <span className="p-1 rounded bg-emerald-200 text-emerald-900 font-bold text-xs shrink-0">📈</span>
                            <div>
                              <span className="font-black text-emerald-900 uppercase block text-[11px]">
                                Aspek dengan Kenaikan Terbesar:
                              </span>
                              <p className="text-slate-700 text-[11px] mt-0.5">
                                Dimensi <strong className="text-emerald-900">{prevComparison.highestGrowthAspect.nama}</strong> meningkat signifikan dari {prevComparison.highestGrowthAspect.scoreA} menjadi {prevComparison.highestGrowthAspect.scoreB} (+{prevComparison.highestGrowthAspect.selisih}).
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 3. Aspek Penurunan Terbesar */}
                        {prevComparison?.biggestDropAspect?.hasDataA && prevComparison.biggestDropAspect.hasDataB && prevComparison.biggestDropAspect.selisih < 0 && (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                            <span className="p-1 rounded bg-amber-200 text-amber-900 font-bold text-xs shrink-0">⚠️</span>
                            <div>
                              <span className="font-black text-amber-900 uppercase block text-[11px]">
                                Aspek dengan Penurunan Capaian:
                              </span>
                              <p className="text-slate-700 text-[11px] mt-0.5">
                                Dimensi <strong className="text-amber-900">{prevComparison.biggestDropAspect.nama}</strong> mengalami penurunan dari {prevComparison.biggestDropAspect.scoreA} ke {prevComparison.biggestDropAspect.scoreB} ({prevComparison.biggestDropAspect.selisih}). Disarankan penguatan pembiasaan.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 4. Indikator Belum Dinilai */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                          <span className="p-1 rounded bg-slate-200 text-slate-800 font-bold text-xs shrink-0">📝</span>
                          <div className="flex-1">
                            <span className="font-black text-slate-800 uppercase block text-[11px]">
                              Status Pengisian Indikator:
                            </span>
                            {unfilledIndicatorsList.length > 0 ? (
                              <div>
                                <p className="text-slate-600 text-[11px] mt-0.5">
                                  Terdapat <strong>{unfilledIndicatorsList.length} indikator</strong> yang belum dinilai pada {activeTriwulanLabel}:
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {unfilledIndicatorsList.slice(0, 6).map((un, i) => (
                                    <span
                                      key={`unf-${i}`}
                                      onClick={() => handleSelectAspectSubmenu(activeTriwulan, un.aspectId)}
                                      className="text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-200"
                                      title={`Klik untuk mengisi nilai ${un.aspectName} - ${un.indName}`}
                                    >
                                      {un.aspectName}: {un.indName}
                                    </span>
                                  ))}
                                  {unfilledIndicatorsList.length > 6 && (
                                    <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                                      +{unfilledIndicatorsList.length - 6} lainnya
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-emerald-700 font-bold text-[11px] mt-0.5">
                                Seluruh 32 indikator telah dinilai secara lengkap. Data siap dicetak ke rapor resmi.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span>Rekomendasi otomatis berbasis data aktual</span>
                      <span className="font-bold text-blue-700 cursor-pointer" onClick={() => setCurrentPage('database')}>Kelola Master Data →</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ======================================================= */}
          {/* TAB 1: KOGNITIF (6 SUB-KOLOM DENGAN KUNING)             */}
          {/* ======================================================= */}
          {currentPage === 'kognitif' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-3 sm:p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                    <ChevronLeft className="w-4 h-4" /> HOME
                  </button>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                    TABEL PENILAIAN KOGNITIF KELAS IV
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="Cari Siswa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-1 text-xs border rounded-lg" />
                  <button onClick={() => window.print()} className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Printer className="w-3.5 h-3.5" /> Cetak</button>
                </div>
              </div>

              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={6} className="border-r border-black p-1.5 bg-[#ffff00] text-black text-xs font-black uppercase">KOGNITIF</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-[#ffff00]">Rentang Perhatian (RP)(kefokusan menerima pembelajaran)</th>
                      <th className="border-r border-black p-2 bg-white">Pemahaman Instruksi (PI)(Memahami instruksi / penjelasan yang diberikan)</th>
                      <th className="border-r border-black p-2 bg-[#ffff00]">Rentang Memori (RM)(Menghapal / mengingat informasi)</th>
                      <th className="border-r border-black p-2 bg-white">Pemecahan Masalah (PM)(Kemampuan memecahkan kasus / permasalahan)</th>
                      <th className="border-r border-black p-2 bg-[#ffff00]">Berpikir kritis (KR)(Memeriksa, meneliti, mengamati secara jeli)</th>
                      <th className="border-r border-black p-2 bg-white">Kreativitas / Inovasi (KI)(Memunculkan ide / gagasan baru, imajinasi)</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Ketekunan Memperhatikan</th>
                      <th className="border-r border-black p-1.5">Pemahaman Petunjuk Belajar</th>
                      <th className="border-r border-black p-1.5">Daya Ingat & Pemahaman</th>
                      <th className="border-r border-black p-1.5">Kemampuan Menyelesaikan Tantangan</th>
                      <th className="border-r border-black p-1.5">Ketelitian & Kritis Berpikir</th>
                      <th className="border-r border-black p-1.5">Kreativitas & Ide Baru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        {(['rp', 'pi', 'rm', 'pm', 'kr', 'ki'] as const).map((k, i) => (
                          <td key={k} className={`border-r border-black p-1 text-center ${i % 2 === 0 ? 'bg-yellow-50/50' : 'bg-white'}`}>
                            <select
                              value={siswa.kognitif[k]}
                              onChange={(e) => updateStudentField(siswa.no, 'kognitif', k, e.target.value)}
                              className="w-full text-center text-xs p-1 font-semibold border rounded bg-white"
                            >
                              <option value="">--</option>
                              {PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                        ))}
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'kognitif')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: AFEKTIF (5 SUB-KOLOM DENGAN BIRU TUA)            */}
          {/* ======================================================= */}
          {currentPage === 'afektif' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                    <ChevronLeft className="w-4 h-4" /> HOME
                  </button>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                    TABEL PENILAIAN AFEKTIF KELAS IV
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={5} className="border-r border-black p-1.5 bg-[#4f81bd] text-white text-xs font-black uppercase">AFEKTIF</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-[#4f81bd] text-white">Empati (EM)(Kemampuan memahami perasaan orang lain)</th>
                      <th className="border-r border-black p-2 bg-white">Suasana Hati (SH)(Kemampuan menjaga stabilitas suasana hati)</th>
                      <th className="border-r border-black p-2 bg-[#4f81bd] text-white">Motivasi (MO)(Terjaga semangatnya di setiap situasi)</th>
                      <th className="border-r border-black p-2 bg-white">Kesabaran (KS)(Menjaga diri dari emosi yang meledak-ledak)</th>
                      <th className="border-r border-black p-2 bg-[#4f81bd] text-white">Ketangguhan (KT)(Mampu bangkit dari kegagalan / kesedihan)</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Kepedulian Terhadap Sesama</th>
                      <th className="border-r border-black p-1.5">Pengelolaan Suasana Hati</th>
                      <th className="border-r border-black p-1.5">Semangat Belajar</th>
                      <th className="border-r border-black p-1.5">Pengendalian Emosi</th>
                      <th className="border-r border-black p-1.5">Ketangguhan & Pantang Menyerah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        {(['em', 'sh', 'mo', 'ks', 'kt'] as const).map((k, i) => (
                          <td key={k} className={`border-r border-black p-1 text-center ${i % 2 === 0 ? 'bg-[#dce6f1]' : 'bg-white'}`}>
                            <select
                              value={siswa.afektif[k]}
                              onChange={(e) => updateStudentField(siswa.no, 'afektif', k, e.target.value)}
                              className="w-full text-center text-xs p-1 font-semibold border rounded bg-white"
                            >
                              <option value="">--</option>
                              {PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                        ))}
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'afektif')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: PSIKOMOTOR (4 SUB-KOLOM DENGAN COKLAT SALMON)     */}
          {/* ======================================================= */}
          {currentPage === 'psikomotor' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                  <ChevronLeft className="w-4 h-4" /> HOME
                </button>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">TABEL PENILAIAN PSIKOMOTOR KELAS IV</h2>
              </div>
              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={4} className="border-r border-black p-1.5 bg-[#f2f2f2] text-slate-900 text-xs font-black uppercase">PSIKOMOTOR</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-white">Motorik Kasar (MK)(Keseimbangan, melompat, berlari)</th>
                      <th className="border-r border-black p-2 bg-[#b85450] text-white">Motorik Halus (MH)(Menggambar sesuai pola, menulis rapi)</th>
                      <th className="border-r border-black p-2 bg-white">Perilaku Repetitif (RE)(Mengendalikan diri dari perilaku berulang yang tidak perlu)</th>
                      <th className="border-r border-black p-2 bg-[#b85450] text-white">Keterampilan / Keluwesan (KK)(Kemampuan dalam menggunakan fisik / peralatan di sekitarnya)</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Koordinasi Gerak Tubuh</th>
                      <th className="border-r border-black p-1.5">Keterampilan Tangan</th>
                      <th className="border-r border-black p-1.5">Pengendalian Diri</th>
                      <th className="border-r border-black p-1.5">Keluwesan Penggunaan Alat Belajar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.psikomotor.mk} onChange={(e) => updateStudentField(siswa.no, 'psikomotor', 'mk', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-[#f7e6e5]">
                          <select value={siswa.psikomotor.mh} onChange={(e) => updateStudentField(siswa.no, 'psikomotor', 'mh', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.psikomotor.re} onChange={(e) => updateStudentField(siswa.no, 'psikomotor', 're', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-[#f7e6e5]">
                          <select value={siswa.psikomotor.kk} onChange={(e) => updateStudentField(siswa.no, 'psikomotor', 'kk', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'psikomotor')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 4: SOSIAL (4 SUB-KOLOM PERSIS FORM PERTAMA)         */}
          {/* ======================================================= */}
          {currentPage === 'sosial' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                  <ChevronLeft className="w-4 h-4" /> HOME
                </button>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">TABEL PENILAIAN SOSIAL KELAS IV</h2>
              </div>
              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b-2 border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={4} className="border-r border-black p-1.5 bg-amber-100 text-slate-900 text-xs font-black uppercase">SOSIAL</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2">Otoritas (OT)(Kemampuan dalam mengikuti tata tertib / peraturan kelompok yang disepakati)</th>
                      <th className="border-r border-black p-2">Kepemimpinan (LD)(Kemampuan mempengaruhi dan mengarahkan oranglain)</th>
                      <th className="border-r border-black p-2">Altruisme (AT)(Memiliki kepedulian untuk membantu secara tulus)</th>
                      <th className="border-r border-black p-2">Komunikasi (KO)(Kemampuan menyampaikan ide dan gagasan kepada orang lain sampai paham)</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Kepatuhan Pada Kesepakatan Bersama</th>
                      <th className="border-r border-black p-1.5">Kemampuan Mengarahkan & Memimpin</th>
                      <th className="border-r border-black p-1.5">Ketulusan Membantu Sesama</th>
                      <th className="border-r border-black p-1.5">Kemampuan Menyampaikan Gagasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        {(['ot', 'ld', 'at', 'ko'] as const).map((k) => (
                          <td key={k} className="border-r border-black p-1 text-center">
                            <select value={siswa.sosial[k]} onChange={(e) => updateStudentField(siswa.no, 'sosial', k, e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                              <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </td>
                        ))}
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'sosial')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 5: ISLAMIC LITERACY (3 SUB-KOLOM DENGAN UNGU)       */}
          {/* ======================================================= */}
          {currentPage === 'islamic_literacy' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                  <ChevronLeft className="w-4 h-4" /> HOME
                </button>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">TABEL PENILAIAN ISLAMIC LITERACY KELAS IV</h2>
              </div>
              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={3} className="border-r border-black p-1.5 bg-[#60497a] text-white text-xs font-black uppercase">ISLAMIC LITERACY</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-white">Kecintaan kepada Al Qur'an (AQ)(Menunjukan sikap & perilaku yang mencintai Al Qur'an)</th>
                      <th className="border-r border-black p-2 bg-[#60497a] text-white">Akhlak Terpuji (AK)(Menunjukkan kesediaan untuk menunjukkan akhlak yang terpuji)</th>
                      <th className="border-r border-black p-2 bg-white">Semangat Beribadah (IB)(Menunjukkan antusiasme dan semangat dalam beribadah & berdoa)</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Kecintaan Terhadap Al-Qur'an</th>
                      <th className="border-r border-black p-1.5">Perilaku & Akhlak Mulia</th>
                      <th className="border-r border-black p-1.5">Antusiasme Beribadah & Berdoa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.islamicLiteracy.aq} onChange={(e) => updateStudentField(siswa.no, 'islamicLiteracy', 'aq', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-[#e4dfec]">
                          <select value={siswa.islamicLiteracy.ak} onChange={(e) => updateStudentField(siswa.no, 'islamicLiteracy', 'ak', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.islamicLiteracy.ib} onChange={(e) => updateStudentField(siswa.no, 'islamicLiteracy', 'ib', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'islamicLiteracy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 6: BILINGUAL (2 SUB-KOLOM DENGAN TEAL/CYAN)         */}
          {/* ======================================================= */}
          {currentPage === 'bilingual' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                  <ChevronLeft className="w-4 h-4" /> HOME
                </button>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">TABEL PENILAIAN BILINGUAL KELAS IV</h2>
              </div>
              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={2} className="border-r border-black p-1.5 bg-[#31869b] text-white text-xs font-black uppercase">BILINGUAL</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-[#31869b] text-white">Kepercayaan Diri (KD)(Menunjukkan kepercayaan diri untuk menggunakan dwi-bahasa dalam keseharian)</th>
                      <th className="border-r border-black p-2 bg-white">Semangat Belajar (SB)(Menunjukkan semangat mempelajari hal baru terkait dengan aktivitas dwi-bahasa)</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Keberanian Berkomunikasi Dwi-Bahasa</th>
                      <th className="border-r border-black p-1.5">Semangat Eksplorasi Bahasa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        <td className="border-r border-black p-1 text-center bg-[#b7dde8]">
                          <select value={siswa.bilingual.kd} onChange={(e) => updateStudentField(siswa.no, 'bilingual', 'kd', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.bilingual.sb} onChange={(e) => updateStudentField(siswa.no, 'bilingual', 'sb', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'bilingual')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 7: TALENTS (2 SUB-KOLOM DENGAN ORANYE)              */}
          {/* ======================================================= */}
          {currentPage === 'talents' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                  <ChevronLeft className="w-4 h-4" /> HOME
                </button>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">TABEL PENILAIAN TALENTS KELAS IV</h2>
              </div>
              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={2} className="border-r border-black p-1.5 bg-[#f79646] text-black text-xs font-black uppercase">TALENTS</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-[#f79646]">Keunikan (UQ)(Memiliki kekhasan secara pribadi yang positif dan mewarnai lingkungan)</th>
                      <th className="border-r border-black p-2 bg-white">Ketertarikan / Hobi (IN)Telah memiliki ketertarikan / hobi yang positif</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Karakter Unik & Positif</th>
                      <th className="border-r border-black p-1.5">Ketertarikan & Minat Positif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        <td className="border-r border-black p-1 text-center bg-[#fcd5b5]">
                          <select value={siswa.talents.uq} onChange={(e) => updateStudentField(siswa.no, 'talents', 'uq', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.talents.in} onChange={(e) => updateStudentField(siswa.no, 'talents', 'in', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'talents')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 8: EXPERIENCE (3 SUB-KOLOM DENGAN BIRU MUDA AIR)    */}
          {/* ======================================================= */}
          {currentPage === 'experience' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                  <ChevronLeft className="w-4 h-4" /> HOME
                </button>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">TABEL PENILAIAN EXPERIENCE KELAS IV</h2>
              </div>
              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={3} className="border-r border-black p-1.5 bg-[#b7dde8] text-black text-xs font-black uppercase">EXPERIENCE</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-[#dbeef3]">Eksplorasi (EX)(Menunjukkan ketertarikan untuk mencoba hal baru)</th>
                      <th className="border-r border-black p-2 bg-white">Observatif (OB)(Menujukkan kejelian saat mengobservasi / mengamati sebuah peristiwa)</th>
                      <th className="border-r border-black p-2 bg-[#dbeef3]">Refleksi (RE)(memiliki kemampuan untuk mengambil kesimpulan dari sebuah kejadian)</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Keberanian Mencoba Hal Baru</th>
                      <th className="border-r border-black p-1.5">Kemampuan Mengamati</th>
                      <th className="border-r border-black p-1.5">Kemampuan Mengambil Sebuah Pelajaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        <td className="border-r border-black p-1 text-center bg-[#dbeef3]">
                          <select value={siswa.experience.ex} onChange={(e) => updateStudentField(siswa.no, 'experience', 'ex', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.experience.ob} onChange={(e) => updateStudentField(siswa.no, 'experience', 'ob', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-[#dbeef3]">
                          <select value={siswa.experience.re} onChange={(e) => updateStudentField(siswa.no, 'experience', 're', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'experience')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 9: INKLUSIVITAS (3 SUB-KOLOM DENGAN HIJAU MUDA)     */}
          {/* ======================================================= */}
          {currentPage === 'inklusivitas' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <button onClick={() => setCurrentPage('home')} className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                  <ChevronLeft className="w-4 h-4" /> HOME
                </button>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">TABEL PENILAIAN INKLUSIVITAS KELAS IV</h2>
              </div>
              <div className="overflow-x-auto border-2 border-black rounded-lg">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-bold border-b border-black text-center">
                      <th rowSpan={3} className="border-r border-black p-2 w-10">NO</th>
                      <th rowSpan={3} className="border-r border-black p-2 min-w-[200px] text-center">NAMA</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">NIS</th>
                      <th rowSpan={3} className="border-r border-black p-2 w-24 text-center">KELAS</th>
                      <th colSpan={3} className="border-r border-black p-1.5 bg-[#c4d79b] text-black text-xs font-black uppercase">INKLUSIVITAS</th>
                      <th rowSpan={3} className="p-2 min-w-[240px] text-center font-bold">Deskripsi</th>
                    </tr>
                    <tr className="text-[11px] border-b border-black text-center font-normal">
                      <th className="border-r border-black p-2 bg-white">Solidaritas (SO)Memiliki kepedulian terhadap teman yang membutuhkan bantuan, tak segan berbagi</th>
                      <th className="border-r border-black p-2 bg-[#c4d79b]">Keadilan (FA)(Memperlakukan teman dengan adil tanpa membeda-bedakan)</th>
                      <th className="border-r border-black p-2 bg-white">Penghormatan (PH)Respek terhadap orang lain, tidak melakukan bullying / shaming atas kekurangan teman</th>
                    </tr>
                    <tr className="bg-[#ff0000] text-white text-[11px] font-bold italic border-b-2 border-black text-center">
                      <th className="border-r border-black p-1.5">Kepedulian & Sikap Saling Berbagi</th>
                      <th className="border-r border-black p-1.5">Sikap Adil & Merangkul Teman</th>
                      <th className="border-r border-black p-1.5">Sikap Saling Menghargai & Respek Terhadap Sesama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => (
                      <tr key={siswa.no} className="hover:bg-amber-50/50">
                        <td className="border-r border-black p-2 text-center font-bold">{siswa.no}</td>
                        <td className="border-r border-black p-2 font-bold text-slate-900">{siswa.nama}</td>
                        <td className="border-r border-black p-2 text-center font-mono">{siswa.nis}</td>
                        <td className="border-r border-black p-2 text-center">{siswa.kelas}</td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.inklusivitas.so} onChange={(e) => updateStudentField(siswa.no, 'inklusivitas', 'so', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-[#ebf1de]">
                          <select value={siswa.inklusivitas.fa} onChange={(e) => updateStudentField(siswa.no, 'inklusivitas', 'fa', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="border-r border-black p-1 text-center bg-white">
                          <select value={siswa.inklusivitas.ph} onChange={(e) => updateStudentField(siswa.no, 'inklusivitas', 'ph', e.target.value)} className="w-full text-center text-xs p-1 font-semibold border rounded bg-white">
                            <option value="">--</option>{PILIHAN_PREDIKAT.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td className="p-1">
                          {renderAspectDescriptionEditor(siswa, 'inklusivitas')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 10: DATABASE SISWA + DETAIL RAPORT (PERSIS EXCEL)  */}
          {/* ======================================================= */}
          {currentPage === 'database' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage('home')}
                    className="px-4 py-2 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <ChevronLeft className="w-4 h-4" /> HOME
                  </button>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      DATABASE PESERTA DIDIK & IDENTITAS RAPOR
                    </h2>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      Impor Excel .xlsx: kolom NAMA dan NIS wajib; NO, KELAS, dan TAHUN AJARAN opsional. Data nilai siswa yang sudah ada tetap tersimpan.
                    </p>
                  </div>
                </div>

                {currentUser?.role !== 'orangtua' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const nextNo = masterStudents.length + 1;
                        const newS: StudentRecord = {
                          no: nextNo,
                          nama: `NAMA SISWA BARU ${nextNo}`,
                          nis: `2023400${String(nextNo).padStart(2, '0')}`,
                          kelas: 'IV (Empat)',
                          tahunAjaran: '2026/2027',
                          triwulan: {
                            T1: createEmptyAssessmentRecord(),
                            T2: createEmptyAssessmentRecord(),
                            T3: createEmptyAssessmentRecord(),
                            T4: createEmptyAssessmentRecord()
                          }
                        };
                        const updated = [...masterStudents, newS];
                        setMasterStudents(updated);
                        saveStudentsToFirebase(updated, `Siswa baru "${newS.nama}" berhasil ditambahkan ke Firebase!`);
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      + Tambah Siswa
                    </button>
                    <input
                      ref={studentImportInputRef}
                      type="file"
                      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleStudentExcelImport}
                      className="hidden"
                    />
                    <button
                      onClick={handleDownloadStudentTemplate}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                      title="Unduh template Excel dengan header database siswa"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Template Excel
                    </button>
                    <button
                      onClick={() => studentImportInputRef.current?.click()}
                      disabled={isFirebaseSyncing}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer disabled:opacity-50"
                      title="Impor identitas siswa dari file Excel .xlsx"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Impor Excel
                    </button>

                    <button
                      onClick={() => saveStudentsToFirebase(masterStudents, 'Seluruh data siswa berhasil disinkronkan ke Firebase Realtime Database.')}
                      disabled={isFirebaseSyncing}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer transition disabled:opacity-50"
                      title="Simpan perubahan tabel data siswa ke Firebase Realtime Database"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isFirebaseSyncing ? 'Menyimpan...' : 'Simpan Data Siswa ke RTDB'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteStudents(selectedStudentNos)}
                      disabled={selectedStudentNos.length === 0 || isFirebaseSyncing}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Hapus siswa yang dicentang beserta seluruh nilai dan rapornya"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Terpilih ({selectedStudentNos.length})
                    </button>
                    <button
                      onClick={() => handleDeleteStudents(masterStudents.map((student) => student.no), true)}
                      disabled={masterStudents.length === 0 || isFirebaseSyncing}
                      className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Hapus seluruh siswa beserta semua nilai dan rapornya"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Semua
                    </button>
                  </div>
                )}
                {currentUser?.role === 'orangtua' && (
                  <div className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <span>🔒</span> Mode Tinjau (Read-Only Orang Tua: Data Ananda)
                  </div>
                )}
              </div>

              {/* TAMPILAN SIDE-BY-SIDE: TABEL SISWA DI KIRI & 4 KOTAK DETAIL RAPOR DI KANAN */}
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* SISI KIRI: TABEL SISWA (NO, NAMA, NIS, KELAS) */}
                <div className="flex-1 w-full overflow-x-auto border-2 border-black rounded-lg">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#d9d9d9] font-black border-b-2 border-black text-center uppercase tracking-wide">
                      <tr>
                        <th className="p-2.5 w-16 border-r border-black">
                          {currentUser?.role !== 'orangtua' ? (
                            <label className="flex items-center justify-center gap-1.5">
                              <input
                                type="checkbox"
                                aria-label="Pilih semua siswa"
                                checked={masterStudents.length > 0 && selectedStudentNos.length === masterStudents.length}
                                onChange={(event) => setSelectedStudentNos(
                                  event.target.checked ? masterStudents.map((student) => student.no) : []
                                )}
                              />
                              <span>NO</span>
                            </label>
                          ) : 'NO'}
                        </th>
                        <th className="p-2.5 border-r border-black text-center min-w-[200px]">NAMA</th>
                        <th className="p-2.5 w-32 border-r border-black text-center">NIS</th>
                        <th className="p-2.5 w-32 border-r border-black text-center">KELAS</th>
                        <th className="p-2.5 w-16 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {dataSiswa.map((s) => (
                        <tr key={s.no} className="hover:bg-amber-50/60 transition">
                          {/* NO */}
                          <td className="p-2 text-center font-bold border-r border-black bg-white">
                            {currentUser?.role !== 'orangtua' ? (
                              <label className="flex items-center justify-center gap-1.5">
                                <input
                                  type="checkbox"
                                  aria-label={`Pilih ${s.nama}`}
                                  checked={selectedStudentNos.includes(s.no)}
                                  onChange={(event) => setSelectedStudentNos((previous) => (
                                    event.target.checked
                                      ? [...previous, s.no]
                                      : previous.filter((no) => no !== s.no)
                                  ))}
                                />
                                {s.no}
                              </label>
                            ) : s.no}
                          </td>

                          {/* NAMA (EDITABLE) */}
                          <td className="p-1 border-r border-black">
                            <input
                              type="text"
                              value={s.nama}
                              readOnly={currentUser?.role === 'orangtua'}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setMasterStudents((prev: StudentRecord[]) =>
                                  prev.map((item: StudentRecord) => (item.no === s.no ? { ...item, nama: val } : item))
                                );
                              }}
                              className={`w-full font-bold text-xs px-2 py-1 rounded text-slate-900 ${
                                currentUser?.role === 'orangtua'
                                  ? 'bg-transparent border-transparent cursor-default'
                                  : 'bg-white hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 focus:outline-none'
                              }`}
                            />
                          </td>

                          {/* NIS (EDITABLE) */}
                          <td className="p-1 border-r border-black text-center">
                            <input
                              type="text"
                              value={s.nis}
                              readOnly={currentUser?.role === 'orangtua'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMasterStudents((prev: StudentRecord[]) =>
                                  prev.map((item: StudentRecord) => (item.no === s.no ? { ...item, nis: val } : item))
                                );
                              }}
                              className={`w-full font-mono text-center font-medium text-xs px-2 py-1 rounded ${
                                currentUser?.role === 'orangtua'
                                  ? 'bg-transparent border-transparent cursor-default'
                                  : 'bg-white hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 focus:outline-none'
                              }`}
                            />
                          </td>

                          {/* KELAS (EDITABLE) */}
                          <td className="p-1 border-r border-black text-center">
                            <input
                              type="text"
                              value={s.kelas}
                              readOnly={currentUser?.role === 'orangtua'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMasterStudents((prev: StudentRecord[]) =>
                                  prev.map((item: StudentRecord) => (item.no === s.no ? { ...item, kelas: val } : item))
                                );
                              }}
                              className={`w-full text-center text-xs px-2 py-1 rounded ${
                                currentUser?.role === 'orangtua'
                                  ? 'bg-transparent border-transparent cursor-default'
                                  : 'bg-white hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 focus:outline-none'
                              }`}
                            />
                          </td>

                          {/* AKSI HAPUS */}
                          <td className="p-1 text-center">
                            {currentUser?.role !== 'orangtua' ? (
                              <button
                                onClick={() => handleDeleteStudents([s.no])}
                                disabled={isFirebaseSyncing}
                                className="px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                title="Hapus Siswa ini"
                              >
                                ✕
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {dataSiswa.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-sm font-semibold text-slate-500">
                            Database siswa kosong. Tambahkan siswa baru atau impor dari Excel.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* SISI KANAN: 4 KOTAK DETAIL HASIL CETAK RAPORT PERSIS GAMBAR */}
                <div className="w-full lg:w-[420px] shrink-0 space-y-5">
                  {/* KOTAK 1: TANGGAL RAPORT */}
                  <div className="border-2 border-black rounded shadow-sm overflow-hidden">
                    <div className="bg-[#d9d9d9] border-b-2 border-black p-1.5 text-center font-black text-xs uppercase tracking-wider">
                      TANGGAL RAPORT
                    </div>
                    <div className="bg-[#00a2ed] p-1.5 border-none">
                      <input
                        type="text"
                        value={metaRapor.tanggalRaport}
                        onChange={(e) => setMetaRapor({ ...metaRapor, tanggalRaport: e.target.value })}
                        className="w-full text-center font-bold text-xs text-black bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* KOTAK 2: KEPALA SEKOLAH */}
                  <div className="border-2 border-black rounded shadow-sm overflow-hidden">
                    <div className="bg-[#d9d9d9] border-b-2 border-black p-1.5 text-center font-black text-xs uppercase tracking-wider">
                      KEPALA SEKOLAH
                    </div>
                    <div className="divide-y border-black">
                      <div className="flex bg-[#00a2ed]">
                        <span className="w-20 border-r-2 border-black p-1.5 text-center font-bold text-xs uppercase text-black">
                          NAMA
                        </span>
                        <input
                          type="text"
                          value={metaRapor.kepalaSekolah.nama}
                          onChange={(e) =>
                            setMetaRapor({
                              ...metaRapor,
                              kepalaSekolah: { ...metaRapor.kepalaSekolah, nama: e.target.value }
                            })
                          }
                          className="flex-1 font-bold text-xs px-3 py-1.5 text-black bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="flex bg-[#00a2ed]">
                        <span className="w-20 border-r-2 border-black p-1.5 text-center font-bold text-xs uppercase text-black">
                          NIY
                        </span>
                        <input
                          type="text"
                          value={metaRapor.kepalaSekolah.niy}
                          onChange={(e) =>
                            setMetaRapor({
                              ...metaRapor,
                              kepalaSekolah: { ...metaRapor.kepalaSekolah, niy: e.target.value }
                            })
                          }
                          className="flex-1 font-mono font-medium text-xs px-3 py-1.5 text-black bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KOTAK 3: NAMA GURU KELAS */}
                  <div className="border-2 border-black rounded shadow-sm overflow-hidden">
                    <div className="bg-[#d9d9d9] border-b-2 border-black p-1.5 text-center font-black text-xs uppercase tracking-wider">
                      NAMA GURU KELAS
                    </div>
                    <div className="divide-y border-black">
                      <div className="flex bg-[#00a2ed]">
                        <span className="w-20 border-r-2 border-black p-1.5 text-center font-bold text-xs uppercase text-black">
                          NAMA
                        </span>
                        <input
                          type="text"
                          value={metaRapor.guruKelas.nama}
                          onChange={(e) =>
                            setMetaRapor({
                              ...metaRapor,
                              guruKelas: { ...metaRapor.guruKelas, nama: e.target.value }
                            })
                          }
                          className="flex-1 font-bold text-xs px-3 py-1.5 text-black bg-transparent focus:outline-none"
                        />
                      </div>
                      <div className="flex bg-[#00a2ed]">
                        <span className="w-20 border-r-2 border-black p-1.5 text-center font-bold text-xs uppercase text-black">
                          NIY
                        </span>
                        <input
                          type="text"
                          value={metaRapor.guruKelas.niy}
                          onChange={(e) =>
                            setMetaRapor({
                              ...metaRapor,
                              guruKelas: { ...metaRapor.guruKelas, niy: e.target.value }
                            })
                          }
                          className="flex-1 font-mono font-medium text-xs px-3 py-1.5 text-black bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KOTAK 4: JUDUL LAPORAN */}
                  <div className="border-2 border-black rounded shadow-sm overflow-hidden">
                    <div className="bg-[#d9d9d9] border-b-2 border-black p-1.5 text-center font-black text-xs uppercase tracking-wider">
                      JUDUL LAPORAN
                    </div>
                    <div className="bg-[#00a2ed] divide-y border-black">
                      <input
                        type="text"
                        value={metaRapor.judulLaporan.baris1}
                        onChange={(e) =>
                          setMetaRapor({
                            ...metaRapor,
                            judulLaporan: { ...metaRapor.judulLaporan, baris1: e.target.value }
                          })
                        }
                        className="w-full text-center font-bold text-xs p-1.5 text-black bg-transparent focus:outline-none uppercase"
                      />
                      <input
                        type="text"
                        value={metaRapor.judulLaporan.baris2}
                        onChange={(e) =>
                          setMetaRapor({
                            ...metaRapor,
                            judulLaporan: { ...metaRapor.judulLaporan, baris2: e.target.value }
                          })
                        }
                        className="w-full text-center font-black text-xs p-1.5 text-black bg-transparent focus:outline-none uppercase"
                      />
                      <input
                        type="text"
                        value={metaRapor.judulLaporan.baris3}
                        onChange={(e) =>
                          setMetaRapor({
                            ...metaRapor,
                            judulLaporan: { ...metaRapor.judulLaporan, baris3: e.target.value }
                          })
                        }
                        className="w-full text-center font-bold text-xs p-1.5 text-black bg-transparent focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  {/* UNGGAH KOP RESMI SEKOLAH */}
                  <div className="border-2 border-amber-400 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-3 bg-amber-50 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs uppercase text-slate-900 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-amber-700" /> KOP RESMI SEKOLAH
                        </span>
                        {uploadedKopImage && (
                          <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            ✓ Terpasang
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Unggah gambar kop baku dari sekolah (.png, .jpg) untuk digunakan langsung pada lembar cetak.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="file"
                          ref={dbKopFileInputRef}
                          onChange={handleKopFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => dbKopFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow transition"
                        >
                          <Upload className="w-3.5 h-3.5" /> {uploadedKopImage ? 'Ganti Kop Sekolah' : 'Upload Kop Sekolah'}
                        </button>
                        {uploadedKopImage && (
                          <button
                            onClick={handleRemoveUploadedKop}
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded text-xs font-bold transition"
                          >
                            Hapus Kop
                          </button>
                        )}
                      </div>
                      {uploadedKopImage && (
                        <div className="mt-2 p-1.5 bg-white border border-slate-300 rounded text-center">
                          <p className="text-[10px] text-slate-500 font-semibold mb-1">Pratinjau Kop Terpasang:</p>
                          <img src={uploadedKopImage} alt="Kop Terpasang" className="max-h-20 mx-auto object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <section className="rounded-xl border-2 border-blue-300 bg-blue-50 p-3 space-y-2" aria-label="Pratinjau laporan">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-black uppercase tracking-wide text-blue-950">Pratinjau hasil edit</h3>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">Langsung</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-blue-900">
                      Perubahan di atas langsung terlihat di sini dan pada lembar rapor resmi.
                    </p>
                    <div className="mx-auto w-full max-w-[360px] rounded-md border border-slate-300 bg-white p-3 text-center text-slate-900 shadow-sm">
                      {showKopSekolah && uploadedKopImage ? (
                        <img src={uploadedKopImage} alt="Pratinjau kop sekolah" className="mb-2 max-h-14 w-full object-contain" />
                      ) : showKopSekolah ? (
                        <p className="mb-2 border-b-2 border-dashed border-slate-300 pb-2 text-[10px] text-slate-500">
                          Unggah kop resmi sekolah untuk melihat pratinjau.
                        </p>
                      ) : null}
                      <p className="text-xs font-black uppercase leading-snug">{metaRapor.judulLaporan.baris1}</p>
                      <p className="text-[11px] font-bold uppercase leading-snug">{metaRapor.judulLaporan.baris2}</p>
                      <p className="text-[10px] font-semibold uppercase leading-snug">{metaRapor.judulLaporan.baris3}</p>
                      <div className="mt-2 border-t border-slate-300 pt-2 text-left text-[10px] leading-relaxed">
                        <p><span className="inline-block w-20 font-semibold text-slate-600">Nama Siswa</span>: {selectedStudent?.nama || 'Belum ada data siswa'}</p>
                        <p><span className="inline-block w-20 font-semibold text-slate-600">NIS</span>: {selectedStudent?.nis || '-'}</p>
                        <p><span className="inline-block w-20 font-semibold text-slate-600">Kelas</span>: {selectedStudent?.kelas || '-'}</p>
                      </div>
                      <div className="mt-2 flex justify-between gap-2 border-t border-slate-200 pt-2 text-left text-[9px] leading-snug">
                        <p className="min-w-0 flex-1"><span className="block font-bold">Kepala Sekolah</span>{metaRapor.kepalaSekolah.nama}</p>
                        <p className="min-w-0 flex-1 text-right"><span className="block font-bold">Guru Kelas</span>{metaRapor.guruKelas.nama}</p>
                      </div>
                      <p className="mt-1 text-right text-[9px] text-slate-600">{metaRapor.tempatRaport}, {metaRapor.tanggalRaport}</p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-white p-2.5 text-[11px] leading-relaxed text-slate-700">
                      <p><strong>Sumber kop:</strong> gambar kop resmi yang diunggah, tersimpan di browser ini. Informasi identitas sekolah pada laporan berasal dari gambar tersebut.</p>
                      <p className="mt-1">Data siswa dan nilai tetap berasal dari Firebase <code>/students</code>. Jika belum ada gambar kop, unggah salinan resmi sekolah sebelum mencetak.</p>
                    </div>
                  </section>

                  {/* TOMBOL SIMPAN PERSONALISASI SEKOLAH KE FIREBASE /app_settings */}
                  {currentUser?.role === 'admin' && (
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-500 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black text-amber-950 uppercase">
                          Simpan Pengaturan Aplikasi (Admin)
                        </div>
                        <div className="text-[11px] text-amber-800">
                          Sinkronkan periode, tanggal raport, dan data penandatangan ke Firebase node <code className="bg-amber-200 px-1 rounded font-bold">/app_settings</code>
                        </div>
                      </div>
                      <button
                        onClick={handleSaveAppSettings}
                        disabled={isFirebaseSyncing}
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isFirebaseSyncing ? 'Menyimpan...' : 'Simpan Personalisasi ke RTDB'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 12: DBTW (REKAP MASTER 32 INDIKATOR PERSIS EXCEL)   */}
          {/* ======================================================= */}
          {currentPage === 'dbtw' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage('home')}
                    className="px-4 py-2 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <ChevronLeft className="w-4 h-4" /> HOME
                  </button>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                      SHEET DBTW - REKAP MASTER PENILAIAN LENGKAP KELAS IV
                    </h2>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      *Terkunci otomatis per siswa: Data kognitif s.d inklusivitas otomatis masuk ke baris masing-masing siswa tanpa melenceng.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Cari Siswa / NIS..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00a2ed]"
                    />
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Rekap
                  </button>
                </div>
              </div>

              {/* TABEL REKAP MASTER PERSIS SHEET DBTW DENGAN FROZEN COLUMNS */}
              <div className="overflow-x-auto border-2 border-black rounded-lg max-h-[75vh]">
                <table className="w-full text-[11px] border-collapse text-center">
                  <thead className="sticky top-0 z-20 bg-white shadow-sm">
                    {/* BARIS 1: KATEGORI UTAMA */}
                    <tr className="border-b border-black font-bold uppercase text-[11px]">
                      <th rowSpan={2} className="border-r border-black p-2 bg-slate-200 w-10 sticky left-0 z-30">NO</th>
                      <th rowSpan={2} className="border-r border-black p-2 bg-slate-200 min-w-[200px] text-left sticky left-10 z-30">NAMA PESERTA DIDIK</th>
                      <th rowSpan={2} className="border-r border-black p-2 bg-slate-200 w-24">NIS</th>
                      <th rowSpan={2} className="border-r border-black p-2 bg-slate-200 w-24">KELAS</th>

                      {/* 1. KOGNITIF (6) */}
                      <th colSpan={6} className="border-r border-black p-1 bg-[#ffff00] text-black font-black">
                        KOGNITIF
                      </th>
                      {/* 2. AFEKTIF (5) */}
                      <th colSpan={5} className="border-r border-black p-1 bg-[#4f81bd] text-white font-black">
                        AFEKTIF
                      </th>
                      {/* 3. PSIKOMOTOR (4) */}
                      <th colSpan={4} className="border-r border-black p-1 bg-[#c0504d] text-white font-black">
                        PSIKOMOTOR
                      </th>
                      {/* 4. SOSIAL (4) */}
                      <th colSpan={4} className="border-r border-black p-1 bg-[#95b3d7] text-slate-900 font-black">
                        SOSIAL
                      </th>
                      {/* 5. ISLAMIC LITERACY (3) */}
                      <th colSpan={3} className="border-r border-black p-1 bg-[#60497a] text-white font-black">
                        ISLAMIC LITERACY
                      </th>
                      {/* 6. BILINGUAL (2) */}
                      <th colSpan={2} className="border-r border-black p-1 bg-[#31869b] text-white font-black">
                        BILINGUAL
                      </th>
                      {/* 7. TALENTS (2) */}
                      <th colSpan={2} className="border-r border-black p-1 bg-[#f79646] text-black font-black">
                        TALENTS
                      </th>
                      {/* 8. EXPERIENCE (3) */}
                      <th colSpan={3} className="border-r border-black p-1 bg-[#b7dde8] text-black font-black">
                        EXPERIENCE
                      </th>
                      {/* 9. INKLUSIVITAS (3) */}
                      <th colSpan={3} className="border-r border-black p-1 bg-[#c4d79b] text-black font-black">
                        INKLUSIVITAS
                      </th>
                    </tr>

                    {/* BARIS 2: KODE SUB-ASPEK SINGKAT */}
                    <tr className="border-b-2 border-black text-[10px] font-bold bg-slate-100">
                      {/* Kognitif */}
                      <th className="border-r border-black p-1 bg-yellow-100" title="Rentang Perhatian">RP</th>
                      <th className="border-r border-black p-1 bg-yellow-50" title="Pemahaman Instruksi">PI</th>
                      <th className="border-r border-black p-1 bg-yellow-100" title="Rentang Memori">RM</th>
                      <th className="border-r border-black p-1 bg-yellow-50" title="Pemecahan Masalah">PM</th>
                      <th className="border-r border-black p-1 bg-yellow-100" title="Berpikir Kritis">KR</th>
                      <th className="border-r border-black p-1 bg-yellow-50" title="Kreativitas / Inovasi">KI</th>

                      {/* Afektif */}
                      <th className="border-r border-black p-1 bg-blue-100" title="Empati">EM</th>
                      <th className="border-r border-black p-1 bg-blue-50" title="Suasana Hati">SH</th>
                      <th className="border-r border-black p-1 bg-blue-100" title="Motivasi">MO</th>
                      <th className="border-r border-black p-1 bg-blue-50" title="Kesabaran">KS</th>
                      <th className="border-r border-black p-1 bg-blue-100" title="Ketangguhan">KT</th>

                      {/* Psikomotor */}
                      <th className="border-r border-black p-1 bg-rose-50" title="Motorik Kasar">MK</th>
                      <th className="border-r border-black p-1 bg-rose-100" title="Motorik Halus">MH</th>
                      <th className="border-r border-black p-1 bg-rose-50" title="Perilaku Repetitif">RE</th>
                      <th className="border-r border-black p-1 bg-rose-100" title="Keluwesan">KK</th>

                      {/* Sosial */}
                      <th className="border-r border-black p-1 bg-slate-100" title="Otoritas">OT</th>
                      <th className="border-r border-black p-1 bg-slate-50" title="Kepemimpinan">LD</th>
                      <th className="border-r border-black p-1 bg-slate-100" title="Altruisme">AT</th>
                      <th className="border-r border-black p-1 bg-slate-50" title="Komunikasi">KO</th>

                      {/* Islamic Literacy */}
                      <th className="border-r border-black p-1 bg-purple-50" title="Kecintaan Al-Qur'an">AQ</th>
                      <th className="border-r border-black p-1 bg-purple-100" title="Akhlak Terpuji">AK</th>
                      <th className="border-r border-black p-1 bg-purple-50" title="Semangat Beribadah">IB</th>

                      {/* Bilingual */}
                      <th className="border-r border-black p-1 bg-teal-100" title="Kepercayaan Diri">KD</th>
                      <th className="border-r border-black p-1 bg-teal-50" title="Semangat Belajar">SB</th>

                      {/* Talents */}
                      <th className="border-r border-black p-1 bg-amber-100" title="Keunikan">UQ</th>
                      <th className="border-r border-black p-1 bg-amber-50" title="Ketertarikan / Hobi">IN</th>

                      {/* Experience */}
                      <th className="border-r border-black p-1 bg-cyan-100" title="Eksplorasi">EX</th>
                      <th className="border-r border-black p-1 bg-cyan-50" title="Observatif">OB</th>
                      <th className="border-r border-black p-1 bg-cyan-100" title="Refleksi">RE</th>

                      {/* Inklusivitas */}
                      <th className="border-r border-black p-1 bg-emerald-50" title="Solidaritas">SO</th>
                      <th className="border-r border-black p-1 bg-emerald-100" title="Keadilan">FA</th>
                      <th className="border-r border-black p-1 bg-emerald-50" title="Penghormatan">PH</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-black">
                    {filteredSiswa.map((siswa) => {
                      const renderCell = (
                        section: keyof SiswaAssessmentRecord,
                        subKey: string,
                        val: string,
                        bgClass: string
                      ) => {
                        const isExceptional = val === 'Exceptional';
                        const isA = val === 'A';
                        const isB = val === 'B';
                        const isC = val === 'C';
                        const isDefisit = val === 'Defisit';

                        return (
                          <td
                            key={subKey}
                            className={`border-r border-black p-0.5 text-center font-bold ${
                              isExceptional
                                ? 'bg-purple-200 text-purple-950 font-black'
                                : isA
                                ? 'bg-emerald-100 text-emerald-900 font-bold'
                                : isB
                                ? 'bg-blue-100 text-blue-900 font-bold'
                                : isC
                                ? 'bg-amber-100 text-amber-900 font-bold'
                                : isDefisit
                                ? 'bg-red-100 text-red-900 font-bold'
                                : bgClass
                            }`}
                          >
                            <select
                              value={val}
                              onChange={(e) => updateStudentField(siswa.no, section, subKey, e.target.value)}
                              className="w-full text-center text-[10px] font-bold bg-transparent focus:outline-none cursor-pointer"
                              title={`${siswa.nama} - ${subKey}: ${val || 'Belum diisi'}`}
                            >
                              <option value="">-</option>
                              {PILIHAN_PREDIKAT.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      };

                      return (
                        <tr key={siswa.no} className="hover:bg-amber-50/70 transition">
                          {/* STICKY NO */}
                          <td className="border-r border-black p-1.5 font-bold text-slate-700 bg-slate-50 sticky left-0 z-10">
                            {siswa.no}
                          </td>

                          {/* STICKY NAMA */}
                          <td className="border-r border-black p-1.5 text-left font-bold text-slate-900 bg-white sticky left-10 z-10 whitespace-nowrap">
                            {siswa.nama}
                          </td>

                          {/* NIS */}
                          <td className="border-r border-black p-1.5 font-mono text-slate-700">
                            {siswa.nis}
                          </td>

                          {/* KELAS */}
                          <td className="border-r border-black p-1.5 text-slate-700 whitespace-nowrap">
                            {siswa.kelas}
                          </td>

                          {/* 1. KOGNITIF (6) */}
                          {renderCell('kognitif', 'rp', siswa.kognitif.rp, 'bg-yellow-50/30')}
                          {renderCell('kognitif', 'pi', siswa.kognitif.pi, 'bg-white')}
                          {renderCell('kognitif', 'rm', siswa.kognitif.rm, 'bg-yellow-50/30')}
                          {renderCell('kognitif', 'pm', siswa.kognitif.pm, 'bg-white')}
                          {renderCell('kognitif', 'kr', siswa.kognitif.kr, 'bg-yellow-50/30')}
                          {renderCell('kognitif', 'ki', siswa.kognitif.ki, 'bg-white')}

                          {/* 2. AFEKTIF (5) */}
                          {renderCell('afektif', 'em', siswa.afektif.em, 'bg-blue-50/40')}
                          {renderCell('afektif', 'sh', siswa.afektif.sh, 'bg-white')}
                          {renderCell('afektif', 'mo', siswa.afektif.mo, 'bg-blue-50/40')}
                          {renderCell('afektif', 'ks', siswa.afektif.ks, 'bg-white')}
                          {renderCell('afektif', 'kt', siswa.afektif.kt, 'bg-blue-50/40')}

                          {/* 3. PSIKOMOTOR (4) */}
                          {renderCell('psikomotor', 'mk', siswa.psikomotor.mk, 'bg-white')}
                          {renderCell('psikomotor', 'mh', siswa.psikomotor.mh, 'bg-rose-50/40')}
                          {renderCell('psikomotor', 're', siswa.psikomotor.re, 'bg-white')}
                          {renderCell('psikomotor', 'kk', siswa.psikomotor.kk, 'bg-rose-50/40')}

                          {/* 4. SOSIAL (4) */}
                          {renderCell('sosial', 'ot', siswa.sosial.ot, 'bg-slate-50')}
                          {renderCell('sosial', 'ld', siswa.sosial.ld, 'bg-white')}
                          {renderCell('sosial', 'at', siswa.sosial.at, 'bg-slate-50')}
                          {renderCell('sosial', 'ko', siswa.sosial.ko, 'bg-white')}

                          {/* 5. ISLAMIC LITERACY (3) */}
                          {renderCell('islamicLiteracy', 'aq', siswa.islamicLiteracy.aq, 'bg-white')}
                          {renderCell('islamicLiteracy', 'ak', siswa.islamicLiteracy.ak, 'bg-purple-50/50')}
                          {renderCell('islamicLiteracy', 'ib', siswa.islamicLiteracy.ib, 'bg-white')}

                          {/* 6. BILINGUAL (2) */}
                          {renderCell('bilingual', 'kd', siswa.bilingual.kd, 'bg-teal-50/50')}
                          {renderCell('bilingual', 'sb', siswa.bilingual.sb, 'bg-white')}

                          {/* 7. TALENTS (2) */}
                          {renderCell('talents', 'uq', siswa.talents.uq, 'bg-amber-50/60')}
                          {renderCell('talents', 'in', siswa.talents.in, 'bg-white')}

                          {/* 8. EXPERIENCE (3) */}
                          {renderCell('experience', 'ex', siswa.experience.ex, 'bg-cyan-50/50')}
                          {renderCell('experience', 'ob', siswa.experience.ob, 'bg-white')}
                          {renderCell('experience', 're', siswa.experience.re, 'bg-cyan-50/50')}

                          {/* 9. INKLUSIVITAS (3) */}
                          {renderCell('inklusivitas', 'so', siswa.inklusivitas.so, 'bg-white')}
                          {renderCell('inklusivitas', 'fa', siswa.inklusivitas.fa, 'bg-emerald-50/50')}
                          {renderCell('inklusivitas', 'ph', siswa.inklusivitas.ph, 'bg-white')}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* LEGENDA WARNA PERSIS SCREENSHOT EXCEL */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-700">Legenda Predikat Nilai:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-purple-500 inline-block" />
                    <span className="font-semibold text-slate-800">Exceptional</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
                    <span className="font-semibold text-slate-800">A</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-blue-500 inline-block" />
                    <span className="font-semibold text-slate-800">B</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-amber-500 inline-block" />
                    <span className="font-semibold text-slate-800">C</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-red-500 inline-block" />
                    <span className="font-semibold text-slate-800">Defisit</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  *Setiap sel nilai di rekap ini langsung tersambung dan terkunci pada baris masing-masing siswa.
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB: PERBANDINGAN TRIWULAN (MULTI-PERIOD ANALYSIS)       */}
          {/* ======================================================= */}
          {currentPage === 'perbandingan' && (
            <PerbandinganTriwulan
              students={masterStudents}
              selectedStudentNo={selectedStudentNum}
              onSelectStudent={setSelectedStudentNum}
              onNavigateHome={() => setCurrentPage('home')}
            />
          )}

          {/* ======================================================= */}
          {/* TAB 11: TO PRINT PAGE (LEMBAR CETAK RAPOR RESMI)        */}
          {/* ======================================================= */}
          {currentPage === 'to_print_page' && (
            <div className="bg-white rounded-xl shadow-lg border-2 border-slate-400 p-4 sm:p-6 space-y-4">
              {/* ======================================================= */}
              {/* TOMBOL BERPINDAH TAMPILAN: FORMAT RESMI VS SPIDER CHART */}
              {/* ======================================================= */}
              <div className="print:hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-2.5 sm:p-3 rounded-xl border border-indigo-400 shadow-md flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-500 flex items-center justify-center text-base shadow-sm border border-white/30 text-white shrink-0">
                    {reportViewMode === 'spider_chart' ? '🕸️' : '📄'}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex flex-wrap items-center gap-1">
                      <span>PILIH FORMAT TAMPILAN RAPOR:</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/40 text-[9px] font-black">
                        {selectedStudent.nama} ({selectedStudent.nis})
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-black text-white">
                      {reportViewMode === 'spider_chart'
                        ? 'Laporan Grafik Spider Chart (Radar Interaktif 9 Aspek)'
                        : 'Lembar Rapor Cetak Resmi (Format Standar Sekolah)'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/20">
                  <button
                    onClick={() => setReportViewMode('document')}
                    className={`px-2.5 py-1.5 rounded-md font-bold text-[10px] sm:text-[11px] uppercase tracking-wide flex items-center gap-1.5 transition cursor-pointer ${
                      reportViewMode === 'document'
                        ? 'bg-amber-400 text-slate-950 shadow-sm ring-1 ring-white/70'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📄 Lembar Resmi (Tabel)</span>
                  </button>
                  <button
                    onClick={() => setReportViewMode('spider_chart')}
                    className={`px-2.5 py-1.5 rounded-md font-bold text-[10px] sm:text-[11px] uppercase tracking-wide flex items-center gap-1.5 transition cursor-pointer ${
                      reportViewMode === 'spider_chart'
                        ? 'bg-teal-300 text-slate-950 shadow-sm ring-1 ring-white/70'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Radar className="w-3.5 h-3.5 text-emerald-950" />
                    <span>🕸️ Spider Chart (Radar)</span>
                    <span className="px-1 py-0.5 text-[8px] bg-red-600 text-white rounded-full font-bold">BARU</span>
                  </button>
                </div>
              </div>

              {/* ======================================================= */}
              {/* BAR KONTROL BERDASARKAN MODE TAMPILAN AKTIF             */}
              {/* ======================================================= */}
              {reportViewMode === 'spider_chart' ? (
                /* BAR KONTROL SPIDER CHART */
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 print:hidden bg-slate-50 -mx-3 sm:-mx-4 p-3 rounded-xl border-slate-300">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage('home')}
                      className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> HOME
                    </button>

                    <span className="text-xs font-bold text-slate-700 ml-2 hidden sm:inline">Pilih Siswa:</span>

                    <button
                      onClick={() => {
                        if (currentUser?.role === 'orangtua') return;
                        if (selectedStudentNum > 1) setSelectedStudentNum((prev) => prev - 1);
                      }}
                      disabled={selectedStudentNum <= 1 || currentUser?.role === 'orangtua'}
                      className="px-2.5 py-1.5 text-xs font-bold border border-slate-400 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                      title="Siswa Sebelumnya"
                    >
                      ◀
                    </button>

                    <select
                      value={selectedStudentNum}
                      disabled={currentUser?.role === 'orangtua'}
                      onChange={(e) => setSelectedStudentNum(Number(e.target.value))}
                      className={`px-3 py-1.5 text-xs font-bold border-2 rounded-lg max-w-[260px] truncate shadow-sm ${
                        currentUser?.role === 'orangtua'
                          ? 'border-blue-500 bg-slate-100 opacity-90 cursor-not-allowed'
                          : 'border-black bg-white cursor-pointer'
                      }`}
                      title={currentUser?.role === 'orangtua' ? 'Akses Orang Tua: Terkunci ke NISN siswa' : 'Pilih Siswa'}
                    >
                      {dataSiswa.map((s) => (
                        <option key={s.no} value={s.no}>
                          {s.no}. {s.nama} ({s.nis})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        if (currentUser?.role === 'orangtua') return;
                        if (selectedStudentNum < dataSiswa.length) setSelectedStudentNum((prev) => prev + 1);
                      }}
                      disabled={selectedStudentNum >= dataSiswa.length || currentUser?.role === 'orangtua'}
                      className="px-2.5 py-1.5 text-xs font-bold border border-slate-400 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                      title="Siswa Berikutnya"
                    >
                      ▶
                    </button>

                    {currentUser?.role === 'orangtua' && (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-1 rounded">
                        🔒 Terkunci
                      </span>
                    )}

                    {/* PILIHAN MENU TRIWULAN (TRIWULAN 1 / TRIWULAN 2 / TRIWULAN 3 / TRIWULAN 4) */}
                    <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-300 ml-1 sm:ml-2">
                      <span className="text-[10px] font-bold text-slate-700 uppercase px-1 hidden md:inline">
                        Periode:
                      </span>
                      {TRIWULAN_OPTIONS.map((t) => {
                        const isSelected = activeTriwulan === t.id;
                        return (
                          <button
                            key={`spider-triwulan-${t.id}`}
                            onClick={() => {
                              setActiveTriwulan(t.id);
                              setReportTriwulan(t.id);
                              setPrintStatus(`Spider Chart menampilkan data ${t.label}.`);
                              setTimeout(() => setPrintStatus(null), 3000);
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-normal transition border cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:text-black'
                            }`}
                            title={`Tampilkan data Spider Chart untuk ${t.label}`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* BAR KONTROL LEMBAR RESMI (DOKUMEN TABEL) */
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 print:hidden bg-slate-50 -mx-3 sm:-mx-4 -mt-3 sm:-mt-4 p-3 rounded-t-xl border-slate-300">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage('home')}
                      className="px-3 py-1.5 bg-[#e65c00] hover:bg-[#b34700] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow transition"
                    >
                      <ChevronLeft className="w-4 h-4" /> HOME
                    </button>

                    <span className="text-xs font-bold text-slate-700 ml-2 hidden sm:inline">Pilih Siswa:</span>

                    <button
                      onClick={() => {
                        if (currentUser?.role === 'orangtua') return;
                        if (selectedStudentNum > 1) {
                          setSelectedStudentNum((prev) => prev - 1);
                        }
                      }}
                      disabled={selectedStudentNum <= 1 || currentUser?.role === 'orangtua'}
                      className="px-2.5 py-1.5 text-xs font-bold border border-slate-400 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-100"
                      title="Siswa Sebelumnya"
                    >
                      ◀
                    </button>

                    <select
                      value={selectedStudentNum}
                      disabled={currentUser?.role === 'orangtua'}
                      onChange={(e) => setSelectedStudentNum(Number(e.target.value))}
                      className={`px-3 py-1.5 text-xs font-bold border-2 rounded-lg max-w-[260px] truncate shadow-sm ${
                        currentUser?.role === 'orangtua'
                          ? 'border-blue-500 bg-slate-100 opacity-90 cursor-not-allowed'
                          : 'border-black bg-white cursor-pointer'
                      }`}
                      title={currentUser?.role === 'orangtua' ? 'Akses Orang Tua: Terkunci ke NISN siswa' : 'Pilih Siswa'}
                    >
                      {dataSiswa.map((s) => (
                        <option key={s.no} value={s.no}>
                          {s.no}. {s.nama} ({s.nis})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => {
                        if (currentUser?.role === 'orangtua') return;
                        if (selectedStudentNum < dataSiswa.length) {
                          setSelectedStudentNum((prev) => prev + 1);
                        }
                      }}
                      disabled={selectedStudentNum >= dataSiswa.length || currentUser?.role === 'orangtua'}
                      className="px-2.5 py-1.5 text-xs font-bold border border-slate-400 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-100"
                      title="Siswa Berikutnya"
                    >
                      ▶
                    </button>

                    {currentUser?.role === 'orangtua' && (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-1 rounded">
                        🔒 Terkunci
                      </span>
                    )}

                    {/* PILIHAN MENU TRIWULAN (TRIWULAN 1 / TRIWULAN 2 / TRIWULAN 3 / TRIWULAN 4) */}
                    <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-300 ml-1 sm:ml-2">
                      <span className="text-[10px] font-bold text-slate-700 uppercase px-1 hidden md:inline">
                        Periode:
                      </span>
                      {TRIWULAN_OPTIONS.map((t) => {
                        const isSelected = activeTriwulan === t.id;
                        return (
                          <button
                            key={`rapor-triwulan-${t.id}`}
                            onClick={() => {
                              setActiveTriwulan(t.id);
                              setReportTriwulan(t.id);
                              setPrintStatus(`Lembar Rapor menampilkan data ${t.label}.`);
                              setTimeout(() => setPrintStatus(null), 3000);
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-normal transition border cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 hover:text-black'
                            }`}
                            title={`Tampilkan data Rapor untuk ${t.label}`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tombol Cetak Utama */}
                    <button
                      onClick={handlePrintRapor}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      title="Buka dialog cetak printer / Simpan ke PDF"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Rapor
                    </button>

                    {/* Tombol Unduh File HTML Siap Cetak */}
                    <button
                      onClick={handleDownloadRaporHTML}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      title="Unduh file rapor mandiri. Bisa dibuka dan dicetak langsung dari browser manapun"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh Dokumen
                    </button>
                  </div>
                </div>
              )}

              {/* PEMBERITAHUAN STATUS CETAK */}
              {printStatus && (
                <div className="bg-emerald-50 border border-emerald-400 text-emerald-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-between print:hidden shadow-sm animate-pulse">
                  <span>ℹ️ {printStatus}</span>
                  <button onClick={() => setPrintStatus(null)} className="text-emerald-700 hover:text-black text-sm font-bold">✕</button>
                </div>
              )}

              {/* ======================================================== */}
              {/* 1. DIALOG PENGATURAN CETAK RAPOR & PRINTER (MODAL LENGKAP) */}
              {/* ======================================================== */}
              {showPrintModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs print:hidden overflow-y-auto">
                  <div className="bg-white rounded-2xl shadow-2xl border-4 border-emerald-600 max-w-xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header Modal */}
                    <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <Printer className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-black text-base sm:text-lg tracking-wide uppercase">
                            Pengaturan Cetak & Printer Rapor
                          </h3>
                          <p className="text-emerald-100 text-xs">
                            Atur kertas, orientasi, margin, dan parameter printer dokumen
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPrintModal(false)}
                        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xl font-bold cursor-pointer"
                        title="Tutup dialog"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                      {/* 1. CAKUPAN SISWA YANG AKAN DICETAK */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <label className="font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                          <span>👤</span> Target Siswa yang Dicetak:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition ${
                            printScope === 'single'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                              : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name="printScope"
                              checked={printScope === 'single'}
                              onChange={() => setPrintScope('single')}
                              className="mt-0.5 text-emerald-600"
                            />
                            <div>
                              <div className="font-extrabold text-xs">Siswa Aktif Saat Ini</div>
                              <div className="text-[11px] text-slate-600 truncate max-w-[200px]">
                                {selectedStudent.nama} ({selectedStudent.nis})
                              </div>
                            </div>
                          </label>

                          <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border-2 cursor-pointer transition ${
                            printScope === 'all'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                              : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name="printScope"
                              checked={printScope === 'all'}
                              onChange={() => setPrintScope('all')}
                              className="mt-0.5 text-emerald-600"
                            />
                            <div>
                              <div className="font-extrabold text-xs">Seluruh Siswa ({dataSiswa.length} Siswa)</div>
                              <div className="text-[11px] text-slate-600">
                                Cetak kolektif dengan pemisah halaman
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 2. PENGATURAN KERTAS (UKURAN & ORIENTASI) */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <label className="font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                          <span>📄</span> Pengaturan Kertas Dokumen:
                        </label>

                        {/* Pilihan Ukuran Kertas */}
                        <div>
                          <div className="text-[11px] font-bold text-slate-600 mb-1.5">Ukuran Kertas:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PAPER_SIZES.map((paper) => (
                              <button
                                key={paper.id}
                                type="button"
                                onClick={() => setPaperSize(paper.id as any)}
                                className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                                  paperSize === paper.id
                                    ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                <div className="text-xs font-black">{paper.id}</div>
                                <div className="text-[10px] opacity-85 leading-tight">{paper.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Orientasi & Margin */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <div className="text-[11px] font-bold text-slate-600 mb-1">Orientasi:</div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setPaperOrientation('portrait')}
                                className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold cursor-pointer ${
                                  paperOrientation === 'portrait'
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                ↕️ Potret (Tegak)
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaperOrientation('landscape')}
                                className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold cursor-pointer ${
                                  paperOrientation === 'landscape'
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                ↔️ Lanskap
                              </button>
                            </div>
                          </div>

                          <div>
                            <div className="text-[11px] font-bold text-slate-600 mb-1">Margin Halaman:</div>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { id: 'narrow', label: 'Sempit (5mm)' },
                                { id: 'normal', label: 'Standar (10mm)' },
                                { id: 'wide', label: 'Lebar (15mm)' }
                              ].map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setPaperMargin(m.id as any)}
                                  className={`py-1.5 px-1 rounded-lg border text-center text-[10.5px] font-bold cursor-pointer ${
                                    paperMargin === m.id
                                      ? 'bg-emerald-700 text-white border-emerald-800'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  }`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. PENGATURAN WARNA, KOP & SKALA DOKUMEN */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <label className="font-black text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
                          <span>⚙️</span> Opsi Tampilan & Parameter Printer:
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Kop Toggle */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                            <span className="text-[11px] font-bold text-slate-700">Kop Surat Sekolah:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => setShowKopSekolah(true)}
                                className={`flex-1 py-1 text-[11px] font-bold rounded border ${
                                  showKopSekolah ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                Tampilkan
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowKopSekolah(false)}
                                className={`flex-1 py-1 text-[11px] font-bold rounded border ${
                                  !showKopSekolah ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                Tanpa Kop
                              </button>
                            </div>
                          </div>

                          {/* Mode Warna */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                            <span className="text-[11px] font-bold text-slate-700">Mode Warna Tinta:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => setPrintColorMode('color')}
                                className={`flex-1 py-1 text-[11px] font-bold rounded border ${
                                  printColorMode === 'color' ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                Berwarna
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrintColorMode('grayscale')}
                                className={`flex-1 py-1 text-[11px] font-bold rounded border ${
                                  printColorMode === 'grayscale' ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                Hitam Putih
                              </button>
                            </div>
                          </div>

                          {/* Skala Zoom Dokumen */}
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                            <span className="text-[11px] font-bold text-slate-700">Skala Ukuran Dokumen:</span>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                              {[100, 95, 90].map((sc) => (
                                <button
                                  key={sc}
                                  type="button"
                                  onClick={() => setPrintScale(sc)}
                                  className={`py-1 text-[11px] font-bold rounded border ${
                                    printScale === sc ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {sc}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Tombol Aksi */}
                    <div className="bg-slate-100 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5">
                      <button
                        onClick={() => setShowPrintModal(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleExecutePrint(true)}
                          className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                          title="Buka dokumen di tab baru dengan dialog print otomatis"
                        >
                          🌐 Buka di Tab Baru
                        </button>

                        <button
                          onClick={() => handleExecutePrint(false)}
                          className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                          title="Cetak langsung menggunakan pengaturan yang dipilih"
                        >
                          <Printer className="w-4 h-4" /> Cetak Dokumen Sekarang
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* 2. DIALOG UNDUH DOKUMEN RAPOR (PILIHAN SISWA, DOCX/PDF, LOKASI) */}
              {/* ======================================================== */}
              {showDownloadModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs print:hidden overflow-y-auto">
                  <div className="bg-white rounded-2xl shadow-2xl border-4 border-blue-600 max-w-xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header Modal */}
                    <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-blue-900 text-white px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <Download className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-black text-base sm:text-lg tracking-wide uppercase">
                            Unduh Dokumen Rapor Siswa
                          </h3>
                          <p className="text-blue-100 text-xs">
                            Pilih cakupan murid, format berkas (Word / PDF), dan tentukan lokasi penyimpanan
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDownloadModal(false)}
                        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xl font-bold cursor-pointer"
                        title="Tutup dialog"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                      {/* LANGKAH 1: OPSI CAKUPAN SISWA */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px] font-bold">1</span>
                            Pilih Cakupan Rapor Murid:
                          </label>
                          <span className="text-[11px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                            {downloadScope === 'single' ? '1 Rapor Siswa' : `Semua (${dataSiswa.length} Siswa)`}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                            downloadScope === 'single'
                              ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-xs'
                              : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name="downloadScope"
                              checked={downloadScope === 'single'}
                              onChange={() => setDownloadScope('single')}
                              className="mt-0.5 text-blue-600"
                            />
                            <div>
                              <div className="font-extrabold text-xs">1. Unduh Satu Rapor Murid</div>
                              <div className="text-[11px] text-slate-600 mt-0.5 font-normal">
                                Rapor aktif: <strong className="text-slate-900 font-bold">{selectedStudent.nama}</strong> ({selectedStudent.nis})
                              </div>
                            </div>
                          </label>

                          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                            downloadScope === 'all'
                              ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-xs'
                              : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name="downloadScope"
                              checked={downloadScope === 'all'}
                              onChange={() => setDownloadScope('all')}
                              className="mt-0.5 text-blue-600"
                            />
                            <div>
                              <div className="font-extrabold text-xs">2. Unduh Seluruh Rapor Murid</div>
                              <div className="text-[11px] text-slate-600 mt-0.5 font-normal">
                                Berkas kolektif <strong className="text-slate-900 font-bold">{dataSiswa.length} Siswa</strong> sekaligus dengan halaman terpisah rapi
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* LANGKAH 2: OPSI FORMAT BERKAS */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px] font-bold">2</span>
                            Pilih Format Dokumen:
                          </label>
                          <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full uppercase">
                            Format: {downloadFormat}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* OPSI DOCX / WORD */}
                          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                            downloadFormat === 'docx'
                              ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-xs'
                              : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name="downloadFormat"
                              checked={downloadFormat === 'docx'}
                              onChange={() => setDownloadFormat('docx')}
                              className="mt-0.5 text-blue-600"
                            />
                            <div>
                              <div className="font-extrabold text-xs flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-blue-700 text-white rounded text-[10px] font-mono">DOCX</span>
                                <span>Microsoft Word (.docx)</span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-1 font-normal leading-relaxed">
                                Format dokumen Word yang dapat diedit langsung. Tabel, border, warna dan tanda tangan 100% presisi.
                              </div>
                            </div>
                          </label>

                          {/* OPSI PDF */}
                          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                            downloadFormat === 'pdf'
                              ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold shadow-xs'
                              : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                          }`}>
                            <input
                              type="radio"
                              name="downloadFormat"
                              checked={downloadFormat === 'pdf'}
                              onChange={() => setDownloadFormat('pdf')}
                              className="mt-0.5 text-blue-600"
                            />
                            <div>
                              <div className="font-extrabold text-xs flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-rose-700 text-white rounded text-[10px] font-mono">PDF</span>
                                <span>Dokumen PDF Resmi (.pdf)</span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-1 font-normal leading-relaxed">
                                Format dokumen baku siap cetak dan arsip digital resmi sekolah tanpa perubahan tata letak.
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* LANGKAH 3: OPSI MEMILIH LOKASI PENYIMPANAN */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                        <label className="font-black text-slate-900 uppercase tracking-wider block flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px] font-bold">3</span>
                          Pilihan Lokasi Penyimpanan Dokumen di Komputer:
                        </label>

                        <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2">
                          <p className="text-slate-700 text-xs leading-relaxed">
                            💡 Anda dapat memilih folder penyimpanan sendiri di komputer (Desktop, Documents, Flashdisk, dsb.) menggunakan tombol <strong>"Pilih Folder & Simpan"</strong>, atau mengunduh otomatis ke folder Download browser Anda.
                          </p>
                          <div className="text-[11px] text-slate-500 font-mono bg-slate-100 p-2 rounded-lg truncate">
                            Nama Berkas: {downloadScope === 'all'
                              ? `Rapor_Seluruh_Siswa_Kelas_IV_${activeTriwulan}.${downloadFormat}`
                              : `Rapor_${selectedStudent.nama.replace(/\s+/g, '_')}_${selectedStudent.nis}_${activeTriwulan}.${downloadFormat}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Tombol Aksi */}
                    <div className="bg-slate-100 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5">
                      <button
                        onClick={() => setShowDownloadModal(false)}
                        className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Opsi 1: Unduh Cepat Otomatis */}
                        <button
                          disabled={isProcessingExport}
                          onClick={() => handleExecuteDownload(false)}
                          className="px-3.5 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                          title="Simpan langsung ke folder Download browser"
                        >
                          <Download className="w-4 h-4" /> Unduh Cepat
                        </button>

                        {/* Opsi 2: Memilih Lokasi Penyimpanan (Save As Folder Picker) */}
                        <button
                          disabled={isProcessingExport}
                          onClick={() => handleExecuteDownload(true)}
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                          title="Buka dialog pemilihan folder di sistem operasi komputer Anda"
                        >
                          <FolderOpen className="w-4 h-4" /> Pilih Folder & Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* PERCABANGAN MODE: SPIDER CHART VS LEMBAR RESMI (TABEL)   */}
              {/* ======================================================== */}
              {reportViewMode === 'spider_chart' ? (
                /* ====================================================== */
                /* 1. TAMPILAN LAPORAN SPIDER CHART (RADAR INTERAKTIF)    */
                /* ====================================================== */
                <div
                  id="spider-chart-rapor"
                  className="bg-white mx-auto border-2 border-slate-300 p-5 sm:p-8 max-w-[210mm] w-full text-black print:border-none print:p-0 print:m-0 print:max-w-none shadow-md rounded-2xl print:rounded-none space-y-4"
                >
                  {/* JUDUL LAPORAN HASIL (DIMAKSIMALKAN UNTUK LAPORAN HASIL) */}
                  <div className="text-center space-y-1 pb-2 border-b-2 border-slate-800">
                    <span className="inline-block px-3 py-0.5 bg-teal-100 text-teal-900 border border-teal-300 rounded-full text-[11px] font-black uppercase tracking-wider">
                      Grafik Radar Capaian Kompetensi Peserta Didik
                    </span>
                    <h3 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-wide">
                      LAPORAN HASIL EVALUASI RAPOR (SPIDER CHART)
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold">
                      Analisis Holistik 9 Dimensi Capaian • <span className="text-teal-800 font-black">{TRIWULAN_OPTIONS.find((t) => t.id === activeTriwulan)?.label || activeTriwulan}</span> • Tahun Ajaran 2026/2027
                    </p>
                  </div>

                  {/* IDENTITAS SISWA */}
                  <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3.5 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Nama Siswa</span>
                        <span className="font-black text-slate-900 uppercase text-sm truncate block">{selectedStudent.nama}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Nomor Induk (NIS)</span>
                        <span className="font-mono font-bold text-slate-800">{selectedStudent.nis}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kelas / Fase</span>
                        <span className="font-bold text-slate-800">{selectedStudent.kelas} (Fase B)</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Periode Rapor</span>
                        <span className="font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block uppercase text-[11px]">
                          {TRIWULAN_OPTIONS.find((t) => t.id === activeTriwulan)?.label || activeTriwulan}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Titimangsa Rapor</span>
                        <span className="font-bold text-slate-800">{metaRapor.tempatRaport}, {metaRapor.tanggalRaport}</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI SUMMARY CARDS */}
                  {(() => {
                    const spiderAnalysis = getStudentSpiderAnalysis(selectedStudent);
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="bg-teal-50 border-2 border-teal-500 rounded-xl p-3 shadow-xs">
                          <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">Indeks Capaian Rerata</span>
                          <div className="text-2xl font-black text-teal-700 my-0.5">
                            {spiderAnalysis.averageScore} <span className="text-xs text-slate-500">/ 5.0</span>
                          </div>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-600 text-white text-[11px] font-black uppercase">
                            Predikat {spiderAnalysis.overallGrade} ({spiderAnalysis.averagePercentage}%)
                          </span>
                        </div>

                        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3 shadow-xs">
                          <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">🌟 Kekuatan Utama</span>
                          <div className="text-sm font-black text-emerald-950 my-1 truncate">
                            {spiderAnalysis.topStrengths.map(s => s.nama).slice(0, 2).join(' & ')}
                          </div>
                          <span className="text-[11px] text-emerald-800 font-semibold block">
                            Skor tertinggi: {spiderAnalysis.topStrengths[0]?.score || 5.0} / 5.0
                          </span>
                        </div>

                        <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-3 shadow-xs">
                          <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">🎯 Fokus Pendampingan</span>
                          <div className="text-sm font-black text-amber-950 my-1 truncate">
                            {spiderAnalysis.topWeaknesses.map(w => w.nama).slice(0, 2).join(' & ')}
                          </div>
                          <span className="text-[11px] text-amber-800 font-semibold block">
                            Perlu stimulasi & latihan berkelanjutan
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SPIDER CHART & ASPECT INSPECTOR */}
                  {(() => {
                    const spiderAnalysis = getStudentSpiderAnalysis(selectedStudent);
                    const trendData = getStudentQuarterTrends(selectedStudent, activeTriwulan);
                    const predictionData = predictNextQuarterAchievement(selectedStudent, activeTriwulan, trendData.quarters);
                    const activeAspectId = selectedSpiderAspect || spiderAnalysis.aspects[0].id;
                    const currentAspect = spiderAnalysis.aspects.find(a => a.id === activeAspectId) || spiderAnalysis.aspects[0];

                    const CX = 270;
                    const CY = 270;
                    const R = 175;
                    const numAspects = ASPEK_LIST.length;

                    const aspectPoints = spiderAnalysis.aspects.map((asp, i) => {
                      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
                      const radius = (asp.score / 5) * R;
                      const x = CX + radius * Math.cos(angle);
                      const y = CY + radius * Math.sin(angle);
                      const outerRadius = R + 42;
                      const outerX = CX + outerRadius * Math.cos(angle);
                      const outerY = CY + outerRadius * Math.sin(angle);
                      const cosVal = Math.cos(angle);
                      const anchor: 'start' | 'end' | 'middle' = cosVal > 0.15 ? 'start' : cosVal < -0.15 ? 'end' : 'middle';
                      return {
                        ...asp,
                        angle,
                        radius,
                        x,
                        y,
                        outerX,
                        outerY,
                        anchor
                      };
                    });

                    const dataPolygonPoints = aspectPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

                    const predictedAspectPoints = predictionData.aspectPredictions.map((asp, i) => {
                      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
                      const radius = (asp.predictedScore / 5) * R;
                      const x = CX + radius * Math.cos(angle);
                      const y = CY + radius * Math.sin(angle);
                      return {
                        ...asp,
                        x,
                        y
                      };
                    });
                    const predictedPolygonPoints = predictedAspectPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

                    return (
                      <div className="space-y-4">
                        {/* Selector Tabs 9 Aspek */}
                        <div className="print:hidden">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                            <span className="flex items-center gap-1.5">
                              <Radar className="w-4 h-4 text-teal-600" />
                              <span>Klik salah satu aspek untuk memeriksa indikator & penjelasannya:</span>
                            </span>
                            <span className="text-slate-500 text-[11px]">9 Dimensi Lengkap</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-100 rounded-xl border border-slate-300">
                            {spiderAnalysis.aspects.map((asp) => {
                              const isSelected = asp.id === activeAspectId;
                              return (
                                <button
                                  key={asp.id}
                                  onClick={() => setSelectedSpiderAspect(asp.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                    isSelected
                                      ? 'bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-300 scale-102'
                                      : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                                    {asp.no}
                                  </span>
                                  <span>{asp.nama}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                    asp.score >= 4 ? 'bg-emerald-500 text-white' : asp.score >= 3 ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                                  }`}>
                                    {asp.score}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Layout Dua Kolom: Radar SVG (Kiri) & Kartu Penjelasan Aspek (Kanan) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                          {/* Sisi Kiri: Spider Chart SVG */}
                          <div className="lg:col-span-7 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border-2 border-slate-200">
                            <div className="w-full max-w-[500px] aspect-square relative select-none">
                              <svg viewBox="0 0 540 540" className="w-full h-full drop-shadow-sm">
                                <defs>
                                  <radialGradient id="spiderFillGradient" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.65" />
                                    <stop offset="60%" stopColor="#0d9488" stopOpacity="0.45" />
                                    <stop offset="100%" stopColor="#115e59" stopOpacity="0.3" />
                                  </radialGradient>
                                  <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                  </filter>
                                </defs>

                                {/* Poligon Grid Konsentris (Level 1 - 5) */}
                                {[1, 2, 3, 4, 5].map((lvl) => {
                                  const rad = (lvl / 5) * R;
                                  const pts = Array.from({ length: numAspects }, (_, i) => {
                                    const a = -Math.PI / 2 + (i * 2 * Math.PI) / numAspects;
                                    return `${(CX + rad * Math.cos(a)).toFixed(1)},${(CY + rad * Math.sin(a)).toFixed(1)}`;
                                  }).join(' ');

                                  return (
                                    <g key={lvl}>
                                      <polygon
                                        points={pts}
                                        fill={lvl === 5 ? '#ffffff' : lvl % 2 === 0 ? '#f8fafc' : 'none'}
                                        stroke={lvl === 5 ? '#64748b' : '#cbd5e1'}
                                        strokeWidth={lvl === 5 ? 1.5 : 1}
                                        strokeDasharray={lvl === 5 ? 'none' : '3,3'}
                                      />
                                      {/* Label Skor Grid */}
                                      <text
                                        x={CX}
                                        y={CY - rad - 2}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fontWeight="bold"
                                        fill="#64748b"
                                      >
                                        {lvl}.0
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Garis Jari-Jari (Spokes) */}
                                {aspectPoints.map((p) => {
                                  const endX = CX + R * Math.cos(p.angle);
                                  const endY = CY + R * Math.sin(p.angle);
                                  const isSelected = p.id === activeAspectId;
                                  return (
                                    <line
                                      key={`spoke-${p.id}`}
                                      x1={CX}
                                      y1={CY}
                                      x2={endX}
                                      y2={endY}
                                      stroke={isSelected ? '#0d9488' : '#cbd5e1'}
                                      strokeWidth={isSelected ? 2 : 1.2}
                                    />
                                  );
                                })}

                                {/* Poligon Data Siswa Riil */}
                                <polygon
                                  points={dataPolygonPoints}
                                  fill="url(#spiderFillGradient)"
                                  stroke="#0d9488"
                                  strokeWidth="3.2"
                                  filter="url(#glowEffect)"
                                  className="transition-all duration-300"
                                />

                                {/* Poligon Garis Putus-Putus Proyeksi Potensi (Jika Aktif) */}
                                {showPredictionInSpider && (
                                  <g>
                                    <polygon
                                      points={predictedPolygonPoints}
                                      fill="rgba(99, 102, 241, 0.16)"
                                      stroke="#6366f1"
                                      strokeWidth="2.6"
                                      strokeDasharray="6 3"
                                      className="transition-all duration-300"
                                    />
                                    {predictedAspectPoints.map((p) => (
                                      <circle
                                        key={`pred-dot-${p.id}`}
                                        cx={p.x}
                                        cy={p.y}
                                        r="4"
                                        fill="#6366f1"
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                      />
                                    ))}
                                  </g>
                                )}

                                {/* Titik Vertex (Simpul Sudut) */}
                                {aspectPoints.map((p) => {
                                  const isSelected = p.id === activeAspectId;
                                  const isHovered = p.id === spiderHoveredAspect;
                                  const highlighted = isSelected || isHovered;

                                  return (
                                    <g
                                      key={`dot-${p.id}`}
                                      className="cursor-pointer"
                                      onClick={() => setSelectedSpiderAspect(p.id)}
                                      onMouseEnter={() => setSpiderHoveredAspect(p.id)}
                                      onMouseLeave={() => setSpiderHoveredAspect(null)}
                                    >
                                      {highlighted && (
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r="13"
                                          fill="#0d9488"
                                          fillOpacity="0.25"
                                        />
                                      )}
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={highlighted ? 8 : 5.5}
                                        fill={highlighted ? '#0f766e' : '#0d9488'}
                                        stroke="#ffffff"
                                        strokeWidth={highlighted ? 2.5 : 2}
                                        className="transition-all duration-150"
                                      />
                                    </g>
                                  );
                                })}

                                {/* Label Teks Aspek di Sekeliling Radar */}
                                {aspectPoints.map((p) => {
                                  const isSelected = p.id === activeAspectId;
                                  const isHovered = p.id === spiderHoveredAspect;
                                  const highlighted = isSelected || isHovered;

                                  return (
                                    <g
                                      key={`label-${p.id}`}
                                      className="cursor-pointer"
                                      onClick={() => setSelectedSpiderAspect(p.id)}
                                      onMouseEnter={() => setSpiderHoveredAspect(p.id)}
                                      onMouseLeave={() => setSpiderHoveredAspect(null)}
                                    >
                                      <text
                                        x={p.outerX}
                                        y={p.outerY}
                                        textAnchor={p.anchor}
                                        fontSize={highlighted ? 11.5 : 10.5}
                                        fontWeight={highlighted ? 900 : 800}
                                        fill={highlighted ? '#0f766e' : '#1e293b'}
                                        fontFamily="sans-serif"
                                      >
                                        {p.no}. {p.nama}
                                        <tspan
                                          fontSize={highlighted ? 10.5 : 9.5}
                                          fontWeight="900"
                                          fill={p.score >= 4 ? '#16a34a' : p.score >= 3 ? '#2563eb' : '#d97706'}
                                        >
                                          {' '}({p.score})
                                        </tspan>
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                            </div>

                            {/* Tombol Toggle & Legenda Garis Proyeksi */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5 print:hidden">
                              <button
                                type="button"
                                onClick={() => setShowPredictionInSpider(!showPredictionInSpider)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                                  showPredictionInSpider
                                    ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-200'
                                    : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>
                                  {showPredictionInSpider
                                    ? 'Sembunyikan Garis Proyeksi'
                                    : `Tampilkan Garis Proyeksi (${predictionData.targetQuarterShort})`}
                                </span>
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold mt-2">
                              <div className="flex items-center gap-1.5 text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                                <span>Capaian Riil ({spiderAnalysis.averageScore} / 5.0)</span>
                              </div>
                              {showPredictionInSpider && (
                                <div className="flex items-center gap-1.5 text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                                  <span className="w-4 h-0.5 border-t-2 border-dashed border-indigo-600 inline-block"></span>
                                  <span>Proyeksi Potensi {predictionData.targetQuarterShort} ({predictionData.predictedAverageScore} / 5.0)</span>
                                </div>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-500 mt-1 font-medium print:hidden text-center">
                              💡 Tip: Klik titik sudut atau label teks untuk melihat penjelasan rincian aspek
                            </span>
                          </div>

                          {/* Sisi Kanan: Kartu Rincian & Penjelasan Aspek Terpilih */}
                          <div className="lg:col-span-5 bg-slate-50 border-2 border-teal-600 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm flex flex-col justify-between">
                            {/* Header Aspek Terpilih */}
                            <div className="border-b border-slate-300 pb-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
                                  Dimensi {currentAspect.no} • Kategori {currentAspect.kategori}
                                </span>
                                <span className={`px-2.5 py-1 rounded text-xs font-black uppercase text-white shadow-2xs ${
                                  currentAspect.grade === 'Exceptional' ? 'bg-purple-600' :
                                  currentAspect.grade === 'A' ? 'bg-emerald-600' :
                                  currentAspect.grade === 'B' ? 'bg-blue-600' :
                                  currentAspect.grade === 'C' ? 'bg-amber-600' : 'bg-rose-600'
                                }`}>
                                  Predikat {currentAspect.grade}
                                </span>
                              </div>
                              <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase mt-1">
                                {currentAspect.nama}
                              </h4>
                              <div className="flex items-center justify-between text-xs mt-2">
                                <span className="text-slate-600 font-semibold">Skor Capaian Dimensi:</span>
                                <span className="text-lg font-black text-teal-700">
                                  {currentAspect.score} <span className="text-xs text-slate-500 font-semibold">/ 5.0 ({currentAspect.percentage}%)</span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                  style={{ width: `${currentAspect.percentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Penjelasan Perolehan Nilai */}
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase mb-1">
                                <Info className="w-4 h-4 text-teal-600" />
                                <span>Penjelasan Perolehan Nilai:</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                {currentAspect.explanation}
                              </p>
                            </div>

                            {/* Daftar Indikator Penilaian */}
                            <div>
                              <div className="text-xs font-black text-slate-800 uppercase mb-2 flex items-center justify-between">
                                <span>Rincian Indikator Penilaian ({currentAspect.indicators.length}):</span>
                                <span className="text-[10px] text-slate-500">Nilai & Deskripsi</span>
                              </div>
                              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                {currentAspect.indicators.map((ind) => (
                                  <div
                                    key={ind.key}
                                    className="bg-white p-2 rounded-lg border border-slate-200 flex items-start justify-between gap-2 text-xs"
                                  >
                                    <div className="space-y-0.5 flex-1">
                                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-black border border-slate-300">
                                          {ind.kode}
                                        </span>
                                        <span>{ind.nama}</span>
                                      </div>
                                      <p className="text-[10.5px] text-slate-600 pl-6.5">{ind.deskripsi}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                                      ind.rating === 'Exceptional' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                      ind.rating === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                      ind.rating === 'B' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                      ind.rating === 'C' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                      'bg-rose-100 text-rose-800 border border-rose-300'
                                    }`}>
                                      {ind.rating} ({ind.score}.0)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ANALISIS KEKUATAN & KELEMAHAN SISWA */}
                  {(() => {
                    const spiderAnalysis = getStudentSpiderAnalysis(selectedStudent);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* KOTAK KEKUATAN */}
                        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
                          <div className="flex items-center gap-2 text-emerald-900 border-b border-emerald-200 pb-2">
                            <Award className="w-5 h-5 text-emerald-700" />
                            <h4 className="font-black text-sm uppercase tracking-wide">
                              🌟 Analisis Kekuatan Siswa (Top Strengths)
                            </h4>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {spiderAnalysis.strengthsSummary}
                          </p>
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-black uppercase text-emerald-900 block">
                              Dimensi Unggulan Yang Dikuasai:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {spiderAnalysis.topStrengths.map((s) => (
                                <span
                                  key={s.id}
                                  onClick={() => setSelectedSpiderAspect(s.id)}
                                  className="px-2.5 py-1 rounded-md bg-white border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs cursor-pointer hover:bg-emerald-100 transition"
                                >
                                  ✓ {s.nama} ({s.score} / 5.0) - Predikat {s.grade}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 leading-normal">
                            <strong>💡 Saran Penguatan:</strong> Berikan peran kepemimpinan dalam kelompok, proyek mandiri berbasis minat, serta kesempatan berbagi inspirasi untuk rekan sebaya.
                          </div>
                        </div>

                        {/* KOTAK KELEMAHAN & AREA PENDAMPINGAN */}
                        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
                          <div className="flex items-center gap-2 text-amber-950 border-b border-amber-200 pb-2">
                            <AlertTriangle className="w-5 h-5 text-amber-700" />
                            <h4 className="font-black text-sm uppercase tracking-wide">
                              🎯 Area Pendampingan & Fokus Peningkatan
                            </h4>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {spiderAnalysis.weaknessesSummary}
                          </p>
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-black uppercase text-amber-950 block">
                              Dimensi Prioritas Bimbingan:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {spiderAnalysis.topWeaknesses.map((w) => (
                                <span
                                  key={w.id}
                                  onClick={() => setSelectedSpiderAspect(w.id)}
                                  className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs cursor-pointer hover:bg-amber-100 transition"
                                >
                                  ⚠️ {w.nama} ({w.score} / 5.0) - Predikat {w.grade}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-950 leading-normal">
                            <strong>🤝 Catatan Kolaborasi:</strong> Lakukan pembiasaan konsisten berdurasi pendek namun rutin di rumah, dampingi dengan pendekatan positif tanpa membebani mental siswa.
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* 🔮 ANALISIS PREDIKSI POTENSI CAPAIAN TRIWULAN BERIKUTNYA */}
                  {/* BERDASARKAN TREN HISTORIS SPIDER CHART                   */}
                  {/* ======================================================== */}
                  {(() => {
                    const trendData = getStudentQuarterTrends(selectedStudent, activeTriwulan);
                    const predictionData = predictNextQuarterAchievement(selectedStudent, activeTriwulan, trendData.quarters);

                    return (
                      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 border-2 border-indigo-300 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm print:break-inside-avoid">
                        {/* Header Prediksi */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                                <Sparkles className="w-4 h-4" />
                              </span>
                              <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                                🔮 Analisis Prediksi Potensi Capaian Triwulan Berikutnya
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              Model proyeksi berbasis akselerasi & tren kenaikan nilai historis 9 dimensi pada Spider Chart
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black border border-indigo-300">
                              Target: {predictionData.targetQuarterLabel}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300">
                              Akurasi Model: {predictionData.confidenceLevel}
                            </span>
                          </div>
                        </div>

                        {/* 4 Kartu Metrik Prediksi */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Capaian Terkini ({predictionData.currentQuarterLabel.split(' ')[0]})</span>
                            <div className="text-xl font-black text-slate-700 mt-0.5">
                              {predictionData.currentOverallGrade === '-' ? '—' : predictionData.currentAverageScore} <span className="text-[10px] font-normal text-slate-500">/ 5.0</span>
                            </div>
                            <span className="text-[10px] text-slate-600 font-semibold block">
                              Predikat: <strong className="text-slate-800">{predictionData.currentOverallGrade}</strong>
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border-2 border-indigo-400 shadow-2xs">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase block">Estimasi Skor Berikutnya</span>
                            <div className="text-xl font-black text-indigo-700 mt-0.5">
                              {predictionData.predictedOverallGrade === '-' ? '—' : predictionData.predictedAverageScore} <span className="text-[10px] font-normal text-slate-500">/ 5.0</span>
                            </div>
                            <span className="text-[10px] text-indigo-900 font-bold block">
                              Prospek Predikat: <strong className="text-indigo-800">{predictionData.predictedOverallGrade}</strong>
                            </span>
                          </div>

                          <div className={`p-3 rounded-xl border shadow-2xs ${
                            predictionData.averageDiff >= 0
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-rose-50 border-rose-300 text-rose-950'
                          }`}>
                            <span className="text-[10px] font-bold uppercase block">Potensi Pertumbuhan</span>
                            <div className={`text-xl font-black mt-0.5 flex items-center gap-1 ${
                              predictionData.averageDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              <span>{predictionData.averageDiff >= 0 ? `+${predictionData.averageDiff}` : predictionData.averageDiff}</span>
                              <span className="text-xs font-bold">({predictionData.averagePercentChange >= 0 ? `+${predictionData.averagePercentChange}` : predictionData.averagePercentChange}%)</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider block">
                              {predictionData.readinessStatus}
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Peluang Lonjakan Terbesar</span>
                            <div className="text-xs font-black text-indigo-900 truncate mt-1">
                              {predictionData.topAcceleratingAspects[0]?.nama || '-'}
                            </div>
                            <span className="text-[10px] text-emerald-600 font-black block">
                              +{predictionData.topAcceleratingAspects[0]?.scoreDiff} poin (+{predictionData.topAcceleratingAspects[0]?.percentChange}%)
                            </span>
                          </div>
                        </div>

                        {/* Kotak Narasi Ringkasan Prediksi */}
                        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs flex items-start gap-3 text-xs">
                          <span className="text-2xl mt-0.5">💡</span>
                          <div className="space-y-1 text-slate-700">
                            <strong className="text-indigo-950 font-black uppercase text-xs block">
                              Ikhtisar Prospek Perkembangan Siswa:
                            </strong>
                            <p className="leading-relaxed">
                              {predictionData.summaryDescription}
                            </p>
                          </div>
                        </div>

                        {/* Dua Kolom: 3 Aspek Akselerasi & 2 Aspek Prioritas Intervensi */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Kolom Akselerasi Unggulan */}
                          <div className="bg-white p-4 rounded-xl border border-emerald-300 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 text-emerald-900">
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                              <h5 className="font-black text-xs uppercase tracking-wider">
                                🚀 3 Dimensi dengan Potensi Lonjakan Tertinggi
                              </h5>
                            </div>
                            <div className="space-y-2">
                              {predictionData.topAcceleratingAspects.map((asp) => (
                                <div key={asp.id} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="text-slate-900">{asp.no}. {asp.nama}</span>
                                    <span className="text-emerald-700 font-black bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                                      {asp.currentScore} ➔ {asp.predictedScore} (+{asp.scoreDiff})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-normal">
                                    {asp.insight}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Kolom Fokus Pendampingan */}
                          <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-amber-100 pb-2 text-amber-950">
                              <Shield className="w-4 h-4 text-amber-600" />
                              <h5 className="font-black text-xs uppercase tracking-wider">
                                🎯 Area Prioritas Intervensi & Pengawalan
                              </h5>
                            </div>
                            <div className="space-y-2">
                              {predictionData.priorityInterventionAspects.map((asp) => (
                                <div key={asp.id} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-xs space-y-1">
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="text-slate-900">{asp.no}. {asp.nama}</span>
                                    <span className="text-amber-800 font-black bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                                      Estimasi {asp.predictedScore} ({asp.predictedGrade})
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 leading-normal">
                                    {asp.insight}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Tabel Komparasi Prediksi 9 Dimensi */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="uppercase font-black text-xs text-indigo-950">
                              📊 Matriks Estimasi Capaian 9 Dimensi (Saat Ini vs Target Prediksi):
                            </span>
                            <span className="text-[11px] text-slate-500">Skala Penilaian 1.0 - 5.0</span>
                          </div>
                          <div className="overflow-x-auto border border-indigo-200 rounded-xl bg-white shadow-2xs">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-indigo-950 text-white text-center font-bold">
                                  <th className="p-2 border-r border-indigo-800 w-10">NO</th>
                                  <th className="p-2 border-r border-indigo-800 text-left min-w-[130px]">DIMENSI ASPEK</th>
                                  <th className="p-2 border-r border-indigo-800 w-24">SKOR KINI</th>
                                  <th className="p-2 border-r border-indigo-800 w-28 bg-indigo-900">PROYEKSI NILAI</th>
                                  <th className="p-2 border-r border-indigo-800 w-24">ESTIMASI DELTA</th>
                                  <th className="p-2 border-r border-indigo-800 w-28">STATUS PROSPEK</th>
                                  <th className="p-2 text-left min-w-[240px]">ARAH PENDAMPINGAN</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {predictionData.aspectPredictions.map((asp) => (
                                  <tr key={asp.id} className="hover:bg-indigo-50/40 transition">
                                    <td className="p-2 text-center font-bold text-slate-600 border-r border-slate-200">{asp.no}</td>
                                    <td className="p-2 font-black text-slate-900 uppercase border-r border-slate-200">{asp.nama}</td>
                                    <td className="p-2 text-center font-bold text-slate-700 border-r border-slate-200">
                                      {asp.hasData ? `${asp.currentScore} (${asp.currentGrade})` : 'Belum ada data'}
                                    </td>
                                    <td className="p-2 text-center font-black text-indigo-700 bg-indigo-50/60 border-r border-slate-200">
                                      {asp.hasData ? `${asp.predictedScore} (${asp.predictedGrade})` : '—'}
                                    </td>
                                    <td className={`p-2 text-center font-black border-r border-slate-200 ${
                                      asp.scoreDiff > 0 ? 'text-emerald-700' : asp.scoreDiff < 0 ? 'text-rose-700' : 'text-slate-600'
                                    }`}>
                                      {asp.scoreDiff > 0 ? `+${asp.scoreDiff}` : asp.scoreDiff}
                                    </td>
                                    <td className="p-2 text-center border-r border-slate-200">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        !asp.hasData
                                          ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                          :
                                        asp.status === 'MELOJIT'
                                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                          : asp.status === 'MENINGKAT'
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : asp.status === 'STABIL'
                                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                                      }`}>
                                        {!asp.hasData ? 'Belum Dinilai' : asp.status === 'MELOJIT' ? '🚀 Melonjak' : asp.status === 'MENINGKAT' ? '📈 Meningkat' : asp.status === 'STABIL' ? '⚖️ Stabil' : '⚠️ Bimbingan'}
                                      </span>
                                    </td>
                                    <td className="p-2 text-slate-700 text-[11px] leading-relaxed">
                                      {asp.insight}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Rencana Aksi Kolaboratif Guru & Orang Tua */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <strong className="text-slate-900 font-black uppercase text-[11px] flex items-center gap-1.5">
                              🎓 Rekomendasi Tindak Lanjut Guru (Sekolah):
                            </strong>
                            <ul className="space-y-1 text-slate-700 text-[11px] list-disc list-inside leading-relaxed">
                              {predictionData.actionPlanTeacher.map((act, i) => (
                                <li key={i}>{act}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <strong className="text-slate-900 font-black uppercase text-[11px] flex items-center gap-1.5">
                              🏡 Rekomendasi Pendampingan Orang Tua (Rumah):
                            </strong>
                            <ul className="space-y-1 text-slate-700 text-[11px] list-disc list-inside leading-relaxed">
                              {predictionData.actionPlanParents.map((act, i) => (
                                <li key={i}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ======================================================== */}
                  {/* VISUALISASI TREN NILAI SISWA DENGAN RECHARTS             */}
                  {/* PROGRES PERKEMBANGAN DARI TRIWULAN SEBELUMNYA           */}
                  {/* ======================================================== */}
                  {(() => {
                    const trendData = getStudentQuarterTrends(selectedStudent, activeTriwulan);
                    const selectedAspectMeta = ASPEK_LIST.find((a) => a.id === selectedTrendAspectId) || ASPEK_LIST[0];

                    // Prepare single aspect quarterly trend data
                    const singleAspectTrendData = trendData.quarters.map((q) => {
                      const rawScore = q[selectedTrendAspectId] !== undefined
                        ? q[selectedTrendAspectId]
                        : (selectedTrendAspectId === 'islamicLiteracy' ? q.islamic_literacy : (selectedTrendAspectId === 'islamic_literacy' ? q.islamicLiteracy : undefined));
                      const scoreNum = typeof rawScore === 'number' && Number.isFinite(rawScore) ? rawScore : null;
                      return {
                        periode: q.periode,
                        label: q.label,
                        nilai: scoreNum
                      };
                    });

                    return (
                      <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm print:break-inside-avoid">
                        {/* Header Tren & Switcher Mode Visualisasi */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                                <TrendingUp className="w-4 h-4" />
                              </span>
                              <h4 className="font-black text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                                📈 Tren Progres Perkembangan Siswa Antar-Triwulan
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              Visualisasi komparasi capaian hasil belajar dari triwulan sebelumnya (TW 1, TW 2, TW 3) hingga saat ini (TW 4)
                            </p>
                          </div>

                          {/* Mode Switcher Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-300 shadow-2xs print:hidden">
                            <button
                              type="button"
                              onClick={() => setTrendChartMode('area')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                trendChartMode === 'area'
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Tampilkan grafik kurva tren skor rerata"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Kurva Rerata</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTrendChartMode('bar')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                trendChartMode === 'bar'
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                              title={`Tampilkan perbandingan 9 dimensi TW ${Math.max(1, Number(activeTriwulan.slice(1)) - 1)} vs TW ${activeTriwulan.slice(1)}`}
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>Komparasi 9 Dimensi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTrendChartMode('dimension')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                trendChartMode === 'dimension'
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Pilih dan fokus pada satu dimensi tertentu"
                            >
                              <Compass className="w-3.5 h-3.5" />
                              <span>Per Dimensi</span>
                            </button>
                          </div>
                        </div>

                        {/* Kartu Ringkasan Progres Nilai */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              {Number(activeTriwulan.slice(1)) > 1 ? `Triwulan ${Number(activeTriwulan.slice(1)) - 1} (Lalu)` : 'Periode Sebelumnya'}
                            </span>
                            <div className="text-lg font-black text-slate-700 mt-0.5">
                              {trendData.prevRerata ?? '—'} <span className="text-[10px] font-normal text-slate-500">/ 5.0</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-semibold block">Periode sebelumnya</span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-teal-300 shadow-2xs">
                            <span className="text-[10px] font-bold text-teal-700 uppercase block">Triwulan {activeTriwulan.slice(1)} (Saat Ini)</span>
                            <div className="text-lg font-black text-teal-700 mt-0.5">
                              {trendData.currentRerata ?? '—'} <span className="text-[10px] font-normal text-slate-500">/ 5.0</span>
                            </div>
                            <span className="text-[10px] text-teal-600 font-semibold block">Capaian terkini</span>
                          </div>

                          <div className={`p-2.5 rounded-xl border shadow-2xs ${
                            trendData.isOverallUp === true
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : trendData.isOverallUp === false
                                ? 'bg-rose-50 border-rose-300 text-rose-950'
                                : 'bg-slate-50 border-slate-300 text-slate-700'
                          }`}>
                            <span className="text-[10px] font-bold uppercase block">
                              {trendData.isOverallUp === null ? 'Belum dapat dibandingkan' : trendData.isOverallUp ? 'Pertumbuhan (Delta)' : 'Penurunan'}
                            </span>
                            <div className={`text-lg font-black mt-0.5 flex items-center gap-1 ${
                              trendData.isOverallUp === true ? 'text-emerald-700' : trendData.isOverallUp === false ? 'text-rose-700' : 'text-slate-700'
                            }`}>
                              {trendData.isOverallUp === true ? <TrendingUp className="w-4 h-4" /> : trendData.isOverallUp === false ? <TrendingDown className="w-4 h-4" /> : null}
                              <span>{trendData.overallDiff === null ? '—' : trendData.isOverallUp ? `+${trendData.overallDiff}` : trendData.overallDiff}</span>
                              <span className="text-xs font-bold">({trendData.overallPercent === null ? '—' : trendData.overallPercent > 0 ? `+${trendData.overallPercent}` : trendData.overallPercent}%)</span>
                            </div>
                            <span className="text-[10px] font-medium block">
                              {trendData.isOverallUp === null ? 'Data penilaian belum lengkap' : trendData.isOverallUp ? 'Tren meningkat positif' : 'Perlu stimulasi'}
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Lompatan Tertinggi</span>
                            <div className="text-xs font-black text-indigo-900 truncate mt-1">
                              {trendData.highestGrowthDimension?.nama ?? 'Belum tersedia'}
                            </div>
                            <span className="text-[10px] text-emerald-600 font-black block">
                              {trendData.highestGrowthDimension?.selisih !== null && trendData.highestGrowthDimension?.selisih !== undefined
                                ? `${trendData.highestGrowthDimension.selisih >= 0 ? '+' : ''}${trendData.highestGrowthDimension.selisih} poin (${trendData.highestGrowthDimension.persen ?? 0}%)`
                                : 'Belum ada data pembanding'}
                            </span>
                          </div>
                        </div>

                        {/* Opsi Pemilih Dimensi Jika Mode 'dimension' Aktif */}
                        {trendChartMode === 'dimension' && (
                          <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 print:hidden text-xs">
                            <span className="font-bold text-slate-700">Pilih Dimensi yang Ingin Dilihat:</span>
                            <select
                              value={selectedTrendAspectId}
                              onChange={(e) => setSelectedTrendAspectId(e.target.value)}
                              className="px-3 py-1 bg-slate-50 border-2 border-teal-600 rounded-lg font-bold text-slate-900 cursor-pointer text-xs"
                            >
                              {ASPEK_LIST.map((asp) => (
                                <option key={asp.id} value={asp.id}>
                                  Dimensi {asp.no}: {asp.nama}
                                </option>
                              ))}
                            </select>
                            <span className="text-slate-500 text-[11px]">
                              Kategori: {selectedAspectMeta.kategori}
                            </span>
                          </div>
                        )}

                        {/* Area Render Recharts */}
                        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
                          {trendChartMode === 'area' && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                                <span>Kurva Skor Rerata Perkembangan Siswa (Skala 1.0 - 5.0)</span>
                                <span className="text-amber-600 font-bold">Garis Putus-Putus: Standar KKM (3.5)</span>
                              </div>
                              <div className="w-full h-[250px] sm:h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={trendData.quarters}
                                    margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                                  >
                                    <defs>
                                      <linearGradient id="rerataGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.65} />
                                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.05} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                      dataKey="periode"
                                      stroke="#64748b"
                                      tick={{ fontSize: 11, fontWeight: 'bold' }}
                                    />
                                    <YAxis
                                      domain={[1, 5]}
                                      ticks={[1, 2, 3, 4, 5]}
                                      stroke="#64748b"
                                      tick={{ fontSize: 11 }}
                                    />
                                    <RechartsTooltip
                                      formatter={(val: any) => [`${val} / 5.0`, 'Skor Rerata']}
                                      labelFormatter={(lbl: any) => {
                                        const q = trendData.quarters.find((x) => x.periode === lbl);
                                        return q ? `${lbl} - ${q.label}` : lbl;
                                      }}
                                      contentStyle={{
                                        backgroundColor: '#0f172a',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        border: '1px solid #334155'
                                      }}
                                    />
                                    <ReferenceLine
                                      y={3.5}
                                      stroke="#f59e0b"
                                      strokeDasharray="4 4"
                                      label={{
                                        value: 'KKM 3.5 (Standar Baik)',
                                        position: 'insideTopLeft',
                                        fill: '#d97706',
                                        fontSize: 10,
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="rerata"
                                      name="Skor Rerata"
                                      stroke="#0d9488"
                                      strokeWidth={3.5}
                                      fillOpacity={1}
                                      fill="url(#rerataGradient)"
                                      activeDot={{ r: 7, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {trendChartMode === 'bar' && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                                <span>Perbandingan Nilai 9 Dimensi: Triwulan III (Sebelumnya) vs Triwulan IV (Saat Ini)</span>
                                <span className="text-teal-700 font-bold">Skala Capaian 1.0 - 5.0</span>
                              </div>
                              <div className="w-full h-[270px] sm:h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={trendData.dimensionComparisons}
                                    margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                      dataKey="singkatan"
                                      stroke="#475569"
                                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                                      angle={-20}
                                      textAnchor="end"
                                    />
                                    <YAxis
                                      domain={[0, 5]}
                                      ticks={[0, 1, 2, 3, 4, 5]}
                                      stroke="#64748b"
                                      tick={{ fontSize: 11 }}
                                    />
                                    <RechartsTooltip
                                      formatter={(val: any, name: any) => [`${val} / 5.0`, name]}
                                      labelFormatter={(lbl: any) => {
                                        const d = trendData.dimensionComparisons.find((x) => x.singkatan === lbl || x.nama === lbl);
                                        return d ? `Dimensi: ${d.nama}` : lbl;
                                      }}
                                      contentStyle={{
                                        backgroundColor: '#0f172a',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        border: '1px solid #334155'
                                      }}
                                    />
                                    <RechartsLegend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                                    <Bar
                                      dataKey="triwulanLalu"
                                      name="Triwulan III (Sebelumnya)"
                                      fill="#94a3b8"
                                      radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                      dataKey="triwulanIni"
                                      name="Triwulan IV (Saat Ini)"
                                      fill="#0d9488"
                                      radius={[4, 4, 0, 0]}
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {trendChartMode === 'dimension' && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                                <span>Perkembangan Dimensi: {selectedAspectMeta.nama} ({selectedAspectMeta.kategori})</span>
                                <span className="text-teal-700 font-bold">Progres TW 1 s.d. TW 4</span>
                              </div>
                              <div className="w-full h-[250px] sm:h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={singleAspectTrendData}
                                    margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                      dataKey="periode"
                                      stroke="#64748b"
                                      tick={{ fontSize: 11, fontWeight: 'bold' }}
                                    />
                                    <YAxis
                                      domain={[1, 5]}
                                      ticks={[1, 2, 3, 4, 5]}
                                      stroke="#64748b"
                                      tick={{ fontSize: 11 }}
                                    />
                                    <RechartsTooltip
                                      formatter={(val: any) => [`${val} / 5.0`, `Skor ${selectedAspectMeta.nama}`]}
                                      labelFormatter={(lbl: any) => {
                                        const q = trendData.quarters.find((x) => x.periode === lbl);
                                        return q ? `${lbl} - ${q.label}` : lbl;
                                      }}
                                      contentStyle={{
                                        backgroundColor: '#0f172a',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        border: '1px solid #334155'
                                      }}
                                    />
                                    <ReferenceLine
                                      y={3.5}
                                      stroke="#f59e0b"
                                      strokeDasharray="4 4"
                                      label={{
                                        value: 'KKM 3.5',
                                        position: 'insideTopLeft',
                                        fill: '#d97706',
                                        fontSize: 10,
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="nilai"
                                      name={selectedAspectMeta.nama}
                                      stroke={selectedAspectMeta.colorBorder || '#7030a0'}
                                      strokeWidth={3.5}
                                      dot={{ r: 6, fill: selectedAspectMeta.colorBorder || '#7030a0', stroke: '#ffffff', strokeWidth: 2 }}
                                      activeDot={{ r: 8, fill: selectedAspectMeta.colorBorder || '#7030a0', stroke: '#ffffff', strokeWidth: 2 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Catatan Analisis & Refleksi Guru */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-start gap-2.5">
                          <span className="text-lg">📊</span>
                          <div className="space-y-0.5 text-slate-700">
                            <span className="font-bold text-slate-900">Catatan Refleksi Progres:</span>
                            <p className="leading-relaxed">
                              Ananda <strong className="text-slate-900">{selectedStudent.nama}</strong> mengalami perubahan rerata sebesar{' '}
                              <strong className={trendData.isOverallUp === true ? 'text-emerald-700' : trendData.isOverallUp === false ? 'text-rose-700' : 'text-slate-700'}>
                                {trendData.overallDiff === null
                                ? 'belum dapat dibandingkan karena data periode belum lengkap'
                                : `${trendData.isOverallUp ? '+' : ''}${trendData.overallDiff} poin (${trendData.overallPercent === null ? '—' : `${trendData.overallPercent > 0 ? '+' : ''}${trendData.overallPercent}%`})`}
                              </strong>{' '}
                              {trendData.overallDiff === null ? '' : 'dibandingkan evaluasi Triwulan sebelumnya.'} Peningkatan paling menonjol tercatat pada aspek{' '}
                              <strong className="text-teal-800">{trendData.highestGrowthDimension?.nama ?? 'yang telah memiliki data pembanding'}</strong>
                              {trendData.highestGrowthDimension?.selisih !== null && trendData.highestGrowthDimension?.selisih !== undefined
                                ? ` dengan kenaikan ${trendData.highestGrowthDimension.selisih >= 0 ? '+' : ''}${trendData.highestGrowthDimension.selisih} poin.`
                                : '.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TABEL LENGKAP REKAPITULASI 9 DIMENSI */}
                  {(() => {
                    const spiderAnalysis = getStudentSpiderAnalysis(selectedStudent);
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="uppercase font-black text-xs">📋 Rekapitulasi Nilai & Keterangan 9 Dimensi:</span>
                          <span className="text-[11px] text-slate-500">Klik 'Periksa' untuk membuka detail</span>
                        </div>
                        <div className="overflow-x-auto border border-slate-300 rounded-xl">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-white text-center font-bold">
                                <th className="p-2 border-r border-slate-700 w-10">NO</th>
                                <th className="p-2 border-r border-slate-700 min-w-[140px] text-left">DIMENSI ASPEK</th>
                                <th className="p-2 border-r border-slate-700 min-w-[130px] text-left">KATEGORI</th>
                                <th className="p-2 border-r border-slate-700 w-24">SKOR (1-5)</th>
                                <th className="p-2 border-r border-slate-700 w-24">PREDIKAT</th>
                                <th className="p-2 border-r border-slate-700 text-left min-w-[280px]">PENJELASAN PEROLEHAN NILAI</th>
                                <th className="p-2 w-20 print:hidden">AKSI</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {spiderAnalysis.aspects.map((asp) => (
                                <tr
                                  key={asp.id}
                                  className={`hover:bg-slate-50 transition ${asp.id === selectedSpiderAspect ? 'bg-teal-50' : 'bg-white'}`}
                                >
                                  <td className="p-2 font-bold text-center border-r border-slate-200">{asp.no}</td>
                                  <td className="p-2 font-black text-slate-900 uppercase border-r border-slate-200">{asp.nama}</td>
                                  <td className="p-2 text-slate-600 border-r border-slate-200">{asp.kategori}</td>
                                  <td className="p-2 text-center font-black text-teal-700 border-r border-slate-200">
                                    {asp.score} / 5.0
                                  </td>
                                  <td className="p-2 text-center border-r border-slate-200">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-white ${
                                      asp.grade === 'Exceptional' ? 'bg-purple-600' :
                                      asp.grade === 'A' ? 'bg-emerald-600' :
                                      asp.grade === 'B' ? 'bg-blue-600' :
                                      asp.grade === 'C' ? 'bg-amber-600' : 'bg-rose-600'
                                    }`}>
                                      {asp.grade}
                                    </span>
                                  </td>
                                  <td className="p-2 text-slate-700 text-[11px] leading-relaxed border-r border-slate-200">
                                    {asp.explanation}
                                  </td>
                                  <td className="p-2 text-center print:hidden">
                                    <button
                                      onClick={() => setSelectedSpiderAspect(asp.id)}
                                      className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                    >
                                      Periksa
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* ====================================================== */
                /* 2. TAMPILAN LEMBAR RAPOR RESMI (FORMAT ASLI SEKOLAH)   */
                /* ====================================================== */
                <React.Fragment>
                  {/* ======================================================== */}
                  {/* LEMBAR RAPOR CETAK RESMI (STANDAR A4/F4 SIAP CETAK/PDF)  */}
                  {/* ======================================================== */}
                  <div
                    id="lembar-rapor-cetak"
                    style={{
                      fontFamily: (FONT_OPTIONS.find((f) => f.id === reportFontFamily) || FONT_OPTIONS[0]).css,
                      fontSize: (FONT_SIZES.find((s) => s.id === reportFontSize) || FONT_SIZES[1]).bodyFont
                    }}
                    className="bg-white mx-auto border-2 border-black p-6 sm:p-10 max-w-[210mm] text-black print:border-none print:p-0 print:m-0 print:max-w-none shadow-sm transition-all"
                  >
                {/* 1. KOP SEKOLAH RESMI ATAU KOP GAMBAR UNGGAHAN PENGGUNA */}
                {showKopSekolah && uploadedKopImage && (
                  <div className="relative group text-center mb-3 pb-2 border-b-2 border-black">
                    <img
                      src={uploadedKopImage}
                      alt="Kop Surat Resmi Sekolah"
                      className="w-full max-h-36 sm:max-h-44 object-contain mx-auto"
                    />
                    <div className="mt-1 print:hidden flex items-center justify-center gap-2 text-xs">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        ✓ Menggunakan Kop Resmi Sekolah
                      </span>
                      <button
                        onClick={() => kopFileInputRef.current?.click()}
                        className="text-blue-700 hover:underline font-semibold"
                      >
                        Ganti Gambar
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={handleRemoveUploadedKop}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Hapus / Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* 3 BARIS JUDUL LAPORAN RESMI (TERHUBUNG 100% KE DATABASE KOTAK 4) */}
                <div className="text-center my-3 space-y-0.5">
                  {metaRapor.judulLaporan.baris1 && (
                    <h1 className="text-[13px] font-black uppercase tracking-wide text-black leading-tight">
                      {metaRapor.judulLaporan.baris1}
                    </h1>
                  )}
                  {metaRapor.judulLaporan.baris2 && (
                    <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-black leading-tight">
                      {metaRapor.judulLaporan.baris2}
                    </h2>
                  )}
                  {metaRapor.judulLaporan.baris3 && (
                    <h3 className="text-[13px] font-bold uppercase tracking-wide text-slate-800 leading-tight">
                      {metaRapor.judulLaporan.baris3}
                    </h3>
                  )}
                </div>

                {/* 2. IDENTITAS PESERTA DIDIK (FORMAT RINGKAS ATAU TABEL) */}
                {studentInfoStyle === 'simple' ? (
                  <div className="mb-3 text-xs font-bold leading-relaxed">
                    <table className="w-full max-w-[420px] table-fixed border-none mb-1 text-xs">
                      <colgroup>
                        <col className="w-[100px]" />
                        <col className="w-[12px]" />
                        <col />
                      </colgroup>
                      <tbody>
                        <tr>
                          <td className="border-none py-1 pr-2 font-bold text-slate-800 text-xs">Nama Siswa</td>
                          <td className="border-none py-1 font-bold text-black">:</td>
                          <td className="border-none py-1 font-bold uppercase tracking-wide text-xs leading-snug text-black">{selectedStudent.nama}</td>
                        </tr>
                        <tr>
                          <td className="border-none py-0.5 pr-2 font-bold text-slate-800 text-xs">NIS</td>
                          <td className="border-none py-0.5 font-bold text-black">:</td>
                          <td className="border-none py-0.5 font-bold text-xs text-black">{selectedStudent.nis}</td>
                        </tr>
                        <tr>
                          <td className="border-none py-0.5 pr-2 font-bold text-slate-800 text-xs">Kelas</td>
                          <td className="border-none py-0.5 font-bold text-black">:</td>
                          <td className="border-none py-0.5 font-bold text-xs text-black">{selectedStudent.kelas}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className="mb-4 border-2 overflow-hidden bg-white"
                    style={{ borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor }}
                  >
                    <div
                      className="px-3 py-1 border-b-2 font-black text-xs uppercase tracking-wider text-center"
                      style={{
                        backgroundColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).headerBg,
                        color: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).headerText,
                        borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor
                      }}
                    >
                      IDENTITAS PESERTA DIDIK
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        <tr className="border-b" style={{ borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor }}>
                          <td
                            className="w-36 sm:w-44 p-1.5 font-bold border-r text-slate-800"
                            style={{
                              backgroundColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).accentBg,
                              borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor
                            }}
                          >
                            Nama Peserta Didik
                          </td>
                          <td className="p-1.5 font-black uppercase text-black border-r" style={{ borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor }}>
                            : {selectedStudent.nama}
                          </td>
                          <td
                            className="w-28 sm:w-36 p-1.5 font-bold border-r text-slate-800"
                            style={{
                              backgroundColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).accentBg,
                              borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor
                            }}
                          >
                            Kelas / Rombel
                          </td>
                          <td className="p-1.5 font-bold text-black">
                            : {selectedStudent.kelas}
                          </td>
                        </tr>
                        <tr className="border-b" style={{ borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor }}>
                          <td
                            className="p-1.5 font-bold border-r text-slate-800"
                            style={{
                              backgroundColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).accentBg,
                              borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor
                            }}
                          >
                            Nomor Induk Siswa (NIS)
                          </td>
                          <td className="p-1.5 font-mono font-bold text-black border-r" style={{ borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor }}>
                            : {selectedStudent.nis}
                          </td>
                          <td
                            className="p-1.5 font-bold border-r text-slate-800"
                            style={{
                              backgroundColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).accentBg,
                              borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor
                            }}
                          >
                            Tanggal Raport
                          </td>
                          <td className="p-1.5 font-bold text-black">
                            : {metaRapor.tempatRaport ? `${metaRapor.tempatRaport}, ` : ''}{metaRapor.tanggalRaport}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. TABEL PENILAIAN CENTANG */}
                <div
                  className="mb-5 overflow-x-auto border-2"
                  style={{ borderColor: '#000000' }}
                >
                  <table className="report-assessment-table w-full text-xs border-collapse">
                    {tableHeaderStyle === 'screenshot2' ? (
                      /* HEADER FORMAT RESMI EXCEL DENGAN PERSONALISASI WARNA */
                      <thead>
                        <tr
                          className="border-b text-center font-black uppercase text-[11px]"
                          style={{ borderColor: (TABLE_THEMES[tableThemeColor] || TABLE_THEMES.default).borderColor }}
                        >
                          <th
                            rowSpan={2}
                            className="p-2 w-10 border-r text-center font-black"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.header,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            NO
                          </th>
                          <th
                            rowSpan={2}
                            className="p-2 w-28 border-r text-center font-black"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.header,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            ASPEK
                          </th>
                          <th
                            rowSpan={2}
                            className="p-2 border-r text-center font-black min-w-[200px]"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.header,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            INDIKATOR KEBERHASILAN
                          </th>
                          <th
                            colSpan={5}
                            className="p-1.5 text-center font-black"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.header,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            PENILAIAN
                          </th>
                        </tr>
                        <tr
                          className="border-b-2 text-center font-black text-[10.5px]"
                          style={{
                            backgroundColor: SCHOOL_REPORT_PALETTE.gradeHeader,
                            color: '#000000',
                            borderColor: '#000000'
                          }}
                        >
                          <th
                            className="p-1.5 w-24 border-r text-center"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.gradeHeader,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            Exceptional
                          </th>
                          <th
                            className="p-1.5 w-12 border-r text-center"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.gradeHeader,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            A
                          </th>
                          <th
                            className="p-1.5 w-12 border-r text-center"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.gradeHeader,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            B
                          </th>
                          <th
                            className="p-1.5 w-12 border-r text-center"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.gradeHeader,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            C
                          </th>
                          <th
                            className="p-1.5 w-16 text-center"
                            style={{
                              backgroundColor: SCHOOL_REPORT_PALETTE.gradeHeader,
                              color: '#000000',
                              borderColor: '#000000'
                            }}
                          >
                            Defisit
                          </th>
                        </tr>
                      </thead>
                    ) : (
                      /* HEADER KLASIK BERWARNA PERSIS GAMBAR 1 */
                      <thead>
                        <tr className="border-b-2 border-black text-center font-black uppercase tracking-wider text-[11px]">
                          <th className="p-2 w-10 border-r border-black bg-[#d9d9d9] text-black">
                            NO
                          </th>
                          <th className="p-2 border-r border-black text-left min-w-[220px] bg-[#d9d9d9] text-black">
                            ASPEK PENILAIAN / PERKEMBANGAN
                          </th>
                          <th className="p-2 w-28 border-r border-black text-center bg-[#7030a0] text-white">
                            EXCEPTIONAL
                          </th>
                          <th className="p-2 w-16 border-r border-black text-center bg-[#00b050] text-white">
                            A
                          </th>
                          <th className="p-2 w-16 border-r border-black text-center bg-[#0070c0] text-white">
                            B
                          </th>
                          <th className="p-2 w-16 border-r border-black text-center bg-[#ffc000] text-black">
                            C
                          </th>
                          <th className="p-2 w-20 text-center bg-[#c00000] text-white">
                            DEFISIT
                          </th>
                        </tr>
                      </thead>
                    )}
                    {printViewMode === 'detail' ? (
                        ASPEK_LIST.map((aspek) => {
                          const aspectPalette = getSchoolAspectPalette(aspek.id);
                          return (
                            <tbody
                              key={aspek.id}
                              className="report-aspect-group divide-y divide-black"
                              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                            >
                              {aspek.indikatorList.map((ind, indIdx) => {
                                const sec = (selectedStudent[aspek.id as keyof SiswaData] as Record<string, string>) || {};
                                const val = sec[ind.key] || '';
                                return (
                                  <tr key={`${aspek.id}-${ind.key}`} className="bg-white hover:bg-slate-50 transition">
                                {indIdx === 0 && (
                                  <td
                                    rowSpan={aspek.indikatorList.length}
                                    className="p-1.5 text-center font-bold border-r border-black align-middle w-10"
                                    style={{ backgroundColor: aspectPalette.number }}
                                  >
                                    {aspek.no}
                                  </td>
                                )}
                                {indIdx === 0 && (
                                  <td
                                    rowSpan={aspek.indikatorList.length}
                                    className="p-1.5 text-center font-bold uppercase text-[11px] text-black border-r border-black align-middle w-28"
                                    style={{ backgroundColor: aspectPalette.aspect }}
                                  >
                                    {aspek.nama}
                                  </td>
                                )}
                                <td
                                  className="p-1.5 border-r border-black text-left text-[11px] text-black"
                                  style={{ backgroundColor: aspectPalette.indicator }}
                                >
                                  {ind.labelLengkap}
                                </td>
                                <td
                                  onClick={() => updateStudentIndicator(selectedStudent.no, aspek.id, ind.key, 'Exceptional')}
                                  className="p-1.5 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-24"
                                  style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                                  title="Pilih Exceptional"
                                >
                                  {val === 'Exceptional' && <span className="font-bold text-base leading-none text-black">✓</span>}
                                </td>
                                <td
                                  onClick={() => updateStudentIndicator(selectedStudent.no, aspek.id, ind.key, 'A')}
                                  className="p-1.5 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-12"
                                  style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                                  title="Pilih A"
                                >
                                  {val === 'A' && <span className="font-bold text-base leading-none text-black">✓</span>}
                                </td>
                                <td
                                  onClick={() => updateStudentIndicator(selectedStudent.no, aspek.id, ind.key, 'B')}
                                  className="p-1.5 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-12"
                                  style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                                  title="Pilih B"
                                >
                                  {val === 'B' && <span className="font-bold text-base leading-none text-black">✓</span>}
                                </td>
                                <td
                                  onClick={() => updateStudentIndicator(selectedStudent.no, aspek.id, ind.key, 'C')}
                                  className="p-1.5 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-12"
                                  style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                                  title="Pilih C"
                                >
                                  {val === 'C' && <span className="font-bold text-base leading-none text-black">✓</span>}
                                </td>
                                <td
                                  onClick={() => updateStudentIndicator(selectedStudent.no, aspek.id, ind.key, 'Defisit')}
                                  className="p-1.5 text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-16"
                                  style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                                  title="Pilih Defisit"
                                >
                                  {val === 'Defisit' && <span className="font-bold text-base leading-none text-black">✓</span>}
                                </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          );
                        })
                      ) : (
                        ASPEK_LIST.map((aspek) => {
                          const grade = getAspectGrade(selectedStudent, aspek.id);
                          const aspectPalette = getSchoolAspectPalette(aspek.id);
                          return (
                            <tbody
                              key={aspek.id}
                              className="report-aspect-group divide-y divide-black"
                              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                            >
                            <tr className="bg-white hover:bg-slate-50 transition">
                              <td className="p-2 text-center font-bold border-r border-black w-10" style={{ backgroundColor: aspectPalette.number }}>{aspek.no}</td>
                              <td className="p-2 text-center font-bold uppercase text-[11px] border-r border-black w-28" style={{ backgroundColor: aspectPalette.aspect }}>{aspek.nama}</td>
                              <td className="p-2 text-left border-r border-black" style={{ backgroundColor: aspectPalette.indicator }}>{aspek.kategori}</td>
                              <td
                                onClick={() => updateStudentOverallGrade(selectedStudent.no, aspek.id, 'Exceptional')}
                                className="p-2 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-24"
                                style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                              >
                                {grade === 'Exceptional' && <span className="font-bold text-base leading-none text-black">✓</span>}
                              </td>
                              <td
                                onClick={() => updateStudentOverallGrade(selectedStudent.no, aspek.id, 'A')}
                                className="p-2 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-12"
                                style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                              >
                                {grade === 'A' && <span className="font-bold text-base leading-none text-black">✓</span>}
                              </td>
                              <td
                                onClick={() => updateStudentOverallGrade(selectedStudent.no, aspek.id, 'B')}
                                className="p-2 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-12"
                                style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                              >
                                {grade === 'B' && <span className="font-bold text-base leading-none text-black">✓</span>}
                              </td>
                              <td
                                onClick={() => updateStudentOverallGrade(selectedStudent.no, aspek.id, 'C')}
                                className="p-2 border-r border-black text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-12"
                                style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                              >
                                {grade === 'C' && <span className="font-bold text-base leading-none text-black">✓</span>}
                              </td>
                              <td
                                onClick={() => updateStudentOverallGrade(selectedStudent.no, aspek.id, 'Defisit')}
                                className="p-2 text-center font-bold cursor-pointer hover:bg-slate-100 select-none w-16"
                                style={{ backgroundColor: SCHOOL_REPORT_PALETTE.gradeCell }}
                              >
                                {grade === 'Defisit' && <span className="font-bold text-base leading-none text-black">✓</span>}
                              </td>
                            </tr>
                            </tbody>
                          );
                        })
                      )}
                  </table>
                </div>

                {/* 4. REFLEKSI PERKEMBANGAN SISWA */}
                <div className="report-print-section border border-black mb-4 overflow-hidden bg-white">
                  <div className="report-print-section-heading border-b border-black px-3 py-1 font-bold text-xs uppercase flex items-center justify-between text-black bg-slate-50">
                    <span>Refleksi Perkembangan Siswa:</span>
                    <button
                      onClick={() => {
                        updateStudentDeskripsiRapor(selectedStudent.no, generateDefaultDeskripsi(selectedStudent));
                        setPrintStatus('Deskripsi berhasil diatur ulang!');
                        setTimeout(() => setPrintStatus(null), 3000);
                      }}
                      className="text-[10px] font-bold text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded hover:bg-slate-100 print:hidden flex items-center gap-1 shadow-xs"
                      title="Reset ke narasi standar nilai siswa"
                    >
                      <Sparkles className="w-3 h-3 text-slate-600" /> Reset Narasi
                    </button>
                  </div>
                  <div className="p-2.5 bg-white">
                    <textarea
                      rows={4}
                      value={getReportDescription(selectedStudent)}
                      onChange={(e) => updateStudentDeskripsiRapor(selectedStudent.no, e.target.value)}
                      className="w-full text-xs leading-relaxed text-black bg-transparent focus:bg-slate-50 rounded focus:outline-none resize-y border-none font-sans print:hidden"
                      placeholder="Tuliskan refleksi capaian perkembangan siswa..."
                    />
                    {/* Tampilan teks statis saat dicetak */}
                    <div className="hidden print:block text-xs leading-relaxed">
                      {splitReportText(getReportDescription(selectedStudent)).map((paragraph, index) => (
                        <p key={`refleksi-${index}`} className="report-text-paragraph">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. SARAN */}
                <div className="report-print-section border border-black mb-6 overflow-hidden bg-white">
                  <div className="report-print-section-heading border-b border-black px-3 py-1 font-bold text-xs uppercase flex items-center justify-between text-black bg-slate-50">
                    <span>Saran:</span>
                    <button
                      onClick={() => {
                        updateStudentSaranRapor(selectedStudent.no, generateDefaultSaran(selectedStudent));
                        setPrintStatus('Saran berhasil diatur ulang!');
                        setTimeout(() => setPrintStatus(null), 3000);
                      }}
                      className="text-[10px] font-bold text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded hover:bg-slate-100 print:hidden flex items-center gap-1 shadow-xs"
                      title="Reset ke saran standar kelemahan siswa"
                    >
                      <Sparkles className="w-3 h-3 text-slate-600" /> Reset Saran
                    </button>
                  </div>
                  <div className="p-2.5 bg-white">
                    <textarea
                      rows={5}
                      value={selectedStudent.saranRapor ?? generateDefaultSaran(selectedStudent)}
                      onChange={(e) => updateStudentSaranRapor(selectedStudent.no, e.target.value)}
                      className="w-full text-xs leading-relaxed text-black bg-transparent focus:bg-slate-50 rounded focus:outline-none resize-y border-none font-sans print:hidden"
                      placeholder="Tuliskan saran tindak lanjut bagi siswa..."
                    />
                    {/* Tampilan teks statis saat dicetak */}
                    <div className="hidden print:block text-xs leading-relaxed">
                      {splitReportText(selectedStudent.saranRapor ?? generateDefaultSaran(selectedStudent)).map((paragraph, index) => (
                        <p key={`saran-${index}`} className="report-text-paragraph">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 6. KOLOM TANDA TANGAN (HANYA KEPALA SEKOLAH DAN GURU KELAS SEJAJAR) */}
                <div className="pt-4 text-xs">
                  <div className="grid grid-cols-2 text-center gap-6">
                    {/* KEPALA SEKOLAH */}
                    <div>
                      <p className="font-semibold text-black mb-16">
                        Mengetahui,<br />Kepala Sekolah
                      </p>
                      <p className="font-black underline uppercase text-xs text-black">
                        {metaRapor.kepalaSekolah.nama}
                      </p>
                      <p className="text-xs text-slate-700 font-semibold">
                        NIY. {metaRapor.kepalaSekolah.niy}
                      </p>
                    </div>

                    {/* GURU KELAS */}
                    <div>
                      <p className="font-semibold text-black mb-16">
                        {metaRapor.tempatRaport}, {metaRapor.tanggalRaport}<br />
                        Guru Kelas IV,
                      </p>
                      <p className="font-black underline uppercase text-xs text-black">
                        {metaRapor.guruKelas.nama}
                      </p>
                      <p className="text-xs text-slate-700 font-semibold">
                        NIY. {metaRapor.guruKelas.niy}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              </React.Fragment>
              )}
            </div>
          )}
            </>
          )}
          </main>
        </div>
      </div>
    </div>
  );
}
