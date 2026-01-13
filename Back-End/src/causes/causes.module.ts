import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CausesController } from './causes.controller';
import { CausesService } from './causes.service';
import { CauseEntity } from './entities/cause.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CauseEntity])],
    controllers: [CausesController],
    providers: [CausesService],
})
export class CausesModule { }
