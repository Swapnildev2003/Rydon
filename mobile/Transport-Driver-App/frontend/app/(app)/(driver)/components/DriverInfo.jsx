import { StyleSheet, Text, View } from 'react-native';

const DriverInfo = ({ driverData }) => {
    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.driverName}>
                    {driverData?.driver.name || 'Driver Name'}
                </Text>
                <Text style={styles.driverLevel}>
                    {driverData?.level || 'Basic Level'}
                </Text>
            </View>
            <View style={styles.profileIcon}>
                <Text style={styles.profileInitial}>
                    {driverData?.driver.name?.charAt(0) || 'D'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    driverName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    driverLevel: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#3A86FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default DriverInfo;
