import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

// Map color constants
const COLORS = {
    DRIVER_LOCATION: '#3A86FF',
    PICKUP: '#4CAF50',
    DROPOFF: '#F44336',
    ROUTE: '#FF9800',
    DRIVER_TO_PICKUP: '#3A86FF',
};

/**
 * RidesMap - Displays driver location, booking markers, and routes
 */
const RidesMap = ({
    liveLocations,
    bookingLocations,
    bookings,
    mapRegion,
    onRegionChange,
}) => {
    const defaultRegion = {
        latitude: liveLocations[0]?.latitude || 37.78825,
        longitude: liveLocations[0]?.longitude || -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                region={mapRegion || defaultRegion}
                onRegionChangeComplete={onRegionChange}
            >
                {/* Driver's current location marker */}
                <DriverMarker liveLocations={liveLocations} />

                {/* Booking location markers */}
                <BookingMarkers locations={bookingLocations} />

                {/* Route lines between pickup and dropoff */}
                <BookingRoutes bookings={bookings} locations={bookingLocations} />

                {/* Lines from driver to pickup locations */}
                <DriverToPickupLines
                    driverLocation={liveLocations[0]}
                    pickupLocations={bookingLocations.filter((loc) => loc.type === 'from')}
                />
            </MapView>
        </View>
    );
};

/**
 * Driver location marker
 */
const DriverMarker = ({ liveLocations }) => {
    if (liveLocations.length === 0) return null;

    const { latitude, longitude, address } = liveLocations[0];

    return (
        <Marker
            coordinate={{ latitude, longitude }}
            title="Your Location"
            description={address}
            pinColor={COLORS.DRIVER_LOCATION}
        />
    );
};

/**
 * Booking pickup and dropoff markers
 */
const BookingMarkers = ({ locations }) => {
    return locations.map((location) => (
        <Marker
            key={location.id}
            coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
            }}
            title={
                location.type === 'from'
                    ? `Pickup (Booking #${location.bookingId})`
                    : `Dropoff (Booking #${location.bookingId})`
            }
            description={location.address}
            pinColor={location.type === 'from' ? COLORS.PICKUP : COLORS.DROPOFF}
        />
    ));
};

/**
 * Route lines between pickup and dropoff for each booking
 */
const BookingRoutes = ({ bookings, locations }) => {
    return bookings.map((booking) => {
        const fromLocation = locations.find(
            (loc) => loc.bookingId === booking.id && loc.type === 'from'
        );
        const toLocation = locations.find(
            (loc) => loc.bookingId === booking.id && loc.type === 'to'
        );

        if (!fromLocation || !toLocation) return null;

        return (
            <Polyline
                key={`route_${booking.id}`}
                coordinates={[
                    { latitude: fromLocation.latitude, longitude: fromLocation.longitude },
                    { latitude: toLocation.latitude, longitude: toLocation.longitude },
                ]}
                strokeColor={COLORS.ROUTE}
                strokeWidth={2}
                lineDashPattern={[5, 5]}
            />
        );
    });
};

/**
 * Dashed lines from driver location to each pickup point
 */
const DriverToPickupLines = ({ driverLocation, pickupLocations }) => {
    if (!driverLocation) return null;

    return pickupLocations.map((location) => (
        <Polyline
            key={`driver_to_${location.id}`}
            coordinates={[
                {
                    latitude: driverLocation.latitude,
                    longitude: driverLocation.longitude,
                },
                { latitude: location.latitude, longitude: location.longitude },
            ]}
            strokeColor={COLORS.DRIVER_TO_PICKUP}
            strokeWidth={1}
            lineDashPattern={[2, 2]}
        />
    ));
};

const styles = StyleSheet.create({
    container: {
        height: Dimensions.get('window').height * 0.5,
        width: '100%',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default RidesMap;
