import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const VehicleCard = ({ vehicleData }) => {
    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
            </View>

            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>
                            {vehicleData?.vehicle_type || 'Vehicle'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {vehicleData?.bus_type || vehicleData?.car_type || vehicleData?.bike_type || 'Type'}
                        </Text>
                    </View>
                    <Text style={[styles.status, styles.activeStatus]}>
                        {vehicleData?.status || 'Active'}
                    </Text>
                </View>

                <View style={styles.details}>
                    <View style={styles.detailRow}>
                        <Ionicons name="car" size={20} color="#666" />
                        <Text style={styles.detailText}>
                            {vehicleData?.license_plate || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Ionicons name="people" size={20} color="#666" />
                        <Text style={styles.detailText}>
                            {vehicleData?.seating_capacity || '0'} seats
                        </Text>
                    </View>

                    {vehicleData?.has_ac !== undefined && (
                        <View style={styles.detailRow}>
                            <Ionicons name="snow" size={20} color="#666" />
                            <Text style={styles.detailText}>
                                AC: {vehicleData.has_ac ? "Yes" : "No"}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    container: {

        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        height: 200,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    status: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    activeStatus: {
        backgroundColor: '#e8f5e9',
        color: '#4CAF50',
    },
    details: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
});

export default VehicleCard;
