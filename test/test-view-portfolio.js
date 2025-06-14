import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { SharedArray } from 'k6/data';

// --- Konfigurasi ---
// Daftar slug portofolio yang akan diuji, diambil dari data JSON Anda.
const portfolioSlugs = new SharedArray('portfolioSlugs', function () {
    // Untuk data yang lebih besar, Anda bisa memuatnya dari file JSON.
    return ['test-v4', 'test-v3', 'test-v2', 'test-v1'];
});

export const options = {
    stages: [
        { duration: '30s', target: 25 }, // Naik ke 25 virtual users selama 30 detik
        { duration: '1m', target: 25 },  // Bertahan di 25 VUs selama 1 menit
        { duration: '10s', target: 0 },   // Turun ke 0
    ],
    thresholds: {
        'http_req_duration': ['p(95)<500'], // 95% permintaan harus selesai di bawah 500ms
        'http_req_failed': ['rate<0.01'],   // Tingkat error harus di bawah 1%
    },
};

// --- Skenario Pengujian ---
export default function () {
    // Pilih slug portofolio secara acak
    const slug = portfolioSlugs[Math.floor(Math.random() * portfolioSlugs.length)];
    const portfolioUrl = `http://localhost:5000/api/portfolios/slug/${slug}`;

    // Skenario 1: Pengguna Baru (Unique Visitor)
    // Pengguna ini tidak mengirimkan cookie 'visitor_id'.
    group('Portfolio: Unique Visitor View', function () {
        const res = http.get(portfolioUrl);

        check(res, {
            '[Portfolio] Status is 200': (r) => r.status === 200,
            '[Portfolio] Response contains visitor_id cookie': (r) => r.cookies.visitor_id !== undefined,
        });
    });

    sleep(1); // Jeda 1 detik

    // Skenario 2: Pengguna Berulang (Returning Visitor)
    // Pengguna ini mengirimkan kembali cookie 'visitor_id'.
    group('Portfolio: Returning Visitor View', function () {
        const jar = http.cookieJar();
        const visitorId = `k6-portfolio-visitor-${__VU}`; // ID unik per Virtual User
        jar.set(portfolioUrl, 'visitor_id', visitorId);

        const res = http.get(portfolioUrl);

        check(res, {
            '[Portfolio] Status is 200': (r) => r.status === 200,
            '[Portfolio] visitor_id cookie is not reset': (r) => r.cookies.visitor_id === undefined,
        });
    });

    sleep(2); // Beri jeda antar iterasi
}