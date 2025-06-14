import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';

// --- Konfigurasi ---
// Daftar slug artikel yang akan diuji. Sebaiknya diisi dengan data nyata dari database Anda.
const articleSlugs = new SharedArray('articleSlugs', function () {
    // Anda bisa memuat ini dari file JSON atau langsung definisikan di sini.
    // Contoh: return JSON.parse(open('./slugs.json'));
    return ['test-upload-image-v3', 'test-upload-gambar-v2', 'test-upload-gambar-v3'];
});

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Naik ke 20 virtual users selama 30 detik
        { duration: '1m', target: 20 },  // Bertahan di 20 VUs selama 1 menit
        { duration: '10s', target: 0 },   // Turun ke 0
    ],
    thresholds: {
        'http_req_duration': ['p(95)<500'], // 95% permintaan harus selesai di bawah 500ms
        'http_req_failed': ['rate<0.01'],   // Tingkat error harus di bawah 1%
    },
};

// --- Skenario Pengujian ---
export default function () {
    // Pilih slug artikel secara acak dari daftar
    const slug = articleSlugs[Math.floor(Math.random() * articleSlugs.length)];
    const articleUrl = `http://localhost:5000/api/blogs/slug/${slug}`;

    // Skenario 1: Pengguna Baru (Unique Visitor)
    // Pengguna ini tidak mengirimkan cookie 'visitor_id'.
    // Server akan membuatkan ID baru untuknya.
    group('Unique Visitor View', function () {
        const res = http.get(articleUrl);

        check(res, {
            'status is 200': (r) => r.status === 200,
            'response contains visitor_id cookie': (r) => r.cookies.visitor_id !== undefined,
        });
    });

    sleep(1); // Tunggu 1 detik

    // Skenario 2: Pengguna Berulang (Returning Visitor)
    // Pengguna ini mengirimkan kembali cookie 'visitor_id' yang didapatnya.
    // Dalam simulasi ini, kita buat ID acak, tapi dalam skenario nyata, VU akan menyimpan cookie-nya.
    // k6 secara default tidak menyimpan cookie antar iterasi, jadi kita harus mengaturnya manual.
    group('Returning Visitor View', function () {
        // 'jar' akan menyimpan cookie untuk sesi VU ini
        const jar = http.cookieJar();
        const fakeVisitorId = `k6-visitor-${__VU}-${__ITER}`; // Membuat ID unik untuk setiap iterasi
        jar.set(articleUrl, 'visitor_id', fakeVisitorId);

        const res = http.get(articleUrl);

        check(res, {
            'status is 200': (r) => r.status === 200,
            'visitor_id remains the same': (r) => {
                const responseCookie = r.cookies.visitor_id;
                // Server seharusnya tidak mengatur cookie baru jika sudah ada
                return responseCookie === undefined || responseCookie[0].value === fakeVisitorId;
            },
        });
    });

    sleep(2); // Beri jeda antar iterasi
}