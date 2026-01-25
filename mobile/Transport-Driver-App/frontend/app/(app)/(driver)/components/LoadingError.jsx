import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const LoadingScreen = ({ message = 'Loading your data...' }) => (
    <View style={styles.container}>
        <ActivityIndicator size="large" color="#3A86FF" />
        <Text style={styles.loadingText}>{message}</Text>
    </View>
);

export const ErrorScreen = ({ error, onRetry }) => (
    <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="warning" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    errorContainer: {
        padding: 20,
    },
    errorText: {
        color: '#F44336',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#3A86FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
