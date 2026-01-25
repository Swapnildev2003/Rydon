import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TABS = [
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'rides', name: 'Rides', icon: 'car' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet' },
    { id: 'more', name: 'More', icon: 'menu' },
];

const BottomNavigation = ({ activeTab, onTabChange }) => {
    return (
        <View style={styles.container}>
            {TABS.map(tab => (
                <TouchableOpacity
                    key={tab.id}
                    style={styles.tabButton}
                    onPress={() => onTabChange(tab.id)}
                >
                    <Ionicons
                        name={tab.icon}
                        size={24}
                        color={activeTab === tab.id ? '#3A86FF' : '#666'}
                    />
                    <Text style={[
                        styles.tabText,
                        activeTab === tab.id && styles.activeTabText
                    ]}>
                        {tab.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingVertical: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabButton: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    tabText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    activeTabText: {
        color: '#3A86FF',
        fontWeight: 'bold',
    },
});

export default BottomNavigation;
