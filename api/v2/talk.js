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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { text, voice = 'nami' } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ success: false, error: 'Text must be a string' });
        }

        if (text.length > 1000) {
            return res.status(400).json({ success: false, error: 'Text too long (max 1000 chars)' });
        }

        // Voice mapping ke voice OpenAI
        const voiceMap = {
            'nami': { openaiVoice: 'alloy', speed: 1.0 },
            'nami-cute': { openaiVoice: 'alloy', speed: 1.2 },
            'nami-formal': { openaiVoice: 'verse', speed: 0.9 },
            'english-female': { openaiVoice: 'alloy', speed: 1.0 },
            'english-male': { openaiVoice: 'verse', speed: 1.0 }
        };

        const selected = voiceMap[voice] || voiceMap['nami'];
        const apiKeys = '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'
        // Request ke OpenAI
        const response = await axios({
            method: 'POST',
            url: 'https://api.openai.com/v1/audio/speech',
            responseType: 'arraybuffer',
            headers: {
                'Authorization': `Bearer ${apiKeys}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: "gpt-4o-mini-tts", // Model TTS OpenAI
                voice: selected.openaiVoice,
                input: text,
                speed: selected.speed,
                format: "mp3"
            }
        });

        // Simpan audio ke storage kamu (S3 / R2 / Firebase / atau langsung buffer)
        // Untuk contoh: langsung kirim buffer sebagai file
        const filename = `tts-${Date.now()}.mp3`;

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

        return res.status(200).send(Buffer.from(response.data));

    } catch (err) {
        console.error('TTS error:', err.response?.data || err);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate speech',
            message: 'TTS service unavailable'
        });
    }
};

module.exports = { handler };
