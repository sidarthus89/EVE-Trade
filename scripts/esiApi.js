/**
 * ESI API Utility Module
 * Handles all EVE Swagger Interface (ESI) API calls with rate limiting and caching
 */

const ESI_BASE_URL = 'https://esi.evetech.net/latest'
const USER_AGENT = 'EVE-Data-Site/1.0 (https://github.com/your-repo)'

// Rate limiting: ESI allows 150 requests per second, we'll be conservative
const RATE_LIMIT_DELAY = 100 // ms between requests
let lastRequestTime = 0

/**
 * Sleep helper for rate limiting
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Rate-limited fetch with retry logic
 */
async function rateLimitedFetch(url, retries = 3) {
    // Enforce rate limit
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
        await sleep(RATE_LIMIT_DELAY - timeSinceLastRequest)
    }
    lastRequestTime = Date.now()

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': 'application/json'
                }
            })

            if (response.status === 429) {
                // Rate limited, wait and retry
                console.warn(`Rate limited, waiting before retry ${attempt}/${retries}`)
                await sleep(5000)
                continue
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            return await response.json()
        } catch (error) {
            if (attempt === retries) {
                throw new Error(`Failed after ${retries} attempts: ${error.message}`)
            }
            console.warn(`Attempt ${attempt} failed, retrying...`)
            await sleep(1000 * attempt) // Exponential backoff
        }
    }
}

/**
 * Fetch all regions from ESI
 */
export async function fetchAllRegions() {
    console.log('Fetching all regions from ESI...')
    const regionIds = await rateLimitedFetch(`${ESI_BASE_URL}/universe/regions/`)

    const regions = []
    for (const regionId of regionIds) {
        try {
            const region = await rateLimitedFetch(`${ESI_BASE_URL}/universe/regions/${regionId}/`)
            regions.push({
                regionID: regionId,
                regionName: region.name,
                description: region.description || ''
            })
            console.log(`Fetched region: ${region.name}`)
        } catch (error) {
            console.error(`Failed to fetch region ${regionId}:`, error.message)
        }
    }

    return regions
}

/**
 * Fetch all stations in a region
 */
export async function fetchStationsInRegion(regionId) {
    try {
        const constellations = await rateLimitedFetch(`${ESI_BASE_URL}/universe/regions/${regionId}/`)
        const stations = []

        for (const constellationId of constellations.constellations || []) {
            const constellation = await rateLimitedFetch(`${ESI_BASE_URL}/universe/constellations/${constellationId}/`)

            for (const systemId of constellation.systems || []) {
                const system = await rateLimitedFetch(`${ESI_BASE_URL}/universe/systems/${systemId}/`)

                if (system.stations && system.stations.length > 0) {
                    for (const stationId of system.stations) {
                        const station = await rateLimitedFetch(`${ESI_BASE_URL}/universe/stations/${stationId}/`)
                        stations.push({
                            stationID: stationId,
                            stationName: station.name,
                            systemID: systemId,
                            systemName: system.name,
                            regionID: regionId
                        })
                    }
                }
            }
        }

        return stations
    } catch (error) {
        console.error(`Failed to fetch stations for region ${regionId}:`, error.message)
        return []
    }
}

/**
 * Fetch structures with public markets (requires no auth for public structures)
 */
export async function fetchPublicStructures() {
    console.log('Note: Public structure markets require additional API access')
    console.log('For now, we will focus on NPC stations which are publicly available')
    return []
}

/**
 * Fetch market groups hierarchy
 */
export async function fetchMarketGroups() {
    console.log('Fetching market groups from ESI...')
    const marketGroupIds = await rateLimitedFetch(`${ESI_BASE_URL}/markets/groups/`)

    const groups = []
    for (const groupId of marketGroupIds) {
        try {
            const group = await rateLimitedFetch(`${ESI_BASE_URL}/markets/groups/${groupId}/`)
            groups.push({
                marketGroupID: groupId,
                name: group.name,
                description: group.description || '',
                parentGroupID: group.parent_group_id || null,
                types: group.types || []
            })
            console.log(`Fetched market group: ${group.name}`)
        } catch (error) {
            console.error(`Failed to fetch market group ${groupId}:`, error.message)
        }
    }

    return groups
}

/**
 * Fetch type information (item details)
 */
export async function fetchTypeInfo(typeId) {
    return await rateLimitedFetch(`${ESI_BASE_URL}/universe/types/${typeId}/`)
}

/**
 * Fetch market orders for a specific type in a region
 */
export async function fetchMarketOrders(regionId, typeId) {
    return await rateLimitedFetch(`${ESI_BASE_URL}/markets/${regionId}/orders/?type_id=${typeId}`)
}

/**
 * Fetch market history for a specific type in a region
 */
export async function fetchMarketHistory(regionId, typeId) {
    return await rateLimitedFetch(`${ESI_BASE_URL}/markets/${regionId}/history/?type_id=${typeId}`)
}

export default {
    fetchAllRegions,
    fetchStationsInRegion,
    fetchPublicStructures,
    fetchMarketGroups,
    fetchTypeInfo,
    fetchMarketOrders,
    fetchMarketHistory
}
