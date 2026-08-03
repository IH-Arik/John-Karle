import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    useColorScheme 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';

interface NotificationHeaderProps {
    title?: string;
    onMarkRead?: () => void;
    onDelete?: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({ 
    title = 'Notifications',
    onMarkRead,
    onDelete 
}) => {
    const router = useRouter();
    const isDarkMode = useColorScheme() === 'dark';

    // Synchronous chromatic context lock mapped directly from validated source
    const styles = getStyles(isDarkMode);
    const dynamicColors = {
        backCircle: isDarkMode ? '#2E2E33' : '#E2E3E5',
        btnTrashBg: isDarkMode ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)',
        trashIcon: '#FF453A',
        readBtnBg: isDarkMode ? '#2C2C2C' : '#E3E5E1',
        titleText: isDarkMode ? '#A5B08B' : '#2D2C39',
        backArrow: isDarkMode ? '#BDBDBD' : '#4A4A4A'
    };

    return (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <TouchableOpacity 
                    style={[styles.backBtn, { backgroundColor: dynamicColors.backCircle }]}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={ms(22)} color={dynamicColors.backArrow} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: dynamicColors.titleText }]}>{title}</Text>
            </View>
            
            <View style={styles.headerRight}>
                <TouchableOpacity 
                    style={[styles.readBtn, { backgroundColor: dynamicColors.readBtnBg }]}
                    onPress={onMarkRead}
                >
                    <Feather name="check" size={ms(14)} color="#6B6B6B" style={{ marginRight: 4 }} />
                    <Text style={styles.readText}>Mark all read</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.trashBtn, { backgroundColor: dynamicColors.btnTrashBg }]}
                    onPress={onDelete}
                >
                    <Feather name="trash-2" size={ms(18)} color={dynamicColors.trashIcon} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// User-validated styling specifications loaded with exact micro-tweaks preserved
const getStyles = (isDark: boolean) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: ms(20),
        paddingVertical: vs(12),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: ms(35),
        height: ms(35),
        borderRadius: ms(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(10),
    },
    title: {
        fontFamily: FONTS.serif,
        fontSize: ms(18), 
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: ms(10),
        paddingVertical: vs(4),
        borderRadius: ms(16),
        marginRight: ms(5),
    },
    readText: {
        fontFamily: FONTS.serif, 
        fontSize: ms(12), 
        color: '#6B6B6B',
    },
    trashBtn: {
        width: ms(35), 
        height: ms(35),
        borderRadius: ms(14), 
        justifyContent: 'center',
        alignItems: 'center',
    },
});
