import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  off,
  update,
  remove
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

export const firebaseConfig = {
  apiKey: "AIzaSyDNGOS06tQ_63_UAHQSJj0uBxpIKWBbnZI",
  authDomain: "triwulan-a6d54.firebaseapp.com",
  databaseURL: "https://triwulan-a6d54-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "triwulan-a6d54",
  storageBucket: "triwulan-a6d54.firebasestorage.app",
  messagingSenderId: "635789273159",
  appId: "1:635789273159:web:4a69a70f6825f7a482a962",
  measurementId: "G-QN0N308TMZ"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export { ref, set, get, onValue, off, update, remove };

export interface TeacherRecord {
  id: string;
  nama: string;
  tingkatKelas: string; // '1' | '2' | '3' | '4' | '5' | '6'
  namaKelas: string; // e.g. 'Kelas 4' or '4A'
  username: string;
  password: string;
  niy?: string;
}

export interface AppSettings {
  instansi: string;
  namaSekolah: string;
  npsn: string;
  akreditasi: string;
  alamat: string;
  kontak: string;
  activeTriwulan: 'T1' | 'T2' | 'T3' | 'T4';
  tahunAjaran: string;
  tempatRaport: string;
  tanggalRaport: string;
  kepalaSekolahNama: string;
  kepalaSekolahNiy: string;
  guruKelasNama?: string;
  guruKelasNiy?: string;
}
