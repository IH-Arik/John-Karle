import { FONTS } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { ms, vs } from 'react-native-size-matters';

export interface PersonItem {
    name: string;
    avatarInfo: {
        type: 'uri' | 'placeholder';
        source?: any;
    };
    role?: string;
}

interface MacPersonasModalProps {
    visible: boolean;
    onClose: () => void;
    persons: PersonItem[];
    isDarkMode?: boolean;
}

export function MacPersonasModal({
    visible,
    onClose,
    persons,
    isDarkMode = false,
}: MacPersonasModalProps) {
    const [isMounted, setIsMounted] = useState(visible);

    const translateY = useSharedValue(380);
    const scaleX = useSharedValue(0.25);
    const scaleY = useSharedValue(0.25);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            setIsMounted(true);
            opacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
            translateY.value = withSpring(0, { damping: 13, stiffness: 280, mass: 0.5 });
            scaleX.value = withSpring(1, { damping: 12, stiffness: 260, mass: 0.5 });
            scaleY.value = withSpring(1, { damping: 13, stiffness: 290, mass: 0.5 });
        } else if (isMounted) {
            opacity.value = withTiming(0, { duration: 160 });
            scaleX.value = withTiming(0.2, { duration: 160, easing: Easing.in(Easing.quad) });
            scaleY.value = withTiming(0.2, { duration: 160, easing: Easing.in(Easing.quad) });
            translateY.value = withTiming(380, { duration: 170, easing: Easing.in(Easing.cubic) }, (finished) => {
                if (finished) {
                    runOnJS(setIsMounted)(false);
                }
            });
        }
    }, [visible, isMounted, opacity, translateY, scaleX, scaleY]);

    const handleClose = () => {
        opacity.value = withTiming(0, { duration: 160 });
        scaleX.value = withTiming(0.2, { duration: 160, easing: Easing.in(Easing.quad) });
        scaleY.value = withTiming(0.2, { duration: 160, easing: Easing.in(Easing.quad) });
        translateY.value = withTiming(380, { duration: 170, easing: Easing.in(Easing.cubic) }, (finished) => {
            if (finished) {
                runOnJS(onClose)();
            }
        });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { translateY: translateY.value },
            { scaleX: scaleX.value },
            { scaleY: scaleY.value },
        ],
    }));

    if (!visible && !isMounted) return null;

    return (
        <Modal transparent visible={visible || isMounted} animationType="none" onRequestClose={handleClose}>
            <View style={styles.modalBackdrop}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFillObject}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View
                    style={[
                        styles.macWindow,
                        isDarkMode ? styles.macWindowDark : styles.macWindowLight,
                        animatedStyle,
                    ]}
                >
                    {/* Titlebar */}
                    <View
                        style={[
                            styles.macTitlebar,
                            isDarkMode ? styles.macTitlebarDark : styles.macTitlebarLight,
                        ]}
                    >
                        <Text style={[styles.macWindowTitle, { color: isDarkMode ? '#E0E0E0' : '#333333' }]}>
                            Whose Memory ({persons.length})
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={handleClose}
                            style={styles.closeBtn}
                        >
                            <Feather name="x" size={ms(18)} color={isDarkMode ? '#AAAAAA' : '#666666'} />
                        </TouchableOpacity>
                    </View>

                    {/* Window Body */}
                    <ScrollView
                        style={styles.windowBody}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {persons.map((person, idx) => (
                            <View
                                key={`${person.name}-${idx}`}
                                style={[
                                    styles.personRow,
                                    idx < persons.length - 1 &&
                                        (isDarkMode ? styles.rowBorderDark : styles.rowBorderLight),
                                ]}
                            >
                                <View
                                    style={[
                                        styles.avatarCircle,
                                        {
                                            backgroundColor: isDarkMode ? '#323239' : '#E5E8E2',
                                            borderColor: isDarkMode ? '#444' : '#D0D5CE',
                                        },
                                    ]}
                                >
                                    {person.avatarInfo.type === 'uri' && person.avatarInfo.source ? (
                                        <Image source={person.avatarInfo.source} style={styles.avatarImg} />
                                    ) : (
                                        <Feather name="user" size={ms(18)} color={isDarkMode ? '#BBB' : '#555'} />
                                    )}
                                </View>

                                <View style={styles.personMeta}>
                                    <Text
                                        style={[
                                            styles.personName,
                                            { color: isDarkMode ? '#FFFFFF' : '#2D2C39' },
                                        ]}
                                    >
                                        {person.name}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.personRole,
                                            { color: isDarkMode ? '#9A9A9A' : '#7A7A85' },
                                        ]}
                                    >
                                        {person.role || (person.name.toLowerCase() === 'mine' || person.name.toLowerCase() === 'self' ? 'Memory Creator' : 'Tagged Member')}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: ms(20),
    },
    macWindow: {
        width: '90%',
        maxHeight: vs(420),
        borderRadius: ms(16),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
    },
    macWindowLight: {
        backgroundColor: '#F7F7F7',
        borderWidth: 1,
        borderColor: '#E2E2E2',
    },
    macWindowDark: {
        backgroundColor: '#1E1E24',
        borderWidth: 1,
        borderColor: '#33333D',
    },
    macTitlebar: {
        height: vs(42),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: ms(14),
        borderBottomWidth: 1,
    },
    macTitlebarLight: {
        backgroundColor: '#EBECEE',
        borderBottomColor: '#DCDCDC',
    },
    macTitlebarDark: {
        backgroundColor: '#292932',
        borderBottomColor: '#363642',
    },
    closeBtn: {
        padding: ms(4),
        justifyContent: 'center',
        alignItems: 'center',
    },
    macWindowTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
    },
    windowBody: {
        maxHeight: vs(360),
    },
    scrollContent: {
        paddingHorizontal: ms(16),
        paddingVertical: vs(8),
    },
    personRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vs(12),
    },
    rowBorderLight: {
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    rowBorderDark: {
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C36',
    },
    avatarCircle: {
        width: ms(40),
        height: ms(40),
        borderRadius: ms(20),
        borderWidth: 1.5,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(14),
    },
    avatarImg: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    personMeta: {
        flex: 1,
        justifyContent: 'center',
    },
    personName: {
        fontFamily: FONTS.serif,
        fontSize: ms(15),
        fontWeight: '600',
        marginBottom: vs(2),
    },
    personRole: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
    },
});
