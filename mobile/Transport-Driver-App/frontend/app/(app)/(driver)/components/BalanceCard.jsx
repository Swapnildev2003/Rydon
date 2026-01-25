import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

const BalanceCard = ({ balance = '$564.78' }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Balance</Text>
                <MaterialIcons name="visibility" size={20} color="white" />
            </View>
            <Text style={styles.amount}>{balance}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#3A86FF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        color: 'white',
        fontWeight: '600',
    },
    amount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default BalanceCard;
