import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import {
    VitesseQueryDto,
    TeamFilter,
    VitesseMode,
    VitesseSummaryResponse,
    VitesseTimeseriesResponse,
    VitesseTimeseriesPoint,
} from './dto';

/**
 * Service Vitesse
 * Handles logic for Speed KPI and Timeseries.
 * Uses inline SQL to ensure robustness of Shift logic (Equipe 3) irrespective of DB Views.
 */
@Injectable()
export class VitesseService {
    constructor(
        @InjectConnection()
        private readonly connection: Connection,
    ) { }

    /**
     * Calculates number of days between two dates (inclusive)
     */
    calculateDaysCount(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    }

    /**
     * Generates all dates between startDate and endDate
     */
    generateDateRange(startDate: string, endDate: string): string[] {
        const dates: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        const current = new Date(start);
        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    /**
     * Fills missing days with 0 values
     */
    fillMissingDays(
        data: Map<string, number>,
        startDate: string,
        endDate: string,
    ): VitesseTimeseriesPoint[] {
        const allDates = this.generateDateRange(startDate, endDate);
        return allDates.map((date) => ({
            date,
            value: data.get(date) || 0,
        }));
    }

    /**
     * Builds the FROM/WHERE clause with parameters
     * Uses a subquery to normalize shift_id and shift_workday
     */
    private buildBaseQuery(query: VitesseQueryDto, select: string, groupBy = ''): { sql: string; params: any[] } {
        const params: any[] = [];

        // Base filters regarding speed validity
        let speedCondition = 'ps.speed_mpm IS NOT NULL';
        if (query.mode === VitesseMode.RUNNING) {
            speedCondition += ' AND ps.speed_mpm > 0';
        }

        // We wrap the raw data to calculate shift info safely
        // Note: Inline calculation is used to strictly follow the Equipe 3 rule
        const subquery = `
            SELECT
                ps.speed_mpm,
                ps.machine_id,
                CASE
                    WHEN TIME(ps.ts) >= '06:00:00' AND TIME(ps.ts) < '14:00:00' THEN 1
                    WHEN TIME(ps.ts) >= '14:00:00' AND TIME(ps.ts) < '22:00:00' THEN 2
                    ELSE 3
                END AS shift_id,
                DATE(ps.ts - INTERVAL 6 HOUR) AS shift_workday
            FROM production_samples ps
            WHERE ${speedCondition}
        `;

        // Outer WHERE conditions
        const conditions: string[] = ['t.shift_workday BETWEEN ? AND ?'];
        params.push(query.startDate, query.endDate);

        if (query.team !== TeamFilter.ALL) {
            conditions.push('t.shift_id = ?');
            params.push(parseInt(query.team, 10));
        }

        if (query.machineId) {
            conditions.push('t.machine_id = ?');
            params.push(query.machineId);
        }

        const sql = `
            SELECT ${select}
            FROM (${subquery}) t
            WHERE ${conditions.join(' AND ')}
            ${groupBy}
        `;

        return { sql, params };
    }

    /**
     * GET /api/vitesse/summary
     */
    async getSummary(query: VitesseQueryDto): Promise<VitesseSummaryResponse> {
        try {
            const { sql, params } = this.buildBaseQuery(
                query,
                'AVG(t.speed_mpm) AS avg_speed, MAX(t.speed_mpm) AS max_speed'
            );

            const result = await this.connection.query(sql, params);
            const row = result[0];

            return {
                startDate: query.startDate,
                endDate: query.endDate,
                team: query.team,
                machineId: query.machineId || null,
                mode: query.mode,
                avgSpeedMpm: parseFloat(row?.avg_speed || '0'),
                maxSpeedMpm: parseFloat(row?.max_speed || '0'),
            };
        } catch (error) {
            console.error('VitesseService.getSummary error:', error);
            throw new InternalServerErrorException('Database error fetching summary');
        }
    }

    /**
     * GET /api/vitesse/timeseries
     */
    async getTimeseries(query: VitesseQueryDto): Promise<VitesseTimeseriesResponse> {
        try {
            const { sql, params } = this.buildBaseQuery(
                query,
                't.shift_workday AS date, AVG(t.speed_mpm) AS value',
                'GROUP BY t.shift_workday ORDER BY t.shift_workday ASC'
            );

            const rows: { date: string | Date; value: string }[] = await this.connection.query(sql, params);

            // Convert to Map
            const dataMap = new Map<string, number>();
            for (const row of rows) {
                const dateStr = row.date instanceof Date
                    ? row.date.toISOString().split('T')[0]
                    : String(row.date);
                dataMap.set(dateStr, parseFloat(row.value || '0'));
            }

            // Fill missing days
            const points = this.fillMissingDays(
                dataMap,
                query.startDate,
                query.endDate
            );

            return {
                unit: 'm/min',
                points,
            };
        } catch (error) {
            console.error('VitesseService.getTimeseries error:', error);
            throw new InternalServerErrorException('Database error fetching timeseries');
        }
    }
}
