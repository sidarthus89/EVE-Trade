/**
 * Fetch and build regions.json with only regions that have accessible markets
 * Filters out regions with no NPC stations
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fetchAllRegions, fetchStationsInRegion } from './esiApi.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const OUTPUT_PATH = path.join(__dirname, '../public/data/regions.json')

async function buildRegionsData() {
    console.log('=== Building Regions Data ===\n')

    try {
        // Step 1: Fetch all regions from ESI
        const allRegions = await fetchAllRegions()
        console.log(`\nFetched ${allRegions.length} total regions`)

        // Step 2: Check each region for stations (filter out wormhole space and empty regions)
        const regionsWithMarkets = []

        for (const region of allRegions) {
            console.log(`\nChecking ${region.regionName} (ID: ${region.regionID}) for markets...`)

            // Skip wormhole regions (IDs 11000000+)
            if (region.regionID >= 11000000) {
                console.log(`  ↳ Skipped (Wormhole space)`)
                continue
            }

            // Check if region has any stations
            const stations = await fetchStationsInRegion(region.regionID)

            if (stations.length > 0) {
                regionsWithMarkets.push({
                    regionID: region.regionID,
                    regionName: region.regionName,
                    stationCount: stations.length
                })
                console.log(`  ✓ Found ${stations.length} stations`)
            } else {
                console.log(`  ✗ No stations found`)
            }
        }

        // Step 3: Sort by region name
        regionsWithMarkets.sort((a, b) => a.regionName.localeCompare(b.regionName))

        // Step 4: Save to JSON
        const output = {
            lastUpdated: new Date().toISOString(),
            totalRegions: regionsWithMarkets.length,
            regions: regionsWithMarkets
        }

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2))

        console.log(`\n=== Success! ===`)
        console.log(`Found ${regionsWithMarkets.length} regions with accessible markets`)
        console.log(`Saved to: ${OUTPUT_PATH}`)

        // Display summary
        console.log(`\n=== Top Trading Regions ===`)
        const topRegions = [...regionsWithMarkets]
            .sort((a, b) => b.stationCount - a.stationCount)
            .slice(0, 10)

        topRegions.forEach((region, index) => {
            console.log(`${index + 1}. ${region.regionName} - ${region.stationCount} stations`)
        })

    } catch (error) {
        console.error('Error building regions data:', error)
        process.exit(1)
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    buildRegionsData()
}

export default buildRegionsData
