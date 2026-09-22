document.addEventListener('DOMContentLoaded', () => {
    // Initialize Authentication UI
    const initAuth = () => {
        try {
            if (typeof AuthClient === 'undefined') {
                console.warn('AuthClient not loaded yet, retrying in 100ms');
                setTimeout(initAuth, 100);
                return;
            }

            const userMenuContainer = document.getElementById('userMenuContainer');
            const userMenuBtn = document.getElementById('userMenuBtn');
            const userDropdown = document.getElementById('userDropdown');
            const userName = document.getElementById('userName');
            const logoutBtn = document.getElementById('logoutBtn');
            const loginLink = document.getElementById('loginLink');
            
            try {
                const currentUser = AuthClient.getUser();

                if (!currentUser || !AuthClient.isAuthenticated()) {
                    // User not logged in, hide user display and show login link
                    if (userMenuContainer) userMenuContainer.style.display = 'none';
                    if (loginLink) loginLink.style.display = 'inline-block';
                } else {
                    // User logged in, show user info and hide login link
                    if (loginLink) loginLink.style.display = 'none';
                    if (userMenuContainer) {
                        userMenuContainer.style.display = 'block';
                        if (userName) {
                            userName.textContent = currentUser.username || currentUser.email || 'Account';
                        }
                    }

                    if (userMenuBtn && userDropdown) {
                        const closeDropdown = () => {
                            userDropdown.classList.remove('open');
                            userMenuBtn.setAttribute('aria-expanded', 'false');
                        };

                        userMenuBtn.addEventListener('click', (eventObj) => {
                            eventObj.preventDefault();
                            eventObj.stopPropagation();
                            const isOpen = userDropdown.classList.toggle('open');
                            userMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                        });

                        document.addEventListener('click', (eventObj) => {
                            if (!userMenuContainer.contains(eventObj.target)) {
                                closeDropdown();
                            }
                        });

                        document.addEventListener('keydown', (eventObj) => {
                            if (eventObj.key === 'Escape') {
                                closeDropdown();
                            }
                        });
                    }

                    // Handle logout
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const result = await AuthClient.logout();
                            if (result.success) {
                                window.location.href = '/login.html';
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('Error accessing AuthClient:', error);
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        }
    };

    // Initialize auth UI first with a small delay to ensure scripts are loaded
    setTimeout(initAuth, 50);

    const eventsGrid = document.getElementById('events-grid');
    const keywordInput = document.getElementById('keywordInput');
    const locationInput = document.getElementById('locationInput');
    const searchBtn = document.querySelector('.btn-search');
    const refreshApifyBtn = document.getElementById('refreshApifyBtn');
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    const fetchStatusPill = document.getElementById('fetchStatusPill');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const sortSelect = document.getElementById('sortSelect');
    const eventsCountEl = document.getElementById('eventsCount');
    const lastSyncAtEl = document.getElementById('lastSyncAt');
    const liveStateEl = document.getElementById('liveState');
    const savedEventsChip = document.getElementById('savedEventsChip');
    const cacheStatusText = document.getElementById('cacheStatusText');
    const cacheFilePath = document.getElementById('cacheFilePath');
    const activeSearchSummary = document.getElementById('activeSearchSummary');
    const assistantForm = document.getElementById('assistantForm');
    const assistantInput = document.getElementById('assistantInput');
    const assistantMessages = document.getElementById('assistantMessages');
    const assistantHint = document.getElementById('assistantHint');

    let allEvents = [];
    let lastRenderedEvents = [];
    let savedEventIds = new Set();
    let showOnlySaved = false;
    let activeCategory = 'all';
    let lastEventCount = 0;
    let cacheInfo = null;

    function showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ',
            save: '❤'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        toastContainer.appendChild(toast);

        const removeToast = () => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('.toast-close').addEventListener('click', removeToast);
        setTimeout(removeToast, duration);
    }

    function formatTimestamp(dateString) {
        if (!dateString) {
            return 'Never';
        }

        const value = new Date(dateString);
        if (Number.isNaN(value.getTime())) {
            return 'Unknown';
        }

        return value.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    function setFetchStatus(text, state = 'idle') {
        fetchStatusPill.textContent = text;
        fetchStatusPill.classList.remove('is-idle', 'is-loading', 'is-success', 'is-error');
        fetchStatusPill.classList.add(`is-${state}`);
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function loadSavedEvents() {
        const saved = localStorage.getItem('savedEvents');
        savedEventIds = new Set(saved ? JSON.parse(saved) : []);
        updateSavedBadge();
    }

    function updateSavedBadge() {
        const count = savedEventIds.size;
        savedEventsChip.setAttribute('data-count', count);
        savedEventsChip.style.opacity = count > 0 ? '1' : '0.5';
    }

    function saveEvent(eventId) {
        savedEventIds.add(eventId);
        localStorage.setItem('savedEvents', JSON.stringify(Array.from(savedEventIds)));
        updateSavedBadge();
        syncSaveButtons(eventId, true);
        showToast('Event saved locally', 'save', 2200);
    }

    function unsaveEvent(eventId) {
        savedEventIds.delete(eventId);
        localStorage.setItem('savedEvents', JSON.stringify(Array.from(savedEventIds)));
        updateSavedBadge();
        syncSaveButtons(eventId, false);
        showToast('Saved event removed', 'info', 2200);
    }

    function isEventSaved(eventId) {
        return savedEventIds.has(eventId);
    }

    function syncSaveButtons(eventId, saved) {
        const buttons = document.querySelectorAll(`.save-event-btn[data-event-id="${CSS.escape(eventId)}"]`);
        buttons.forEach((button) => {
            button.classList.toggle('saved', saved);
            button.setAttribute('aria-label', saved ? 'Saved event - click to unsave' : 'Save this event');
            button.setAttribute('title', saved ? 'Unsave event' : 'Save event');
            const icon = button.querySelector('.save-icon');
            if (icon) {
                icon.textContent = saved ? '❤' : '🤍';
            }
        });
    }

    function updateSearchSummary() {
        const parts = [];
        const keyword = keywordInput.value.trim();
        const location = locationInput.value.trim();

        if (keyword) {
            parts.push(`Keyword: ${keyword}`);
        }

        if (location) {
            parts.push(`Location: ${location}`);
        }

        if (showOnlySaved) {
            parts.push('Saved only');
        }

        if (activeCategory !== 'all') {
            parts.push(`Category: ${activeCategory}`);
        }

        activeSearchSummary.textContent = parts.length > 0 ? parts.join(' • ') : 'All startup events';
        assistantHint.textContent = parts.length > 0
            ? `Current context: ${parts.join(' • ')}`
            : 'Ask for AI meetups, saved picks, location ideas, or what to search next.';
    }

    function updateCacheInfo(cache) {
        cacheInfo = cache || null;

        if (!cacheInfo || !cacheInfo.savedAt) {
            cacheStatusText.textContent = 'Waiting for first fetch';
            cacheFilePath.textContent = 'JSON will be written to the local project folder.';
            downloadJsonBtn.setAttribute('aria-disabled', 'true');
            downloadJsonBtn.classList.add('is-disabled');
            return;
        }

        cacheStatusText.textContent = `${cacheInfo.eventsCount || 0} events cached`;
        cacheFilePath.textContent = `${cacheInfo.filePath || 'Local cache'} • ${formatTimestamp(cacheInfo.savedAt)}`;
        downloadJsonBtn.removeAttribute('aria-disabled');
        downloadJsonBtn.classList.remove('is-disabled');
    }

    function updateStats() {
        eventsCountEl.textContent = String(allEvents.length);
        lastSyncAtEl.textContent = cacheInfo?.savedAt ? formatTimestamp(cacheInfo.savedAt) : 'Never';
    }

    function getEventDateMs(event) {
        const raw = event?.dates?.start?.dateTime || event?.dates?.start?.localDate || null;
        const parsed = raw ? Date.parse(raw) : NaN;
        return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    }

    function sortEvents(events) {
        const mode = sortSelect.value;
        const sorted = [...events];

        if (mode === 'date-desc') {
            return sorted.sort((a, b) => getEventDateMs(b) - getEventDateMs(a));
        }

        if (mode === 'name-asc') {
            return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        return sorted.sort((a, b) => getEventDateMs(a) - getEventDateMs(b));
    }

    function getEventCategory(event) {
        const haystack = `${event.name || ''} ${event.description || ''}`.toLowerCase();
        if (haystack.includes('pitch')) return 'pitch';
        if (haystack.includes('workshop')) return 'workshops';
        if (haystack.includes('conference')) return 'conference';
        return 'networking';
    }

    function getFilteredEvents() {
        const keywordQuery = keywordInput.value.trim().toLowerCase();
        const locationQuery = locationInput.value.trim().toLowerCase();

        return allEvents.filter((event) => {
            const title = (event.name || '').toLowerCase();
            const description = (event.description || event.info || '').toLowerCase();
            const venue = event?._embedded?.venues?.[0];
            const location = `${venue?.name || ''} ${venue?.city?.name || ''}`.toLowerCase();
            const eventId = event.id || event.name;

            const matchesKeyword = !keywordQuery || title.includes(keywordQuery) || description.includes(keywordQuery);
            const matchesLocation = !locationQuery || location.includes(locationQuery);
            const matchesSaved = !showOnlySaved || isEventSaved(eventId);
            const matchesCategory = activeCategory === 'all' || getEventCategory(event) === activeCategory;

            return matchesKeyword && matchesLocation && matchesSaved && matchesCategory;
        });
    }

    function createEventCard(event, isNew = false) {
        const title = event.name || 'Untitled Event';
        const description = event.info || event.description || 'Join this event for founders, operators, and investors.';
        const rawDate = event?.dates?.start?.dateTime || event?.dates?.start?.localDate || new Date().toISOString();
        const dateObj = new Date(rawDate);
        const dateString = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const venue = event?._embedded?.venues?.[0];
        const location = venue ? `${venue.name}${venue.city?.name ? `, ${venue.city.name}` : ''}` : 'Online / TBD';

        const image = event.images?.find((item) => item.ratio === '16_9') || event.images?.[0];
        const imageUrl = image?.url || 'https://images.unsplash.com/photo-1559136555-e4616d94625b?auto=format&fit=crop&w=600&q=80';

        const eventId = event.id || event.name;
        const isSaved = isEventSaved(eventId);
        const parametersJson = escapeHtml(JSON.stringify(event.rawParameters || event, null, 2));
        const badgeLabel = getEventCategory(event).replace('workshops', 'Workshop');

        const card = document.createElement('article');
        card.className = isNew ? 'event-card new-realtime-event' : 'event-card';
        card.setAttribute('data-event-id', eventId);
        card.tabIndex = 0;

        card.innerHTML = `
            <div class="event-image" style="background-image: url('${imageUrl}')">
                <div class="event-badge">${escapeHtml(badgeLabel)}</div>
                <button class="save-event-btn ${isSaved ? 'saved' : ''}" data-event-id="${escapeHtml(eventId)}" aria-label="${isSaved ? 'Saved event - click to unsave' : 'Save this event'}" title="${isSaved ? 'Unsave event' : 'Save event'}">
                    <span class="save-icon">${isSaved ? '❤' : '🤍'}</span>
                </button>
            </div>
            <div class="event-content">
                <div class="event-date">${escapeHtml(dateString)}</div>
                <h3 class="event-title">${escapeHtml(title)}</h3>
                <p class="event-desc">${escapeHtml(description)}</p>
                <div class="event-footer">
                    <div class="event-location">${escapeHtml(location)}</div>
                    <a href="${event.url || '#'}" target="_blank" rel="noopener noreferrer" class="event-link">Details ↗</a>
                </div>
                <details class="event-params">
                    <summary>Full Details</summary>
                    <pre>${parametersJson}</pre>
                </details>
            </div>
        `;

        const saveBtn = card.querySelector('.save-event-btn');
        saveBtn.addEventListener('click', (eventObj) => {
            eventObj.preventDefault();
            eventObj.stopPropagation();

            if (isEventSaved(eventId)) {
                unsaveEvent(eventId);
            } else {
                saveEvent(eventId);
            }
        });

        card.addEventListener('keydown', (eventObj) => {
            if (eventObj.key.toLowerCase() === 's' && document.activeElement === card) {
                eventObj.preventDefault();
                saveBtn.click();
            }
        });

        return card;
    }

    function renderEmptyState() {
        const context = [];
        if (keywordInput.value.trim()) context.push(`"${escapeHtml(keywordInput.value.trim())}"`);
        if (locationInput.value.trim()) context.push(`near "${escapeHtml(locationInput.value.trim())}"`);

        const label = context.length > 0 ? ` for ${context.join(' ')}` : '';
        const savedMessage = showOnlySaved ? ' in saved events' : '';

        eventsGrid.innerHTML = `
            <div class="loading-state">
                <div style="margin-bottom: 1rem; font-size: 1.15rem;">No events found${label}${savedMessage}.</div>
                <button id="emptyStateFetchBtn" class="btn-primary" style="border:none;">Fetch fresh events</button>
            </div>
        `;

        document.getElementById('emptyStateFetchBtn').addEventListener('click', () => refreshApifyBtn.click());
    }

    function renderEvents(events) {
        lastRenderedEvents = events;
        eventsGrid.innerHTML = '';

        if (!events.length) {
            renderEmptyState();
            return;
        }

        events.forEach((event) => {
            eventsGrid.appendChild(createEventCard(event));
        });
    }

    function addAssistantMessage(text, role = 'bot') {
        const message = document.createElement('div');
        message.className = `assistant-message assistant-message-${role}`;
        message.textContent = text;
        assistantMessages.appendChild(message);
        assistantMessages.scrollTop = assistantMessages.scrollHeight;
    }

    function buildAssistantReply(query) {
        const normalized = query.trim().toLowerCase();
        const filteredEvents = sortEvents(getFilteredEvents());

        if (!normalized) {
            return 'Ask about topics, cities, saved events, or what filters to use next.';
        }

        if (!allEvents.length) {
            const requestedTopic = query.trim().replace(/[?.!]+$/, '');
            return `I understand you are asking about "${requestedTopic}". The event feed is empty right now, so I cannot match it to real listings yet. Fetch fresh events, or try a focused search term like AI, founder, pitch, funding, SaaS, or workshop.`;
        }

        if (normalized.includes('saved')) {
            const savedEvents = filteredEvents.filter((event) => isEventSaved(event.id || event.name)).slice(0, 3);
            if (!savedEvents.length) {
                return 'You do not have saved events in the current view yet. Save a few cards and I can rank them back to you.';
            }

            return `Saved shortlist: ${savedEvents.map((event) => event.name).join(' • ')}.`;
        }

        if (normalized.includes('location') || normalized.includes('city') || normalized.includes('where')) {
            const locations = Array.from(new Set(
                filteredEvents
                    .map((event) => {
                        const venue = event?._embedded?.venues?.[0];
                        return [venue?.city?.name, venue?.name].filter(Boolean).join(', ');
                    })
                    .filter(Boolean)
            )).slice(0, 4);

            return locations.length
                ? `Strong location signals right now: ${locations.join(' • ')}.`
                : 'Most current listings are online or missing venue details, so keyword filtering will work better than location.';
        }

        if (normalized.includes('search') || normalized.includes('keyword') || normalized.includes('filter')) {
            const hints = ['AI', 'Pitch', 'Founder', 'SaaS', 'Fintech'];
            const matched = hints.filter((hint) => allEvents.some((event) => `${event.name || ''} ${event.description || ''}`.toLowerCase().includes(hint.toLowerCase())));
            return matched.length
                ? `Try these filters next: ${matched.slice(0, 4).join(' • ')}.`
                : 'Start with broad filters like AI, networking, founder, or workshop, then narrow by city.';
        }

        if (normalized.includes('help') || normalized.includes('problem') || normalized.includes('issue') || normalized.includes('how')) {
            return 'I can help turn that into an event search. Tell me the topic, city, and goal, for example “AI networking in New York” or “pitch events for founders,” and I will rank the best matching events from the current feed.';
        }

        const topicTerms = normalized
            .split(/[^a-z0-9]+/)
            .filter((term) => term.length > 2);

        const topicalMatches = filteredEvents.filter((event) => {
            const haystack = `${event.name || ''} ${event.description || event.info || ''}`.toLowerCase();
            return topicTerms.some((term) => haystack.includes(term));
        });

        const recommendationPool = topicalMatches.length ? topicalMatches : filteredEvents;
        const picks = recommendationPool.slice(0, 3);

        if (!picks.length) {
            return 'No events match that request yet. Clear filters or fetch fresh events and try again.';
        }

        const reason = topicalMatches.length
            ? `I found ${topicalMatches.length} topical match${topicalMatches.length === 1 ? '' : 'es'}.`
            : `I used the ${filteredEvents.length} events in your current filtered feed.`;

        return `${reason} Start with ${picks.map((event) => event.name).join(' • ')}.`;
    }

    async function requestAssistantReply(query) {
        const filteredEvents = sortEvents(getFilteredEvents())
            .slice(0, 12)
            .map((event) => {
                const venue = event?._embedded?.venues?.[0];

                return {
                    id: event.id || null,
                    name: event.name || 'Untitled Event',
                    description: event.description || event.info || '',
                    dates: {
                        start: {
                            dateTime: event?.dates?.start?.dateTime || event?.dates?.start?.localDate || null
                        }
                    },
                    _embedded: {
                        venues: [{
                            name: venue?.name || null,
                            city: {
                                name: venue?.city?.name || null
                            }
                        }]
                    },
                    url: event.url || null
                };
            });
        const filters = {
            keyword: keywordInput.value.trim(),
            location: locationInput.value.trim(),
            savedOnly: showOnlySaved,
            category: activeCategory,
            sort: sortSelect.value
        };

        const response = await fetch('/api/assistant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...AuthClient.getAuthHeaders()
            },
            body: JSON.stringify({
                message: query,
                filters,
                events: filteredEvents
            })
        });

        const contentType = response.headers.get('content-type') || '';
        const payload = contentType.includes('application/json')
            ? await response.json()
            : { error: await response.text() };

        if (!response.ok) {
            throw new Error(payload.error || 'Assistant request failed');
        }

        return payload.reply;
    }

    function applyFiltersAndRender() {
        updateSearchSummary();
        renderEvents(sortEvents(getFilteredEvents()));
    }

    function showLoadingSkeletons(count = 6) {
        eventsGrid.innerHTML = '';

        for (let index = 0; index < count; index += 1) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card';
            skeleton.innerHTML = `
                <div class="skeleton-image skeleton"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line short skeleton"></div>
                    <div class="skeleton-line title skeleton"></div>
                    <div class="skeleton-line skeleton"></div>
                    <div class="skeleton-line short skeleton"></div>
                </div>
            `;
            eventsGrid.appendChild(skeleton);
        }
    }

    async function fetchEvents(showSkeleton = true) {
        try {
            if (!AuthClient.isAuthenticated()) {
                eventsGrid.innerHTML = `
                    <div class="glass-card" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; margin: 2rem 0;">
                        <div style="width: 64px; height: 64px; background: rgba(157, 78, 221, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; border: 1px solid rgba(157, 78, 221, 0.4);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9d4edd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h3 style="font-size: 1.5rem; color: #f8fafc; margin-bottom: 0.75rem; font-family: 'Outfit', sans-serif; font-weight: 600;">Sign In Required</h3>
                        <p style="color: #94a3b8; max-width: 400px; margin-bottom: 2rem; font-size: 1.05rem; line-height: 1.5;">Discover premium startup events, network with founders, and build your journey. Join the ecosystem today.</p>
                        <a href="/login.html" class="btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 500;">Sign In to Discover</a>
                    </div>
                `;
                setFetchStatus('Auth Required', 'idle');
                return;
            }

            if (showSkeleton) {
                showLoadingSkeletons();
            }

            const response = await fetch('/api/events', {
                headers: {
                    ...AuthClient.getAuthHeaders()
                }
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Failed to load events');
            }

            allEvents = Array.isArray(payload.events) ? payload.events : [];
            lastEventCount = allEvents.length;
            updateCacheInfo(payload.cache);
            updateStats();
            applyFiltersAndRender();
            setFetchStatus(allEvents.length ? 'Loaded' : 'No Data', allEvents.length ? 'success' : 'idle');
        } catch (error) {
            console.error('Error fetching events:', error);
            eventsGrid.innerHTML = `<div class="loading-state" style="color: #fb7185;">Failed to load events: ${escapeHtml(error.message)}. Please try again later.</div>`;
            setFetchStatus('Load Failed', 'error');
        }
    }

    async function triggerApifyFetch(customInput = null) {
        try {
            if (!AuthClient.isAuthenticated()) {
                showToast('Please sign in to fetch fresh events', 'error', 2600);
                window.location.href = '/login.html';
                return;
            }

            refreshApifyBtn.disabled = true;
            searchBtn.disabled = true;
            setFetchStatus('Scraping...', 'loading');

            const response = await fetch('/api/apify/fetch', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...AuthClient.getAuthHeaders()
                },
                body: JSON.stringify(customInput || {})
            });

            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Fetch trigger failed');
            }

            updateCacheInfo(payload.cache);
            setFetchStatus(`Synced ${payload.eventsCount} events`, 'success');
            showToast('Fresh events fetched and saved to local JSON', 'success', 2600);
            await fetchEvents(false);
        } catch (error) {
            console.error('Error triggering Apify fetch:', error);
            setFetchStatus('Fetch Failed', 'error');
            showToast(error.message, 'error', 2600);
        } finally {
            refreshApifyBtn.disabled = false;
            searchBtn.disabled = false;
        }
    }

    function buildApifyPayload() {
        const keywordQuery = keywordInput.value.trim();
        const locationQuery = locationInput.value.trim();

        if (!keywordQuery && !locationQuery) {
            return null;
        }

        let formattedLocation = locationQuery;
        if (/jalandhar/i.test(formattedLocation)) {
            formattedLocation = 'in--India--Jalandhar';
        } else if (/new york/i.test(formattedLocation)) {
            formattedLocation = 'us--ny--New York';
        }

        const searchUrl = `https://www.meetup.com/find/?keywords=${encodeURIComponent(keywordQuery || 'startup')}&location=${encodeURIComponent(formattedLocation || 'us--ny--New York')}&source=EVENTS&distance=anyDistance`;

        return {
            searchUrls: [searchUrl],
            maxItems: 50,
            proxyConfiguration: {
                useApifyProxy: true
            }
        };
    }

    function setActiveChip(targetChip) {
        document.querySelectorAll('.chip').forEach((chip) => {
            const isActive = chip === targetChip;
            chip.classList.toggle('active', isActive);
            chip.setAttribute('aria-pressed', String(isActive));
        });
    }

    document.querySelectorAll('.chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            setActiveChip(chip);

            const label = chip.textContent.trim().toLowerCase();
            showOnlySaved = label.includes('saved');
            activeCategory = label === 'all' || label.includes('saved') ? 'all' : label;

            applyFiltersAndRender();
        });
    });

    keywordInput.addEventListener('input', applyFiltersAndRender);
    locationInput.addEventListener('input', applyFiltersAndRender);
    sortSelect.addEventListener('change', applyFiltersAndRender);

    const handleSearchAction = (eventObj) => {
        if (eventObj.type === 'click' || eventObj.key === 'Enter') {
            applyFiltersAndRender();
            document.getElementById('events').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    keywordInput.addEventListener('keypress', handleSearchAction);
    locationInput.addEventListener('keypress', handleSearchAction);
    searchBtn.addEventListener('click', handleSearchAction);

    clearSearchBtn.addEventListener('click', () => {
        keywordInput.value = '';
        locationInput.value = '';
        showOnlySaved = false;
        activeCategory = 'all';
        setActiveChip(document.querySelector('.chip'));
        applyFiltersAndRender();
        showToast('Filters cleared', 'info', 1800);
    });

    document.querySelectorAll('.quick-tag').forEach((tag) => {
        tag.addEventListener('click', () => {
            keywordInput.value = tag.dataset.keyword || '';
            applyFiltersAndRender();
            document.getElementById('events').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    refreshApifyBtn.addEventListener('click', () => {
        triggerApifyFetch(buildApifyPayload());
    });

    downloadJsonBtn.addEventListener('click', async (eventObj) => {
        eventObj.preventDefault();
        
        if (!AuthClient.isAuthenticated()) {
            showToast('Please sign in to download events', 'error', 2600);
            return;
        }

        if (!cacheInfo?.savedAt) {
            showToast('Fetch events first to create the local JSON cache', 'info', 2400);
            return;
        }

        try {
            showToast('Preparing download...', 'info', 1000);
            const response = await fetch('/api/events/download', {
                headers: {
                    ...AuthClient.getAuthHeaders()
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'events-cache.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            showToast(`Download failed: ${error.message}`, 'error', 2600);
        }
    });

    assistantForm.addEventListener('submit', async (eventObj) => {
        eventObj.preventDefault();
        const query = assistantInput.value.trim();

        if (!query) {
            showToast('Type a quick question for the assistant', 'info', 2000);
            return;
        }

        addAssistantMessage(query, 'user');
        assistantInput.value = '';
        assistantInput.disabled = true;

        addAssistantMessage('Thinking through the current event feed...', 'bot');
        const pendingMessage = assistantMessages.lastElementChild;

        try {
            const reply = await requestAssistantReply(query);
            pendingMessage.textContent = reply;
        } catch (error) {
            console.error('Assistant request failed:', error);
            pendingMessage.textContent = buildAssistantReply(query);
            showToast(error.message, 'info', 2600);
        } finally {
            assistantInput.disabled = false;
            assistantInput.focus();
        }
    });

    const shortcutsBtn = document.getElementById('shortcuts-btn');
    const shortcutsHelp = document.getElementById('shortcuts-help');
    const shortcutsClose = document.querySelector('.shortcuts-close');

    function toggleShortcuts() {
        shortcutsHelp.classList.toggle('active');
    }

    shortcutsBtn.addEventListener('click', toggleShortcuts);
    shortcutsClose.addEventListener('click', toggleShortcuts);

    shortcutsHelp.addEventListener('click', (eventObj) => {
        if (eventObj.target === shortcutsHelp) {
            toggleShortcuts();
        }
    });

    document.addEventListener('keydown', (eventObj) => {
        if (eventObj.key === '?' || (eventObj.shiftKey && eventObj.key === '/')) {
            eventObj.preventDefault();
            toggleShortcuts();
        }

        if (eventObj.key === 'Escape' && shortcutsHelp.classList.contains('active')) {
            toggleShortcuts();
        }

        if ((eventObj.key === 'c' || eventObj.key === 'C') && document.activeElement.tagName !== 'INPUT') {
            clearSearchBtn.click();
        }
    });

    setInterval(async () => {
        try {
            if (!AuthClient.isAuthenticated()) return;

            const response = await fetch('/api/events', {
                headers: {
                    ...AuthClient.getAuthHeaders()
                }
            });
            if (!response.ok) {
                throw new Error('Polling failed');
            }

            const payload = await response.json();
            const nextEvents = Array.isArray(payload.events) ? payload.events : [];
            const hasNewItems = nextEvents.length > lastEventCount;

            allEvents = nextEvents;
            lastEventCount = nextEvents.length;
            updateCacheInfo(payload.cache);
            updateStats();
            applyFiltersAndRender();

            if (hasNewItems) {
                showToast('New events detected from the local cache', 'success', 2200);
            }

            liveStateEl.innerHTML = '<span class="pulse-dot"></span> Connected';
        } catch (error) {
            liveStateEl.innerHTML = '<span class="pulse-dot offline"></span> Disconnected';
            console.error('Polling error:', error);
        }
    }, 30000);

    setFetchStatus('Idle', 'idle');
    loadSavedEvents();
    updateSearchSummary();
    updateCacheInfo(null);
    fetchEvents();
});
