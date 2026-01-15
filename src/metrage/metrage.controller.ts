import {
    Controller,
    Get,
    Query,
    UsePipes,
    ValidationPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { MetrageService } from './metrage.service';
import {
    MetrageQueryDto,
    MetrageSummaryResponse,
    MetrageTimeseriesResponse,
} from './dto';

/**
 * Controller Métrage
 * Expose les endpoints REST pour la page Métrage
 */
@Controller('api/metrage')
@UsePipes(
    new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }),
)
export class MetrageController {
    constructor(private readonly metrageService: MetrageService) { }

    /**
     * GET /api/metrage/summary
     *
     * Retourne les KPI cards pour la page Métrage:
     * - metrageTotalM: Métrage total en mètres
     * - daysCount: Nombre de jours calendaires (inclusif)
     * - metrageDailyAvgM: Moyenne journalière
     *
     * @param query - Paramètres de filtrage (dates, équipe, machine)
     * @returns MetrageSummaryResponse
     *
     * @example
     * GET /api/metrage/summary?startDate=2026-01-01&endDate=2026-01-08&team=all
     */
    @Get('summary')
    @HttpCode(HttpStatus.OK)
    async getSummary(
        @Query() query: MetrageQueryDto,
    ): Promise<MetrageSummaryResponse> {
        return this.metrageService.getSummary(query);
    }

    /**
     * GET /api/metrage/timeseries
     *
     * Retourne les points de données pour la courbe d'évolution:
     * - unit: Unité de mesure ('m')
     * - points: Array de {date, value} pour chaque jour
     *
     * Les jours sans données sont inclus avec value = 0
     *
     * @param query - Paramètres de filtrage (dates, équipe, machine)
     * @returns MetrageTimeseriesResponse
     *
     * @example
     * GET /api/metrage/timeseries?startDate=2026-01-01&endDate=2026-01-08&team=1
     */
    @Get('timeseries')
    @HttpCode(HttpStatus.OK)
    async getTimeseries(
        @Query() query: MetrageQueryDto,
    ): Promise<MetrageTimeseriesResponse> {
        return this.metrageService.getTimeseries(query);
    }
}
