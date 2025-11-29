import { useState, useEffect } from 'react'
import { fetchRegions } from '../api/client'
import '../styles/RegionSelector.css'

export default function RegionSelector({ onSelectRegion }) {
    const HUB_REGIONS = ['Domain', 'Heimatar', 'Metropolis', 'Sinq Laison', 'The Forge']
    const [regions, setRegions] = useState([])
    const [selectedRegion, setSelectedRegion] = useState('all')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadRegions = async () => {
            try {
                const data = await fetchRegions()
                const regionList = data.regions || []
                setRegions(regionList)
                setLoading(false)
            } catch (error) {
                console.error('Error loading regions:', error)
                setError(error.message)
                setLoading(false)
            }
        }
        loadRegions()
    }, [])

    const handleRegionChange = (e) => {
        const regionId = e.target.value
        setSelectedRegion(regionId)
        if (onSelectRegion) {
            onSelectRegion(regionId === 'all' ? null : parseInt(regionId))
        }
    }

    if (error) {
        return (
            <div className="region-selector error">
                <p>Error loading regions: {error}</p>
            </div>
        )
    }

    const hubRegions = regions.filter(r => HUB_REGIONS.includes(r.regionName))
    const otherRegions = regions.filter(r => !HUB_REGIONS.includes(r.regionName))

    return (
        <div className="region-selector">
            <select
                value={selectedRegion}
                onChange={handleRegionChange}
                className="region-dropdown"
                disabled={loading}
            >
                <option value="all">All Regions</option>
                <optgroup label="Popular Regions">
                    {hubRegions.map(region => (
                        <option key={region.regionID} value={region.regionID}>
                            {region.regionName}
                        </option>
                    ))}
                </optgroup>
                <optgroup label="All Regions (Alphabetical)">
                    {otherRegions.map(region => (
                        <option key={region.regionID} value={region.regionID}>
                            {region.regionName}
                        </option>
                    ))}
                </optgroup>
            </select>
        </div>
    )
}
