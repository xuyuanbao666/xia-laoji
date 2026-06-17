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
import { RegisterRequest } from '../types';
import { Card, Button, Input } from '../components/common';

/**
 * 注册页
 */
const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  // 表单验证
  const validateForm = (): boolean => {
    if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim()) {
      Alert.alert('提示', '请填写必要信息');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('提示', '密码长度至少6位');
      return false;
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('提示', '请输入正确的邮箱格式');
      return false;
    }

    return true;
  };

  // 更新表单数据
  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
  };

  // 处理注册
  const handleRegister = async () => {
    if (!validateForm()) return;

    const registerData = {
      email: formData.email.trim(),
      password: formData.password,
      profile: {
        name: formData.name.trim(),
        gender: 'male' as const,
        birthday: '2000-01-01',
        height: 170,
        currentWeight: 65,
        targetWeight: 60,
        activityLevel: 'light' as const,
      },
    };

    try {
      await register(registerData);
    } catch (err) {
      // 错误已在 store 中处理
    }
  };

  // 跳转到登录页
  const goToLogin = () => {
    navigation.goBack();
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
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={goToLogin}>
          <Text style={styles.backText}>← 返回登录</Text>
        </TouchableOpacity>

        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>创建账号</Text>
          <Text style={styles.subtitle}>开始记录你的健康饮食之旅</Text>
        </View>

        {/* 注册表单 */}
        <Card style={styles.formCard}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="姓名 *"
            placeholder="请输入姓名"
            value={formData.name}
            onChangeText={(text) => updateField('name', text)}
            autoCapitalize="none"
          />

          <Input
            label="邮箱 *"
            placeholder="请输入邮箱"
            value={formData.email}
            onChangeText={(text) => updateField('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="密码 *"
            placeholder="请设置密码（至少6位）"
            value={formData.password}
            onChangeText={(text) => updateField('password', text)}
            secureTextEntry
          />

          <Input
            label="确认密码 *"
            placeholder="请再次输入密码"
            value={formData.confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
            secureTextEntry
          />

          <Button
            title="注册"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />
        </Card>

        {/* 登录链接 */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>已有账号？</Text>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={styles.loginLink}>立即登录</Text>
          </TouchableOpacity>
        </View>

        {/* 底部间距 */}
        <View style={styles.bottomSpacing} />
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
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    color: '#666666',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
  registerButton: {
    marginTop: 8,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 4,
  },
  loginLink: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default RegisterScreen;
