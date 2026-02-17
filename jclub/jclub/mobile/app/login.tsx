import { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '../ctx';
import { ThemedText as Text } from '@/components/themed-text';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const PRIMARY_GREEN = '#3E8E41';
const GOOGLE_COLOR = '#DB4437';
const FACEBOOK_COLOR = '#1877F2';

export default function Login() {
    const { signIn } = useSession();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Google Auth Request (using environment variables)
    const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    });

    // Facebook Auth Request (using environment variables)
    const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    });

    useEffect(() => {
        if (googleResponse?.type === 'success') {
            const { authentication } = googleResponse;
            handleSocialLoginSuccess('google', authentication?.accessToken);
        }
    }, [googleResponse]);

    useEffect(() => {
        if (fbResponse?.type === 'success') {
            const { authentication } = fbResponse;
            handleSocialLoginSuccess('facebook', authentication?.accessToken);
        }
    }, [fbResponse]);

    const handleSocialLoginSuccess = async (provider: string, token: string | undefined) => {
        if (!token) return;

        setLoading(true);
        try {
            // Send to backend for verification and JWT issuance
            // Note: In dev mode, our backend currently trusts the email/name.
            // We should fetch basic info from Google/FB if needed, or send the token.
            await signIn(provider, '', token); // Updated signIn to handle social
            router.replace('/');
        } catch (e: any) {
            Alert.alert('Social Login Failed', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter Email and Password');
            return;
        }

        setLoading(true);
        try {
            await signIn('local', email, undefined, password);
            router.replace('/');
        } catch (e: any) {
            console.error(e);
            Alert.alert('Login Failed', e.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: string) => {
        if (provider === 'google') {
            if (!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB) {
                Alert.alert("Configuration Required", "Google Client IDs are missing in .env file.");
                return;
            }
            googlePromptAsync();
        } else if (provider === 'facebook') {
            if (!process.env.EXPO_PUBLIC_FACEBOOK_APP_ID) {
                Alert.alert("Configuration Required", "Facebook App ID is missing in .env file.");
                return;
            }
            fbPromptAsync();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>

                    {/* Header / Logo Area */}
                    <View style={styles.headerSection}>
                        <Image
                            source={require('@/assets/images/jclub-logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>JClub</Text>
                        <Text style={styles.subtitle}>Temukan dan gabung permainan seru di sekitarmu!</Text>
                    </View>

                    {/* Email/Password Login */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="email@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Text style={styles.inputLabel}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="******"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleEmailLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginBtnText}>Masuk</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>ATAU</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Social Login Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.socialButton, styles.googleBtn]}
                            onPress={() => handleSocialLogin('google')}
                            disabled={loading || !googleRequest}
                        >
                            <View style={styles.iconWrapper}>
                                <FontAwesome5 name="google" size={20} color="#fff" />
                            </View>
                            <Text style={styles.socialBtnText}>Masuk dengan Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.socialButton, styles.fbBtn]}
                            onPress={() => handleSocialLogin('facebook')}
                            disabled={loading}
                        >
                            <View style={styles.iconWrapper}>
                                <FontAwesome5 name="facebook-f" size={20} color="#fff" />
                            </View>
                            <Text style={styles.socialBtnText}>Masuk dengan Facebook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push('/register')} style={styles.signUpContainer}>
                            <Text style={styles.footerText}>Belum punya akun? <Text style={styles.linkText}>Daftar</Text></Text>
                        </TouchableOpacity>
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
        marginBottom: 40,
    },
    logoImage: {
        width: 150,
        height: 150,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        color: '#757575',
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
        marginBottom: 16,
        fontSize: 16,
        color: '#1C1C1E',
    },
    loginButton: {
        backgroundColor: PRIMARY_GREEN,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#9E9E9E',
        fontSize: 12,
        fontWeight: '600',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    signUpContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#757575',
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
