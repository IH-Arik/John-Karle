import React from 'react';
import { 
    Modal, 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Pressable, 
    useColorScheme,
    Dimensions
} from 'react-native';
import { CalendarList } from 'react-native-calendars';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';

interface MemoryCalendarModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectDate: (day: any) => void;
    selectedDate: string;
}

export const MemoryCalendarModal: React.FC<MemoryCalendarModalProps> = ({
    visible,
    onClose,
    onSelectDate,
    selectedDate
}) => {
    const isDarkMode = useColorScheme() === 'dark';

    // Today's date as yyyy-mm-dd — used as the upper boundary for selection
    const today = new Date().toISOString().split('T')[0];

    // Guard: silently ignore taps on future dates (belt-and-suspenders alongside maxDate)
    const handleDayPress = (day: any) => {
        if (day.dateString > today) return;
        onSelectDate(day);
    };
    
    // Self-contained thematic hooks matching app aesthetic
    const palette = {
        textDark: isDarkMode ? '#FFFFFF' : '#2D2C39',
        btnPrimary: '#8EA281',
        bgContent: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        bgCancel: isDarkMode ? '#2C2C2C' : '#F0F0F0',
    };

    // Mathematically bound width lock calculated from outer constraints
    const windowWidth = Dimensions.get('window').width;
    // subtract modal external padding (24 * 2) and internal modal box padding (20 * 2)
    const calendarWidth = windowWidth - ms(48) - ms(40);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable 
                style={styles.modalOverlay} 
                onPress={onClose}
            >
                <Pressable style={[styles.modalContent, { backgroundColor: palette.bgContent }]}>
                    <Text style={[styles.modalTitle, { color: palette.textDark }]}>Select Memory Date</Text>
                    
                    {/* Cinematic List-Engine swapped in for real physical animation interpolation */}
                    <View style={{ width: calendarWidth, height: vs(320), overflow: 'hidden' }}>
                        <CalendarList
                            onDayPress={handleDayPress}
                            horizontal={true}
                            pagingEnabled={true}
                            calendarWidth={calendarWidth}
                            staticHeader={false}
                            showsHorizontalScrollIndicator={false}
                            pastScrollRange={60}   // 5 Years back
                            futureScrollRange={0}  // No future months
                            maxDate={today}        // Disable all future dates
                            markedDates={{
                                [selectedDate]: { selected: true, disableTouchEvent: true }
                            }}
                            theme={{
                                backgroundColor: 'transparent',
                                calendarBackground: 'transparent',
                                textSectionTitleColor: isDarkMode ? '#A0A0A0' : '#767676',
                                selectedDayBackgroundColor: palette.btnPrimary,
                                selectedDayTextColor: '#FFFFFF',
                                todayTextColor: palette.btnPrimary,
                                dayTextColor: palette.textDark,
                                textDisabledColor: isDarkMode ? '#444' : '#D3D3D3',
                                dotColor: palette.btnPrimary,
                                arrowColor: palette.btnPrimary,
                                monthTextColor: palette.textDark,
                                textDayFontFamily: FONTS.sans,
                                textMonthFontFamily: FONTS.serif,
                                textDayHeaderFontFamily: FONTS.sans,
                                textDayFontSize: ms(14),
                                textMonthFontSize: ms(16),
                                textMonthFontWeight: 'bold',
                            }}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.cancelBtn, { backgroundColor: palette.bgCancel }]}
                        onPress={onClose}
                    >
                        <Text style={[styles.cancelText, { color: palette.textDark }]}>Cancel</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: ms(24),
    },
    modalContent: {
        borderRadius: ms(24),
        padding: ms(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(18),
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: vs(12),
    },
    cancelBtn: {
        marginTop: vs(16),
        paddingVertical: vs(12),
        borderRadius: ms(12),
        alignItems: 'center',
    },
    cancelText: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '600',
    }
});
