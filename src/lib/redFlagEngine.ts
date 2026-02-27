/**
 * Red Flag Emergency Detection Engine
 *
 * Detects high-risk symptom combinations that require immediate
 * emergency medical attention. This runs BEFORE calling the AI triage API
 * to ensure life-threatening conditions are escalated instantly.
 */

interface RedFlagInput {
    age: number;
    mainSymptom: string;
    additionalSymptoms: string[];
    severity: number;
    temperature?: number;
}

interface RedFlagResult {
    isEmergency: boolean;
    triggerReason?: string;
}

/**
 * Normalizes text for symptom matching — lowercases and trims.
 */
function normalize(text: string): string {
    return text.toLowerCase().trim();
}

/**
 * Checks if any of the given keywords appear in the symptom text.
 */
function containsAny(text: string, keywords: string[]): boolean {
    const normalized = normalize(text);
    return keywords.some((kw) => normalized.includes(normalize(kw)));
}

/**
 * Detects red flag emergency conditions from user-reported symptoms.
 *
 * Returns `isEmergency: true` with a descriptive `triggerReason` if any
 * high-risk combination is matched. Otherwise returns `isEmergency: false`.
 */
export function detectRedFlags(data: RedFlagInput): RedFlagResult {
    const allSymptoms = normalize(
        `${data.mainSymptom} ${data.additionalSymptoms.join(' ')}`
    );

    // Rule 1: Chest pain AND shortness of breath
    const hasChestPain = containsAny(allSymptoms, [
        'chest pain',
        'chest tightness',
        'chest pressure',
        'pain in chest',
    ]);
    const hasShortnessOfBreath = containsAny(allSymptoms, [
        'shortness of breath',
        'difficulty breathing',
        'can\'t breathe',
        'cannot breathe',
        'trouble breathing',
        'breathing difficulty',
        'breathless',
    ]);

    if (hasChestPain && hasShortnessOfBreath) {
        return {
            isEmergency: true,
            triggerReason: 'Chest pain with breathing difficulty detected.',
        };
    }

    // Rule 2: Severe headache AND slurred speech
    const hasSevereHeadache = containsAny(allSymptoms, [
        'severe headache',
        'worst headache',
        'sudden headache',
        'intense headache',
        'extreme headache',
    ]);
    const hasSlurredSpeech = containsAny(allSymptoms, [
        'slurred speech',
        'difficulty speaking',
        'can\'t speak',
        'speech problems',
        'trouble speaking',
    ]);

    if (hasSevereHeadache && hasSlurredSpeech) {
        return {
            isEmergency: true,
            triggerReason:
                'Severe headache with slurred speech detected — possible stroke symptoms.',
        };
    }

    // Rule 3: High fever (>103°F / 39.4°C) AND stiff neck
    const hasHighFever =
        (data.temperature !== undefined && data.temperature >= 39.4) ||
        containsAny(allSymptoms, ['high fever', 'very high fever', '103', '104', '105']);
    const hasStiffNeck = containsAny(allSymptoms, [
        'stiff neck',
        'neck stiffness',
        'neck rigidity',
    ]);

    if (hasHighFever && hasStiffNeck) {
        return {
            isEmergency: true,
            triggerReason:
                'High fever with stiff neck detected — possible meningitis symptoms.',
        };
    }

    // Rule 4: Unconsciousness
    const hasUnconsciousness = containsAny(allSymptoms, [
        'unconscious',
        'loss of consciousness',
        'passed out',
        'fainted',
        'unresponsive',
        'not responsive',
        'blacked out',
    ]);

    if (hasUnconsciousness) {
        return {
            isEmergency: true,
            triggerReason: 'Loss of consciousness detected — immediate medical attention required.',
        };
    }

    // Rule 5: Severity >= 9 AND dizziness
    const hasDizziness = containsAny(allSymptoms, [
        'dizziness',
        'dizzy',
        'lightheaded',
        'light-headed',
        'feeling faint',
        'vertigo',
    ]);

    if (data.severity >= 9 && hasDizziness) {
        return {
            isEmergency: true,
            triggerReason:
                'Severe symptoms with dizziness detected — possible critical condition.',
        };
    }

    // Rule 6: Severe abdominal pain + vomiting blood
    const hasSevereAbdominalPain = containsAny(allSymptoms, [
        'severe abdominal pain',
        'severe stomach pain',
        'intense abdominal pain',
        'extreme stomach pain',
        'severe belly pain',
    ]);
    const hasVomitingBlood = containsAny(allSymptoms, [
        'vomiting blood',
        'throwing up blood',
        'blood in vomit',
        'hematemesis',
    ]);

    if (hasSevereAbdominalPain && hasVomitingBlood) {
        return {
            isEmergency: true,
            triggerReason:
                'Severe abdominal pain with vomiting blood detected — possible internal bleeding.',
        };
    }

    // No red flags detected
    return { isEmergency: false };
}
