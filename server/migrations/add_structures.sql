-- Add structures table for player Upwell structures
CREATE TABLE
IF NOT EXISTS structures
(
    structure_id BIGINT PRIMARY KEY,
    structure_name VARCHAR
(255),
    owner_id INT,
    owner_name VARCHAR
(255),
    system_id INT,
    system_name VARCHAR
(255),
    region_id INT,
    type_id INT,
    type_name VARCHAR
(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY
(region_id) REFERENCES regions
(region_id) ON
DELETE CASCADE,
    INDEX idx_region (region_id),
    INDEX idx_system
(system_id)
);

-- Add ESI tokens table for OAuth authentication
CREATE TABLE
IF NOT EXISTS esi_tokens
(
    id INT PRIMARY KEY AUTO_INCREMENT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP
);
