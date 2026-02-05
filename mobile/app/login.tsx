import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../ctx';
import { ThemedText as Text } from '@/components/themed-text';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const PRIMARY_GREEN = '#3E8E41';
const GOOGLE_COLOR = '#DB4437';
const FACEBOOK_COLOR = '#1877F2';

export default function Login() {
    const { signIn } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogin = async (provider: string) => {
        setLoading(true);
        try {
            // Simulate backend delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            await signIn(provider);
            router.replace('/');
        } catch (e) {
            console.error(e);
            alert('Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>

                    {/* Header / Logo Area */}
                    <View style={styles.headerSection}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="football-outline" size={60} color={PRIMARY_GREEN} />
                        </View>
                        <Text style={styles.title}>Reserve Game</Text>
                        <Text style={styles.subtitle}>Temukan dan gabung permainan seru di sekitarmu!</Text>
                    </View>

                    {/* Social Login Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.socialButton, styles.googleBtn]}
                            onPress={() => handleLogin('google')}
                            disabled={loading}
                        >
                            <View style={styles.iconWrapper}>
                                <FontAwesome5 name="google" size={20} color="#fff" />
                            </View>
                            <Text style={styles.socialBtnText}>Masuk dengan Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.socialButton, styles.fbBtn]}
                            onPress={() => handleLogin('facebook')}
                            disabled={loading}
                        >
                            <View style={styles.iconWrapper}>
                                <FontAwesome5 name="facebook-f" size={20} color="#fff" />
                            </View>
                            <Text style={styles.socialBtnText}>Masuk dengan Facebook</Text>
                        </TouchableOpacity>

                        <Text style={styles.termsText}>
                            Dengan masuk, kamu menyetujui <Text style={styles.linkText}>Syarat & Ketentuan</Text> kami.
                        </Text>
                    </View>

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                        </View>
                    )}
                </View>
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
        justifyContent: 'center', // Center vertically
        alignItems: 'center',     // Center horizontally
    },
    contentContainer: {
        width: '100%',
        paddingHorizontal: 30,
        maxWidth: 500, // For Web: Look like a card/centered
        alignItems: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 60,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8F5E9', // Light Green
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        justifyContent: 'center',
        position: 'relative',
    },
    googleBtn: {
        backgroundColor: GOOGLE_COLOR,
    },
    fbBtn: {
        backgroundColor: FACEBOOK_COLOR,
    },
    iconWrapper: {
        position: 'absolute',
        left: 24,
    },
    socialBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    toggleContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 14,
        color: '#757575',
    },
    termsText: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 12,
        color: '#9E9E9E',
    },
    linkText: {
        color: PRIMARY_GREEN,
        fontWeight: '600',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
