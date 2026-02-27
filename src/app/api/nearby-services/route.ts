import { NextRequest, NextResponse } from 'next/server';

/**
 * Nearby Services API Route
 *
 * Fetches nearby hospitals, clinics, and ambulance services using
 * the Google Maps Places API. Returns names, addresses, phone numbers,
 * distances, ratings, and open/closed status.
 *
 * Falls back gracefully with a Google Maps search URL if no API key
 * is configured or if the request fails.
 */

interface NearbyPlace {
    name: string;
    address: string;
    phone: string | null;
    distance: number | null; // in km
    rating: number | null;
    isOpen: boolean | null;
    placeType: 'hospital' | 'ambulance' | 'clinic';
    mapsUrl: string;
}

interface NearbyServicesResponse {
    success: boolean;
    places: NearbyPlace[];
    fallbackUrl: string;
    message?: string;
}

// Haversine formula — distance between two lat/lng pairs in km
function haversineKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    const fallbackUrl = !isNaN(lat) && !isNaN(lng)
        ? `https://www.google.com/maps/search/hospital/@${lat},${lng},15z`
        : 'https://www.google.com/maps/search/hospital+near+me';

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json<NearbyServicesResponse>({
            success: false,
            places: [],
            fallbackUrl,
            message: 'Latitude and longitude are required.',
        });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // No API key — return graceful fallback
    if (!apiKey) {
        return NextResponse.json<NearbyServicesResponse>({
            success: false,
            places: [],
            fallbackUrl,
            message: 'Google Maps API key not configured. Use the fallback link.',
        });
    }

    try {
        // Search for hospitals and ambulance services in parallel
        const searchTypes = [
            { keyword: 'hospital', type: 'hospital' as const },
            { keyword: 'ambulance service', type: 'ambulance' as const },
            { keyword: 'clinic', type: 'clinic' as const },
        ];

        const nearbyResults = await Promise.all(
            searchTypes.map(async ({ keyword, type }) => {
                const url = new URL(
                    'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
                );
                url.searchParams.set('location', `${lat},${lng}`);
                url.searchParams.set('radius', '5000'); // 5 km
                url.searchParams.set('keyword', keyword);
                url.searchParams.set('key', apiKey);

                const res = await fetch(url.toString());
                if (!res.ok) return [];

                const data = await res.json();
                if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];

                // Take top 5 results per type
                const results = (data.results || []).slice(0, 5);

                // Fetch phone numbers via Place Details for each result
                const detailed: NearbyPlace[] = await Promise.all(
                    results.map(async (place: Record<string, unknown>) => {
                        let phone: string | null = null;

                        // Fetch place details for phone number
                        try {
                            const detailUrl = new URL(
                                'https://maps.googleapis.com/maps/api/place/details/json'
                            );
                            detailUrl.searchParams.set(
                                'place_id',
                                place.place_id as string
                            );
                            detailUrl.searchParams.set(
                                'fields',
                                'formatted_phone_number,international_phone_number'
                            );
                            detailUrl.searchParams.set('key', apiKey);

                            const detailRes = await fetch(detailUrl.toString());
                            if (detailRes.ok) {
                                const detailData = await detailRes.json();
                                phone =
                                    detailData.result?.international_phone_number ||
                                    detailData.result?.formatted_phone_number ||
                                    null;
                            }
                        } catch {
                            // Silently continue if detail fetch fails
                        }

                        const placeLat = (place.geometry as { location: { lat: number; lng: number } })?.location?.lat;
                        const placeLng = (place.geometry as { location: { lat: number; lng: number } })?.location?.lng;

                        return {
                            name: place.name as string,
                            address: (place.vicinity || place.formatted_address || 'Address not available') as string,
                            phone,
                            distance:
                                placeLat && placeLng
                                    ? Math.round(haversineKm(lat, lng, placeLat, placeLng) * 10) / 10
                                    : null,
                            rating: (place.rating as number) || null,
                            isOpen: (place.opening_hours as { open_now?: boolean })?.open_now ?? null,
                            placeType: type,
                            mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
                        } satisfies NearbyPlace;
                    })
                );

                return detailed;
            })
        );

        // Flatten & sort by distance
        const allPlaces = nearbyResults
            .flat()
            .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

        return NextResponse.json<NearbyServicesResponse>({
            success: true,
            places: allPlaces,
            fallbackUrl,
        });
    } catch (error) {
        console.error('Nearby services API error:', error);
        return NextResponse.json<NearbyServicesResponse>({
            success: false,
            places: [],
            fallbackUrl,
            message: 'Failed to fetch nearby services.',
        });
    }
}
