'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';
import {
    Phone,
    MapPin,
    AlertTriangle,
    Shield,
    Heart,
    ArrowLeft,
    Star,
    Clock,
    Navigation,
    Loader2,
    ExternalLink,
    Ambulance,
    Building2,
} from 'lucide-react';
import { getEmergencyNumber } from '@/lib/emergencyNumber';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface NearbyPlace {
    name: string;
    address: string;
    phone: string | null;
    distance: number | null;
    rating: number | null;
    isOpen: boolean | null;
    placeType: 'hospital' | 'ambulance' | 'clinic';
    mapsUrl: string;
}

/* ──────────────────────────────────────────────
   First Aid Instructions Mapping
   ────────────────────────────────────────────── */

function getFirstAidInstructions(reason: string): string[] {
    const r = reason.toLowerCase();

    if (r.includes('chest pain') || r.includes('breathing')) {
        return [
            'Sit upright in a comfortable position — do not lie flat.',
            'Loosen any tight clothing around the chest and neck.',
            'Avoid any physical exertion or unnecessary movement.',
            'If prescribed, take aspirin (chew one 325 mg tablet).',
            'Stay calm and try to breathe slowly and deeply.',
            'Do not eat or drink anything.',
            'Seek immediate emergency medical care.',
        ];
    }

    if (r.includes('stroke') || r.includes('slurred speech') || r.includes('headache')) {
        return [
            'Note the exact time symptoms started — this is critical for treatment.',
            'Do NOT give the person any food, drink, or medication.',
            'Keep the person still and lying on their side.',
            'Do not let the person fall asleep.',
            'Loosen any restrictive clothing.',
            'Call emergency services immediately.',
            'Use the FAST test: Face drooping, Arm weakness, Speech difficulty, Time to call.',
        ];
    }

    if (r.includes('fever') || r.includes('meningitis') || r.includes('stiff neck')) {
        return [
            'Keep the person in a cool, dimly lit room.',
            'Do not give aspirin to children — use acetaminophen if needed.',
            'Apply cool (not cold) compresses to the forehead.',
            'Ensure the person stays hydrated with small sips of water.',
            'Do NOT wait for symptoms to improve on their own.',
            'Seek immediate emergency medical attention.',
        ];
    }

    if (r.includes('unconscious') || r.includes('consciousness')) {
        return [
            'Check if the person is breathing — look, listen, and feel.',
            'If breathing, place in the recovery position (on their side).',
            'If NOT breathing, begin CPR if you are trained.',
            'Do NOT put anything in the person\'s mouth.',
            'Do NOT move the person unless they are in danger.',
            'Call emergency services immediately.',
            'Stay with the person until help arrives.',
        ];
    }

    if (r.includes('abdominal') || r.includes('vomiting blood') || r.includes('bleeding')) {
        return [
            'Do NOT eat or drink anything.',
            'Lie down and keep still to reduce blood flow.',
            'If vomiting, turn on your side to prevent choking.',
            'Do NOT take pain medication (especially aspirin or ibuprofen).',
            'Apply a warm (not hot) compress to the abdomen for comfort.',
            'Seek immediate emergency medical care.',
        ];
    }

    if (r.includes('dizziness') || r.includes('dizzy') || r.includes('severe symptoms')) {
        return [
            'Sit or lie down immediately to prevent falling.',
            'If sitting, place your head between your knees.',
            'Avoid sudden movements or changes in position.',
            'Drink water slowly if conscious and able to swallow.',
            'Do NOT drive or operate machinery.',
            'Seek immediate medical attention.',
        ];
    }

    return [
        'Stay calm and remain in a safe position.',
        'Do not ignore worsening symptoms.',
        'Keep airways clear and monitor breathing.',
        'Call emergency services if the condition deteriorates.',
        'Do NOT self-medicate without professional guidance.',
        'Seek immediate professional medical care.',
    ];
}

/* ──────────────────────────────────────────────
   Nearby Place Card Component
   ────────────────────────────────────────────── */

function PlaceCard({ place }: { place: NearbyPlace }) {
    const typeIcon =
        place.placeType === 'ambulance' ? (
            <Ambulance className="h-5 w-5 text-red-500" />
        ) : (
            <Building2 className="h-5 w-5 text-blue-600" />
        );

    const typeLabel =
        place.placeType === 'ambulance'
            ? 'Ambulance'
            : place.placeType === 'clinic'
                ? 'Clinic'
                : 'Hospital';

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    {/* Name & Type */}
                    <div className="flex items-center gap-2 mb-1.5">
                        {typeIcon}
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {place.name}
                        </h3>
                    </div>

                    {/* Address */}
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {place.address}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {typeLabel}
                        </span>

                        {place.distance !== null && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <Navigation className="h-3 w-3" />
                                {place.distance} km
                            </span>
                        )}

                        {place.rating !== null && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                {place.rating}
                            </span>
                        )}

                        {place.isOpen !== null && (
                            <span
                                className={`inline-flex items-center gap-1 text-xs ${place.isOpen ? 'text-green-600' : 'text-red-500'
                                    }`}
                            >
                                <Clock className="h-3 w-3" />
                                {place.isOpen ? 'Open now' : 'Closed'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                {place.phone ? (
                    <a
                        href={`tel:${place.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-colors"
                    >
                        <Phone className="h-4 w-4" />
                        Call {place.phone}
                    </a>
                ) : (
                    <span className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 text-sm font-medium py-2.5 px-3 rounded-lg cursor-not-allowed">
                        <Phone className="h-4 w-4" />
                        No phone available
                    </span>
                )}

                <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 px-3 rounded-lg border border-gray-200 transition-colors"
                >
                    <ExternalLink className="h-4 w-4" />
                    Map
                </a>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Loading Skeleton
   ────────────────────────────────────────────── */

function PlaceSkeleton() {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-40" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-56 mb-3" />
            <div className="flex gap-2">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-3 bg-gray-100 rounded w-12" />
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
                <div className="w-16 h-10 bg-gray-100 rounded-lg" />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Emergency Page Inner Content
   ────────────────────────────────────────────── */

function EmergencyContent() {
    const searchParams = useSearchParams();
    const baseReason = searchParams.get('reason');
    const isDirectVisit = !baseReason;
    const reason = baseReason || 'Find immediate help and nearby medical services.';
    const [emergencyNumber, setEmergencyNumber] = useState({ general: '112', ambulance: '112' });
    const firstAid = getFirstAidInstructions(reason);

    // Nearby services state
    const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
    const [nearbyLoading, setNearbyLoading] = useState(true);
    const [nearbyError, setNearbyError] = useState<string | null>(null);
    const [fallbackUrl, setFallbackUrl] = useState('https://www.google.com/maps/search/hospital+near+me');
    const [locationDenied, setLocationDenied] = useState(false);

    useEffect(() => {
        setEmergencyNumber(getEmergencyNumber());

        // Fetch nearby services using geolocation
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setFallbackUrl(
                        `https://www.google.com/maps/search/hospital/@${latitude},${longitude},15z`
                    );

                    try {
                        const res = await fetch(
                            `/api/nearby-services?lat=${latitude}&lng=${longitude}`
                        );
                        const data = await res.json();

                        if (data.success && data.places.length > 0) {
                            setNearbyPlaces(data.places);
                        } else {
                            setNearbyError(data.message || 'No nearby services found.');
                            if (data.fallbackUrl) setFallbackUrl(data.fallbackUrl);
                        }
                    } catch {
                        setNearbyError('Failed to fetch nearby services.');
                    } finally {
                        setNearbyLoading(false);
                    }
                },
                () => {
                    setLocationDenied(true);
                    setNearbyLoading(false);
                },
                { enableHighAccuracy: false, timeout: 8000 }
            );
        } else {
            setLocationDenied(true);
            setNearbyLoading(false);
        }
    }, []);

    const handleFindHospitals = useCallback(() => {
        window.open(fallbackUrl, '_blank');
    }, [fallbackUrl]);

    // Separate hospitals/clinics and ambulances
    const hospitals = nearbyPlaces.filter(
        (p) => p.placeType === 'hospital' || p.placeType === 'clinic'
    );
    const ambulances = nearbyPlaces.filter((p) => p.placeType === 'ambulance');

    return (
        <div className="min-h-screen bg-white">
            {/* ── Top Alert Banner ── */}
            <div className="bg-red-600 text-white py-3 px-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    <span>This is an emergency alert — please take immediate action</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* ── Back Link ── */}
                {!isDirectVisit && (
                    <a
                        href="/checker"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Symptom Checker
                    </a>
                )}

                {/* ── Emergency Badge ── */}
                <div className="text-center mb-8 pt-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full mb-5">
                        <span className="text-4xl" role="img" aria-label="Emergency alert">
                            🚨
                        </span>
                    </div>

                    <div className="inline-block bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                        Emergency Services
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                        {isDirectVisit
                            ? 'Emergency Services Locator'
                            : 'Symptoms indicate a possible medical emergency.'}
                    </h1>

                    <p className="text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
                        {reason}
                    </p>
                </div>

                {/* ── Primary Action: Call Emergency ── */}
                <div className="mb-8">
                    <a
                        id="call-emergency-btn"
                        href={`tel:${emergencyNumber.general}`}
                        className="flex items-center justify-center gap-3 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-lg py-4 px-6 rounded-xl transition-colors shadow-lg shadow-red-600/25"
                    >
                        <Phone className="h-6 w-6" />
                        Call Emergency Services ({emergencyNumber.general})
                    </a>
                </div>

                {/* ── Nearby Ambulance Services ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="flex items-center justify-center w-9 h-9 bg-red-100 rounded-lg">
                            <Ambulance className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Nearby Ambulance Services
                        </h2>
                    </div>

                    {nearbyLoading ? (
                        <div className="space-y-3">
                            <PlaceSkeleton />
                            <PlaceSkeleton />
                        </div>
                    ) : ambulances.length > 0 ? (
                        <div className="space-y-3">
                            {ambulances.map((place, i) => (
                                <PlaceCard key={`amb-${i}`} place={place} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                            <p className="text-sm text-gray-500 mb-3">
                                {locationDenied
                                    ? 'Location access is needed to find nearby ambulance services.'
                                    : 'No ambulance services found nearby.'}
                            </p>
                            <a
                                href={`tel:${emergencyNumber.ambulance}`}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                Call {emergencyNumber.ambulance} for Ambulance
                            </a>
                        </div>
                    )}
                </div>

                {/* ── Nearby Hospitals & Clinics ── */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-9 h-9 bg-blue-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Nearby Hospitals & Clinics
                            </h2>
                        </div>
                        {!nearbyLoading && (
                            <button
                                onClick={handleFindHospitals}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                View on Maps
                                <ExternalLink className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {nearbyLoading ? (
                        <div className="space-y-3">
                            <PlaceSkeleton />
                            <PlaceSkeleton />
                            <PlaceSkeleton />
                        </div>
                    ) : hospitals.length > 0 ? (
                        <div className="space-y-3">
                            {hospitals.map((place, i) => (
                                <PlaceCard key={`hosp-${i}`} place={place} />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                            <p className="text-sm text-gray-500 mb-3">
                                {locationDenied
                                    ? 'Location access is needed to find nearby hospitals.'
                                    : nearbyError || 'No hospitals found nearby.'}
                            </p>
                            <button
                                onClick={handleFindHospitals}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                <MapPin className="h-4 w-4" />
                                Search on Google Maps
                            </button>
                        </div>
                    )}
                </div>

                {/* ── First Aid Instructions ── */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8 mb-8">
                    <div className="flex items-center gap-2.5 mb-5">
                        <div className="flex items-center justify-center w-9 h-9 bg-red-100 rounded-lg">
                            <Heart className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            First Aid Instructions
                        </h2>
                    </div>

                    <ul className="space-y-3">
                        {firstAid.map((instruction, index) => (
                            <li key={index} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                    {index + 1}
                                </span>
                                <span className="text-gray-700 text-sm leading-relaxed">
                                    {instruction}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Quick Reference Card ── */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <div className="flex items-center gap-2.5 mb-3">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-blue-900">
                            While Waiting for Help
                        </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1.5">•</span>
                            Stay with the person and keep them calm.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1.5">•</span>
                            Unlock doors so emergency responders can enter.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1.5">•</span>
                            Gather any medications the person is currently taking.
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1.5">•</span>
                            Be ready to describe the symptoms to the dispatcher.
                        </li>
                    </ul>
                </div>

                {/* ── Safety Disclaimer ── */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-start gap-3 text-sm text-gray-500">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
                        <p className="leading-relaxed">
                            <strong className="text-gray-600">Medical Disclaimer:</strong>{' '}
                            This tool does not replace emergency medical services. If symptoms
                            are severe or worsening, seek immediate professional care. This
                            application is for informational purposes only and should not be
                            used as a substitute for professional medical advice, diagnosis, or
                            treatment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Page Export (with Suspense boundary for useSearchParams)
   ────────────────────────────────────────────── */

export default function EmergencyPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Loading emergency information…</p>
                    </div>
                </div>
            }
        >
            <EmergencyContent />
        </Suspense>
    );
}
