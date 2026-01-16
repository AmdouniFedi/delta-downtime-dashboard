import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CauseEntity } from './entities/cause.entity';
import { ListCausesQueryDto } from './dto/list-causes.query.dto';

@Injectable()
export class CausesService {
    constructor(
        @InjectRepository(CauseEntity)
        private readonly causesRepo: Repository<CauseEntity>,
    ) { }

    async list(query: ListCausesQueryDto) {
        const {
            search,
            category,
            affectTRS,
            sortBy = 'code',
            sortDir = 'ASC',
            page = 1,
            limit = 1000,
        } = query;

        const qb = this.causesRepo.createQueryBuilder('c');

        if (category) qb.andWhere('c.category = :category', { category });

        if (search) {
            qb.andWhere('(c.code LIKE :s OR c.name LIKE :s)', { s: `%${search}%` });
        }

        // Only apply this filter if the query param is provided
        if (affectTRS === 'true') qb.andWhere('c.affect_TRS = 1');
        if (affectTRS === 'false') qb.andWhere('c.affect_TRS = 0');

        const sortMap: Record<string, string> = {
            code: 'c.code',
            name: 'c.name',
            category: 'c.category',
            affectTRS: 'c.affect_TRS',
        };

        qb.orderBy(sortMap[sortBy], sortDir);
        qb.skip((page - 1) * limit).take(limit);

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
}
