import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText as Text } from '@/components/themed-text';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

const PRIMARY_GREEN = '#3E8E41';

export default function Register() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.register({ name, email, password });
            Alert.alert('Success', 'Registration successful! Please login.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            console.error(e);
            Alert.alert('Registration Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.contentContainer}>

                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to join the game!</Text>

                    <View style={styles.formContainer}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="******"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="******"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.registerBtnText}>Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
                            <Text style={styles.loginLinkText}>Already have an account? Login</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 30,
        paddingTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#757575',
        marginBottom: 40,
    },
    formContainer: {
        width: '100%',
        maxWidth: 400,
    },
    label: {
        fontSize: 14,
        color: '#1C1C1E',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        fontSize: 16,
    },
    registerButton: {
        backgroundColor: PRIMARY_GREEN,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    loginLinkText: {
        color: PRIMARY_GREEN,
        fontWeight: '600',
    }
});
