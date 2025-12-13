const axios = require('axios');

const handler = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key'
    );

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { kota } = req.query;

        if (!kota) {
            return res.status(400).json({
                success: false,
                error: 'Parameter kota diperlukan',
                example: '/tools/cuaca?kota=Jakarta'
            });
        }

        // Request ke API gratis Zenitsu (menggunakan data BMKG)
        const url = `https://api.zenitsu.web.id/api/info/cuaca?q=${encodeURIComponent(kota)}`;

        const response = await axios.get(url);

        const hasil = response.data;

        // Format respons supaya tetap clean dan konsisten
        return res.json({
            statusCode: 200,
            results: hasil.results || null,
            timestamp: new Date().toISOString(),
            attribution: "@ndiidepzX"
        });

    } catch (error) {
        console.error('Cuaca error:', error?.response?.data || error);

        return res.status(500).json({
            success: false,
            error: 'Gagal mengambil data cuaca (free API)',
            detail: 'Coba kota lain atau ulang beberapa saat lagi.'
        });
    }
};

module.exports = { handler };
