/**
 * API Utilities - Request validation, error handling, and middleware helpers
 */

const validateEventQuery = (query) => {
    const errors = [];
    
    if (query.keyword && typeof query.keyword !== 'string') {
        errors.push('Keyword must be a string');
    }
    
    if (query.location && typeof query.location !== 'string') {
        errors.push('Location must be a string');
    }
    
    if (query.limit) {
        const limit = parseInt(query.limit);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            errors.push('Limit must be a number between 1 and 100');
        }
    }
    
    if (query.offset) {
        const offset = parseInt(query.offset);
        if (isNaN(offset) || offset < 0) {
            errors.push('Offset must be a non-negative number');
        }
    }
    
    if (query.sortBy && !['date-asc', 'date-desc', 'name'].includes(query.sortBy)) {
        errors.push('SortBy must be one of: date-asc, date-desc, name');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

const filterEventsByQuery = (events = [], query = {}) => {
    let filtered = [...events];
    
    if (query.keyword) {
        const keyword = query.keyword.toLowerCase().trim();
        filtered = filtered.filter(event => {
            const name = (event.name || '').toLowerCase();
            const description = (event.description || '').toLowerCase();
            return name.includes(keyword) || description.includes(keyword);
        });
    }
    
    if (query.location) {
        const location = query.location.toLowerCase().trim();
        filtered = filtered.filter(event => {
            const venue = event?._embedded?.venues?.[0];
            const city = (venue?.city?.name || '').toLowerCase();
            const venueName = (venue?.name || '').toLowerCase();
            return city.includes(location) || venueName.includes(location);
        });
    }
    
    if (query.eventType) {
        filtered = filtered.filter(event => {
            const name = (event.name || '').toLowerCase();
            const description = (event.description || '').toLowerCase();
            const fullText = `${name} ${description}`.toLowerCase();
            
            switch (query.eventType.toLowerCase()) {
                case 'workshop':
                    return fullText.includes('workshop') || fullText.includes('training');
                case 'networking':
                    return fullText.includes('networking') || fullText.includes('mixer');
                case 'conference':
                    return fullText.includes('conference') || fullText.includes('summit');
                case 'pitch':
                    return fullText.includes('pitch') || fullText.includes('demo');
                default:
                    return true;
            }
        });
    }
    
    return filtered;
};

const sortEvents = (events = [], sortBy = 'date-asc') => {
    const sorted = [...events];
    
    switch (sortBy) {
        case 'date-desc':
            return sorted.sort((a, b) => {
                const dateA = new Date(a?.dates?.start?.dateTime || a?.dates?.start?.localDate || 0);
                const dateB = new Date(b?.dates?.start?.dateTime || b?.dates?.start?.localDate || 0);
                return dateB - dateA;
            });
        case 'name':
            return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        case 'date-asc':
        default:
            return sorted.sort((a, b) => {
                const dateA = new Date(a?.dates?.start?.dateTime || a?.dates?.start?.localDate || 0);
                const dateB = new Date(b?.dates?.start?.dateTime || b?.dates?.start?.localDate || 0);
                return dateA - dateB;
            });
    }
};

const paginateEvents = (events = [], limit = 20, offset = 0) => {
    const start = Math.max(0, parseInt(offset) || 0);
    const end = start + Math.min(parseInt(limit) || 20, 100);
    
    return {
        events: events.slice(start, end),
        total: events.length,
        limit: end - start,
        offset: start,
        hasMore: end < events.length
    };
};

const getTrendingEvents = (events = [], days = 7) => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return events.filter(event => {
        const eventDate = new Date(event?.dates?.start?.dateTime || event?.dates?.start?.localDate || 0);
        return eventDate >= cutoffDate && eventDate <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    });
};

const getEventSuggestions = (events = [], userQuery = '', limit = 5) => {
    if (!userQuery || !userQuery.trim()) {
        return events.slice(0, limit);
    }
    
    const query = userQuery.toLowerCase().trim();
    const scored = events.map(event => {
        let score = 0;
        const name = (event.name || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        const venue = event?._embedded?.venues?.[0];
        const city = (venue?.city?.name || '').toLowerCase();
        
        if (name.startsWith(query)) score += 3;
        if (name.includes(query)) score += 2;
        if (description.includes(query)) score += 1;
        if (city.includes(query)) score += 1;
        
        return { event, score };
    });
    
    return scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.event);
};

const createSuccessResponse = (data, message = 'Success', statusCode = 200) => {
    return {
        statusCode,
        body: {
            success: true,
            message,
            data
        }
    };
};

const createErrorResponse = (error, statusCode = 500) => {
    return {
        statusCode,
        body: {
            success: false,
            error: error.message || error,
            timestamp: new Date().toISOString()
        }
    };
};

module.exports = {
    validateEventQuery,
    filterEventsByQuery,
    sortEvents,
    paginateEvents,
    getTrendingEvents,
    getEventSuggestions,
    createSuccessResponse,
    createErrorResponse
};
