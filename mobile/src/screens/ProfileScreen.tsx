import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useFoodStore } from '../store/foodStore';
import { Card, Button } from '../components/common';

/**
 * 我的页面 - 用户信息和设置
 */
const ProfileScreen: React.FC = () => {
  const { user, logout, updateProfile } = useAuthStore();
  const { favorites } = useFoodStore();

  // 编辑模式
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.profile?.name || '',
    dailyCalories: user?.goals?.dailyCalories?.toString() || '2000',
    currentWeight: user?.profile?.currentWeight?.toString() || '',
    height: user?.profile?.height?.toString() || '',
  });

  // 退出登录
  const handleLogout = () => {
    Alert.alert('提示', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // 保存个人资料
  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        profile: {
          name: editData.name,
          height: parseFloat(editData.height) || 0,
          currentWeight: parseFloat(editData.currentWeight) || 0,
          targetWeight: user?.profile?.targetWeight || 0,
          gender: user?.profile?.gender || 'other',
          birthday: user?.profile?.birthday || '',
          activityLevel: user?.profile?.activityLevel || 'sedentary',
        },
        goals: {
          dailyCalories: parseInt(editData.dailyCalories) || 2000,
          protein: user?.goals?.protein || 0,
          carbs: user?.goals?.carbs || 0,
          fat: user?.goals?.fat || 0,
        },
      });
      setIsEditing(false);
      Alert.alert('成功', '个人资料已更新');
    } catch (error) {
      Alert.alert('错误', '更新失败，请重试');
    }
  };

  // 菜单项
  const menuItems = [
    {
      title: '常用食物',
      subtitle: `${favorites.length} 个收藏`,
      icon: '⭐',
      onPress: () => {},
    },
    {
      title: '饮食目标',
      subtitle: `${user?.goals?.dailyCalories || 2000} kcal/天`,
      icon: '🎯',
      onPress: () => setIsEditing(true),
    },
    {
      title: '数据导出',
      subtitle: '导出饮食记录',
      icon: '📤',
      onPress: () => Alert.alert('提示', '功能开发中...'),
    },
    {
      title: '关于应用',
      subtitle: '小老虎饮食记录',
      icon: '🐯',
      onPress: () => Alert.alert('关于', '小老虎饮食记录 v1.0.0'),
    },
  ];

  // 活动水平选项
  const activityLevels = [
    { key: 'sedentary', label: '久坐不动', description: '办公室工作' },
    { key: 'light', label: '轻度活动', description: '每周运动1-3次' },
    { key: 'moderate', label: '中度活动', description: '每周运动3-5次' },
    { key: 'active', label: '高度活动', description: '每周运动6-7次' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 用户信息卡片 */}
      <Card style={styles.userCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.profile?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user?.profile?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* 基本信息 */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{user?.profile?.height || '--'}</Text>
            <Text style={styles.infoLabel}>身高 (cm)</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>{user?.profile?.currentWeight || '--'}</Text>
            <Text style={styles.infoLabel}>体重 (kg)</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoValue}>
              {user?.profile?.gender === 'male' ? '男' : user?.profile?.gender === 'female' ? '女' : '--'}
            </Text>
            <Text style={styles.infoLabel}>性别</Text>
          </View>
        </View>
      </Card>

      {/* 快捷操作 */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionItem}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#FFE4E4' }]}>
            <Text style={styles.quickActionEmoji}>📊</Text>
          </View>
          <Text style={styles.quickActionLabel}>周报</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionItem}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#E4F7F5' }]}>
            <Text style={styles.quickActionEmoji}>🏆</Text>
          </View>
          <Text style={styles.quickActionLabel}>成就</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionItem}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#FFF4E4' }]}>
            <Text style={styles.quickActionEmoji}>💡</Text>
          </View>
          <Text style={styles.quickActionLabel}>建议</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionItem}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#F0E4FF' }]}>
            <Text style={styles.quickActionEmoji}>📈</Text>
          </View>
          <Text style={styles.quickActionLabel}>趋势</Text>
        </TouchableOpacity>
      </View>

      {/* 设置菜单 */}
      <Text style={styles.sectionTitle}>设置</Text>
      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </Card>

      {/* 退出登录 */}
      <Button
        title="退出登录"
        variant="outline"
        onPress={handleLogout}
        style={styles.logoutButton}
      />

      {/* 底部间距 */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: 16,
  },
  userCard: {
    marginBottom: 16,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#999999',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#999999',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickActionItem: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  menuCard: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  logoutButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;
