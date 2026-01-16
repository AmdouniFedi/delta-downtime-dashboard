/**
 * Response DTOs pour l'API Métrage
 */

/**
 * Réponse pour GET /api/metrage/summary
 */
export interface MetrageSummaryResponse {
    /** Date de début du range */
    startDate: string;
    /** Date de fin du range */
    endDate: string;
    /** Filtre équipe appliqué */
    team: string;
    /** Filtre machine appliqué (null si tous) */
    machineId: number | null;
    /** Métrage total en mètres */
    metrageTotalM: number;
    /** Nombre de jours calendaires (inclusif) */
    daysCount: number;
    /** Moyenne journalière en mètres */
    metrageDailyAvgM: number;
}

/**
 * Point de données pour la timeseries
 */
export interface TimeseriesPoint {
    /** Date (YYYY-MM-DD) */
    date: string;
    /** Valeur du métrage en mètres */
    value: number;
}

/**
 * Réponse pour GET /api/metrage/timeseries
 */
export interface MetrageTimeseriesResponse {
    /** Unité de mesure */
    unit: string;
    /** Points de données */
    points: TimeseriesPoint[];
}
