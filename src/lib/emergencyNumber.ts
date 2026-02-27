/**
 * Emergency Number Utility
 *
 * Returns the correct emergency phone number based on the user's
 * browser locale. Falls back to 112 (international emergency number).
 */

export function getEmergencyNumber(): { general: string; ambulance: string } {
    if (typeof navigator === 'undefined') return { general: '112', ambulance: '112' };

    const locale = navigator.language || '';

    if (locale.includes('IN') || locale.includes('in')) return { general: '112', ambulance: '108' };
    if (locale.includes('US') || locale.includes('us')) return { general: '911', ambulance: '911' };
    if (locale.includes('GB') || locale.includes('gb')) return { general: '999', ambulance: '999' };
    if (locale.includes('AU') || locale.includes('au')) return { general: '000', ambulance: '000' };
    if (locale.includes('EU') || locale.includes('eu')) return { general: '112', ambulance: '112' };
    if (locale.includes('CA') || locale.includes('ca')) return { general: '911', ambulance: '911' };
    if (locale.includes('NZ') || locale.includes('nz')) return { general: '111', ambulance: '111' };
    if (locale.includes('JP') || locale.includes('jp')) return { general: '119', ambulance: '119' };

    return { general: '112', ambulance: '112' }; // International default
}
