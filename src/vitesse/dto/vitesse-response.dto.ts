/**
 * Response DTOs for Vitesse API
 */

/**
 * Response for GET /api/vitesse/summary
 */
export interface VitesseSummaryResponse {
    startDate: string;
    endDate: string;
    team: string;
    machineId: number | null;
    mode: string;
    /** Average speed in m/min */
    avgSpeedMpm: number;
    /** Max speed in m/min */
    maxSpeedMpm: number;
}

/**
 * Single point in timeseries
 */
export interface VitesseTimeseriesPoint {
    /** Date (YYYY-MM-DD) */
    date: string;
    /** Average speed value */
    value: number;
}

/**
 * Response for GET /api/vitesse/timeseries
 */
export interface VitesseTimeseriesResponse {
    unit: string;
    points: VitesseTimeseriesPoint[];
}
