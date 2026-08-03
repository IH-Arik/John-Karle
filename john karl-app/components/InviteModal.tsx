import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ms, vs } from 'react-native-size-matters';
import { FONTS } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/services/api';

// ── Role options ────────────────────────────────────────────────────────────
const ROLES = [
    { id: 'owner',  label: 'Owner',  desc: 'Full access & control',    icon: 'crown-outline', type: 'material',  color: '#92A38D', colorDark: '#516249' },
    { id: 'editor', label: 'Editor', desc: 'Can add & edit memories',  icon: 'edit-2',        type: 'feather',   color: '#A2A1BA', colorDark: '#54526B' },
    { id: 'viewer', label: 'Viewer', desc: 'Read-only access',         icon: 'eye-outline',   type: 'ionicons',  color: '#AAB7C0', colorDark: '#58656E' },
];

// ── Relation options (common family relationships) ──────────────────────────
const RELATIONS = [
    { id: 'spouse',      label: 'Spouse',       icon: 'heart',        color: '#C0A0A0', colorDark: '#7A5A5A' },
    { id: 'parent',      label: 'Parent',       icon: 'user',         color: '#A8B0A0', colorDark: '#506050' },
    { id: 'child',       label: 'Child',        icon: 'user',         color: '#B0C0A8', colorDark: '#506850' },
    { id: 'brother',     label: 'Brother',      icon: 'users',        color: '#A0B8C8', colorDark: '#506478' },
    { id: 'sister',      label: 'Sister',       icon: 'users',        color: '#C0A8B8', colorDark: '#705868' },
    { id: 'grandparent', label: 'Grandparent',  icon: 'user',         color: '#B8B0A0', colorDark: '#685850' },
    { id: 'grandchild',  label: 'Grandchild',   icon: 'user',         color: '#A8C0B0', colorDark: '#507060' },
    { id: 'aunt',        label: 'Aunt',         icon: 'user',         color: '#C0B0C0', colorDark: '#706070' },
    { id: 'uncle',       label: 'Uncle',        icon: 'user',         color: '#B0B8C8', colorDark: '#506878' },
    { id: 'cousin',      label: 'Cousin',       icon: 'users',        color: '#C0C0A8', colorDark: '#707050' },
    { id: 'friend',      label: 'Friend',       icon: 'smile',        color: '#A8C0C0', colorDark: '#507070' },
    { id: 'other',       label: 'Other',        icon: 'more-horizontal', color: '#B0B0B0', colorDark: '#606060' },
];

interface InviteModalProps {
    visible: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    onInviteSuccess?: () => void;
}

type PickerType = 'relation' | 'role' | null;

export default function InviteModal({ visible, onClose, isDarkMode, onInviteSuccess }: InviteModalProps) {

    // ── Form state ────────────────────────────────────────────────────────
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedRelationId, setSelectedRelationId] = useState('brother');
    const [selectedRoleId, setSelectedRoleId] = useState('viewer');
    const [activePicker, setActivePicker] = useState<PickerType>(null);
    const [isSending, setIsSending] = useState(false);

    const selectedRelation = RELATIONS.find(r => r.id === selectedRelationId) || RELATIONS[3];
    const selectedRole     = ROLES.find(r => r.id === selectedRoleId)         || ROLES[2];

    const triggerTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const togglePicker = (picker: PickerType) => {
        triggerTap();
        setActivePicker(prev => prev === picker ? null : picker);
    };

    // ── Permissions helper (unchanged logic) ─────────────────────────────
    const hasPerm = (perm: string) => {
        if (selectedRoleId === 'owner') return true;
        if (selectedRoleId === 'editor') return ['view_mem', 'view_timeline', 'add_mem', 'edit_prof'].includes(perm);
        return ['view_mem', 'view_timeline'].includes(perm);
    };

    // ── Reset form ────────────────────────────────────────────────────────
    const resetForm = () => {
        setName('');
        setEmail('');
        setSelectedRelationId('sibling');
        setSelectedRoleId('viewer');
        setActivePicker(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSendInvitation = async () => {
        if (!name.trim()) {
            Alert.alert('Missing Name', 'Please enter the invitee\'s full name.');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsSending(true);
        try {
            const body = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                relation: selectedRelationId,
                role: selectedRoleId,
            };
            console.log('[InviteModal] POST /users/invitations', body);
            const response = await api.post('/users/invitations', body);
            console.log('[InviteModal] Response:', JSON.stringify(response));

            if (response.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                    'Invitation Sent! 🎉',
                    `${name.trim()} will receive an email invitation to join your family archive.`,
                    [{ text: 'Done', onPress: () => { resetForm(); onClose(); onInviteSuccess?.(); } }]
                );
            } else {
                Alert.alert('Failed', response.message || 'Could not send invitation. Please try again.');
            }
        } catch (err: any) {
            console.error('[InviteModal] Error:', err);
            Alert.alert('Error', err?.message || 'A network error occurred.');
        } finally {
            setIsSending(false);
        }
    };

    const modalPal = {
        bg:             isDarkMode ? '#1A1A1A'  : '#F9F8F6',
        inputBg:        isDarkMode ? '#2D2C35'  : '#E5E3EA',
        inputText:      isDarkMode ? '#FFFFFF'  : '#2D2C39',
        label:          isDarkMode ? '#C0C0C0'  : '#5A5A5F',
        closeBg:        isDarkMode ? '#333333'  : '#EAEAEA',
        closeIcon:      isDarkMode ? '#AFAFAF'  : '#5F5F5F',
        selectBg:       isDarkMode ? '#2D333A'  : '#E4EAEF',
        selectText:     isDarkMode ? '#B0B8C0'  : '#5C6975',
        pickerBg:       isDarkMode ? '#2D333A'  : '#E4EAEF',
        pickerDivider:  isDarkMode ? '#3B434A'  : '#D5DDE4',
        pickerTextMain: isDarkMode ? '#FFFFFF'  : '#3A3A45',
        pickerTextSub:  isDarkMode ? '#9FA7AE'  : '#888E95',
        tableBg:        isDarkMode ? '#242B22'  : '#E1E6DE',
        tableHeader:    isDarkMode ? '#879F80'  : '#8A9B89',
        checkOk:        '#8E9F85',
        checkOff:       isDarkMode ? '#4D554B'  : '#C3CDC0',
        btnMain:        '#92A38D',
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="formSheet"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: modalPal.bg }} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">

                        {/* Header */}
                        <View style={styles.modalHeaderRow}>
                            <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#3A3A45' }]}>Invite Someone</Text>
                            <TouchableOpacity
                                style={[styles.modalCloseBtn, { backgroundColor: modalPal.closeBg }]}
                                onPress={handleClose}
                            >
                                <Feather name="x" size={ms(18)} color={modalPal.closeIcon} />
                            </TouchableOpacity>
                        </View>

                        {/* Name */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.inputLabel, { color: modalPal.label }]}>Name</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: modalPal.inputBg, color: modalPal.inputText }]}
                                placeholder="Their full name"
                                placeholderTextColor={isDarkMode ? '#666' : '#8E8E99'}
                                value={name}
                                onChangeText={setName}
                                editable={!isSending}
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.inputLabel, { color: modalPal.label }]}>Email</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: modalPal.inputBg, color: modalPal.inputText }]}
                                placeholder="their@email.com"
                                placeholderTextColor={isDarkMode ? '#666' : '#8E8E99'}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isSending}
                            />
                        </View>

                        {/* Relation dropdown */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.inputLabel, { color: modalPal.label }]}>Relation</Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.selectBox, { backgroundColor: modalPal.selectBg }]}
                                onPress={() => togglePicker('relation')}
                                disabled={isSending}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Feather name={selectedRelation.icon as any} size={ms(16)} color={modalPal.selectText} style={{ marginRight: ms(8) }} />
                                    <Text style={[styles.selectText, { color: modalPal.selectText }]}>{selectedRelation.label}</Text>
                                </View>
                                <Feather name={activePicker === 'relation' ? 'chevron-up' : 'chevron-down'} size={ms(16)} color={modalPal.selectText} />
                            </TouchableOpacity>

                            {activePicker === 'relation' && (
                                <View style={[styles.pickerFloat, { backgroundColor: modalPal.pickerBg }]}>
                                    {RELATIONS.map((rel, idx) => (
                                        <React.Fragment key={rel.id}>
                                            {idx > 0 && <View style={[styles.pickerDivider, { backgroundColor: modalPal.pickerDivider }]} />}
                                            <TouchableOpacity
                                                style={styles.pickerItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    triggerTap();
                                                    setSelectedRelationId(rel.id);
                                                    setActivePicker(null);
                                                }}
                                            >
                                                <View style={[styles.pickerIconBox, { backgroundColor: isDarkMode ? rel.colorDark : rel.color }]}>
                                                    <Feather name={rel.icon as any} size={ms(14)} color="#FFFFFF" />
                                                </View>
                                                <View style={styles.pickerText}>
                                                    <Text style={[styles.pickerTitle, { color: modalPal.pickerTextMain }]}>{rel.label}</Text>
                                                </View>
                                                {rel.id === selectedRelationId && (
                                                    <Ionicons name="checkmark" size={ms(18)} color="#92A38D" />
                                                )}
                                            </TouchableOpacity>
                                        </React.Fragment>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Role dropdown */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.inputLabel, { color: modalPal.label }]}>Role</Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={[styles.selectBox, { backgroundColor: modalPal.selectBg }]}
                                onPress={() => togglePicker('role')}
                                disabled={isSending}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {selectedRole.type === 'material' ? (
                                        <MaterialCommunityIcons name={selectedRole.icon as any} size={ms(16)} color={modalPal.selectText} style={{ marginRight: ms(8) }} />
                                    ) : selectedRole.type === 'ionicons' ? (
                                        <Ionicons name={selectedRole.icon as any} size={ms(16)} color={modalPal.selectText} style={{ marginRight: ms(8) }} />
                                    ) : (
                                        <Feather name={selectedRole.icon as any} size={ms(16)} color={modalPal.selectText} style={{ marginRight: ms(8) }} />
                                    )}
                                    <Text style={[styles.selectText, { color: modalPal.selectText }]}>{selectedRole.label}</Text>
                                </View>
                                <Feather name={activePicker === 'role' ? 'chevron-up' : 'chevron-down'} size={ms(16)} color={modalPal.selectText} />
                            </TouchableOpacity>

                            {activePicker === 'role' && (
                                <View style={[styles.pickerFloat, { backgroundColor: modalPal.pickerBg }]}>
                                    {ROLES.map((role, idx) => (
                                        <React.Fragment key={role.id}>
                                            {idx > 0 && <View style={[styles.pickerDivider, { backgroundColor: modalPal.pickerDivider }]} />}
                                            <TouchableOpacity
                                                style={styles.pickerItem}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    triggerTap();
                                                    setSelectedRoleId(role.id);
                                                    setActivePicker(null);
                                                }}
                                            >
                                                <View style={[styles.pickerIconBox, { backgroundColor: isDarkMode ? role.colorDark : role.color }]}>
                                                    {role.type === 'material' ? (
                                                        <MaterialCommunityIcons name={role.icon as any} size={ms(16)} color="#FFFFFF" />
                                                    ) : role.type === 'ionicons' ? (
                                                        <Ionicons name={role.icon as any} size={ms(14)} color="#FFFFFF" />
                                                    ) : (
                                                        <Feather name={role.icon as any} size={ms(14)} color="#FFFFFF" />
                                                    )}
                                                </View>
                                                <View style={styles.pickerText}>
                                                    <Text style={[styles.pickerTitle, { color: modalPal.pickerTextMain }]}>{role.label}</Text>
                                                    <Text style={[styles.pickerSub,   { color: modalPal.pickerTextSub  }]}>{role.desc}</Text>
                                                </View>
                                                {role.id === selectedRoleId && (
                                                    <Ionicons name="checkmark" size={ms(18)} color="#92A38D" />
                                                )}
                                            </TouchableOpacity>
                                        </React.Fragment>
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Permissions matrix */}
                        <View style={[styles.permTable, { backgroundColor: modalPal.tableBg }]}>
                            <Text style={[styles.permTitle, { color: modalPal.tableHeader }]}>
                                PERMISSIONS FOR {selectedRole.label.toUpperCase()}
                            </Text>
                            {[
                                { perm: 'view_mem',      label: 'View Memories'  },
                                { perm: 'view_timeline', label: 'View Timeline'  },
                                { perm: 'add_mem',       label: 'Add Memories'   },
                                { perm: 'edit_prof',     label: 'Edit Profiles'  },
                                { perm: 'manage',        label: 'Manage Access'  },
                            ].map(({ perm, label }) => (
                                <View key={perm} style={styles.permItem}>
                                    <Ionicons
                                        name={hasPerm(perm) ? 'checkmark-circle' : 'close-circle'}
                                        size={ms(18)}
                                        color={hasPerm(perm) ? modalPal.checkOk : modalPal.checkOff}
                                        style={{ marginRight: ms(10) }}
                                    />
                                    <Text style={[
                                        styles.permLabel,
                                        { color: hasPerm(perm) ? (isDarkMode ? '#FFF' : '#4A4A4A') : (isDarkMode ? '#666' : '#9FAFA0') }
                                    ]}>
                                        {label}
                                    </Text>
                                </View>
                            ))}
                        </View>

                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: modalPal.btnMain, opacity: isSending ? 0.7 : 1 }]}
                            onPress={handleSendInvitation}
                            disabled={isSending}
                            activeOpacity={0.85}
                        >
                            {isSending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitBtnText}>Send Invitation</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalScroll: {
        padding: ms(24),
        paddingBottom: vs(120),
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vs(32),
        marginTop: vs(10),
    },
    modalTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(28),
        fontWeight: '500',
    },
    modalCloseBtn: {
        width: ms(38),
        height: ms(38),
        borderRadius: ms(19),
        justifyContent: 'center',
        alignItems: 'center',
    },
    formGroup: {
        marginBottom: vs(20),
    },
    inputLabel: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        marginBottom: vs(8),
    },
    textInput: {
        width: '100%',
        height: vs(50),
        borderRadius: ms(16),
        paddingHorizontal: ms(16),
        fontFamily: FONTS.sans,
        fontSize: ms(15),
    },
    selectBox: {
        width: '100%',
        height: vs(50),
        borderRadius: ms(16),
        paddingHorizontal: ms(16),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectText: {
        fontFamily: FONTS.sans,
        fontSize: ms(15),
        fontWeight: '500',
    },
    pickerFloat: {
        width: '100%',
        borderRadius: ms(18),
        marginTop: vs(8),
        padding: ms(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 10,
    },
    pickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: ms(12),
    },
    pickerIconBox: {
        width: ms(36),
        height: ms(36),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: ms(16),
    },
    pickerText: {
        flex: 1,
    },
    pickerTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(16),
        fontWeight: '500',
        marginBottom: vs(2),
    },
    pickerSub: {
        fontFamily: FONTS.sans,
        fontSize: ms(12),
    },
    pickerDivider: {
        height: 1,
        width: '100%',
    },
    permTable: {
        width: '100%',
        borderRadius: ms(20),
        padding: ms(20),
        marginTop: vs(10),
    },
    permTitle: {
        fontFamily: FONTS.serif,
        fontSize: ms(13),
        letterSpacing: 0.5,
        fontWeight: '500',
        marginBottom: vs(14),
    },
    permItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vs(10),
    },
    permLabel: {
        fontFamily: FONTS.sans,
        fontSize: ms(14),
        fontWeight: '500',
    },
    modalFooter: {
        position: 'absolute',
        bottom: vs(30),
        left: ms(24),
        right: ms(24),
    },
    submitBtn: {
        width: '100%',
        height: vs(54),
        borderRadius: ms(16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: {
        fontFamily: FONTS.serif,
        color: '#FFFFFF',
        fontSize: ms(17),
        fontWeight: '600',
    },
});
