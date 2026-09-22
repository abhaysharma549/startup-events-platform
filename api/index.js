require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { loadSnapshot, saveEvents, getStorageInfo } = require('../lib/event-store');

const app = express();

// Initialize Apify safely
let apifyClient = null;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_WEBHOOK_SECRET = process.env.APIFY_WEBHOOK_SECRET;
const APIFY_ACTOR_ID = process.env.APIFY_ACTOR_ID || '9dardaZ3akeIhRfs3';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

try {
    if (APIFY_API_TOKEN) {
        const { ApifyClient } = require('apify-client');
        apifyClient = new ApifyClient({ token: APIFY_API_TOKEN });
        console.log('[API] Apify client initialized');
    } else {
        console.log('[API] No APIFY_API_TOKEN provided');
    }
} catch (error) {
    console.error('[API] Warning - Apify initialization failed:', error.message);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public folder
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', apifyReady: !!apifyClient });
});

// Cache to store Apify events persistently for new visits
let cachedEvents = [];
let cacheMeta = {
    savedAt: null,
    filePath: null,
    eventsCount: 0
};

const defaultActorInput = {
    searchUrls: [
        'https://www.meetup.com/find/?keywords=ai&location=us--ny--New%20York&source=EVENTS&distance=anyDistance&eventType=online'
    ],
    maxItems: 50,
    proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
    }
};

function mapItemsToEvents(items = []) {
    return items.map(item => {
        return {
            name: item.title || item.name || "Startup Event",
            description: item.description || item.details || "A premium startup event.",
            dates: {
                start: {
                    dateTime: item.dateTime || item.startDate || item.time || new Date().toISOString()
                }
            },
            _embedded: {
                venues: [{
                    name: item.venue || (item.location && item.location.name) || "India",
                    city: { name: (item.location && item.location.city) || "" }
                }]
            },
            images: [{
                url: (item.featuredEventPhoto && item.featuredEventPhoto.highResUrl) || (item.displayPhoto && item.displayPhoto.highResUrl) || item.image || item.imageUrl || item.thumbnail || "https://images.unsplash.com/photo-1540317580384-e5d43867caa6?auto=format&fit=crop&w=600&q=80",
                ratio: '16_9'
            }],
            url: item.url || item.eventUrl || "#",
            rawParameters: item
        };
    });
}

function getDatasetIdFromPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    return (
        payload?.resource?.defaultDatasetId ||
        payload?.data?.resource?.defaultDatasetId ||
        payload?.eventData?.resource?.defaultDatasetId ||
        null
    );
}

function summarizeEventForAssistant(event) {
    const venue = event?._embedded?.venues?.[0];

    return {
        id: event.id || null,
        name: event.name || 'Untitled Event',
        description: event.description || event.info || '',
        date: event?.dates?.start?.dateTime || event?.dates?.start?.localDate || null,
        location: {
            venue: venue?.name || null,
            city: venue?.city?.name || null
        },
        url: event.url || null
    };
}

app.post('/api/apify/fetch', async (req, res) => {
    if (!APIFY_API_TOKEN || !apifyClient) {
        return res.status(400).json({ error: 'Apify API token not configured. Set APIFY_API_TOKEN in environment variables.' });
    }

    try {
        const actorInput = req.body && Object.keys(req.body).length > 0 ? req.body : defaultActorInput;

        // Run the Actor and wait for it to finish
        const run = await apifyClient.actor(APIFY_ACTOR_ID).call(actorInput);
        const datasetId = run?.defaultDatasetId;

        if (!datasetId) {
            return res.status(500).json({ error: 'Actor run completed without defaultDatasetId.' });
        }

        // Fetch and cache items from the Actor output dataset
        const { items } = await apifyClient.dataset(datasetId).listItems();
        cachedEvents = mapItemsToEvents(items || []);
        const snapshot = await saveEvents(cachedEvents, {
            actorId: APIFY_ACTOR_ID,
            datasetId,
            runId: run?.id || null
        });
        cacheMeta = getStorageInfo(snapshot);

        return res.status(200).json({
            message: 'Apify actor run completed and events updated.',
            actorId: APIFY_ACTOR_ID,
            runId: run?.id,
            datasetId,
            eventsCount: cachedEvents.length,
            cache: cacheMeta
        });
    } catch (error) {
        console.error('Error running Apify actor:', error.message);
        return res.status(500).json({ error: 'Failed to run Apify actor fetch.' });
    }
});

// Webhook for Apify notifications
app.post('/api/webhooks/apify', express.text({type: '*/*'}), async (req, res) => {
    if (!apifyClient) {
        return res.status(400).json({ error: 'Apify client not initialized' });
    }

    let payload = req.body;
    
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (e) {
            console.error("Failed to forcefully parse JSON webhook payload");
        }
    }

    if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Invalid webhook payload. Expected JSON body.' });
    }

    if (APIFY_WEBHOOK_SECRET) {
        const receivedSecret = req.query.secret || req.get('x-apify-webhook-secret');
        if (receivedSecret !== APIFY_WEBHOOK_SECRET) {
            return res.status(401).json({ error: 'Invalid webhook secret.' });
        }
    }
    
    console.log("Webhook Triggered by Apify!", payload);
    
    const datasetId = getDatasetIdFromPayload(payload);
    
    if (datasetId) {
        try {
            console.log(`Fetching freshly scraped dataset: ${datasetId}`);
            const scrapedItems = await apifyClient.dataset(datasetId).listItems();
            const items = scrapedItems?.items || [];
            const newEvents = mapItemsToEvents(items);
            
            cachedEvents = newEvents;
            const snapshot = await saveEvents(cachedEvents, {
                actorId: APIFY_ACTOR_ID,
                datasetId,
                sourceEvent: 'webhook'
            });
            cacheMeta = getStorageInfo(snapshot);
            console.log(`Updated cache with ${cachedEvents.length} new events from Apify!`);
            
        } catch (error) {
            console.error("Error fetching Apify dataset:", error.message);
            return res.status(500).json({ error: 'Webhook received but failed to fetch dataset items.' });
        }
    } else {
        return res.status(400).json({ error: 'Webhook payload missing defaultDatasetId.' });
    }
    
    res.status(200).send("Apify Webhook Processed!");
});

// Get cached events
app.get('/api/events', async (req, res) => {
    return res.json({
        events: cachedEvents,
        cache: cacheMeta
    });
});

app.get('/api/events/download', async (req, res) => {
    if (!cacheMeta.filePath) {
        return res.status(404).json({ error: 'No local JSON cache available yet.' });
    }

    return res.download(cacheMeta.filePath, 'events-cache.json');
});

app.post('/api/assistant', async (req, res) => {
    if (!GEMINI_API_KEY) {
        return res.status(503).json({ error: 'Missing GEMINI_API_KEY in environment variables.' });
    }

    const {
        message,
        filters = {},
        events = []
    } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    const safeEvents = Array.isArray(events)
        ? events.slice(0, 12).map(summarizeEventForAssistant)
        : [];

    const systemPrompt = [
        'You are a concise chatbot for a startup events web app.',
        'First understand the user question or problem, then answer it directly.',
        'Use the provided event data and current filter context when the question is about events, recommendations, cities, dates, saved items, or search strategy.',
        'Do not invent specific events, dates, cities, or links that are not in the provided event data.',
        'If event data is missing or weak, still help the user by suggesting practical search terms, filters, or next steps.',
        'If the question is outside event discovery, give a short helpful answer and connect it back to how the app can help when relevant.',
        'Keep answers short and practical, usually 2 to 4 sentences.'
    ].join(' ');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: systemPrompt
                        }
                    ]
                },
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: JSON.stringify({
                                    message: message.trim(),
                                    filters,
                                    events: safeEvents
                                })
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 512
                }
            })
        });

        const payload = await response.json();

        if (!response.ok) {
            const errorMessage = payload?.error?.message || 'Gemini request failed.';
            return res.status(response.status).json({ error: errorMessage });
        }

        const text = (payload?.candidates?.[0]?.content?.parts || [])
            .map((part) => part.text || '')
            .join('')
            .trim();

        if (!text) {
            return res.status(502).json({ error: 'Gemini returned an empty response.' });
        }

        return res.json({ reply: text, model: GEMINI_MODEL });
    } catch (error) {
        console.error('Error calling Gemini API:', error.message);
        return res.status(500).json({ error: 'Failed to generate assistant reply.' });
    }
});

// Serve index.html for all other routes (SPA routing)
app.get(/.*/, (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(500).send('Error loading page');
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[API] Error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

module.exports = app;

(async () => {
    try {
        const snapshot = await loadSnapshot();
        cachedEvents = snapshot.events;
        cacheMeta = getStorageInfo(snapshot);
    } catch (error) {
        console.error('[API] Failed to load local event cache:', error.message);
    }
})();
