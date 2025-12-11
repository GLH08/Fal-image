import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import bodyParser from 'body-parser';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8787;
const FAL_KEY = process.env.FAL_KEY;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https:", "http:"],
            fontSrc: ["'self'", "https:", "http:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Authentication Middleware
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");

    if (!AUTH_PASSWORD) return next();

    if (req.path === '/login.html' || req.path === '/api/login' || req.path === '/favicon.ico') {
        return next();
    }

    const authCookie = req.cookies.auth;
    if (authCookie === AUTH_PASSWORD) {
        return next();
    }

    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    res.redirect('/login.html');
});

// Static files
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

// Login Route
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === AUTH_PASSWORD) {
        res.cookie('auth', password, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Enhanced Model Configuration
const FAL_MODEL_CONFIG = {
    "flux-1.1-pro-ultra": {
        submitUrl: 'https://queue.fal.run/fal-ai/flux-pro/v1.1-ultra',
        statusBaseUrl: 'https://queue.fal.run/fal-ai/flux-pro',
        logName: 'FLUX 1.1 Pro Ultra',
        type: 'text-to-image',
        supports: {
            aspectRatios: ['21:9', '16:9', '4:3', '3:2', '1:1', '2:3', '3:4', '9:16', '9:21'],
            resolutions: [],
            safetyTolerance: true,
            seed: true,
            enhancePrompt: true,
            raw: true,
            imageToImage: false,
            outputFormats: ['jpeg', 'png'],
            customSizes: true
        },
        defaults: {
            aspectRatio: '16:9',
            safetyTolerance: '2',
            outputFormat: 'jpeg',
            enableSafetyChecker: true,
            numImages: 1
        }
    },
    "flux-2-pro": {
        submitUrl: 'https://queue.fal.run/fal-ai/flux-2-pro',
        statusBaseUrl: 'https://queue.fal.run/fal-ai/flux-2-pro',
        logName: 'FLUX 2 Pro',
        type: 'text-to-image',
        supports: {
            aspectRatios: [],
            resolutions: [],
            safetyTolerance: true,
            seed: true,
            enhancePrompt: false,
            raw: false,
            imageToImage: false,
            outputFormats: ['jpeg', 'png'],
            customSizes: true,
            imageSize: true
        },
        defaults: {
            imageSize: 'landscape_4_3',
            safetyTolerance: '2',
            outputFormat: 'jpeg',
            enableSafetyChecker: true,
            numImages: 1
        }
    },
    "imagen4-preview": {
        submitUrl: 'https://queue.fal.run/fal-ai/imagen4/preview',
        statusBaseUrl: 'https://queue.fal.run/fal-ai/imagen4',
        logName: 'Google Imagen 4 Preview',
        type: 'text-to-image',
        supports: {
            aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
            resolutions: ['1K', '2K'],
            safetyTolerance: false,
            seed: false,
            enhancePrompt: false,
            raw: false,
            imageToImage: false,
            outputFormats: ['jpeg', 'png', 'webp'],
            customSizes: false
        },
        defaults: {
            aspectRatio: '1:1',
            resolution: '1K',
            outputFormat: 'png',
            numImages: 1
        }
    },
    "nano-banana-pro": {
        submitUrl: 'https://queue.fal.run/fal-ai/nano-banana-pro',
        statusBaseUrl: 'https://queue.fal.run/fal-ai/nano-banana-pro',
        logName: 'Gemini 3 Pro Image',
        type: 'text-to-image',
        supports: {
            aspectRatios: ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
            resolutions: ['1K', '2K', '4K'],
            safetyTolerance: false,
            seed: false,
            enhancePrompt: false,
            raw: false,
            imageToImage: false,
            outputFormats: ['jpeg', 'png', 'webp'],
            customSizes: false
        },
        defaults: {
            aspectRatio: '1:1',
            resolution: '1K',
            outputFormat: 'png',
            numImages: 1
        }
    },
    "nano-banana-pro-edit": {
        submitUrl: 'https://queue.fal.run/fal-ai/nano-banana-pro/edit',
        statusBaseUrl: 'https://queue.fal.run/fal-ai/nano-banana-pro',
        logName: 'Gemini 3 Pro Image Edit',
        type: 'image-to-image',
        supports: {
            aspectRatios: ['auto', '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'],
            resolutions: ['1K', '2K', '4K'],
            safetyTolerance: false,
            seed: false,
            enhancePrompt: false,
            raw: false,
            imageToImage: true,
            imageUrls: true,
            outputFormats: ['jpeg', 'png', 'webp'],
            customSizes: false,
            multiImage: true
        },
        defaults: {
            aspectRatio: 'auto',
            resolution: '1K',
            outputFormat: 'png',
            numImages: 1
        }
    },
    "flux-2-pro-edit": {
        submitUrl: 'https://queue.fal.run/fal-ai/flux-2-pro/edit',
        statusBaseUrl: 'https://queue.fal.run/fal-ai/flux-2-pro',
        logName: 'FLUX 2 Pro Edit',
        type: 'image-to-image',
        supports: {
            aspectRatios: ['auto'],
            resolutions: [],
            safetyTolerance: true,
            seed: true,
            enhancePrompt: false,
            raw: false,
            imageToImage: true,
            outputFormats: ['jpeg', 'png'],
            imageUrls: true,
            customSizes: true
        },
        defaults: {
            imageSize: 'auto',
            safetyTolerance: '2',
            outputFormat: 'jpeg',
            enableSafetyChecker: true,
            numImages: 1
        }
    }
};

// Database Helpers
function readDb() {
    if (!fs.existsSync(DB_FILE)) {
        return { images: [], statistics: { total: 0, byModel: {} } };
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return { images: [], statistics: { total: 0, byModel: {} } };
    }
}

function writeDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function addImageToDb(image) {
    try {
        const db = readDb();

        // Ensure statistics object exists
        if (!db.statistics) {
            console.log('Initializing missing statistics object');
            db.statistics = { total: 0, byModel: {} };
        }
        if (!db.statistics.byModel) {
            console.log('Initializing missing byModel object');
            db.statistics.byModel = {};
        }

        db.images.unshift(image);
        db.statistics.total = (db.statistics.total || 0) + 1;
        db.statistics.byModel[image.model] = (db.statistics.byModel[image.model] || 0) + 1;
        writeDb(db);
        console.log(`✅ Image saved to database: ${image.model} (Total: ${db.statistics.total})`);
    } catch (error) {
        console.error('❌ Failed to save image to database:', error);
        // Don't throw the error - we don't want to fail the entire request
        // if database save fails
    }
}

// Utility Functions
function validateModelParameters(model, params) {
    const config = FAL_MODEL_CONFIG[model];
    if (!config) {
        return { valid: false, error: `Unsupported model: ${model}` };
    }

    const errors = [];

    // Validate aspect ratio
    if (params.aspectRatio) {
        // FLUX 2 Pro uses image_size parameter instead of aspect_ratio
        if (model === 'flux-2-pro' || model === 'flux-2-pro-edit') {
            // These models use image_size mapping, so we don't validate aspectRatio here
            // The mapping happens in constructFalPayload
            const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:2'];
            if (!validRatios.includes(params.aspectRatio)) {
                errors.push(`Invalid aspect ratio "${params.aspectRatio}" for ${model}. Supported: ${validRatios.join(', ')}`);
            }
        } else if (config.supports.aspectRatios.length > 0) {
            if (!config.supports.aspectRatios.includes(params.aspectRatio)) {
                errors.push(`Invalid aspect ratio "${params.aspectRatio}" for ${model}. Supported: ${config.supports.aspectRatios.join(', ')}`);
            }
        }
    }

    // Validate resolution
    if (params.resolution) {
        if (!config.supports.resolutions.includes(params.resolution)) {
            errors.push(`Invalid resolution "${params.resolution}" for ${model}. Supported: ${config.supports.resolutions.join(', ')}`);
        }
    }

    // Validate output format
    if (params.outputFormat) {
        if (!config.supports.outputFormats.includes(params.outputFormat)) {
            errors.push(`Invalid output format "${params.outputFormat}" for ${model}. Supported: ${config.supports.outputFormats.join(', ')}`);
        }
    }

    // Validate safety tolerance
    if (params.safety_tolerance && !config.supports.safetyTolerance) {
        errors.push(`Model ${model} does not support safety_tolerance parameter`);
    }

    // Validate seed
    if (params.seed && !config.supports.seed) {
        errors.push(`Model ${model} does not support seed parameter`);
    }

    // Validate image URLs for image-to-image models
    if (config.type === 'image-to-image') {
        if (!params.imageUrls && !params.image_url) {
            errors.push(`Model ${model} requires image URLs`);
        }

        // Validate multi-image support
        if (params.imageUrls && params.imageUrls.length > 1 && !config.supports.multiImage) {
            errors.push(`Model ${model} does not support multiple input images`);
        }
    }

    return { valid: errors.length === 0, errors };
}

function constructFalPayload(model, params) {
    const config = FAL_MODEL_CONFIG[model];
    const payload = {
        prompt: params.prompt,
        num_images: params.num_images || config.defaults.numImages,
    };

    // Add model-specific parameters
    if (config.type === 'image-to-image') {
        if (params.image_url) {
            payload.image_url = params.image_url;
        } else if (params.imageUrls && params.imageUrls.length > 0) {
            payload.image_urls = params.imageUrls;
        }

        // FLUX 2 Pro Edit uses image_size
        if (model === 'flux-2-pro-edit') {
            if (params.aspectRatio) {
                const aspectRatioMap = {
                    '1:1': 'square',
                    '16:9': 'landscape_16_9',
                    '9:16': 'portrait_16_9',
                    '4:3': 'landscape_4_3',
                    '3:2': 'portrait_4_3',
                    'auto': 'auto'
                };
                payload.image_size = aspectRatioMap[params.aspectRatio] || 'auto';
            } else {
                payload.image_size = 'auto';
            }
        } else if (config.supports.customSizes && params.imageSize) {
            payload.image_size = params.imageSize;
        } else if (params.aspectRatio) {
            payload.aspect_ratio = params.aspectRatio;
        }

        if (params.imagePromptStrength) {
            payload.image_prompt_strength = params.imagePromptStrength;
        }
    } else {
        // Text-to-image models
        if (model === 'flux-2-pro') {
            // FLUX 2 Pro uses image_size instead of aspect_ratio
            if (params.aspectRatio) {
                const aspectRatioMap = {
                    '1:1': 'square',
                    '16:9': 'landscape_16_9',
                    '9:16': 'portrait_16_9',
                    '4:3': 'landscape_4_3',
                    '3:2': 'portrait_4_3'
                };
                payload.image_size = aspectRatioMap[params.aspectRatio] || 'landscape_4_3';
            }
        } else if (params.aspectRatio) {
            payload.aspect_ratio = params.aspectRatio;
        }

        if (params.resolution && config.supports.resolutions.length > 0) {
            payload.resolution = params.resolution;
        }
    }

    // Add optional parameters if supported
    if (config.supports.safetyTolerance && params.safety_tolerance) {
        payload.safety_tolerance = params.safety_tolerance;
    }

    if (config.supports.seed && params.seed) {
        payload.seed = params.seed;
    }

    if (config.supports.enhancePrompt && params.enhancePrompt !== undefined) {
        payload.enhance_prompt = params.enhancePrompt;
    }

    if (config.supports.raw && params.raw !== undefined) {
        payload.raw = params.raw;
    }

    if (params.outputFormat) {
        payload.output_format = params.outputFormat;
    }

    if (params.enableSafetyChecker !== undefined) {
        payload.enable_safety_checker = params.enableSafetyChecker;
    }

    if (params.syncMode !== undefined) {
        payload.sync_mode = params.syncMode;
    }

    return payload;
}

// API Routes

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0',
        models: Object.keys(FAL_MODEL_CONFIG).length
    });
});

// Get available models
app.get('/api/models', (req, res) => {
    const models = Object.entries(FAL_MODEL_CONFIG).map(([id, config]) => ({
        id,
        name: config.logName,
        type: config.type,
        supports: config.supports,
        defaults: config.defaults
    }));
    res.json(models);
});

// Generate Image Endpoint
app.post('/api/generate', async (req, res) => {
    if (!FAL_KEY) {
        return res.status(500).json({ error: "Server missing FAL_KEY configuration." });
    }

    const {
        model,
        prompt,
        aspectRatio,
        resolution,
        safety_tolerance,
        seed,
        outputFormat,
        num_images,
        image_url,
        imageUrls,
        enhancePrompt,
        raw,
        imagePromptStrength,
        imageSize,
        enableSafetyChecker
    } = req.body;

    if (!model || !FAL_MODEL_CONFIG[model]) {
        return res.status(400).json({ error: "Invalid or missing model." });
    }
    if (!prompt) {
        return res.status(400).json({ error: "Missing prompt." });
    }

    const validation = validateModelParameters(model, {
        aspectRatio,
        resolution,
        safety_tolerance,
        seed,
        outputFormat,
        image_url,
        imageUrls
    });

    if (!validation.valid) {
        return res.status(400).json({ error: validation.errors.join(', ') });
    }

    const config = FAL_MODEL_CONFIG[model];
    const falBody = constructFalPayload(model, {
        prompt,
        aspectRatio,
        resolution,
        safety_tolerance,
        seed,
        outputFormat,
        num_images,
        image_url,
        imageUrls,
        enhancePrompt,
        raw,
        imagePromptStrength,
        imageSize,
        enableSafetyChecker
    });

    try {
        console.log(`Generating with ${config.logName}:`, JSON.stringify(falBody, null, 2));

        // Submit Request
        const submitResponse = await fetch(config.submitUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(falBody)
        });

        if (!submitResponse.ok) {
            const text = await submitResponse.text();
            throw new Error(`Fal.ai submission failed: ${submitResponse.status} ${text}`);
        }

        const submitResult = await submitResponse.json();
        const requestId = submitResult.request_id;

        // Poll for Result
        let result = null;
        const maxAttempts = 600;  // Increased to 600 seconds (10 minutes)
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(r => setTimeout(r, 1000));

            const statusUrl = `${config.statusBaseUrl}/requests/${requestId}`;
            const statusResponse = await fetch(statusUrl, {
                headers: { 'Authorization': `Key ${FAL_KEY}` }
            });

            if (statusResponse.status === 200) {
                const data = await statusResponse.json();
                if (data.images && data.images.length > 0) {
                    result = data.images[0];
                    break;
                }
                if (data.status === 'FAILED' || data.status === 'CANCELLED') {
                    throw new Error(`Generation ${data.status}`);
                }
            }
        }

        if (!result) {
            throw new Error("Generation timed out.");
        }

        // HTTPS Fix
        let falUrl = result.url;
        if (falUrl && falUrl.startsWith('http://')) {
            falUrl = falUrl.replace('http://', 'https://');
        }

        let lskyUrl = null;
        if (process.env.LSKY_URL && process.env.LSKY_TOKEN) {
            try {
                lskyUrl = await uploadToLsky(falUrl);
            } catch (e) {
                console.error("Lsky upload failed", e);
            }
        }

        // Save to DB
        const imageRecord = {
            id: requestId,
            url: falUrl,
            lskyUrl: lskyUrl,
            prompt: prompt,
            model: model,
            aspectRatio: aspectRatio || config.defaults.aspectRatio,
            resolution: resolution || config.defaults.resolution,
            safety_tolerance: safety_tolerance,
            seed: seed,
            outputFormat: outputFormat || config.defaults.outputFormat,
            timestamp: new Date().toISOString(),
            hidden: false,
            modelType: config.type
        };

        if (image_url) imageRecord.sourceImage = image_url;
        if (imageUrls) imageRecord.sourceImages = imageUrls;

        addImageToDb(imageRecord);

        res.json(imageRecord);

    } catch (error) {
        console.error("Generation error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk Generate Endpoint
app.post('/api/generate/bulk', async (req, res) => {
    if (!FAL_KEY) {
        return res.status(500).json({ error: "Server missing FAL_KEY configuration." });
    }

    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({ error: "Invalid or empty requests array." });
    }

    if (requests.length > 5) {
        return res.status(400).json({ error: "Maximum 5 requests per bulk operation." });
    }

    try {
        const results = await Promise.allSettled(
            requests.map(async (requestParams) => {
                const model = requestParams.model;
                const config = FAL_MODEL_CONFIG[model];

                const validation = validateModelParameters(model, requestParams);
                if (!validation.valid) {
                    return { success: false, error: validation.errors.join(', '), params: requestParams };
                }

                const falBody = constructFalPayload(model, requestParams);

                const submitResponse = await fetch(config.submitUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Key ${FAL_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(falBody)
                });

                if (!submitResponse.ok) {
                    const text = await submitResponse.text();
                    throw new Error(`Fal.ai submission failed: ${submitResponse.status} ${text}`);
                }

                const submitResult = await submitResponse.json();
                const requestId = submitResult.request_id;

                // Poll for result
                let result = null;
                const maxAttempts = 600;  // Increased to 600 seconds (10 minutes)
                for (let i = 0; i < maxAttempts; i++) {
                    await new Promise(r => setTimeout(r, 1000));

                    const statusUrl = `${config.statusBaseUrl}/requests/${requestId}`;
                    const statusResponse = await fetch(statusUrl, {
                        headers: { 'Authorization': `Key ${FAL_KEY}` }
                    });

                    if (statusResponse.status === 200) {
                        const data = await statusResponse.json();
                        if (data.images && data.images.length > 0) {
                            result = data.images[0];
                            break;
                        }
                        if (data.status === 'FAILED' || data.status === 'CANCELLED') {
                            throw new Error(`Generation ${data.status}`);
                        }
                    }
                }

                if (!result) {
                    throw new Error("Generation timed out.");
                }

                let falUrl = result.url;
                if (falUrl && falUrl.startsWith('http://')) {
                    falUrl = falUrl.replace('http://', 'https://');
                }

                let lskyUrl = null;
                if (process.env.LSKY_URL && process.env.LSKY_TOKEN) {
                    try {
                        lskyUrl = await uploadToLsky(falUrl);
                    } catch (e) {
                        console.error("Lsky upload failed", e);
                    }
                }

                const imageRecord = {
                    id: requestId,
                    url: falUrl,
                    lskyUrl: lskyUrl,
                    prompt: requestParams.prompt,
                    model: model,
                    aspectRatio: requestParams.aspectRatio || config.defaults.aspectRatio,
                    resolution: requestParams.resolution || config.defaults.resolution,
                    safety_tolerance: requestParams.safety_tolerance,
                    seed: requestParams.seed,
                    outputFormat: requestParams.outputFormat || config.defaults.outputFormat,
                    timestamp: new Date().toISOString(),
                    hidden: false,
                    modelType: config.type
                };

                addImageToDb(imageRecord);

                return { success: true, result: imageRecord };
            })
        );

        const responses = results.map(r => r.status === 'fulfilled' ? r.value : {
            success: false,
            error: r.reason.message
        });

        res.json({ results: responses });
    } catch (error) {
        console.error("Bulk generation error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Gallery Endpoints
app.get('/api/images', (req, res) => {
    const db = readDb();
    const visibleImages = db.images.filter(img => !img.hidden);
    res.json(visibleImages);
});

app.get('/api/images/stats', (req, res) => {
    const db = readDb();
    res.json(db.statistics || { total: 0, byModel: {} });
});

// Manual Image Collection Endpoint
app.post('/api/images/manual', (req, res) => {
    const { url, prompt, model, aspectRatio } = req.body;

    if (!url || !prompt) {
        return res.status(400).json({ error: "URL and prompt are required." });
    }

    try {
        new URL(url);
    } catch (e) {
        return res.status(400).json({ error: "Invalid URL format." });
    }

    const id = 'manual-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    const imageRecord = {
        id: id,
        url: url,
        lskyUrl: null,
        prompt: prompt,
        model: model || 'Manual',
        aspectRatio: aspectRatio || 'Unknown',
        resolution: null,
        safety_tolerance: null,
        timestamp: new Date().toISOString(),
        hidden: false,
        source: 'manual'
    };

    addImageToDb(imageRecord);
    res.json(imageRecord);
});

app.delete('/api/images/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const initialLength = db.images.length;
    db.images = db.images.filter(img => img.id !== id);
    if (db.images.length === initialLength) {
        return res.status(404).json({ error: "Image not found" });
    }
    writeDb(db);
    res.json({ success: true });
});

app.patch('/api/images/:id/hide', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    const image = db.images.find(img => img.id === id);
    if (!image) {
        return res.status(404).json({ error: "Image not found" });
    }
    image.hidden = true;
    writeDb(db);
    res.json({ success: true });
});

// Image Upload Endpoint for Editing
app.post('/api/upload', async (req, res) => {
    try {
        const { imageData } = req.body;

        if (!imageData) {
            return res.status(400).json({ error: "No image data provided" });
        }

        // Convert base64 to buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // In a real implementation, you would upload to a storage service
        // For now, we'll just return a mock URL
        const filename = `upload-${Date.now()}.png`;
        const mockUrl = `data:image/png;base64,${base64Data}`;

        res.json({ url: mockUrl, filename });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Lsky Upload Helper
async function uploadToLsky(imageUrl) {
    const lskyUrl = process.env.LSKY_URL;
    const lskyToken = process.env.LSKY_TOKEN;
    const strategyId = process.env.LSKY_STRATEGY_ID || '1';

    if (!lskyUrl || !lskyToken) return null;

    try {
        console.log(`Downloading image from: ${imageUrl}`);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to download image from Fal.ai. Status: ${imageResponse.status}`);

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const formData = new FormData();
        formData.append('file', buffer, { filename: 'generated-image.png', contentType: 'image/png' });
        formData.append('strategy_id', strategyId);

        const apiUrl = lskyUrl.replace(/\/$/, '') + '/api/v1/upload';
        console.log(`Uploading to Lsky: ${apiUrl}`);

        const uploadResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${lskyToken}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Lsky Pro API returned status ${uploadResponse.status}: ${errorText}`);
        }

        const result = await uploadResponse.json();
        if (result.status === true && result.data?.links?.url) {
            console.log('✅ Lsky Pro upload successful. New URL:', result.data.links.url);
            return result.data.links.url;
        } else {
            throw new Error(`Lsky Pro returned an error: ${result.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Lsky Pro upload failed:', error.message);
        return null;
    }
}

app.listen(PORT, () => {
    console.log('==============================================');
    console.log('🚀 FAL.ai Image Generator Pro v2.0.0');
    console.log('==============================================');
    console.log(`📍 Server running on http://localhost:${PORT}`);
    console.log(`🔑 FAL_KEY: ${FAL_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🔐 Authentication: ${AUTH_PASSWORD ? '✅ Enabled' : '⚠️ Disabled'}`);
    console.log(`☁️  Lsky Pro: ${process.env.LSKY_URL ? '✅ Configured' : '⚠️ Disabled'}`);
    console.log('==============================================');
    console.log('🤖 Available Models:');
    Object.entries(FAL_MODEL_CONFIG).forEach(([id, config]) => {
        console.log(`   • ${config.logName} (${id})`);
        console.log(`     - Type: ${config.type}`);
        console.log(`     - Aspect Ratios: ${config.supports.aspectRatios.length} options`);
    });
    console.log('==============================================');
    console.log('📖 API Endpoints:');
    console.log(`   • GET  /health - Health check`);
    console.log(`   • GET  /api/models - List models`);
    console.log(`   • POST /api/generate - Generate image`);
    console.log(`   • POST /api/generate/bulk - Bulk generate`);
    console.log(`   • GET  /api/images - List images`);
    console.log(`   • GET  /api/images/stats - Statistics`);
    console.log('==============================================');
});
