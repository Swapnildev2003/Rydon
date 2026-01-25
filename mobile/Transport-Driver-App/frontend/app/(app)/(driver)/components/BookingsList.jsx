import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BookingCard from './BookingCard';

/**
 * BookingsList - Displays list of bookings with pull-to-refresh
 */
const BookingsList = ({
    bookings,
    onAccept,
    onReject,
    onRefresh,
    refreshing,
}) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Your Bookings</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={20} color="#3A86FF" />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={bookings}
                renderItem={({ item }) => (
                    <BookingCard
                        booking={item}
                        onAccept={(id) => onAccept(id, 'accepted')}
                        onReject={(id) => onReject(id, 'rejected')}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<EmptyState />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3A86FF']}
                        tintColor="#3A86FF"
                    />
                }
            />
        </View>
    );
};

/**
 * Empty state when no bookings
 */
const EmptyState = () => (
    <Text style={styles.emptyText}>No bookings found</Text>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    refreshButton: {
        padding: 8,
    },
    list: {
        paddingBottom: 80,
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 20,
        fontSize: 16,
    },
});

export default BookingsList;
