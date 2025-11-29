// Sample EVE Online Static Data - Categories and Items
// In production, this would come from the EVE Static Data Export

export const eveCategories = {
    Ammunition: {
        id: 8,
        items: [
            { id: 587, name: 'Concussion Bomb' },
            { id: 588, name: 'Electron Bomb' },
            { id: 589, name: 'Focused Void Bomb' },
            { id: 590, name: 'Lockbreaker Bomb' },
            { id: 591, name: 'Scrapnel Bomb' },
            { id: 592, name: 'Void Bomb' }
        ]
    },
    'Armor Plates': {
        id: 59,
        items: [
            { id: 2048, name: 'Adaptive Nano Plating' },
            { id: 2049, name: 'Armor Plate' },
            { id: 2050, name: 'Expanded Armor Plate' }
        ]
    },
    'Shield Modules': {
        id: 69,
        items: [
            { id: 2044, name: 'Mark I Shield Emitter' },
            { id: 2045, name: 'Shield Boost Amplifier' },
            { id: 2046, name: 'Small Shield Booster' }
        ]
    },
    'Propulsion Modules': {
        id: 65,
        items: [
            { id: 2063, name: '10MN Afterburner I' },
            { id: 2064, name: '1MN Afterburner I' },
            { id: 2065, name: 'Microwarp Drive' }
        ]
    },
    Weapons: {
        id: 7,
        items: [
            { id: 2001, name: 'Small Blaster Turret' },
            { id: 2002, name: 'Dual Light Pulse Laser' },
            { id: 2003, name: 'Small Missile Launcher' }
        ]
    },
    'Drones': {
        id: 18,
        items: [
            { id: 2036, name: 'Scout Drone' },
            { id: 2037, name: 'Combat Drone' },
            { id: 2038, name: 'Salvage Drone' }
        ]
    },
    'Rigs': {
        id: 31,
        items: [
            { id: 25000001, name: 'Small Armor Reinforcement Rig' },
            { id: 25000002, name: 'Small Capacitor Charging Rig' },
            { id: 25000003, name: 'Small Shield Reinforcement Rig' }
        ]
    },
    'Modules': {
        id: 66,
        items: [
            { id: 5995, name: 'Damage Control I' },
            { id: 5996, name: 'Heat Sink I' },
            { id: 5997, name: 'Power Diagnostic System I' }
        ]
    }
}

export const regions = [
    { id: 10000002, name: 'The Forge' },
    { id: 10000043, name: 'Domain' },
    { id: 10000030, name: 'Heimatar' },
    { id: 10000037, name: 'Sinq Laison' },
    { id: 10000042, name: 'Metropolis' }
]
