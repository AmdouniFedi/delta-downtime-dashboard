import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'causes' })
export class CauseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
    id!: string; // bigint -> safest as string in JS/TS

    @Column({ type: 'varchar', length: 32, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 128 })
    name!: string;

    @Column({ type: 'varchar', length: 64 })
    category!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description!: string | null;

    /**
     * DB column: affect_TRS TINYINT(1)
     * We map it to boolean in TS, and use a transformer to guarantee boolean values
     * (because MySQL often returns 0/1 as numbers).
     */
    @Column({
        name: 'affect_TRS',
        type: 'tinyint',
        width: 1,
        default: () => '1',
        transformer: {
            to: (value: boolean) => (value ? 1 : 0),
            from: (value: any) => value === 1 || value === true,
        },
    })
    affectTRS!: boolean;
}
