import { Module } from '@nestjs/common';
import { VitesseController } from './vitesse.controller';
import { VitesseService } from './vitesse.service';

/**
 * Module Vitesse
 * Encapsulates logic for the Vitesse page (Speed KPIs + Chart)
 */
@Module({
    controllers: [VitesseController],
    providers: [VitesseService],
    exports: [VitesseService],
})
export class VitesseModule { }
