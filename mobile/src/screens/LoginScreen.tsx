import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

/**
 * 登录页 - 温暖可爱风格
 */
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isValid = email.trim() && password.trim();

  const handleLogin = async () => {
    if (!isValid) return;
    try {
      await login({ email: email.trim(), password });
    } catch (err) {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* 顶部装饰 */}
        <View style={styles.topDecor}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
          <View style={[styles.decorCircle, styles.decorCircle3]} />
        </View>

        {/* Logo 和标题 */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Text style={styles.logoEmoji}>🦐</Text>
              </View>
            </View>
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.title}>虾牢记</Text>
          <Text style={styles.subtitle}>记录每一口，健康每一天</Text>
          <View style={styles.subtitleLine} />
        </View>

        {/* 登录表单 */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>👋 欢迎回来</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 邮箱输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📧 邮箱</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入邮箱"
              placeholderTextColor="#CCCCCC"
              value={email}
              onChangeText={(text) => { setEmail(text); clearError(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* 密码输入 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔒 密码</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="请输入密码"
                placeholderTextColor="#CCCCCC"
                value={password}
                onChangeText={(text) => { setPassword(text); clearError(); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 登录按钮 */}
          <TouchableOpacity
            style={[styles.loginButton, !isValid && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={!isValid || isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? '登录中...' : '🚀 登录'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 注册链接 */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>还没有账号？</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>立即注册 ✨</Text>
          </TouchableOpacity>
        </View>

        {/* 底部装饰 */}
        <View style={styles.footerSection}>
          <Text style={styles.footer}>🦐 虾牢记 v1.0.0</Text>
          <Text style={styles.footerSlogan}>用爱记录，健康生活 ❤️</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  // 顶部装饰
  topDecor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.15,
  },
  decorCircle1: {
    width: 200,
    height: 200,
    backgroundColor: '#FF6B6B',
    top: -60,
    right: -40,
  },
  decorCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#FFB5B5',
    top: 80,
    left: -50,
  },
  decorCircle3: {
    width: 100,
    height: 100,
    backgroundColor: '#FFDAB9',
    top: 40,
    right: 60,
  },

  // Logo
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logoOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoInner: {
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 48,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B6B',
    opacity: 0.1,
    top: -10,
    left: -10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 8,
  },
  subtitleLine: {
    width: 40,
    height: 3,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },

  // 表单
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF6B6B',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#333333',
  },
  eyeButton: {
    padding: 14,
  },
  eyeIcon: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#FFB5B5',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 注册
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  registerText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 4,
  },
  registerLink: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '700',
  },

  // 底部
  footerSection: {
    alignItems: 'center',
  },
  footer: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  footerSlogan: {
    fontSize: 11,
    color: '#DDDDDD',
  },
});

export default LoginScreen;
