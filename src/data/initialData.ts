import { StudentRecord, SiswaAssessmentRecord, TriwulanKey } from '../types/rapor';

export const STUDENT_NAMES: { no: number; nama: string; nis: string }[] = [
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
  { no: 26, nama: 'MUHAMMAD树GAOZHAN AL GHIFARI'.replace('树', ''), nis: '202340027' },
  { no: 27, nama: 'PUTRI SALSABILA', nis: '202230022' },
  { no: 28, nama: 'RASYIQUL ABID IBNU PURNOMO', nis: '202340028' },
  { no: 29, nama: 'SHAKIRA RAMADHANI PERMANA', nis: '202340029' },
  { no: 30, nama: 'SHAZIA ATHALLA SUGIARTO', nis: '202340030' }
];

export const createEmptyAssessmentRecord = (): SiswaAssessmentRecord => ({
  kognitif: { rp: '', pi: '', rm: '', pm: '', kr: '', ki: '', deskripsi: '' },
  afektif: { em: '', sh: '', mo: '', ks: '', kt: '', deskripsi: '' },
  psikomotor: { mk: '', mh: '', re: '', kk: '', deskripsi: '' },
  sosial: { ot: '', ld: '', at: '', ko: '', deskripsi: '' },
  islamicLiteracy: { aq: '', ak: '', ib: '', deskripsi: '' },
  bilingual: { kd: '', sb: '', deskripsi: '' },
  talents: { uq: '', in: '', deskripsi: '' },
  experience: { ex: '', ob: '', re: '', deskripsi: '' },
  inklusivitas: { so: '', fa: '', ph: '', deskripsi: '' }
});

const ABIZAR_T1: SiswaAssessmentRecord = {
  kognitif: {
    rp: 'B',
    pi: 'B',
    rm: 'B',
    pm: 'B',
    kr: 'C',
    ki: 'C',
    deskripsi: 'Mampu memahami materi dengan baik dan berpikir kreatif dalam menyelesaikan tugas.'
  },
  afektif: {
    em: 'B',
    sh: 'B',
    mo: 'B',
    ks: 'B',
    kt: 'B',
    deskripsi: 'Menunjukkan kestabilan emosi dan kesiapan belajar yang baik.'
  },
  psikomotor: {
    mk: 'B',
    mh: 'A',
    re: 'A',
    kk: 'A',
    deskripsi: 'Sangat terampil dalam mengendalikan perilaku dan menggunakan peralatan di sekitarnya.'
  },
  sosial: {
    ot: 'A',
    ld: 'A',
    at: 'A',
    ko: 'A',
    deskripsi: 'Memiliki jiwa kepemimpinan yang baik, taat aturan, dan komunikatif.'
  },
  islamicLiteracy: {
    aq: 'A',
    ak: 'B',
    ib: 'B',
    deskripsi: 'Menunjukkan kecintaan mendalam terhadap Al-Qur\'an dan bersemangat dalam beribadah.'
  },
  bilingual: {
    kd: 'B',
    sb: 'B',
    deskripsi: 'Mulai percaya diri dalam menggunakan kosa kata dwi-bahasa sederhana.'
  },
  talents: {
    uq: 'A',
    in: 'Exceptional',
    deskripsi: 'Memiliki keunikan pribadi yang sangat positif dan minat hobi yang kuat.'
  },
  experience: {
    ex: 'Exceptional',
    ob: 'A',
    re: 'A',
    deskripsi: 'Sangat antusias bereksplorasi mencoba hal baru dan jeli dalam mengamati.'
  },
  inklusivitas: {
    so: 'A',
    fa: 'A',
    ph: 'A',
    deskripsi: 'Menunjukkan solidaritas tinggi, memperlakukan teman dengan adil dan respek.'
  },
  deskripsiRapor: `Selama periode Triwulan 1, Ananda Abizar Arfan Raqqilla menunjukkan perkembangan yang positif dan menggembirakan. Ananda tumbuh menjadi pribadi yang hangat, percaya diri, dan penuh rasa ingin tahu. Ia memiliki antusiasme tinggi dalam mengeksplorasi pengalaman belajar baru serta menunjukkan kekuatan menonjol pada aspek sosial-emosional dan keagamaan.`,
  saranRapor: `Terima kasih kepada Parents yang senantiasa mendampingi Ananda Abizar di rumah. Untuk terus menguatkan fokus dan daya ingat, Parents disarankan memberikan petunjuk terstruktur satu per satu dan mengulang obrolan santai yang memancing daya pikir kritis.`
};

const ABIZAR_T2: SiswaAssessmentRecord = {
  kognitif: {
    rp: 'A',
    pi: 'B',
    rm: 'B',
    pm: 'B',
    kr: 'B',
    ki: 'B',
    deskripsi: 'Rentang perhatian meningkat signifikan (RP = A), daya analisis kritis dan kreativitas semakin terasah.'
  },
  afektif: {
    em: 'B',
    sh: 'B',
    mo: 'B',
    ks: 'B',
    kt: 'B',
    deskripsi: 'Kematangan sikap dan kestabilan motivasi belajar terjaga stabil.'
  },
  psikomotor: {
    mk: 'B',
    mh: 'B',
    re: 'A',
    kk: 'B',
    deskripsi: 'Perlu stimulasi lanjutan pada kerapian motorik halus saat menyelesaikan tugas keterampilan.'
  },
  sosial: {
    ot: 'Exceptional',
    ld: 'Exceptional',
    at: 'A',
    ko: 'A',
    deskripsi: 'Kepemimpinan dan kepatuhan aturan kelompok semakin menonjol dan menjadi panutan rekan sebaya.'
  },
  islamicLiteracy: {
    aq: 'Exceptional',
    ak: 'A',
    ib: 'A',
    deskripsi: 'Hafalan surat pendek bertambah lancar dan menunjukkan adab islami yang sangat terpuji.'
  },
  bilingual: {
    kd: 'B',
    sb: 'B',
    deskripsi: 'Konsisten mempraktikkan kosakata bahasa Inggris dalam instruksi kelas.'
  },
  talents: {
    uq: 'Exceptional',
    in: 'Exceptional',
    deskripsi: 'Bakat seni dan kreativitas rancang bangun semakin tampak menonjol.'
  },
  experience: {
    ex: 'Exceptional',
    ob: 'Exceptional',
    re: 'A',
    deskripsi: 'Daya observasi terhadap lingkungan sekitar sangat teliti dan mampu merefleksikan hikmah.'
  },
  inklusivitas: {
    so: 'Exceptional',
    fa: 'A',
    ph: 'Exceptional',
    deskripsi: 'Sangat peduli, inklusif, dan selalu aktif mengajak teman yang pemalu untuk beraktivitas bersama.'
  },
  deskripsiRapor: `Pada Triwulan 2, Ananda Abizar Arfan Raqqilla mengalami lompatan kemajuan terutama pada dimensi kognitif dan kepemimpinan sosial. Konsentrasi belajar di kelas meningkat tajam didukung semangat ibadah harian yang mengagumkan.`,
  saranRapor: `Dukungan di rumah dapat difokuskan pada latihan motorik halus dan ketelitian melalui kegiatan merakit atau menggambar detail, serta mempertahankan apresiasi positif pada setiap usahanya.`
};

const ABIZAR_T3: SiswaAssessmentRecord = {
  kognitif: {
    rp: 'A',
    pi: 'A',
    rm: 'B',
    pm: 'A',
    kr: 'B',
    ki: 'B',
    deskripsi: 'Pemahaman instruksi belajar dan pemecahan masalah mandiri semakin matang.'
  },
  afektif: {
    em: 'A',
    sh: 'B',
    mo: 'A',
    ks: 'B',
    kt: 'A',
    deskripsi: 'Ketangguhan menghadapi soal menantang meningkat pesat, tidak mudah putus asa.'
  },
  psikomotor: {
    mk: 'A',
    mh: 'A',
    re: 'Exceptional',
    kk: 'A',
    deskripsi: 'Kerapian menulis dan koordinasi fisik menunjukkan peningkatan menggembirakan.'
  },
  sosial: {
    ot: 'Exceptional',
    ld: 'Exceptional',
    at: 'Exceptional',
    ko: 'A',
    deskripsi: 'Altruisme dan kepemimpinan berwibawa, mampu meredakan perselisihan di kelompok.'
  },
  islamicLiteracy: {
    aq: 'Exceptional',
    ak: 'Exceptional',
    ib: 'A',
    deskripsi: 'Karakter islami terinternalisasi dengan sangat baik dalam tutur kata dan perilaku.'
  },
  bilingual: {
    kd: 'A',
    sb: 'A',
    deskripsi: 'Percaya diri tinggi dalam menjawab pertanyaan dwibahasa secara spontan.'
  },
  talents: {
    uq: 'Exceptional',
    in: 'Exceptional',
    deskripsi: 'Menunjukkan inisiatif tinggi dalam menampilkan bakat dan proyek kreatif.'
  },
  experience: {
    ex: 'Exceptional',
    ob: 'Exceptional',
    re: 'Exceptional',
    deskripsi: 'Mampu menyusun kesimpulan hasil eksperimen sains dengan daya nalar runut.'
  },
  inklusivitas: {
    so: 'Exceptional',
    fa: 'Exceptional',
    ph: 'Exceptional',
    deskripsi: 'Penuh empati, menjunjung nilai keadilan dan persaudaraan tanpa sekat.'
  },
  deskripsiRapor: `Memasuki Triwulan 3, Ananda Abizar telah mengukuhkan capaian di kategori Unggul (A / Exceptional) pada hampir seluruh dimensi. Sikap mandiri, percaya diri dwibahasa, serta kepedulian sosialnya menjadi teladan hangat di kelas.`,
  saranRapor: `Pertahankan ritme belajar yang gembira. Ajak Ananda mendiskusikan topik bacaan ensiklopedia atau fenomena alam sehari-hari untuk terus menumbuhkan nalar kritisnya.`
};

const ABIZAR_T4: SiswaAssessmentRecord = {
  kognitif: {
    rp: 'A',
    pi: 'A',
    rm: 'A',
    pm: 'A',
    kr: 'A',
    ki: 'A',
    deskripsi: 'Capaian sempurna pada seluruh indikator kognitif dengan nilai rata-rata 4.00.'
  },
  afektif: {
    em: 'Exceptional',
    sh: 'A',
    mo: 'Exceptional',
    ks: 'A',
    kt: 'Exceptional',
    deskripsi: 'Memiliki kecerdasan emosional tinggi, ketangguhan mental prima, dan motivasi intrinsik.'
  },
  psikomotor: {
    mk: 'Exceptional',
    mh: 'A',
    re: 'Exceptional',
    kk: 'Exceptional',
    deskripsi: 'Keluwesan fisik, ketangkasan olahraga, dan kerapian karya motorik sangat mengesankan.'
  },
  sosial: {
    ot: 'Exceptional',
    ld: 'Exceptional',
    at: 'Exceptional',
    ko: 'Exceptional',
    deskripsi: 'Komunikator handal dan pemimpin muda berintegritas tinggi.'
  },
  islamicLiteracy: {
    aq: 'Exceptional',
    ak: 'Exceptional',
    ib: 'Exceptional',
    deskripsi: 'Menjadi teladan ibadah, tilawah tartil, dan akhlaqul karimah di lingkungan sekolah.'
  },
  bilingual: {
    kd: 'Exceptional',
    sb: 'Exceptional',
    deskripsi: 'Sangat fasih dan antusias dalam komunikasi dwi-bahasa kelas.'
  },
  talents: {
    uq: 'Exceptional',
    in: 'Exceptional',
    deskripsi: 'Bakat kepemimpinan, riset kecil, dan seni teraplikasi dengan gemilang.'
  },
  experience: {
    ex: 'Exceptional',
    ob: 'Exceptional',
    re: 'Exceptional',
    deskripsi: 'Refleksi pengalaman hidup yang mendalam dan kecintaan belajar seumur hidup.'
  },
  inklusivitas: {
    so: 'Exceptional',
    fa: 'Exceptional',
    ph: 'Exceptional',
    deskripsi: 'Pilar persahabatan inklusif yang senantiasa melindungi dan merangkul semua kawan.'
  },
  deskripsiRapor: `Di akhir tahun ajaran (Triwulan 4), Ananda Abizar Arfan Raqqilla menuntaskan seluruh target kompetensi dengan predikat Istimewa (Exceptional). Seluruh aspek perkembangan kognitif, afektif, kepemimpinan, dan spiritual berkembang holistik dan paripurna.`,
  saranRapor: `Selamat atas capaian luar biasa Ananda Abizar sepanjang tahun ajaran ini! Terus rawat api rasa ingin tahu dan kerendahan hati Ananda agar menjadi insan cerdas berkarakter mulia.`
};

export const INITIAL_MASTER_STUDENTS: StudentRecord[] = STUDENT_NAMES.map((s, idx) => {
  if (idx === 0) {
    return {
      no: s.no,
      nama: s.nama,
      nis: s.nis,
      kelas: 'IV (Empat)',
      tahunAjaran: '2026/2027',
      triwulan: {
        T1: ABIZAR_T1,
        T2: ABIZAR_T2,
        T3: ABIZAR_T3,
        T4: ABIZAR_T4
      }
    };
  }

  // Realistic deterministic progression for students 2..30
  const baseGradeIdx = (idx * 3) % 4; // 0: Exceptional, 1: A, 2: B, 3: C
  const gradeLevels: ('Exceptional' | 'A' | 'B' | 'C' | 'Defisit')[] = ['Exceptional', 'A', 'B', 'C', 'Defisit'];

  const getQuarterGrade = (stage: 1 | 2 | 3 | 4, offset: number) => {
    // stage 1 is lower, progressively increases
    const step = 4 - stage;
    const gIndex = Math.min(4, Math.max(0, baseGradeIdx + step - offset));
    return gradeLevels[gIndex] || 'B';
  };

  const buildStudentRecordForQuarter = (quarterNum: 1 | 2 | 3 | 4): SiswaAssessmentRecord => {
    const qKey = `T${quarterNum}` as TriwulanKey;
    const kogGrade = getQuarterGrade(quarterNum, 1);
    const afkGrade = getQuarterGrade(quarterNum, 0);
    const psiGrade = getQuarterGrade(quarterNum, 1);
    const sosGrade = getQuarterGrade(quarterNum, 0);
    const islGrade = getQuarterGrade(quarterNum, 1);
    const bilGrade = getQuarterGrade(quarterNum, 2);
    const talGrade = getQuarterGrade(quarterNum, 1);
    const expGrade = getQuarterGrade(quarterNum, 0);
    const inkGrade = getQuarterGrade(quarterNum, 0);

    return {
      kognitif: {
        rp: kogGrade,
        pi: kogGrade,
        rm: kogGrade,
        pm: kogGrade,
        kr: getQuarterGrade(quarterNum, 2),
        ki: getQuarterGrade(quarterNum, 2),
        deskripsi: `Perkembangan kognitif Triwulan ${quarterNum} menunjukkan capaian yang teratur.`
      },
      afektif: {
        em: afkGrade,
        sh: afkGrade,
        mo: afkGrade,
        ks: getQuarterGrade(quarterNum, 1),
        kt: getQuarterGrade(quarterNum, 1),
        deskripsi: `Sikap dan kepribadian terpantau baik pada Triwulan ${quarterNum}.`
      },
      psikomotor: {
        mk: psiGrade,
        mh: psiGrade,
        re: psiGrade,
        kk: psiGrade,
        deskripsi: `Aktivitas fisik dan keterampilan motorik berkembang memadai.`
      },
      sosial: {
        ot: sosGrade,
        ld: sosGrade,
        at: sosGrade,
        ko: sosGrade,
        deskripsi: `Komunikasi dan adaptasi sosial berjalan harmonis.`
      },
      islamicLiteracy: {
        aq: islGrade,
        ak: islGrade,
        ib: islGrade,
        deskripsi: `Semangat ibadah dan kecintaan Al-Qur\'an terbina rutin.`
      },
      bilingual: {
        kd: bilGrade,
        sb: bilGrade,
        deskripsi: `Pembiasaan kosakata dwi-bahasa mulai terbangun.`
      },
      talents: {
        uq: talGrade,
        in: talGrade,
        deskripsi: `Minat dan bakat siswa tersalurkan positif.`
      },
      experience: {
        ex: expGrade,
        ob: expGrade,
        re: expGrade,
        deskripsi: `Antusias dalam mengikuti kegiatan eksplorasi kelas.`
      },
      inklusivitas: {
        so: inkGrade,
        fa: inkGrade,
        ph: inkGrade,
        deskripsi: `Sikap ramah dan menghormati sesama teman terjaga baik.`
      },
      deskripsiRapor: `Ananda ${s.nama} menunjukkan perkembangan belajar yang positif pada Triwulan ${quarterNum}.`,
      saranRapor: `Pertahankan pembiasaan belajar baik di sekolah maupun di rumah.`
    };
  };

  return {
    no: s.no,
    nama: s.nama,
    nis: s.nis,
    kelas: 'IV (Empat)',
    tahunAjaran: '2026/2027',
    triwulan: {
      T1: buildStudentRecordForQuarter(1),
      T2: buildStudentRecordForQuarter(2),
      T3: buildStudentRecordForQuarter(3),
      T4: buildStudentRecordForQuarter(4)
    }
  };
});
