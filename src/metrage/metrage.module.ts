import { Module } from '@nestjs/common';
import { MetrageController } from './metrage.controller';
import { MetrageService } from './metrage.service';

/**
 * Module Métrage
 * Encapsule la logique de la page Métrage (KPI cards + courbe évolution)
 */
@Module({
    controllers: [MetrageController],
    providers: [MetrageService],
    exports: [MetrageService],
})
export class MetrageModule { }
