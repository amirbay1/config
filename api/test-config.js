// api/test-config.js
// این یک مثال مفهومی از یک تابع بدون سرور Node.js برای Vercel است.
// این کد تست واقعی V2Ray/Xray یا پینگ را انجام نمی‌دهد و فقط یک شبیه‌ساز است.
// برای پیاده‌سازی واقعی، باید منطق تست شبکه را در اینجا اضافه کنید.

export default async function handler(request, response) {
    // مطمئن شوید که درخواست از نوع POST باشد
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // دریافت کانفیگ از بدنه درخواست
        const { config } = request.body;

        if (!config) {
            return response.status(400).json({ message: 'Config is required.' });
        }

        // --- اینجا منطق واقعی تست کانفیگ V2Ray/Xray و پینگ شما قرار می‌گیرد ---
        // این بخش باید با کد واقعی جایگزین شود که:
        // 1. کانفیگ دریافتی را تحلیل کند.
        // 2. یک تست اتصال واقعی به سرور V2Ray/Xray انجام دهد.
        // 3. پینگ (latency) را اندازه‌گیری کند.
        // 4. وضعیت فعال بودن (active/inactive) را تعیین کند.

        // مثال شبیه‌سازی شده:
        // فرض می‌کنیم تست همیشه موفق است و پینگ 100 میلی‌ثانیه است.
        // در یک سناریوی واقعی، شما اینجا یک کتابخانه یا ابزار پینگ را فراخوانی می‌کنید.
        // برای مثال، اگر از پایتون استفاده می‌کردید، ممکن بود یک subprocess برای اجرای 'ping' داشته باشید.
        // برای V2Ray/Xray، نیاز به یک کتابخانه Node.js برای تعامل با پروتکل‌ها یا اجرای یک کلاینت V2Ray/Xray دارید.

        const simulatedPing = Math.floor(Math.random() * (200 - 50 + 1)) + 50; // پینگ تصادفی بین 50 تا 200 میلی‌ثانیه
        const isActive = Math.random() > 0.2; // 80% احتمال فعال بودن

        if (isActive) {
            response.status(200).json({
                status: 'active',
                pingMs: simulatedPing,
                message: `کانفیگ فعال است. پینگ: ${simulatedPing}ms`
            });
        } else {
            response.status(200).json({
                status: 'inactive',
                reason: 'اتصال برقرار نشد یا پینگ بالا بود.',
                message: `کانفیگ غیرفعال است. دلیل: اتصال برقرار نشد یا پینگ بالا بود.`
            });
        }

    } catch (error) {
        console.error('Error in test-config serverless function:', error);
        response.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
