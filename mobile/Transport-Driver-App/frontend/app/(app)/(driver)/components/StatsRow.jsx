import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const StatCard = ({ icon, iconColor, value, label }) => (
    <View style={styles.statCard}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const StatsRow = ({
    acceptedRate = '20%',
    rating = '4.0',
    cancelledRate = '3%'
}) => {
    return (
        <View style={styles.container}>
            <StatCard
                icon="checkmark-circle"
                iconColor="#4CAF50"
                value={acceptedRate}
                label="Accepted"
            />
            <StatCard
                icon="star"
                iconColor="#FFC107"
                value={rating}
                label="Rating"
            />
            <StatCard
                icon="close-circle"
                iconColor="#F44336"
                value={cancelledRate}
                label="Cancelled"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 10,
        width: '30%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
});

export default StatsRow;
