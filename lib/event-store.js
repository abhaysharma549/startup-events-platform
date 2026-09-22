const fs = require('fs/promises');
const path = require('path');

const configuredDir = process.env.EVENTS_CACHE_DIR;
const configuredFile = process.env.EVENTS_CACHE_FILE;
const storageDir = configuredDir
    ? path.resolve(configuredDir)
    : path.join(__dirname, '..', 'data');
const storageFile = configuredFile
    ? path.resolve(configuredFile)
    : path.join(storageDir, 'events-cache.json');

function createEmptySnapshot() {
    return {
        savedAt: null,
        eventsCount: 0,
        source: 'startup-events-app',
        events: []
    };
}

async function ensureStorageDir() {
    await fs.mkdir(storageDir, { recursive: true });
}

async function loadSnapshot() {
    try {
        const raw = await fs.readFile(storageFile, 'utf8');
        const parsed = JSON.parse(raw);

        return {
            savedAt: parsed.savedAt || null,
            eventsCount: Array.isArray(parsed.events) ? parsed.events.length : 0,
            source: parsed.source || 'startup-events-app',
            events: Array.isArray(parsed.events) ? parsed.events : []
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return createEmptySnapshot();
        }

        throw error;
    }
}

async function saveEvents(events, extra = {}) {
    await ensureStorageDir();

    const snapshot = {
        savedAt: new Date().toISOString(),
        eventsCount: Array.isArray(events) ? events.length : 0,
        source: 'startup-events-app',
        ...extra,
        events: Array.isArray(events) ? events : []
    };

    await fs.writeFile(storageFile, JSON.stringify(snapshot, null, 2), 'utf8');
    return snapshot;
}

function getStorageInfo(snapshot) {
    return {
        filePath: storageFile,
        savedAt: snapshot.savedAt || null,
        eventsCount: Array.isArray(snapshot.events) ? snapshot.events.length : 0
    };
}

module.exports = {
    loadSnapshot,
    saveEvents,
    getStorageInfo,
    storageFile
};
