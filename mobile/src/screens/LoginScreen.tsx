import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { Card, Button, Input } from '../components/common';

/**
 * 登录页
 */
const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 表单验证
  const isValid = email.trim() && password.trim();

  // 处理登录
  const handleLogin = async () => {
    if (!isValid) return;

    try {
      await login({ email: email.trim(), password });
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  // 跳转到注册页
  const goToRegister = () => {
    navigation.navigate('Register');
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
        {/* Logo 和标题 */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🐯</Text>
          </View>
          <Text style={styles.title}>小老虎饮食记录</Text>
          <Text style={styles.subtitle}>记录每一口，健康每一天</Text>
        </View>

        {/* 登录表单 */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>欢迎回来</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="邮箱"
            placeholder="请输入邮箱"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="密码"
            placeholder="请输入密码"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError();
            }}
            secureTextEntry
          />

          <Button
            title="登录"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!isValid}
            style={styles.loginButton}
          />
        </Card>

        {/* 注册链接 */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>还没有账号？</Text>
          <TouchableOpacity onPress={goToRegister}>
            <Text style={styles.registerLink}>立即注册</Text>
          </TouchableOpacity>
        </View>

        {/* 底部装饰 */}
        <Text style={styles.footer}>用爱记录，健康生活 ❤️</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
  },
  formCard: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
  },
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
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#CCCCCC',
  },
});

export default LoginScreen;
