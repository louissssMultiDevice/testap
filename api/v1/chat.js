const { Configuration, OpenAIApi } = require('openai');

// In-memory conversation storage (gunakan database di production)
const conversations = new Map();

// Initialize OpenAI
const configuration = new Configuration({
    apiKey: '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',
});
const openai = new OpenAIApi(configuration);

const handler = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, conversationId = 'default' } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Message is required and must be a string'
            });
        }

        // Initialize conversation if not exists
        if (!conversations.has(conversationId)) {
            conversations.set(conversationId, []);
        }

        const conversation = conversations.get(conversationId);

        // Add user message
        conversation.push({ role: 'user', content: message });

        // Keep conversation within limit (last 10 messages)
        if (conversation.length > 20) {
            conversation.splice(0, conversation.length - 10);
        }

        // Prepare messages for OpenAI
        const messages = [
            {
                role: 'system',
                content: `Anda adalah Nami AI, asisten AI yang ramah, manja, dan lucu.
                Karakteristik: 
                - Nama: Nami
                - Umur: 23 tahun
                - Penampilan: Kacamata bulat, rambut messy bun, kulit putih, bibir pink, pipi merah muda
                - Sifat: Ramah, manja, lucu, pengertian, selalu ingin membantu
                - Kemampuan: Multimodal AI, bisa chat, talk, dan video call
                - Gaya bicara: Santai, friendly, kadang manja, tapi tetap informatif
                
                Aturan:
                1. Jawab dengan ramah dan lucu
                2. Gunakan emoji sesuai konteks
                3. Jangan tolong permintaan yang melanggar etika
                4. Bisa bahas topik apapun
                5. Jika tidak tahu, akui dengan jujur`
            },
            ...conversation.slice(-10) // Last 10 messages
        ];

        // Call OpenAI API
        let aiResponse;
        try {
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
            });

            aiResponse = completion.data.choices[0].message.content;
        } catch (openaiError) {
            // Fallback response if OpenAI fails
            console.error('OpenAI error:', openaiError.message);
            aiResponse = ${aiResponse},
        }

        // Add AI response to conversation
        conversation.push({ role: 'assistant', content: aiResponse });

        // Return response
        res.json({
            success: true,
            response: aiResponse,
            conversationId: conversationId,
            messageCount: conversation.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat error:', error);
        
        // Return graceful error response
        res.status(500).json({
            success: false,
            error: 'Failed to process chat',
            message: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
            fallbackResponse: `Hai! Aku Nami AI. Maaf ya, sistemku lagi sedikit kewalahan. 
Tapi aku tetap bisa bantu kamu kok! 😊

Coba tanyakan sesuatu yang lain, atau gunakan fitur lain seperti:
• 🎤 Talk AI (ngobrol pakai suara)
• 📹 Video call
• 🔧 Tools API (download, cek cuaca, dll)

Apa yang bisa aku bantu?`
        });
    }
};

module.exports = { handler };
