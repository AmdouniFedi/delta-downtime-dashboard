/**
 * Utilitaires pour la logique des équipes (shifts)
 * 
 * Équipes:
 * - Équipe 1: 06:00 – 13:59:59
 * - Équipe 2: 14:00 – 21:59:59
 * - Équipe 3: 22:00 – 05:59:59 (cross-midnight)
 * 
 * Règle shift_workday: 
 * Les heures 00:00-05:59 appartiennent au jour de travail PRÉCÉDENT.
 * Formule: shift_workday = DATE(ts - 6 heures)
 */

/**
 * Calcule le shift_id (1, 2, ou 3) à partir d'un timestamp
 * 
 * @param timestamp - Date/heure à analyser
 * @returns shift_id (1, 2, ou 3)
 * 
 * @example
 * getShiftId(new Date('2026-01-10T07:30:00')) // => 1
 * getShiftId(new Date('2026-01-10T15:00:00')) // => 2
 * getShiftId(new Date('2026-01-10T23:00:00')) // => 3
 * getShiftId(new Date('2026-01-11T03:00:00')) // => 3
 */
export function getShiftId(timestamp: Date): 1 | 2 | 3 {
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const timeInMinutes = hours * 60 + minutes;

    // Équipe 1: 06:00 (360 min) – 13:59 (839 min)
    if (timeInMinutes >= 360 && timeInMinutes < 840) {
        return 1;
    }

    // Équipe 2: 14:00 (840 min) – 21:59 (1319 min)
    if (timeInMinutes >= 840 && timeInMinutes < 1320) {
        return 2;
    }

    // Équipe 3: 22:00–23:59 (1320-1439 min) OU 00:00–05:59 (0-359 min)
    return 3;
}

/**
 * Calcule le shift_workday (jour de travail logique) à partir d'un timestamp
 * 
 * Formule: DATE(ts - 6 heures)
 * Effet: Les heures 00:00-05:59 sont rattachées au jour précédent
 * 
 * @param timestamp - Date/heure à analyser
 * @returns Date du shift_workday (YYYY-MM-DD)
 * 
 * @example
 * getShiftWorkday(new Date('2026-01-11T02:00:00')) // => '2026-01-10'
 * getShiftWorkday(new Date('2026-01-11T06:00:00')) // => '2026-01-11'
 * getShiftWorkday(new Date('2026-01-10T22:30:00')) // => '2026-01-10'
 */
export function getShiftWorkday(timestamp: Date): string {
    // Soustraire 6 heures
    const adjusted = new Date(timestamp.getTime() - 6 * 60 * 60 * 1000);

    // Formater en YYYY-MM-DD
    return adjusted.toISOString().split('T')[0];
}

/**
 * Retourne les informations complètes du shift pour un timestamp
 * 
 * @param timestamp - Date/heure à analyser
 * @returns Objet avec shift_id et shift_workday
 */
export function getShiftInfo(timestamp: Date): {
    shiftId: 1 | 2 | 3;
    shiftWorkday: string;
} {
    return {
        shiftId: getShiftId(timestamp),
        shiftWorkday: getShiftWorkday(timestamp),
    };
}

/**
 * Retourne le nom de l'équipe
 */
export function getShiftName(shiftId: 1 | 2 | 3): string {
    const names: Record<1 | 2 | 3, string> = {
        1: 'Équipe 1 (06:00–14:00)',
        2: 'Équipe 2 (14:00–22:00)',
        3: 'Équipe 3 (22:00–06:00)',
    };
    return names[shiftId];
}

/**
 * Retourne les horaires d'un shift pour un jour donné
 * Note: Pour l'équipe 3, les horaires traversent minuit
 */
export function getShiftTimeRange(shiftId: 1 | 2 | 3): {
    startHour: string;
    endHour: string;
    crossMidnight: boolean;
} {
    switch (shiftId) {
        case 1:
            return { startHour: '06:00', endHour: '14:00', crossMidnight: false };
        case 2:
            return { startHour: '14:00', endHour: '22:00', crossMidnight: false };
        case 3:
            return { startHour: '22:00', endHour: '06:00', crossMidnight: true };
    }
}
