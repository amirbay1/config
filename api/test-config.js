// api/test-config.js
// این تابع بدون سرور Node.js یک تست اتصال TCP واقعی به کانفیگ V2Ray/Xray شما انجام می‌دهد.
// توجه: این یک تست کامل پروتکل V2Ray/Xray نیست، بلکه فقط اتصال اولیه TCP را بررسی می‌کند.

import net from 'node:net'; // استفاده از ماژول net برای تست اتصال TCP

export default async function handler(request, response) {
    // تنظیم هدرهای CORS برای اجازه دسترسی از فرانت‌اند
    response.setHeader('Access-Control-Allow-Origin', '*'); // اجازه دسترسی از هر دامنه‌ای
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // متدهای مجاز
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // هدرهای مجاز

    // پاسخ به درخواست OPTIONS (برای Preflight Request CORS)
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    // اطمینان از اینکه درخواست از نوع POST باشد
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // دریافت کانفیگ از بدنه درخواست
        const { config } = request.body;

        if (!config) {
            return response.status(400).json({ message: 'Config is required.' });
        }

        // تجزیه و تحلیل اولیه کانفیگ برای استخراج هاست و پورت
        // این یک تجزیه کننده ساده است. یک راه حل قوی‌تر نیاز به یک تجزیه کننده جامع‌تر کانفیگ V2Ray/Xray دارد.
        let host = '';
        let port = '';
        let protocol = '';

        try {
            const url = new URL(config);
            protocol = url.protocol.replace(':', ''); // مثال: "vmess"
            if (protocol === 'vmess' || protocol === 'vless') {
                // برای vmess/vless، کانفیگ معمولاً JSON کدگذاری شده با Base64 است
                const base64Part = config.substring(protocol.length + 3);
                let decodedJson = '';
                try {
                    // تلاش برای دیکد کردن Base64
                    decodedJson = Buffer.from(base64Part, 'base64').toString('utf8');
                } catch (e) {
                    console.warn(`Base64 decoding failed for ${protocol} config.`, e);
                    return response.status(400).json({ message: 'Invalid config format (Base64 decode failed).' });
                }
                const configObj = JSON.parse(decodedJson);
                host = configObj.add;
                port = configObj.port;
            } else {
                // برای trojan, ss, ssr, warp، هاست و پورت معمولاً مستقیماً در مسیر URL هستند
                const parts = url.host.split(':');
                host = parts[0];
                port = parts[1];
            }
        } catch (e) {
            console.error('Error parsing config URL:', e);
            return response.status(400).json({ message: 'Invalid config URL format.' });
        }

        if (!host || !port) {
            return response.status(400).json({ message: 'Could not extract host or port from config.' });
        }

        const timeout = 5000; // 5 ثانیه مهلت برای اتصال
        const startTime = process.hrtime.bigint(); // زمان با دقت بالا

        // انجام تست اتصال TCP
        const pingResult = await new Promise((resolve) => {
            const socket = new net.Socket();
            let connected = false;

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                const endTime = process.hrtime.bigint();
                const duration = Number(endTime - startTime) / 1_000_000; // تبدیل نانوثانیه به میلی‌ثانیه
                connected = true;
                socket.destroy(); // بلافاصله پس از اتصال سوکت را ببندید
                resolve({ status: 'active', pingMs: Math.round(duration) });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({ status: 'inactive', reason: 'Timeout' });
            });

            socket.on('error', (err) => {
                socket.destroy();
                let reason = 'Connection failed';
                if (err.code === 'ECONNREFUSED') {
                    reason = 'Connection refused';
                } else if (err.code === 'ENOTFOUND') {
                    reason = 'Host not found';
                }
                resolve({ status: 'inactive', reason: reason });
            });

            socket.connect(port, host);
        });

        response.status(200).json(pingResult);

    } catch (error) {
        console.error('Error in test-config serverless function:', error);
        response.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
