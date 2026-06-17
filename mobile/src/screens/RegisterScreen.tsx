import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

/**
 * 注册页 - 带邮箱验证码
 */
const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    verifyCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
    if (field === 'verifyCode') {
      setCodeVerified(false); // 重新输入验证码时重置验证状态
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!formData.email.trim()) {
      Alert.alert('提示', '请先输入邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('提示', '请输入正确的邮箱格式');
      return;
    }

    setSendingCode(true);
    try {
      const response = await api.post('/auth/send-code', { email: formData.email.trim() });
      if (response.data?.success) {
        setCodeSent(true);
        setCountdown(60);
        Alert.alert('已发送', '验证码已发送到您的邮箱，请查收');
      } else {
        Alert.alert('错误', response.data?.message || '发送失败');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '发送失败，请重试';
      Alert.alert('错误', msg);
    } finally {
      setSendingCode(false);
    }
  };

  // 验证验证码
  const handleVerifyCode = async () => {
    if (!formData.verifyCode.trim()) {
      Alert.alert('提示', '请输入验证码');
      return;
    }

    try {
      const response = await api.post('/auth/verify-code', {
        email: formData.email.trim(),
        code: formData.verifyCode.trim(),
      });
      if (response.data?.success) {
        setCodeVerified(true);
        Alert.alert('验证成功', '邮箱已验证，可以继续注册');
      } else {
        Alert.alert('错误', response.data?.message || '验证失败');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || '验证失败';
      Alert.alert('错误', msg);
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      Alert.alert('提示', '请输入邮箱');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return false;
    }
    return true;
  };

  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) return;
    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        profile: formData.name.trim() ? { name: formData.name.trim() } : undefined,
      });
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
        </View>

        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← 返回登录</Text>
        </TouchableOpacity>

        {/* 标题 */}
        <View style={styles.header}>
          <View style={styles.logoMini}>
            <Text style={styles.logoEmoji}>🦐</Text>
          </View>
          <Text style={styles.title}>创建账号</Text>
          <Text style={styles.subtitle}>开始记录你的健康饮食之旅</Text>
          <View style={styles.subtitleLine} />
        </View>

        {/* 注册表单 */}
        <View style={styles.formCard}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 昵称 (可选) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>😊 昵称 <Text style={{fontSize: 12, color: '#999'}}>(可选)</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="请输入昵称"
              placeholderTextColor="#CCCCCC"
              value={formData.name}
              onChangeText={(t) => updateField('name', t)}
            />
          </View>

          {/* 邮箱 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📧 邮箱</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入邮箱"
              placeholderTextColor="#CCCCCC"
              value={formData.email}
              onChangeText={(t) => updateField('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* 验证码 (可选) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔢 验证码 <Text style={{fontSize: 12, color: '#999'}}>(可选)</Text></Text>
            <View style={styles.codeRow}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="请输入6位验证码"
                placeholderTextColor="#CCCCCC"
                value={formData.verifyCode}
                onChangeText={(t) => updateField('verifyCode', t)}
                keyboardType="numeric"
                maxLength={6}
                editable={!codeVerified}
              />
              <TouchableOpacity
                style={[
                  styles.sendCodeBtn,
                  codeVerified && styles.sendCodeBtnVerified,
                  countdown > 0 && styles.sendCodeBtnDisabled,
                ]}
                onPress={codeVerified ? undefined : (codeSent && countdown > 0 ? undefined : handleSendCode)}
                disabled={codeVerified || sendingCode || (countdown > 0)}
              >
                <Text style={styles.sendCodeBtnText}>
                  {codeVerified ? '✓ 已验证' : sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '发送验证码'}
                </Text>
              </TouchableOpacity>
            </View>
            {!codeVerified && codeSent && (
              <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCode}>
                <Text style={styles.verifyBtnText}>验证</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔒 密码</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="请设置密码（至少6位）"
                placeholderTextColor="#CCCCCC"
                value={formData.password}
                onChangeText={(t) => updateField('password', t)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 确认密码 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔒 确认密码</Text>
            <TextInput
              style={styles.input}
              placeholder="请再次输入密码"
              placeholderTextColor="#CCCCCC"
              value={formData.confirmPassword}
              onChangeText={(t) => updateField('confirmPassword', t)}
              secureTextEntry
            />
          </View>

          {/* 注册按钮 */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? '注册中...' : '🎉 注册'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 登录链接 */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>已有账号？</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>立即登录 ✨</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  contentContainer: { flexGrow: 1, padding: 24 },

  // 装饰
  topDecor: { position: 'absolute', top: 0, left: 0, right: 0, height: 250, overflow: 'hidden' },
  decorCircle: { position: 'absolute', borderRadius: 100, opacity: 0.12 },
  decorCircle1: { width: 180, height: 180, backgroundColor: '#FF6B6B', top: -50, left: -40 },
  decorCircle2: { width: 120, height: 120, backgroundColor: '#FFB5B5', top: 60, right: -30 },

  // 返回
  backButton: { marginTop: 40, marginBottom: 20 },
  backText: { fontSize: 14, color: '#666666', fontWeight: '500' },

  // 标题
  header: { alignItems: 'center', marginBottom: 30 },
  logoMini: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF6B6B', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoEmoji: { fontSize: 30 },
  title: { fontSize: 26, fontWeight: '800', color: '#333333', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#999999', marginBottom: 8 },
  subtitleLine: { width: 40, height: 3, backgroundColor: '#FF6B6B', borderRadius: 2 },

  // 表单
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorIcon: { fontSize: 16, marginRight: 8 },
  errorText: { flex: 1, fontSize: 13, color: '#FF6B6B' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 8 },
  input: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 14, fontSize: 15, color: '#333333', borderWidth: 1.5, borderColor: '#F0F0F0' },

  // 验证码
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  codeInput: { flex: 1, marginRight: 10 },
  sendCodeBtn: { backgroundColor: '#FF6B6B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  sendCodeBtnVerified: { backgroundColor: '#4CAF50' },
  sendCodeBtnDisabled: { backgroundColor: '#CCCCCC' },
  sendCodeBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  verifyBtn: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  verifyBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // 密码
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 12, borderWidth: 1.5, borderColor: '#F0F0F0' },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: '#333333' },
  eyeIcon: { fontSize: 18, padding: 14 },

  // 注册按钮
  registerButton: { backgroundColor: '#FF6B6B', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  registerButtonDisabled: { backgroundColor: '#CCCCCC', shadowOpacity: 0.1 },
  registerButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  // 登录链接
  loginSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 14, color: '#666666', marginRight: 4 },
  loginLink: { fontSize: 14, color: '#FF6B6B', fontWeight: '700' },
  bottomSpacing: { height: 40 },
});

export default RegisterScreen;
