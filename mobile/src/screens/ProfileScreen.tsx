import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useRecordStore } from '../store/recordStore';
import { useFoodStore } from '../store/foodStore';

/**
 * 我的页面 - 用户信息和设置
 */
const ProfileScreen: React.FC = () => {
  const { user, logout, updateProfile } = useAuthStore();
  const { records, loadRecords } = useRecordStore();
  const { favorites } = useFoodStore();

  // 编辑模式
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.profile?.name || '',
    dailyCalories: user?.goals?.dailyCalories?.toString() || '2000',
    currentWeight: user?.profile?.currentWeight?.toString() || '',
    height: user?.profile?.height?.toString() || '',
    targetWeight: user?.profile?.targetWeight?.toString() || '',
  });

  // 加载记录数据
  useFocusEffect(
    useCallback(() => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 30);
      loadRecords(weekAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
    }, [])
  );

  // 计算统计数据
  const uniqueDays = new Set(records.map((r) => r.date.split('T')[0])).size;
  const totalCalories = records.reduce((sum, r) => sum + (r.totalNutrition?.calories || 0), 0);
  const avgCalories = uniqueDays > 0 ? Math.round(totalCalories / uniqueDays) : 0;

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
          targetWeight: parseFloat(editData.targetWeight) || 0,
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
      setShowEditModal(false);
      Alert.alert('成功', '个人资料已更新');
    } catch (error) {
      Alert.alert('错误', '更新失败，请重试');
    }
  };

  // 获取 BMI
  const getBMI = () => {
    const height = user?.profile?.height;
    const weight = user?.profile?.currentWeight;
    if (height && weight && height > 0) {
      const heightM = height / 100;
      return (weight / (heightM * heightM)).toFixed(1);
    }
    return null;
  };

  const bmi = getBMI();
  const getBMILevel = (bmi: number) => {
    if (bmi < 18.5) return { text: '偏瘦', color: '#4ECDC4' };
    if (bmi < 24) return { text: '正常', color: '#4CAF50' };
    if (bmi < 28) return { text: '偏胖', color: '#FFB300' };
    return { text: '肥胖', color: '#FF6B6B' };
  };

  // 菜单项
  const menuItems = [
    {
      title: '编辑资料',
      subtitle: '修改个人信息',
      icon: '✏️',
      onPress: () => {
        setEditData({
          name: user?.profile?.name || '',
          dailyCalories: user?.goals?.dailyCalories?.toString() || '2000',
          currentWeight: user?.profile?.currentWeight?.toString() || '',
          height: user?.profile?.height?.toString() || '',
          targetWeight: user?.profile?.targetWeight?.toString() || '',
        });
        setShowEditModal(true);
      },
    },
    {
      title: '饮食目标',
      subtitle: `每日 ${user?.goals?.dailyCalories || 2000} 千卡`,
      icon: '🎯',
      onPress: () => {
        setEditData({
          name: user?.profile?.name || '',
          dailyCalories: user?.goals?.dailyCalories?.toString() || '2000',
          currentWeight: user?.profile?.currentWeight?.toString() || '',
          height: user?.profile?.height?.toString() || '',
          targetWeight: user?.profile?.targetWeight?.toString() || '',
        });
        setShowEditModal(true);
      },
    },
    {
      title: '我的收藏',
      subtitle: `${favorites.length} 个常用食物`,
      icon: '⭐',
      onPress: () => {},
    },
    {
      title: '数据导出',
      subtitle: '导出饮食记录',
      icon: '📤',
      onPress: () => Alert.alert('提示', '功能开发中...'),
    },
    {
      title: '关于虾牢记',
      subtitle: 'v1.0.0',
      icon: '🦐',
      onPress: () => Alert.alert('关于', '虾牢记 - 你的饮食记录小助手\n版本 1.0.0'),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* 用户信息卡片 */}
      <View style={styles.userCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.profile?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{user?.profile?.name || '小伙伴'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditData({
                name: user?.profile?.name || '',
                dailyCalories: user?.goals?.dailyCalories?.toString() || '2000',
                currentWeight: user?.profile?.currentWeight?.toString() || '',
                height: user?.profile?.height?.toString() || '',
                targetWeight: user?.profile?.targetWeight?.toString() || '',
              });
              setShowEditModal(true);
            }}
          >
            <Text style={styles.editBtnText}>编辑</Text>
          </TouchableOpacity>
        </View>

        {/* 身体数据 */}
        <View style={styles.bodyStats}>
          <View style={[styles.bodyStatItem, { backgroundColor: '#FFE4E1' }]}>
            <Text style={[styles.bodyStatValue, { color: '#FF6B6B' }]}>
              {user?.profile?.height || '--'}
            </Text>
            <Text style={styles.bodyStatLabel}>身高 cm</Text>
          </View>
          <View style={[styles.bodyStatItem, { backgroundColor: '#E0F7FA' }]}>
            <Text style={[styles.bodyStatValue, { color: '#4ECDC4' }]}>
              {user?.profile?.currentWeight || '--'}
            </Text>
            <Text style={styles.bodyStatLabel}>体重 kg</Text>
          </View>
          <View style={[styles.bodyStatItem, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.bodyStatValue, { color: '#FFB300' }]}>
              {bmi || '--'}
            </Text>
            <Text style={styles.bodyStatLabel}>BMI {bmi ? getBMILevel(parseFloat(bmi)).text : ''}</Text>
          </View>
        </View>
      </View>

      {/* 使用统计 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 使用统计</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{uniqueDays}</Text>
            <Text style={styles.statLabel}>记录天数</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#FFF0F0' }]}>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{records.length}</Text>
            <Text style={styles.statLabel}>总记录数</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#E3F2FD' }]}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>{avgCalories}</Text>
            <Text style={styles.statLabel}>日均热量</Text>
          </View>
        </View>
      </View>

      {/* 设置菜单 */}
      <Text style={styles.sectionTitle}>⚙️ 设置</Text>
      <View style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[
              styles.menuItem,
              index < menuItems.length - 1 && styles.menuItemBorder,
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFF0F0' }]}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuArrow}>▶</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>

      {/* 底部间距 */}
      <View style={styles.bottomSpacing} />

      {/* 编辑资料模态框 */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑资料</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* 昵称 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>昵称</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="输入昵称"
                />
              </View>

              {/* 每日目标热量 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>每日目标热量 (千卡)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editData.dailyCalories}
                  onChangeText={(text) => setEditData({ ...editData, dailyCalories: text })}
                  keyboardType="numeric"
                  placeholder="2000"
                />
              </View>

              {/* 身高体重 */}
              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>身高 (cm)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editData.height}
                    onChangeText={(text) => setEditData({ ...editData, height: text })}
                    keyboardType="numeric"
                    placeholder="170"
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>体重 (kg)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editData.currentWeight}
                    onChangeText={(text) => setEditData({ ...editData, currentWeight: text })}
                    keyboardType="numeric"
                    placeholder="65"
                  />
                </View>
              </View>

              {/* 目标体重 */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>目标体重 (kg)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editData.targetWeight}
                  onChangeText={(text) => setEditData({ ...editData, targetWeight: text })}
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  contentContainer: {
    padding: 16,
  },

  // 用户卡片
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#999999',
  },
  editBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editBtnText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
  },

  // 身体数据
  bodyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  bodyStatValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  bodyStatLabel: {
    fontSize: 11,
    color: '#666666',
  },

  // 使用统计
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },

  // 菜单
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999999',
  },
  menuArrow: {
    fontSize: 10,
    color: '#CCCCCC',
  },

  // 退出登录
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE4E1',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  bottomSpacing: {
    height: 20,
  },

  // 编辑模态框
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#999999',
  },
  modalContent: {
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginRight: 8,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    marginLeft: 8,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
