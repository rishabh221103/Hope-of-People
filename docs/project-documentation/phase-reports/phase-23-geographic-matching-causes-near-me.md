# Phase 23 Report: Geographic Proximity Matching Algorithm ("Causes Near Me")

## 1. Executive Summary
In accordance with Page 2 and Page 3 of the official HOP functional specifications document, Phase 23 implements the **Backend Geographic Matching Algorithm & Localized Aid Discovery ("Causes Near Me")**.

This feature equips donors with the ability to discover and fund grassroot community initiatives happening within their immediate geographic proximity (city, zip code, or distance radius). The backend implements a spherical Haversine trigonometric algorithm to calculate real-world physical distances in kilometers between the donor's coordinates and assistance locations, while providing clean UI filtering and distance badges.

---

## 2. Architecture & Database Design

### 2.1 Database Schema (`V9__geographic_matching.sql` in `hop_db`)
- **Table `assistance_requests` Additions**:
  - `city`: `VARCHAR(100)`
  - `state`: `VARCHAR(100)`
  - `postal_code`: `VARCHAR(30)`
  - `country`: `VARCHAR(100) DEFAULT 'USA'`
  - `latitude`: `DOUBLE PRECISION`
  - `longitude`: `DOUBLE PRECISION`
- **Table `users` Additions**:
  - `city`, `state`, `postal_code`, `country`, `latitude`, `longitude`
- **Performance Indexes**:
  - `idx_assistance_coords`: Spatial lookup index on `(latitude, longitude)`
  - `idx_assistance_city`: Index on `(city)`
  - `idx_assistance_postal`: Index on `(postal_code)`
  - `idx_users_coords`: Spatial index on `users(latitude, longitude)`

---

## 3. Mathematical & Backend Implementation

### 3.1 Haversine Distance Formula
The distance $d$ between two points $(\text{lat}_1, \text{lon}_1)$ and $(\text{lat}_2, \text{lon}_2)$ on a sphere of radius $R = 6371\text{ km}$ is calculated as:
$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$

In PostgreSQL SQL native query, to ensure high performance across thousands of requests:
```sql
SELECT a.*
FROM assistance_requests a
WHERE a.is_urgent_story = false
  AND a.status IN ('APPROVED', 'PENDING')
  AND a.latitude IS NOT NULL
  AND a.longitude IS NOT NULL
  AND (:category IS NULL OR :category = '' OR UPPER(a.category) = UPPER(:category))
  AND (
    6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(:userLat)) * cos(radians(a.latitude)) *
            cos(radians(a.longitude) - radians(:userLon)) +
            sin(radians(:userLat)) * sin(radians(a.latitude))
        ))
    )
  ) <= :radiusKm
ORDER BY (
    6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
            cos(radians(:userLat)) * cos(radians(a.latitude)) *
            cos(radians(a.longitude) - radians(:userLon)) +
            sin(radians(:userLat)) * sin(radians(a.latitude))
        ))
    )
) ASC
```

### 3.2 Service Layer (`AssistanceService.java`)
- `getNearbyInitiatives(latitude, longitude, radiusKm, city, postalCode, category, viewerEmail)`:
  - If GPS coordinates are provided: executes spatial Haversine query and calculates exact high-precision `distanceKm` for each initiative.
  - If viewer is logged in and has coordinates on profile: auto-falls back to donor's saved location.
  - If city or postal code is provided: performs case-insensitive city/zip matching.
- `calculateHaversineDistance(lat1, lon1, lat2, lon2)`: Java utility rounding distances to 1 decimal place.

### 3.3 REST Endpoints (`AssistanceController.java`)
| Endpoint | Method | Security | Description |
|---|---|---|---|
| `/api/v1/assistance/nearby` | `GET` | Public / PermitAll | Discover causes by latitude, longitude, radius (km), city, or postal code |

---

## 4. Frontend Implementation (React & TypeScript)

### 4.1 Client Service (`assistanceService.ts`)
Updated `AssistanceRequestItem` with `city`, `state`, `postalCode`, `latitude`, `longitude`, `distanceKm` and added `getNearbyRequests(...)`.

### 4.2 Interactive Proximity Toolbar (`AssistanceBrowsePage.tsx`)
- **"Causes Near Me" Banner**:
  - 1-Click **"Use My GPS Location"** button utilizing `navigator.geolocation.getCurrentPosition`.
  - Manual City search input (e.g., "Chicago", "Evanston").
  - Radius selection pills: **5 km**, **10 km**, **25 km**, **50 km**, **100 km**.
  - Dynamic feedback badge: `Showing causes within 25 km of your detected location.`
  - "Reset to All" action.
- **Card Badges**:
  - Displays location badge with `MapPin` icon: `📍 Chicago, IL`.
  - Displays computed proximity badge with `Navigation` icon: `19.2 km away` in emerald badge.

### 4.3 Aid Application Form (`AssistanceRequestPage.tsx`)
- Beneficiaries can specify City, State, Postal Code, and click **"Auto-Pin My GPS Location"** to automatically populate high-precision coordinates.

---

## 5. End-to-End Verification Results
Automated test script (`scratch/verify_geographic_matching.ps1`) executed against live PostgreSQL:
- Created 4 initiatives across the country:
  1. Chicago (Lat: 41.8781, Lon: -87.6298)
  2. Evanston (Lat: 42.0451, Lon: -87.6877 ~19 km North)
  3. Milwaukee (Lat: 43.0389, Lon: -87.9065 ~130 km North)
  4. Los Angeles (Lat: 34.0522, Lon: -118.2437 ~2800 km West)
- **Radius 25 km Query:** Returned Chicago (0.0 km) and Evanston (19.2 km).
- **Radius 150 km Query:** Returned Chicago (0.0 km), Evanston (19.2 km), and Milwaukee (131.1 km).
- **City Filter Query (Chicago):** Returned Chicago initiative.
