import {
    Controller,
    Get,
    Query,
    UsePipes,
    ValidationPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { VitesseService } from './vitesse.service';
import {
    VitesseQueryDto,
    VitesseSummaryResponse,
    VitesseTimeseriesResponse,
} from './dto';

/**
 * Controller Vitesse
 * Endpoints for Speed page
 */
@Controller('api/vitesse')
@UsePipes(
    new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }),
)
export class VitesseController {
    constructor(private readonly vitesseService: VitesseService) { }

    /**
     * GET /api/vitesse/summary
     * Returns KPI cards: Avg Speed, Max Speed
     */
    @Get('summary')
    @HttpCode(HttpStatus.OK)
    async getSummary(
        @Query() query: VitesseQueryDto,
    ): Promise<VitesseSummaryResponse> {
        return this.vitesseService.getSummary(query);
    }

    /**
     * GET /api/vitesse/timeseries
     * Returns daily evolution (avg speed)
     */
    @Get('timeseries')
    @HttpCode(HttpStatus.OK)
    async getTimeseries(
        @Query() query: VitesseQueryDto,
    ): Promise<VitesseTimeseriesResponse> {
        return this.vitesseService.getTimeseries(query);
    }
}
