import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const StatusBar = ({ batteryLevel, isBatteryCharging }) => {
    return (
        <View style={styles.container}>
            <View style={styles.onlineStatus}>
                <View style={[styles.statusIndicator, styles.online]} />
                <Text style={styles.statusText}>Online</Text>
            </View>
            <View style={styles.batteryStatus}>
                <Text style={styles.batteryText}>
                    {batteryLevel !== null ? `${batteryLevel}%` : 'N/A'}
                </Text>
                <Ionicons
                    name={isBatteryCharging ? "battery-charging" : "battery-full"}
                    size={20}
                    color={batteryLevel < 20 ? "#F44336" : "#666"}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    onlineStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    online: {
        backgroundColor: '#4CAF50',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '500',
    },
    batteryStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    batteryText: {
        fontSize: 14,
        color: '#666',
        marginRight: 4,
    },
});

export default StatusBar;
