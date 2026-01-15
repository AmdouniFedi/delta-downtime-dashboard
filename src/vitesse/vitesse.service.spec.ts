import { Test, TestingModule } from '@nestjs/testing';
import { VitesseService } from './vitesse.service';
import { Connection } from 'typeorm';

describe('VitesseService', () => {
    let service: VitesseService;

    // Mock database connection
    const mockConnection = {
        query: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VitesseService,
                {
                    provide: Object.getPrototypeOf(require('typeorm').getConnectionToken()), // Hack for InjectConnection
                    useValue: mockConnection,
                },
                {
                    provide: 'DATABASE_CONNECTION', // Fallback if name injection is used
                    useValue: mockConnection
                }
            ],
        }).compile();

        service = module.get<VitesseService>(VitesseService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateDateRange', () => {
        it('should generate a full range of dates inclusive', () => {
            const range = service.generateDateRange('2026-01-01', '2026-01-03');
            expect(range).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
        });

        it('should handle single day range', () => {
            const range = service.generateDateRange('2026-01-01', '2026-01-01');
            expect(range).toEqual(['2026-01-01']);
        });
    });

    describe('Shift Logic (Equipe 3 Rules)', () => {
        // We cannot easily test the SQL logic with unit tests without a real DB or complex SQL parser.
        // But we can verify the SQL string construction is correct or test logic if extracted.
        // Since logic is INLINE in SQL, we will simulate the expected SQL parameters/structure relative to inputs.

        it('should build correct parameters for team 3 and mode running', async () => {
            // Mock query return
            mockConnection.query.mockResolvedValue([{ avg_speed: '75.5', max_speed: '120' }]);

            await service.getSummary({
                startDate: '2026-01-01',
                endDate: '2026-01-02',
                team: '3' as any,
                mode: 'running' as any,
                machineId: null
            });

            // We verify that query was called
            expect(mockConnection.query).toHaveBeenCalled();

            // Inspect params
            const callArgs = mockConnection.query.mock.calls[0];
            const sql = callArgs[0];
            const params = callArgs[1];

            // Check params order: startDate, endDate, teamId
            expect(params).toEqual(['2026-01-01', '2026-01-02', 3]);

            // Check SQL contains relevant logic
            expect(sql).toContain('speed_mpm > 0'); // Mode running
            expect(sql).toContain('t.shift_id = ?'); // Team filter
        });
    });
});
