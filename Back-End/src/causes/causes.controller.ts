import { Controller, Get, Query } from '@nestjs/common';
import { CausesService } from './causes.service';
import { ListCausesQueryDto } from './dto/list-causes.query.dto';

@Controller('causes')
export class CausesController {
    constructor(private readonly causesService: CausesService) { }

    @Get()
    async list(@Query() query: ListCausesQueryDto) {
        return this.causesService.list(query);
    }
}
