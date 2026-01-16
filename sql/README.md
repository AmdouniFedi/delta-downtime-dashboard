# Delta Downtime Dashboard - SQL pour la page "Métrage"

## 📁 Structure des fichiers

| Fichier | Description |
|---------|-------------|
| `01_create_table.sql` | Création de la table `production_samples` |
| `02_sample_data.sql` | Données de test (35 enregistrements) |
| `03_create_view.sql` | VIEW `v_production_samples_enriched` |
| `04_query_summary.sql` | Requête pour les KPI Cards |
| `05_query_timeseries.sql` | Requête pour le graphique d'évolution |
| `06_alternative_counter.sql` | Alternative avec compteur cumulatif |

## 🚀 Installation

Exécutez les fichiers dans l'ordre:

```bash
mysql -u user -p database < 01_create_table.sql
mysql -u user -p database < 02_sample_data.sql
mysql -u user -p database < 03_create_view.sql
```

## ⏰ Logique des équipes (Shifts)

| Équipe | Horaires | Particularité |
|--------|----------|---------------|
| Équipe 1 | 06:00 – 13:59:59 | - |
| Équipe 2 | 14:00 – 21:59:59 | - |
| Équipe 3 | 22:00 – 05:59:59 | **Cross-midnight** |

### Jour de travail (shift_workday)

La formule `DATE(ts - INTERVAL 6 HOUR)` rattache automatiquement les heures **00:00-05:59** au jour de travail **précédent**.

**Exemples:**

| Timestamp | shift_id | shift_workday |
|-----------|----------|---------------|
| 2026-01-11 02:00:00 | 3 | **2026-01-10** |
| 2026-01-11 06:00:00 | 1 | 2026-01-11 |
| 2026-01-10 22:30:00 | 3 | 2026-01-10 |

## 📊 Utilisation dans Next.js

### Requête Summary (KPI Cards)

```typescript
// api/metrage/summary/route.ts
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const teamId = searchParams.get('team_id');
  const machineId = searchParams.get('machine_id');

  const result = await prisma.$queryRaw`
    SELECT 
      COALESCE(SUM(metrage_inc_m), 0) AS metrage_total_m,
      DATEDIFF(${endDate}, ${startDate}) + 1 AS days_count,
      ROUND(
        COALESCE(
          SUM(metrage_inc_m) / (DATEDIFF(${endDate}, ${startDate}) + 1),
          0
        ),
        3
      ) AS metrage_daily_avg_m
    FROM v_production_samples_enriched
    WHERE 
      shift_workday BETWEEN ${startDate} AND ${endDate}
      AND (${teamId} IS NULL OR shift_id = ${teamId})
      AND (${machineId} IS NULL OR machine_id = ${machineId})
  `;

  return Response.json(result[0]);
}
```

### Requête Timeseries (Graphique)

```typescript
// api/metrage/timeseries/route.ts
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const teamId = searchParams.get('team_id');
  const machineId = searchParams.get('machine_id');

  const data = await prisma.$queryRaw`
    SELECT 
      shift_workday AS date,
      SUM(metrage_inc_m) AS metrage_m
    FROM v_production_samples_enriched
    WHERE 
      shift_workday BETWEEN ${startDate} AND ${endDate}
      AND (${teamId} IS NULL OR shift_id = ${teamId})
      AND (${machineId} IS NULL OR machine_id = ${machineId})
    GROUP BY shift_workday
    ORDER BY shift_workday ASC
  `;

  // Fill missing days with 0
  return Response.json(fillMissingDays(data, startDate, endDate));
}

function fillMissingDays(data: any[], start: string, end: string) {
  const result = [];
  const dataMap = new Map(data.map(d => [d.date, Number(d.metrage_m)]));
  
  const current = new Date(start);
  const endDate = new Date(end);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      metrage_m: dataMap.get(dateStr) || 0
    });
    current.setDate(current.getDate() + 1);
  }
  
  return result;
}
```

## ⚠️ Notes importantes

### Timezone

- Les timestamps (`ts`) sont supposés être en **heure locale**
- Si stockés en UTC, utilisez `CONVERT_TZ(ts, 'UTC', 'Europe/Paris')` dans la VIEW

### Jours sans données

- Les requêtes `GROUP BY` n'incluent pas les jours sans enregistrements
- Le backend doit compléter avec des valeurs à 0 (voir `fillMissingDays`)

### Performance

- Index existants: `(ts)` et `(machine_id, ts)` sont suffisants
- Pour tables > 10M lignes: envisager le partitioning par mois sur `ts`

## 📈 Résultats attendus avec les données exemple

```sql
-- Query Summary (2026-01-10 à 2026-01-12, ALL teams, ALL machines)
+----------------+------------+--------------------+
| metrage_total_m| days_count | metrage_daily_avg_m|
+----------------+------------+--------------------+
| 7146.850       | 3          | 2382.283           |
+----------------+------------+--------------------+

-- Query Timeseries
+------------+------------+
| date       | metrage_m  |
+------------+------------+
| 2026-01-10 | 3019.750   |
| 2026-01-11 | 2559.000   |
| 2026-01-12 | 575.900    |
+------------+------------+
```
