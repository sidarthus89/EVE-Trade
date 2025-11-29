/**
 * ESI API Configuration and Rate Limiting
 */

// ESI base URL
export const ESI_BASE_URL = 'https://esi.evetech.net/latest';

// Rate limiting configuration
export const RATE_LIMIT_DELAY = 100; // 100ms between requests
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // 1 second initial retry delay

// Popular/hub regions for faster market data refresh
export const POPULAR_REGIONS = [
    10000002, // The Forge (Jita)
    10000043, // Domain (Amarr)
    10000032, // Sinq Laison (Dodixie)
    10000030, // Heimatar (Rens)
    10000042  // Metropolis (Hek)
];

// Data sync intervals (in minutes)
export const SYNC_INTERVALS = {
    REGIONS: 1440,              // 1 day
    STATIONS: 129600,           // 3 months (90 days)
    STRUCTURES: 10080,          // 1 week (7 days)
    MARKET_TREE: 129600,        // 3 months (90 days)
    MARKET_ORDERS_POPULAR: 5,   // 5 minutes for popular regions
    MARKET_ORDERS_STANDARD: 10  // 10 minutes for other regions
};

// Helper to delay execution
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Rate-limited fetch with retry logic
export async function rateLimitedFetch(url, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await delay(RATE_LIMIT_DELAY);

            const response = await fetch(url, {
                ...options,
                headers: {
                    'User-Agent': 'EVE-Data-Site/1.0',
                    ...options.headers
                }
            });

            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('X-Esi-Error-Limit-Reset')) || 60;
                console.warn(`Rate limited. Waiting ${retryAfter} seconds...`);
                await delay(retryAfter * 1000);
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            lastError = error;
            if (attempt < MAX_RETRIES) {
                const backoffDelay = RETRY_DELAY * Math.pow(2, attempt - 1);
                console.warn(`Attempt ${attempt} failed. Retrying in ${backoffDelay}ms...`);
                await delay(backoffDelay);
            }
        }
    }

    throw lastError;
}

// Fetch all regions from ESI
export async function fetchAllRegions() {
    const response = await rateLimitedFetch(`${ESI_BASE_URL}/universe/regions/`);
    return response.json();
}

// Fetch region details
export async function fetchRegionDetails(regionId) {
    const response = await rateLimitedFetch(`${ESI_BASE_URL}/universe/regions/${regionId}/`);
    return response.json();
}

// Fetch stations in a region
export async function fetchStationsInRegion(regionId) {
    const response = await rateLimitedFetch(`${ESI_BASE_URL}/universe/regions/${regionId}/`);
    const regionData = await response.json();

    const stations = [];
    for (const constellationId of regionData.constellations) {
        const constResponse = await rateLimitedFetch(`${ESI_BASE_URL}/universe/constellations/${constellationId}/`);
        const constData = await constResponse.json();

        for (const systemId of constData.systems) {
            const systemResponse = await rateLimitedFetch(`${ESI_BASE_URL}/universe/systems/${systemId}/`);
            const systemData = await systemResponse.json();

            if (systemData.stations && systemData.stations.length > 0) {
                for (const stationId of systemData.stations) {
                    const stationResponse = await rateLimitedFetch(`${ESI_BASE_URL}/universe/stations/${stationId}/`);
                    const stationData = await stationResponse.json();

                    stations.push({
                        stationID: stationId,
                        stationName: stationData.name,
                        systemID: systemId,
                        systemName: systemData.name,
                        regionID: regionId
                    });
                }
            }
        }
    }

    return stations;
}

// Fetch market orders for a type in a region
export async function fetchMarketOrders(regionId, typeId) {
    const response = await rateLimitedFetch(
        `${ESI_BASE_URL}/markets/${regionId}/orders/?type_id=${typeId}&order_by=price`
    );
    return response.json();
}

// Fetch all market orders in a region (paginated)
export async function fetchAllMarketOrdersInRegion(regionId) {
    let page = 1;
    let allOrders = [];
    let hasMorePages = true;

    while (hasMorePages) {
        const response = await rateLimitedFetch(
            `${ESI_BASE_URL}/markets/${regionId}/orders/?page=${page}`
        );

        const orders = await response.json();
        allOrders = allOrders.concat(orders);

        const totalPages = parseInt(response.headers.get('X-Pages')) || 1;
        hasMorePages = page < totalPages;
        page++;
    }

    return allOrders;
}

// Fetch market history for a type in a region
export async function fetchMarketHistory(regionId, typeId) {
    const response = await rateLimitedFetch(
        `${ESI_BASE_URL}/markets/${regionId}/history/?type_id=${typeId}`
    );
    return response.json();
}

// Fetch market groups
export async function fetchMarketGroups() {
    const response = await rateLimitedFetch(`${ESI_BASE_URL}/markets/groups/`);
    return response.json();
}

// Fetch market group details
export async function fetchMarketGroupDetails(groupId) {
    const response = await rateLimitedFetch(`${ESI_BASE_URL}/markets/groups/${groupId}/`);
    return response.json();
}

// Fetch type information
export async function fetchTypeInfo(typeId) {
    const response = await rateLimitedFetch(`${ESI_BASE_URL}/universe/types/${typeId}/`);
    return response.json();
}

// Fetch structures in a region (requires authentication for full data)
export async function fetchStructuresInRegion(regionId) {
    // Note: This endpoint requires authentication and returns limited public data
    const response = await rateLimitedFetch(`${ESI_BASE_URL}/universe/structures/`);
    return response.json();
}
