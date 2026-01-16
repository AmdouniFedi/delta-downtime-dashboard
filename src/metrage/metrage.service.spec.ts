import { Test, TestingModule } from '@nestjs/testing';
import { MetrageService } from './metrage.service';
import { getShiftId, getShiftWorkday, getShiftInfo } from './utils/shift.utils';

/**
 * Tests unitaires pour MetrageService
 * Focus sur la logique date/équipe (shift calculations)
 */
describe('MetrageService', () => {
    let service: MetrageService;

    // Mock de la connexion TypeORM
    const mockConnection = {
        query: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MetrageService,
                {
                    provide: 'Connection',
                    useValue: mockConnection,
                },
            ],
        })
            .overrideProvider('Connection')
            .useValue(mockConnection)
            .compile();

        // Créer le service manuellement pour les tests de logique pure
        service = new MetrageService(mockConnection as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================
    // Tests: calculateDaysCount
    // =========================================================
    describe('calculateDaysCount', () => {
        it('should return 1 for same day', () => {
            expect(service.calculateDaysCount('2026-01-10', '2026-01-10')).toBe(1);
        });

        it('should return 8 for 2026-01-01 to 2026-01-08 (inclusive)', () => {
            expect(service.calculateDaysCount('2026-01-01', '2026-01-08')).toBe(8);
        });

        it('should return 31 for full month January', () => {
            expect(service.calculateDaysCount('2026-01-01', '2026-01-31')).toBe(31);
        });

        it('should return 3 for 2026-01-10 to 2026-01-12', () => {
            expect(service.calculateDaysCount('2026-01-10', '2026-01-12')).toBe(3);
        });
    });

    // =========================================================
    // Tests: generateDateRange
    // =========================================================
    describe('generateDateRange', () => {
        it('should generate all dates between start and end (inclusive)', () => {
            const dates = service.generateDateRange('2026-01-10', '2026-01-12');
            expect(dates).toEqual(['2026-01-10', '2026-01-11', '2026-01-12']);
        });

        it('should return single date when start equals end', () => {
            const dates = service.generateDateRange('2026-01-15', '2026-01-15');
            expect(dates).toEqual(['2026-01-15']);
        });
    });

    // =========================================================
    // Tests: fillMissingDays
    // =========================================================
    describe('fillMissingDays', () => {
        it('should fill missing days with value 0', () => {
            const data = new Map<string, number>([
                ['2026-01-10', 100],
                ['2026-01-12', 200],
            ]);

            const result = service.fillMissingDays(data, '2026-01-10', '2026-01-12');

            expect(result).toEqual([
                { date: '2026-01-10', value: 100 },
                { date: '2026-01-11', value: 0 }, // Filled with 0
                { date: '2026-01-12', value: 200 },
            ]);
        });

        it('should handle empty data', () => {
            const data = new Map<string, number>();
            const result = service.fillMissingDays(data, '2026-01-10', '2026-01-12');

            expect(result).toEqual([
                { date: '2026-01-10', value: 0 },
                { date: '2026-01-11', value: 0 },
                { date: '2026-01-12', value: 0 },
            ]);
        });
    });
});

// =========================================================
// Tests: Shift Utilities (logique équipes)
// =========================================================
describe('Shift Utilities', () => {
    // =========================================================
    // Tests: getShiftId
    // =========================================================
    describe('getShiftId', () => {
        it('should return 1 for 06:00', () => {
            const ts = new Date('2026-01-10T06:00:00');
            expect(getShiftId(ts)).toBe(1);
        });

        it('should return 1 for 13:59', () => {
            const ts = new Date('2026-01-10T13:59:00');
            expect(getShiftId(ts)).toBe(1);
        });

        it('should return 2 for 14:00', () => {
            const ts = new Date('2026-01-10T14:00:00');
            expect(getShiftId(ts)).toBe(2);
        });

        it('should return 2 for 21:59', () => {
            const ts = new Date('2026-01-10T21:59:00');
            expect(getShiftId(ts)).toBe(2);
        });

        it('should return 3 for 22:00', () => {
            const ts = new Date('2026-01-10T22:00:00');
            expect(getShiftId(ts)).toBe(3);
        });

        it('should return 3 for 23:00 (before midnight)', () => {
            const ts = new Date('2026-01-10T23:00:00');
            expect(getShiftId(ts)).toBe(3);
        });

        it('should return 3 for 01:00 (after midnight)', () => {
            const ts = new Date('2026-01-11T01:00:00');
            expect(getShiftId(ts)).toBe(3);
        });

        it('should return 3 for 05:59 (end of night shift)', () => {
            const ts = new Date('2026-01-11T05:59:00');
            expect(getShiftId(ts)).toBe(3);
        });

        it('should return 1 for 06:00 (start of day shift)', () => {
            const ts = new Date('2026-01-11T06:00:00');
            expect(getShiftId(ts)).toBe(1);
        });
    });

    // =========================================================
    // Tests: getShiftWorkday (CRITICAL: cross-midnight logic)
    // =========================================================
    describe('getShiftWorkday', () => {
        it('should return same day for 06:00', () => {
            const ts = new Date('2026-01-11T06:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-11');
        });

        it('should return same day for 14:00', () => {
            const ts = new Date('2026-01-11T14:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-11');
        });

        it('should return same day for 22:00', () => {
            const ts = new Date('2026-01-10T22:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-10');
        });

        it('should return same day for 23:00', () => {
            const ts = new Date('2026-01-10T23:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-10');
        });

        // CRITICAL: Cross-midnight cases
        it('should return PREVIOUS day for 01:00 (cross-midnight)', () => {
            const ts = new Date('2026-01-11T01:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-10'); // ← CRITICAL!
        });

        it('should return PREVIOUS day for 02:00 (cross-midnight)', () => {
            const ts = new Date('2026-01-11T02:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-10'); // ← CRITICAL!
        });

        it('should return PREVIOUS day for 05:59 (cross-midnight)', () => {
            const ts = new Date('2026-01-11T05:59:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-10'); // ← CRITICAL!
        });

        it('should return CURRENT day for 06:00 (new workday starts)', () => {
            const ts = new Date('2026-01-11T06:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-11'); // ← New day!
        });

        // Edge case: exactly at midnight
        it('should return PREVIOUS day for 00:00 (midnight)', () => {
            const ts = new Date('2026-01-11T00:00:00');
            expect(getShiftWorkday(ts)).toBe('2026-01-10'); // ← CRITICAL!
        });
    });

    // =========================================================
    // Tests: getShiftInfo (combined)
    // =========================================================
    describe('getShiftInfo', () => {
        it('should return correct info for 23:00 (Équipe 3, same workday)', () => {
            const ts = new Date('2026-01-10T23:00:00');
            const info = getShiftInfo(ts);
            expect(info.shiftId).toBe(3);
            expect(info.shiftWorkday).toBe('2026-01-10');
        });

        it('should return correct info for 01:00 (Équipe 3, previous workday)', () => {
            const ts = new Date('2026-01-11T01:00:00');
            const info = getShiftInfo(ts);
            expect(info.shiftId).toBe(3);
            expect(info.shiftWorkday).toBe('2026-01-10'); // Previous day!
        });

        it('should return correct info for 05:59 (Équipe 3, previous workday)', () => {
            const ts = new Date('2026-01-11T05:59:00');
            const info = getShiftInfo(ts);
            expect(info.shiftId).toBe(3);
            expect(info.shiftWorkday).toBe('2026-01-10'); // Previous day!
        });

        it('should return correct info for 06:00 (Équipe 1, new workday)', () => {
            const ts = new Date('2026-01-11T06:00:00');
            const info = getShiftInfo(ts);
            expect(info.shiftId).toBe(1);
            expect(info.shiftWorkday).toBe('2026-01-11'); // New day starts!
        });
    });
});
