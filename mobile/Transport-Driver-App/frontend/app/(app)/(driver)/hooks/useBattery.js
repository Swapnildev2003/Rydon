import { useEffect, useState } from 'react';
import * as Battery from 'expo-battery';

/**
 * Custom hook for battery monitoring
 * @returns {Object} - { batteryLevel, isCharging }
 */
export const useBattery = () => {
    const [batteryLevel, setBatteryLevel] = useState(null);
    const [isCharging, setIsCharging] = useState(false);

    useEffect(() => {
        let batteryLevelSubscription;
        let batteryStateSubscription;

        const setupBatteryListeners = async () => {
            try {
                const isAvailable = await Battery.isAvailableAsync();
                if (!isAvailable) return;

                // Get initial battery level
                const level = await Battery.getBatteryLevelAsync();
                setBatteryLevel(Math.round(level * 100));

                // Get initial charging state
                const state = await Battery.getBatteryStateAsync();
                setIsCharging(state === Battery.BatteryState.CHARGING);

                // Subscribe to battery level changes
                batteryLevelSubscription = Battery.addBatteryLevelListener(
                    ({ batteryLevel }) => {
                        setBatteryLevel(Math.round(batteryLevel * 100));
                    }
                );

                // Subscribe to charging state changes
                batteryStateSubscription = Battery.addBatteryStateListener(
                    ({ batteryState }) => {
                        setIsCharging(batteryState === Battery.BatteryState.CHARGING);
                    }
                );
            } catch (error) {
                console.error('Battery monitoring error:', error);
            }
        };

        setupBatteryListeners();

        return () => {
            batteryLevelSubscription?.remove();
            batteryStateSubscription?.remove();
        };
    }, []);

    return { batteryLevel, isCharging };
};

export default useBattery;
