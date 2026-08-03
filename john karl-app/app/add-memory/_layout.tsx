import { Stack } from 'expo-router';

export default function AddMemoryLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="story" />
            <Stack.Screen name="tags" />
            <Stack.Screen name="save" />
        </Stack>
    );
}
