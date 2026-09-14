# Stockify — Sistem Inventaris Ruangan Komputer

Aplikasi inventaris untuk Lab Komputer. Repo ini berisi dua versi:

- **PWA** (folder root: `index.html`, `style.css`, `script.js`, dst.) — siap deploy ke **GitHub Pages**.
- **Aplikasi mobile** (`mobile-app/`) — React Native + Expo, untuk build APK Android.

## 🚀 Deploy PWA ke GitHub Pages (otomatis)

Repo ini sudah dilengkapi GitHub Actions workflow (`.github/workflows/deploy.yml`) yang otomatis men-deploy isi folder root sebagai situs GitHub Pages setiap kali ada push ke branch `main`.

Langkah setup (sekali saja):

1. Push/upload repo ini ke GitHub.
2. Buka repo di GitHub → **Settings → Pages**.
3. Pada bagian **Build and deployment → Source**, pilih **GitHub Actions**.
4. Push ke branch `main` (atau jalankan workflow secara manual lewat tab **Actions → Deploy Stockify PWA to GitHub Pages → Run workflow**).
5. Setelah workflow selesai (hijau ✅), situs akan tersedia di:
   `https://<username>.github.io/<nama-repo>/`

Tidak perlu langkah build tambahan — PWA ini murni HTML/CSS/JS statis dan semua path sudah relatif, jadi otomatis bekerja baik di root domain maupun di subpath repo GitHub Pages.

### Deploy manual (alternatif, tanpa Actions)
Jika ingin cara paling sederhana tanpa workflow:
1. **Settings → Pages → Source**: pilih branch `main`, folder `/ (root)`.
2. Simpan. GitHub akan otomatis mem-build dan mempublikasikan isi folder root.

> Catatan: file `.nojekyll` sudah disertakan agar GitHub Pages tidak memproses file lewat Jekyll (mencegah file/folder tertentu ter-skip).

## Fitur PWA
- Icon Stockify diterapkan pada manifest & ikon aplikasi.
- Navbar menampilkan identitas `@david&rendi`.
- Splash screen dengan logo, nama aplikasi, pembuat, dan loading.
- Dashboard: total barang, kondisi baik, barang rusak.
- Tambah, edit, hapus inventaris (dengan konfirmasi).
- Pencarian nama/kode, filter ruangan & kondisi.
- Dark mode.
- Data tersimpan lokal (LocalStorage), termasuk export/import & backup/restore JSON.
- Installable (Add to Home Screen) via `manifest.json` + `service-worker.js` (mode offline).

### Field data
- Nama Barang
- Kode Inventaris
- Nama Ruangan
- Jumlah Barang
- Kondisi: Baik / Rusak Ringan / Rusak Berat

## 📱 Build APK (aplikasi mobile)

Kode aplikasi mobile ada di folder `mobile-app/`. Untuk build APK:

```bash
cd mobile-app
npm install
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

Profil `preview` pada `eas.json` sudah diset untuk menghasilkan APK.

## Struktur folder

```
.
├── index.html              # PWA — entry point (di-deploy ke GitHub Pages)
├── style.css
├── script.js
├── service-worker.js
├── manifest.json
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── .github/workflows/deploy.yml   # Auto-deploy ke GitHub Pages
├── .nojekyll
└── mobile-app/              # Aplikasi Expo/React Native (build APK)
    ├── App.js
    ├── app.json
    ├── package.json
    ├── eas.json
    └── assets/
```
