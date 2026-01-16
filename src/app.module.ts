import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetrageModule } from './metrage/metrage.module';
import { VitesseModule } from './vitesse/vitesse.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '24010575', // User provided password
            database: 'delta_db', // User created DB
            entities: [], // Inline SQL used mostly, but standard setup requires this
            synchronize: false, // We use SQL scripts
            autoLoadEntities: true,
        }),
        MetrageModule,
        VitesseModule,
    ],
})
export class AppModule { }
