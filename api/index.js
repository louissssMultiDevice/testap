const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Key Middleware
const API_KEY = 'nami-ai';
const apiKeyMiddleware = (req, res, next) => {
    // Allow public endpoints without API key
    const publicEndpoints = ['/', '/docs', '/api', '/info', '/panduan', '/health'];
    if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
        return next();
    }
    
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
        return res.status(401).json({ 
            success: false, 
            error: 'API key required',
            message: 'Gunakan header X-API-Key: nami-ai'
        });
    }
    
    if (apiKey !== API_KEY) {
        return res.status(403).json({ 
            success: false, 
            error: 'Invalid API key',
            message: 'API key harus: nami-ai'
        });
    }
    
    next();
};

// Apply middleware
app.use(apiKeyMiddleware);

// API Routes
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        region: process.env.VERCEL_REGION || 'local'
    });
});

// Main endpoints
app.post('/api/v1/chat', require('./v1/chat').handler);
app.post('/api/v2/talk', require('./v2/talk').handler);
app.post('/api/v3/call', require('./v3/call').handler);

// Info endpoints
app.get('/api/info/dev', (req, res) => {
    res.json({
        developer: 'PrivHandi',
        version: '1.0.0',
        repository: 'https://github.com/privhandi/nami-ai',
        email: 'support@nami-ai.com'
    });
});

app.get('/api/info/server', (req, res) => {
    res.json({
        server: 'Vercel',
        region: process.env.VERCEL_REGION || 'sin1',
        memory: process.env.VERCEL_FUNCTION_MEMORY_MB || '1024',
        runtime: process.env.VERCEL_RUNTIME || 'Node.js'
    });
});

app.get('/api/info/website', (req, res) => {
    res.json({
        name: 'Nami AI',
        domain: 'nami-ai.vercel.app',
        features: ['Chat AI', 'Talk AI', 'Video Call', '50+ Tools'],
        status: 'active'
    });
});

// Tools endpoints
app.get('/api/tools/cuaca', require('./tools/cuaca').handler);
app.get('/api/tools/downloader/:type', require('./tools/downloader').handler);
app.get('/api/tools/search/:type', require('./tools/search').handler);

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        endpoints: {
            v1: { chat: 'POST /v1/chat' },
            v2: { talk: 'POST /v2/talk' },
            v3: { call: 'POST /v3/call' },
            tools: {
                cuaca: 'GET /tools/cuaca?kota=Jakarta',
                downloader: 'GET /tools/downloader/:type?url=...',
                search: 'GET /tools/search/:type?query=...'
            }
        },
        authentication: 'Use X-API-Key: nami-ai'
    });
});

// Error handling
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong' 
            : err.message
    });
});

// Export handler untuk Vercel
module.exports = app;
