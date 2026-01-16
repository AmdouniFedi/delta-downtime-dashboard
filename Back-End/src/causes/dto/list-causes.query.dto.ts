import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListCausesQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    category?: string;

    /**
     * affectTRS:
     *  - "true"  -> only causes that affect TRS
     *  - "false" -> only causes that do NOT affect TRS
     *  - undefined -> ALL causes (default behavior)
     */
    @IsOptional()
    @IsIn(['true', 'false'])
    affectTRS?: 'true' | 'false';

    @IsOptional()
    @IsIn(['code', 'name', 'category', 'affectTRS'])
    sortBy?: 'code' | 'name' | 'category' | 'affectTRS' = 'code';

    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sortDir?: 'ASC' | 'DESC' = 'ASC';

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    page?: number = 1;

    /**
     * Causes list is usually small, so a bigger default makes sense
     * to show "all causes" in the UI without implementing pagination yet.
     */
    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @Max(2000)
    limit?: number = 1000;
}
