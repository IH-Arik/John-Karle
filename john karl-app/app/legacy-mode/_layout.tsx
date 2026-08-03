import { Stack } from 'expo-router';

export default function LegacyLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="access" />
            <Stack.Screen name="rules" />
            <Stack.Screen name="transfer" />
            <Stack.Screen name="success" />
        </Stack>
    );
}
