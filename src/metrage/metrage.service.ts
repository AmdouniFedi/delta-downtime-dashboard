import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import {
    MetrageQueryDto,
    TeamFilter,
    MetrageSummaryResponse,
    MetrageTimeseriesResponse,
    TimeseriesPoint,
} from './dto';

/**
 * Service Métrage
 * Gère la logique métier et les requêtes SQL pour la page Métrage
 */
@Injectable()
export class MetrageService {
    constructor(
        @InjectConnection()
        private readonly connection: Connection,
    ) { }

    /**
     * Calcule le nombre de jours calendaires entre deux dates (inclusif)
     */
    calculateDaysCount(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // +1 pour inclusif
    }

    /**
     * Génère tous les jours entre startDate et endDate
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
     * Complète la timeseries avec les jours manquants (value = 0)
     */
    fillMissingDays(
        data: Map<string, number>,
        startDate: string,
        endDate: string,
    ): TimeseriesPoint[] {
        const allDates = this.generateDateRange(startDate, endDate);
        return allDates.map((date) => ({
            date,
            value: data.get(date) || 0,
        }));
    }

    /**
     * Construit les clauses WHERE dynamiques avec paramètres
     * Retourne [whereClause, params]
     */
    private buildWhereClause(query: MetrageQueryDto): {
        whereClause: string;
        params: any[];
    } {
        const conditions: string[] = [];
        const params: any[] = [];

        // Filtre date range (obligatoire)
        conditions.push('shift_workday BETWEEN ? AND ?');
        params.push(query.startDate, query.endDate);

        // Filtre équipe (optionnel)
        if (query.team !== TeamFilter.ALL) {
            conditions.push('shift_id = ?');
            params.push(parseInt(query.team, 10));
        }

        // Filtre machine (optionnel)
        if (query.machineId) {
            conditions.push('machine_id = ?');
            params.push(query.machineId);
        }

        return {
            whereClause: conditions.join(' AND '),
            params,
        };
    }

    /**
     * GET /api/metrage/summary
     * Retourne les KPI cards: total, jours, moyenne
     */
    async getSummary(query: MetrageQueryDto): Promise<MetrageSummaryResponse> {
        try {
            const { whereClause, params } = this.buildWhereClause(query);
            const daysCount = this.calculateDaysCount(query.startDate, query.endDate);

            const sql = `
        SELECT 
          COALESCE(SUM(metrage_inc_m), 0) AS metrage_total_m
        FROM v_production_samples_enriched
        WHERE ${whereClause}
      `;

            const result = await this.connection.query(sql, params);
            const metrageTotalM = parseFloat(result[0]?.metrage_total_m || '0');
            const metrageDailyAvgM =
                daysCount > 0 ? Math.round(metrageTotalM / daysCount) : 0;

            return {
                startDate: query.startDate,
                endDate: query.endDate,
                team: query.team,
                machineId: query.machineId || null,
                metrageTotalM: Math.round(metrageTotalM),
                daysCount,
                metrageDailyAvgM,
            };
        } catch (error) {
            console.error('MetrageService.getSummary error:', error);
            throw new InternalServerErrorException('Database error fetching summary');
        }
    }

    /**
     * GET /api/metrage/timeseries
     * Retourne les points pour la courbe d'évolution quotidienne
     */
    async getTimeseries(
        query: MetrageQueryDto,
    ): Promise<MetrageTimeseriesResponse> {
        try {
            const { whereClause, params } = this.buildWhereClause(query);

            const sql = `
        SELECT 
          shift_workday AS date,
          SUM(metrage_inc_m) AS value
        FROM v_production_samples_enriched
        WHERE ${whereClause}
        GROUP BY shift_workday
        ORDER BY shift_workday ASC
      `;

            const rows: { date: any; value: string }[] =
                await this.connection.query(sql, params);

            // Convertir en Map pour lookup rapide
            const dataMap = new Map<string, number>();
            for (const row of rows) {
                const dateStr =
                    (row.date as any) instanceof Date
                        ? row.date.toISOString().split('T')[0]
                        : String(row.date);
                dataMap.set(dateStr, Math.round(parseFloat(row.value || '0')));
            }

            // Compléter avec les jours manquants
            const points = this.fillMissingDays(
                dataMap,
                query.startDate,
                query.endDate,
            );

            return {
                unit: 'm',
                points,
            };
        } catch (error) {
            console.error('MetrageService.getTimeseries error:', error);
            throw new InternalServerErrorException(
                'Database error fetching timeseries',
            );
        }
    }
}
