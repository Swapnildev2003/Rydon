import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const ConnectionStatus = ({ status, locations }) => {
    const statusConfig = {
        connecting: { color: '#FFA500', text: 'Connecting...', icon: 'sync' },
        connected: { color: '#4CAF50', text: 'Live Tracking', icon: 'wifi' },
        disconnected: { color: '#F44336', text: 'Disconnected', icon: 'wifi-off' },
        error: { color: '#F44336', text: 'Connection Error', icon: 'alert-circle' }
    };

    const currentStatus = statusConfig[status] || statusConfig.disconnected;

    return (
        <View style={[styles.container, { backgroundColor: `${currentStatus.color}20` }]}>
            <View style={styles.statusRow}>
                <Ionicons name={currentStatus.icon} size={20} color={currentStatus.color} />
                <Text style={[styles.statusText, { color: currentStatus.color }]}>
                    {currentStatus.text}
                </Text>
            </View>

            {status === 'connected' && locations.length > 0 && (
                <View style={styles.locationData}>
                    <Text style={styles.locationText}>
                        <Ionicons name="location" size={14} />{' '}
                        {locations[0].address || 'Getting address...'}
                    </Text>
                    <Text style={styles.coordinatesText}>
                        {locations[0].latitude.toFixed(6)}, {locations[0].longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.coordinatesText}>
                        Updated: {new Date(locations[0].timestamp).toLocaleTimeString()}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderRadius: 8,
        margin: 16,
        marginBottom: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    locationData: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#00000020',
    },
    locationText: {
        fontSize: 14,
        color: '#333',
    },
    coordinatesText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
        marginTop: 2,
    },
});

export default ConnectionStatus;
