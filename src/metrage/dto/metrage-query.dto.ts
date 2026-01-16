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
 * Enum pour le filtre équipe
 */
export enum TeamFilter {
    ALL = 'all',
    TEAM_1 = '1',
    TEAM_2 = '2',
    TEAM_3 = '3',
}

/**
 * Validateur personnalisé: startDate <= endDate
 */
@ValidatorConstraint({ name: 'isStartBeforeEnd', async: false })
export class IsStartBeforeEndConstraint implements ValidatorConstraintInterface {
    validate(endDate: string, args: ValidationArguments): boolean {
        const obj = args.object as MetrageQueryDto;
        if (!obj.startDate || !endDate) return true;
        return new Date(obj.startDate) <= new Date(endDate);
    }

    defaultMessage(): string {
        return 'startDate must be before or equal to endDate';
    }
}

/**
 * DTO de validation pour les requêtes Métrage
 * Utilisé par les endpoints /summary et /timeseries
 */
export class MetrageQueryDto {
    /**
     * Date de début (YYYY-MM-DD)
     * Représente le shift_workday de début (inclusif)
     */
    @IsDateString({}, { message: 'startDate must be a valid date (YYYY-MM-DD)' })
    startDate: string;

    /**
     * Date de fin (YYYY-MM-DD)
     * Représente le shift_workday de fin (inclusif)
     */
    @IsDateString({}, { message: 'endDate must be a valid date (YYYY-MM-DD)' })
    @Validate(IsStartBeforeEndConstraint)
    endDate: string;

    /**
     * Filtre équipe: 'all' | '1' | '2' | '3'
     * @default 'all'
     */
    @IsOptional()
    @IsEnum(TeamFilter, {
        message: 'team must be one of: all, 1, 2, 3',
    })
    team: TeamFilter = TeamFilter.ALL;

    /**
     * Filtre machine (optionnel)
     */
    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value, 10) : null))
    @IsInt({ message: 'machineId must be an integer' })
    @Min(1, { message: 'machineId must be >= 1' })
    machineId?: number | null;
}
