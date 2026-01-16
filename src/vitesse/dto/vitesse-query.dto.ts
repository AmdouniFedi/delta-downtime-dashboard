import {
    IsDateString,
    IsEnum,
    IsOptional,
    IsInt,
    Min,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Filter Team Enum
 */
export enum TeamFilter {
    ALL = 'all',
    TEAM_1 = '1',
    TEAM_2 = '2',
    TEAM_3 = '3',
}

/**
 * Filter Mode Enum
 */
export enum VitesseMode {
    RAW = 'raw',       // Include all data (even 0)
    RUNNING = 'running' // Only speed > 0
}

/**
 * Custom Validator: startDate <= endDate
 */
@ValidatorConstraint({ name: 'isStartBeforeEnd', async: false })
export class IsStartBeforeEndConstraint implements ValidatorConstraintInterface {
    validate(endDate: string, args: ValidationArguments): boolean {
        const obj = args.object as VitesseQueryDto;
        if (!obj.startDate || !endDate) return true;
        return new Date(obj.startDate) <= new Date(endDate);
    }

    defaultMessage(): string {
        return 'startDate must be before or equal to endDate';
    }
}

/**
 * Validation DTO for Vitesse queries
 */
export class VitesseQueryDto {
    /**
     * Start Date (YYYY-MM-DD)
     */
    @IsDateString({}, { message: 'startDate must be a valid date (YYYY-MM-DD)' })
    startDate: string;

    /**
     * End Date (YYYY-MM-DD)
     */
    @IsDateString({}, { message: 'endDate must be a valid date (YYYY-MM-DD)' })
    @Validate(IsStartBeforeEndConstraint)
    endDate: string;

    /**
     * Team Filter
     * @default 'all'
     */
    @IsOptional()
    @IsEnum(TeamFilter, {
        message: 'team must be one of: all, 1, 2, 3',
    })
    team: TeamFilter = TeamFilter.ALL;

    /**
     * Machine Filter (Optional)
     */
    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value, 10) : null))
    @IsInt({ message: 'machineId must be an integer' })
    @Min(1, { message: 'machineId must be >= 1' })
    machineId?: number | null;

    /**
     * Calculation Mode
     * @default 'raw'
     */
    @IsOptional()
    @IsEnum(VitesseMode, {
        message: 'mode must be one of: raw, running',
    })
    mode: VitesseMode = VitesseMode.RAW;
}
