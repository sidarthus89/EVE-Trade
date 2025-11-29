const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * API Client for EVE Data Site Backend
 */

// Helper function for fetch with error handling
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.message);
        throw error;
    }
}

/**
 * Regions API
 */
export async function fetchRegions() {
    return apiFetch('/regions');
}

export async function fetchRegionDetails(regionId) {
    return apiFetch(`/regions/${regionId}`);
}

/**
 * Stations API
 */
export async function fetchStations(regionId = null) {
    const endpoint = regionId ? `/stations/${regionId}` : '/stations';
    return apiFetch(endpoint);
}

/**
 * Items API
 */
export async function fetchMarketTree() {
    return apiFetch('/items/tree');
}

export async function fetchItemDetails(typeId) {
    return apiFetch(`/items/${typeId}`);
}

export async function searchItems(query) {
    return apiFetch(`/items/search/${encodeURIComponent(query)}`);
}

/**
 * Market API
 */
export async function fetchMarketOrders(typeId, regionId, outlierFilter = 'none') {
    const params = new URLSearchParams({ outlierFilter });
    return apiFetch(`/market/${typeId}/${regionId}?${params}`);
}

export async function fetchMarketHistory(typeId, regionId, days = null) {
    const params = days ? `?days=${days}` : '';
    return apiFetch(`/market/history/${typeId}/${regionId}${params}`);
}

export async function fetchMarketDistribution(typeId) {
    return apiFetch(`/market/distribution/${typeId}`);
}

/**
 * Health Check
 */
export async function checkHealth() {
    return apiFetch('/health', { baseURL: API_BASE_URL.replace('/api', '') });
}
