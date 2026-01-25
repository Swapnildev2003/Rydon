import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BookingCard = ({ booking, onAccept, onReject }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
            case 'accepted':
                return styles.completedStatus;
            case 'rejected':
            case 'cancelled':
                return styles.cancelledStatus;
            default:
                return styles.pendingStatus;
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.bookingId}>Booking #{booking.id}</Text>
                <Text style={[styles.bookingStatus, getStatusStyle(booking.status)]}>
                    {booking.status}
                </Text>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>From: {booking.from_address}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#666" />
                    <Text style={styles.detailText}>To: {booking.to_address}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {new Date(booking.created_at).toLocaleString()}
                    </Text>
                </View>
            </View>

            {booking.status === 'pending' && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => onAccept(booking.id)}
                    >
                        <Text style={styles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => onReject(booking.id)}
                    >
                        <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bookingId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    bookingStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pendingStatus: {
        backgroundColor: '#FFF3E0',
        color: '#FF9800',
    },
    completedStatus: {
        backgroundColor: '#E8F5E9',
        color: '#4CAF50',
    },
    cancelledStatus: {
        backgroundColor: '#FFEBEE',
        color: '#F44336',
    },
    details: {
        marginTop: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default BookingCard;
