-- ============================================================
-- MASTER SETUP SCRIPT
-- Delta Downtime Dashboard
-- ============================================================
-- Ce script installe TOUT : Base de données, Tables, Vues et Données.
-- Exécutez ce fichier une seule fois.

-- 1. CRÉATION DE LA BASE (Si elle n'existe pas)
CREATE DATABASE IF NOT EXISTS delta_db;
USE delta_db;

-- 2. CRÉATION DE LA TABLE
DROP TABLE IF EXISTS production_samples;
CREATE TABLE production_samples (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ts DATETIME NOT NULL COMMENT 'Timestamp en heure locale',
    machine_id INT NOT NULL,
    metrage_inc_m DECIMAL(12,3) NOT NULL DEFAULT 0.000 COMMENT 'Métrage incrémental en mètres',
    speed_mpm DECIMAL(10,2) NULL COMMENT 'Vitesse en mètres par minute',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ts (ts),
    INDEX idx_machine_ts (machine_id, ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. INSERTION DES DONNÉES (Exemple)
INSERT INTO production_samples (ts, machine_id, metrage_inc_m, speed_mpm) VALUES
-- Équipe 1 (06:00–13:59)
('2026-01-10 06:15:00', 1, 125.500, 42.50),
('2026-01-10 08:30:00', 1, 198.250, 44.00),
('2026-01-10 10:45:00', 1, 340.750, 45.00),
('2026-01-10 07:00:00', 2, 210.000, 38.00),
('2026-01-10 11:30:00', 2, 275.600, 40.50),
-- Équipe 2 (14:00–21:59)
('2026-01-10 14:30:00', 1, 280.250, 44.00),
('2026-01-10 17:00:00', 1, 225.800, 43.00),
('2026-01-10 18:45:00', 1, 195.100, 41.00),
('2026-01-10 15:15:00', 2, 320.800, 39.50),
('2026-01-10 20:00:00', 2, 185.400, 37.00),
-- Équipe 3 (22:00–05:59)
('2026-01-10 22:15:00', 1, 150.000, 40.00),
('2026-01-10 23:30:00', 1, 130.500, 38.00),
('2026-01-10 22:45:00', 2, 185.500, 37.00),
-- Cross-midnight logic tests
('2026-01-11 01:30:00', 1, 175.300, 38.50),
('2026-01-11 03:15:00', 1, 145.200, 36.00),
('2026-01-11 04:45:00', 1, 130.200, 36.00),
('2026-01-11 02:00:00', 2, 160.800, 35.00),
('2026-01-11 05:30:00', 2, 145.600, 35.50),
-- New day
('2026-01-11 06:00:00', 1, 290.450, 46.00),
('2026-01-11 09:30:00', 1, 315.800, 47.00),
('2026-01-11 07:15:00', 2, 265.900, 42.00),
('2026-01-11 12:00:00', 2, 285.400, 43.50);

-- 4. CRÉATION DE LA VUE MÉTRAGE
CREATE OR REPLACE VIEW v_production_samples_enriched AS
SELECT 
    id, ts, machine_id, metrage_inc_m, speed_mpm,
    CASE 
        WHEN TIME(ts) >= '06:00:00' AND TIME(ts) < '14:00:00' THEN 1
        WHEN TIME(ts) >= '14:00:00' AND TIME(ts) < '22:00:00' THEN 2
        ELSE 3
    END AS shift_id,
    DATE(ts - INTERVAL 6 HOUR) AS shift_workday,
    created_at
FROM production_samples;

-- 5. CRÉATION DE LA VUE VITESSE
CREATE OR REPLACE VIEW v_speed_samples_enriched AS
SELECT
  ps.ts, ps.machine_id, ps.speed_mpm,
  CASE
    WHEN TIME(ps.ts) >= '06:00:00' AND TIME(ps.ts) < '14:00:00' THEN 1
    WHEN TIME(ps.ts) >= '14:00:00' AND TIME(ps.ts) < '22:00:00' THEN 2
    ELSE 3
  END AS shift_id,
  DATE(ps.ts - INTERVAL 6 HOUR) AS shift_workday
FROM production_samples ps
WHERE ps.speed_mpm IS NOT NULL;
