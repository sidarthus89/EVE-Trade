/**
 * MySQL Database Schema for EVE Data Site
 * Run this SQL on your MySQL server to create the database and tables
 */

-- Note: Database should already be created via Plesk
-- Just run this file to create tables

-- Regions table
CREATE TABLE IF NOT EXISTS regions (
    region_id INT PRIMARY KEY,
    region_name VARCHAR(255) NOT NULL,
    station_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_region_name (region_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
    station_id BIGINT PRIMARY KEY,
    station_name VARCHAR(255) NOT NULL,
    system_id INT NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    region_id INT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_region (region_id),
    INDEX idx_system (system_id),
    INDEX idx_station_name (station_name),
    FOREIGN KEY (region_id) REFERENCES regions(region_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Item types table (for market items)
CREATE TABLE IF NOT EXISTS item_types (
    type_id INT PRIMARY KEY,
    type_name VARCHAR(255) NOT NULL,
    description TEXT,
    volume DECIMAL(20, 4),
    mass DECIMAL(20, 4),
    published BOOLEAN DEFAULT TRUE,
    market_group_id INT,
    icon_id INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_name (type_name),
    INDEX idx_market_group (market_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Market groups table (categories/subcategories)
CREATE TABLE IF NOT EXISTS market_groups (
    market_group_id INT PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_group_id INT DEFAULT NULL,
    icon_id INT,
    has_types BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent (parent_group_id),
    INDEX idx_group_name (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Market orders table (buy/sell orders)
CREATE TABLE IF NOT EXISTS market_orders (
    order_id BIGINT PRIMARY KEY,
    region_id INT NOT NULL,
    type_id INT NOT NULL,
    location_id BIGINT NOT NULL,
    system_id INT NOT NULL,
    is_buy_order BOOLEAN NOT NULL,
    price DECIMAL(20, 2) NOT NULL,
    volume_remain INT NOT NULL,
    volume_total INT NOT NULL,
    min_volume INT DEFAULT 1,
    duration INT NOT NULL,
    issued DATETIME NOT NULL,
    expires DATETIME NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_region_type (region_id, type_id),
    INDEX idx_type (type_id),
    INDEX idx_location (location_id),
    INDEX idx_expires (expires),
    INDEX idx_is_buy (is_buy_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Market history table (daily aggregated data)
CREATE TABLE IF NOT EXISTS market_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    type_id INT NOT NULL,
    date DATE NOT NULL,
    average DECIMAL(20, 2) NOT NULL,
    highest DECIMAL(20, 2) NOT NULL,
    lowest DECIMAL(20, 2) NOT NULL,
    order_count INT NOT NULL,
    volume BIGINT NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_history (region_id, type_id, date),
    INDEX idx_region_type_date (region_id, type_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data sync status table (track last sync times)
CREATE TABLE IF NOT EXISTS sync_status (
    sync_type VARCHAR(50) PRIMARY KEY,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    records_processed INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial sync status records
INSERT INTO sync_status (sync_type, status) VALUES
    ('regions', 'pending'),
    ('stations', 'pending'),
    ('market_groups', 'pending'),
    ('item_types', 'pending')
ON DUPLICATE KEY UPDATE sync_type=sync_type;
