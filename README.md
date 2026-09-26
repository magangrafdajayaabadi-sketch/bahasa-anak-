# 🦉 Kiko Bahasa

Aplikasi belajar bahasa untuk **anak usia 3–12 tahun** — Inggris, Mandarin, Arab,
Korea, dan Jepang — dengan **AI Tutor** bernama Kiko yang memberi umpan balik
personal. Antarmukanya penuh warna dan terasa seperti permainan.

## 4 jenis latihan

| Latihan | Cara main | Peran AI Tutor |
|---|---|---|
| 🧩 **Kosakata** | Dengar/baca kata lalu pilih gambar atau tulisan yang benar | Memberi tips mengingat kata saat anak keliru |
| 🎧 **Pelafalan** | Dengarkan Kiko (pelan/normal), tirukan lewat mikrofon | Menilai bunyi dan memberi satu perbaikan konkret |
| 🎤 **Berbicara** | Ngobrol bergiliran dengan Kiko, ada contoh kalimat + suara | Membalas dalam bahasa target, memberi arti + pertanyaan lanjutan |
| ✏️ **Menulis** | Jiplak huruf di kanvas dengan jari; usia 9–12 juga mengeja | Menilai kerapian goresan dan memberi saran bentuk huruf |

Semua latihan berakhir dengan bintang ⭐, konfeti 🎉, lencana 🏅, dan runtutan
hari 🔥.

## 🧠 Sistem belajar adaptif

Aplikasi tidak sekadar mengacak soal — ia melacak penguasaan **tiap kata** dan
menyesuaikan diri.

**Pengulangan berjeda (Leitner).** Setiap kata punya "kotak" 0–5. Jawaban benar
menaikkan kotak dan menunda pengulangan (5 menit → 1 hari → 3 hari → 7 hari →
21 hari); jawaban keliru menurunkannya sehingga kata itu **segera muncul lagi**.
Kata di kotak 3 ke atas dianggap kuat.

**Soal disusun, bukan diacak.** Setiap sesi mendahulukan kata yang jatuh tempo
dan paling lemah, lalu kata baru, baru sisanya. Berlaku di kosakata, pelafalan,
dan menulis.

**🎯 Ulang Cerdas.** Bila ada kata yang jatuh tempo, tombolnya muncul di beranda
dan menyusun sesi lintas tema khusus dari kata-kata itu.

**Kesulitan menyesuaikan.** Ketepatan ≥85% menaikkan jumlah pilihan jawaban,
<60% menurunkannya — selalu di dalam batas usia (2–4 pilihan). Tingkat saat ini
ditampilkan sebagai 🌱 / 🌤️ / 🔥.

**Kiko punya ingatan.** Setiap permintaan umpan balik menyertakan ringkasan
padat: tingkat anak, ketepatan, kata yang masih sering meleset **beserta bentuk
kelirunya**, dan kata yang sudah lancar. Jadi Kiko bisa berkata *"kemarin 'neko'
juga terbaca 'neku', coba tekan bunyi 'ko'-nya"* alih-alih memuji generik.
Ringkasan ini dibatasi 4 kata agar hemat kuota gratis.

**💬 Ngobrol Bebas** (usia 6+). Selain latihan terpandu, anak bisa bicara apa
saja; Kiko menanggapi isinya dalam bahasa target, membetulkan paling banyak satu
kesalahan, lalu bertanya balik agar obrolan berlanjut.

**📋 Ringkasan untuk orang tua.** Panel orang tua menampilkan kata yang perlu
perhatian (lengkap dengan nomor kotak dan contoh kekeliruan) dan bisa membuat
laporan: ringkasan, kekuatan, fokus latihan, plus satu ide kegiatan 5 menit
tanpa layar di rumah.

## Menyesuaikan dengan usia

| Kelompok | Penyesuaian otomatis |
|---|---|
| 🐣 3–5 tahun | 2 pilihan jawaban, mode dengar-lalu-pilih-gambar (tanpa perlu bisa membaca), kata otomatis diucapkan |
| 🦊 6–8 tahun | 3 pilihan, mode baca ikut muncul, percakapan bebas terbuka |
| 🦁 9–12 tahun | 4 pilihan, tambahan babak mengeja (mengetik), boleh menjawab dengan ketikan |

## Menjalankan

```bash
npm install
npm run dev               # UI di http://localhost:5173, API di :8787
```

Lalu di aplikasi: ketuk **👨‍👩‍👧 (pojok kanan atas) → 🔑 Kunci API Gemini**,
tempel kunci Anda, tekan **Tes koneksi**, pilih model, lalu **Simpan**.

Perintah lain:

```bash
npm run build     # bundel produksi ke dist/
npm run dev:web   # hanya antarmuka
npm run dev:api   # hanya server AI Tutor
```

## 🔑 BYOK — kunci Gemini milik Anda sendiri

Aplikasi tidak memaketkan kunci apa pun. Setiap keluarga memakai kunci sendiri:

1. Buka <https://aistudio.google.com/apikey>, masuk dengan akun Google.
2. Tekan **Create API key** — gratis, tanpa kartu kredit.
3. Tempel di panel orang tua, tekan **Tes koneksi**.

**Pemilihan model.** Setelah kunci diuji, aplikasi memanggil `GET /v1beta/models`
dan menampilkan **model yang benar-benar bisa diakses kunci Anda**, diurutkan
dari versi terbaru. Model tier **Flash** / **Flash-Lite** dikelompokkan sebagai
*"Tersedia di paket gratis (disarankan)"* dan dipilih otomatis.

> Pendekatan ini disengaja: daftar dan kuota model gratis Google berubah cukup
> sering, jadi menanam satu nama model di dalam kode akan cepat usang. Dengan
> mengambil daftar dari kunci Anda, model terbaru muncul sendiri tanpa perlu
> memperbarui aplikasi. Batas kuota tetap perlu Anda cek di halaman AI Studio.

Penghematan kuota gratis sudah diterapkan: `thinkingBudget: 0` (tanpa penalaran
panjang), `maxOutputTokens: 800`, konteks pembelajar dibatasi 4 kata, seluruh
penjadwalan & penilaian dihitung di perangkat, dan AI hanya dipanggil saat
memang dibutuhkan — pada latihan kosakata misalnya hanya ketika anak keliru.

### Tanpa kunci pun tetap jalan

Kalau kunci belum diisi, server menjawab 503 dan aplikasi otomatis memakai
**tutor cadangan** yang berjalan sepenuhnya di perangkat: penilaian kemiripan
ucapan, penilaian jiplakan, pujian, dan tips tetap muncul. Seluruh sistem
adaptif — pengulangan berjeda, penyusunan soal, tingkat kesulitan, Ulang Cerdas,
dan ringkasan orang tua — juga tetap bekerja penuh karena dihitung lokal. Isi
kunci kapan saja untuk mengaktifkan umpan balik yang benar-benar personal.

## Arsitektur

```
server/index.mjs      Proksi Express ke Google Gemini (tanpa SDK, cukup fetch)
                      → GET  /api/models   daftar model milik kunci pengguna
                      → POST /api/tutor    umpan balik dengan responseSchema,
                        jadi hasilnya selalu JSON valid:
                        {praise, tip, correction, reply, stars…}
                      → POST /api/insight  laporan kemajuan untuk orang tua
                      → safetySettings BLOCK_LOW_AND_ABOVE (pengguna anak-anak)
                      → kunci tidak disimpan di server, hanya diteruskan

src/lib/mastery.ts    Mesin adaptif: kotak Leitner, penyusun sesi, tingkat
                      kesulitan, profil pembelajar untuk konteks AI
src/lib/settings.ts   BYOK: simpan/baca kunci + model, ambil daftar model
src/data/             Kurikulum: 5 tema × 6 kata × 5 bahasa + kalimat percakapan
src/lib/speech.ts     Text-to-speech, pengenalan suara, skor kemiripan (Levenshtein)
src/lib/tutor.ts      Klien AI Tutor + tutor cadangan luring
src/lib/progress.ts   Bintang, lencana, streak (localStorage)
src/lib/sfx.ts        Efek suara dibangkitkan Web Audio — tanpa file aset
src/components/       Maskot SVG, kanvas jiplak, komponen UI
src/screens/          Onboarding, pilih bahasa, beranda, 4 permainan,
                      panel orang tua, kartu pengaturan kunci API
```

### Cara penilaian bekerja

- **Pelafalan & berbicara** — ucapan diubah jadi teks oleh browser, lalu
  dibandingkan dengan tulisan asli *dan* cara bacanya (jarak Levenshtein,
  mengabaikan tanda nada/harakat). Skor terbaik yang dipakai, jadi anak tidak
  dihukum karena pengenal suara memilih ejaan lain.
- **Menulis** — huruf target dirender ke kanvas tersembunyi sebagai *mask*
  dengan pita toleransi tebal. Coretan anak dibandingkan piksel per piksel:
  berapa persen bentuk huruf tertutup, berapa persen coretan keluar garis.

## Catatan privasi & keamanan

- Profil, bintang, lencana, **dan kunci API** hanya disimpan di `localStorage`
  perangkat. Kunci dikirim per permintaan ke server lokal, yang meneruskannya ke
  Google — tidak ditulis ke disk server dan tidak masuk ke log.
- Tidak ada rekaman suara yang disimpan atau dikirim; browser mengubah suara
  menjadi teks, dan hanya teks singkat itu yang dinilai AI Tutor.
- Onboarding hanya meminta nama panggilan. Prompt sistem melarang Kiko meminta
  data pribadi anak.
- Panel orang tua berisi ringkasan kemajuan, status AI, saran durasi bermain,
  dan tombol hapus data.

## Keterbatasan yang perlu diketahui

- **Suara & mikrofon bergantung pada perangkat.** Text-to-speech dan pengenalan
  suara memakai Web Speech API. Chrome/Edge/Safari terbaru paling lengkap;
  Firefox belum mendukung pengenalan suara. Bahasa yang belum punya suara
  terpasang ditandai 🔇 di layar pemilihan, dan latihan pelafalan menyediakan
  tombol "Aku sudah menirukan" sebagai gantinya.
- **Kurikulum masih contoh** — 30 kata per bahasa (5 tema) plus 6 kalimat
  percakapan. Tambahkan entri baru di `src/data/curriculum.ts`; strukturnya satu
  konsep berisi kelima bahasa sekaligus, jadi menambah kata otomatis berlaku
  untuk semua bahasa dan semua jenis latihan.
