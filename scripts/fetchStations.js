/**
 * Fetch and build comprehensive stations data
 * Gets all NPC stations across all K-space regions
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchAllRegions, fetchStationsInRegion } from './esiApi.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_PATH = path.join(__dirname, '../public/data/stations.json')

async function buildStationsData() {
    console.log('=== Building Stations Data ===\n')
    console.log('This may take 10-15 minutes due to ESI rate limiting...\n')

    try {
        // Fetch all regions
        const allRegions = await fetchAllRegions()
        const kSpaceRegions = allRegions.filter(r => r.regionID < 11000000)

        console.log(`Processing ${kSpaceRegions.length} K-space regions...\n`)

        const allStations = []
        let processedCount = 0

        for (const region of kSpaceRegions) {
            processedCount++
            console.log(`[${processedCount}/${kSpaceRegions.length}] Fetching stations in ${region.regionName}...`)

            const stations = await fetchStationsInRegion(region.regionID)

            if (stations.length > 0) {
                allStations.push(...stations)
                console.log(`  ✓ Found ${stations.length} stations`)
            } else {
                console.log(`  - No stations`)
            }
        }

        // Sort by region, then by name
        allStations.sort((a, b) => {
            if (a.regionID !== b.regionID) {
                return a.regionID - b.regionID
            }
            return a.stationName.localeCompare(b.stationName)
        })

        // Save to JSON
        const output = {
            lastUpdated: new Date().toISOString(),
            totalStations: allStations.length,
            stations: allStations
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))

        console.log(`\n=== Success! ===`)
        console.log(`Total stations fetched: ${allStations.length}`)
        console.log(`Saved to: ${OUTPUT_PATH}`)

        // Summary by region
        const stationsByRegion = allStations.reduce((acc, station) => {
            acc[station.regionID] = (acc[station.regionID] || 0) + 1
            return acc
        }, {})

        console.log(`\nStations distributed across ${Object.keys(stationsByRegion).length} regions`)

    } catch (error) {
        console.error('Error building stations data:', error)
        process.exit(1)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    buildStationsData()
}

export default buildStationsData
