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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useRecordStore } from '../store/recordStore';
import { useFoodStore } from '../store/foodStore';
import { DietRecord, Food } from '../types';

/**
 * 我的页面 - 用户信息和设置
 */
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout, updateProfile } = useAuthStore();
  const { records, loadRecords } = useRecordStore();
  const { favorites, loadFavorites, removeFavorite } = useFoodStore();

  // 模态框状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // 编辑数据
  const [editData, setEditData] = useState({
    name: '',
    dailyCalories: '',
    protein: '',
    carbs: '',
    fat: '',
    currentWeight: '',
    height: '',
    targetWeight: '',
  });

  // 加载数据
  useFocusEffect(
    useCallback(() => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 30);
      loadRecords(weekAgo.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);
      loadFavorites();
    }, [])
  );

  // 计算统计数据
  const uniqueDays = new Set(records.map((r) => r.date.split('T')[0])).size;
  const totalCalories = records.reduce((sum, r) => sum + (r.totalNutrition?.calories || 0), 0);
  const avgCalories = uniqueDays > 0 ? Math.round(totalCalories / uniqueDays) : 0;

  // 打开编辑资料
  const openEditModal = () => {
    setEditData({
      name: user?.profile?.name || '',
      dailyCalories: user?.goals?.dailyCalories?.toString() || '2000',
      protein: user?.goals?.protein?.toString() || '',
      carbs: user?.goals?.carbs?.toString() || '',
      fat: user?.goals?.fat?.toString() || '',
      currentWeight: user?.profile?.currentWeight?.toString() || '',
      height: user?.profile?.height?.toString() || '',
      targetWeight: user?.profile?.targetWeight?.toString() || '',
    });
    setShowEditModal(true);
  };

  // 打开饮食目标
  const openGoalsModal = () => {
    setEditData({
      ...editData,
      dailyCalories: user?.goals?.dailyCalories?.toString() || '2000',
      protein: user?.goals?.protein?.toString() || '',
      carbs: user?.goals?.carbs?.toString() || '',
      fat: user?.goals?.fat?.toString() || '',
    });
    setShowGoalsModal(true);
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
          protein: parseInt(editData.protein) || 0,
          carbs: parseInt(editData.carbs) || 0,
          fat: parseInt(editData.fat) || 0,
        },
      });
      setShowEditModal(false);
      Alert.alert('成功', '个人资料已更新');
    } catch (error) {
      Alert.alert('错误', '更新失败，请重试');
    }
  };

  // 保存饮食目标
  const handleSaveGoals = async () => {
    try {
      await updateProfile({
        profile: user?.profile || { name: '', gender: 'other', birthday: '', height: 0, currentWeight: 0, targetWeight: 0, activityLevel: 'sedentary' },
        goals: {
          dailyCalories: parseInt(editData.dailyCalories) || 2000,
          protein: parseInt(editData.protein) || 0,
          carbs: parseInt(editData.carbs) || 0,
          fat: parseInt(editData.fat) || 0,
        },
      });
      setShowGoalsModal(false);
      Alert.alert('成功', '饮食目标已更新');
    } catch (error) {
      Alert.alert('错误', '更新失败，请重试');
    }
  };

  // 导出数据
  const handleExport = () => {
    const exportData = records.map((r) => ({
      date: r.date,
      meal: r.meal,
      foods: r.foods.map((f) => `${f.name} ${f.amount}g`).join(', '),
      calories: r.totalNutrition?.calories || 0,
      protein: r.totalNutrition?.protein || 0,
      carbs: r.totalNutrition?.carbs || 0,
      fat: r.totalNutrition?.fat || 0,
    }));

    const text = exportData.map((r) =>
      `${r.date} | ${r.meal} | ${r.foods} | ${r.calories}千卡 | 蛋白${r.protein}g 碳水${r.carbs}g 脂肪${r.fat}g`
    ).join('\n');

    Alert.alert(
      '导出数据',
      `共 ${exportData.length} 条记录\n\n${text.substring(0, 500)}${text.length > 500 ? '\n...' : ''}`,
      [{ text: '确定' }]
    );
  };

  // 删除收藏
  const handleRemoveFavorite = (foodId: string, foodName: string) => {
    Alert.alert('取消收藏', `确定要取消收藏"${foodName}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFavorite(foodId);
          } catch (error) {
            Alert.alert('错误', '取消收藏失败');
          }
        },
      },
    ]);
  };

  // 快速添加到餐次
  const handleQuickAdd = (food: Food) => {
    const mealTypes = [
      { key: 'breakfast', label: '早餐', icon: '🌅' },
      { key: 'lunch', label: '午餐', icon: '☀️' },
      { key: 'dinner', label: '晚餐', icon: '🌙' },
      { key: 'snack', label: '加餐', icon: '🍪' },
    ];

    Alert.alert(
      `添加 ${food.nameZh || food.name}`,
      '选择要添加到哪一餐',
      mealTypes.map((meal) => ({
        text: `${meal.icon} ${meal.label}`,
        onPress: () => {
          // 传递食物数据到记录页
          (globalThis as any).selectedMealType = meal.key;
          (globalThis as any).selectedFoodForQuickAdd = food;
          setShowFavoritesModal(false);
          navigation.navigate('RecordTab');
        },
      })),
      { cancelable: true }
    );
  };

  // BMI
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

  // 退出登录
  const handleLogout = () => {
    Alert.alert('提示', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => { await logout(); },
      },
    ]);
  };

  // 菜单项
  const menuItems = [
    {
      title: '编辑资料',
      subtitle: '修改个人信息',
      icon: '✏️',
      onPress: openEditModal,
    },
    {
      title: '饮食目标',
      subtitle: `每日 ${user?.goals?.dailyCalories || 2000} 千卡`,
      icon: '🎯',
      onPress: openGoalsModal,
    },
    {
      title: '我的收藏',
      subtitle: `${favorites.length} 个常用食物`,
      icon: '⭐',
      onPress: () => {
        loadFavorites();
        setShowFavoritesModal(true);
      },
    },
    {
      title: '数据导出',
      subtitle: `已记录 ${records.length} 条`,
      icon: '📤',
      onPress: handleExport,
    },
    {
      title: '关于虾牢记',
      subtitle: 'v1.0.0',
      icon: '🦐',
      onPress: () => Alert.alert('关于', '🦐 虾牢记\n你的饮食记录小助手\n\n版本 1.0.0'),
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
          <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
            <Text style={styles.editBtnText}>编辑</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bodyStats}>
          <View style={[styles.bodyStatItem, { backgroundColor: '#FFE4E1' }]}>
            <Text style={[styles.bodyStatValue, { color: '#FF6B6B' }]}>{user?.profile?.height || '--'}</Text>
            <Text style={styles.bodyStatLabel}>身高 cm</Text>
          </View>
          <View style={[styles.bodyStatItem, { backgroundColor: '#E0F7FA' }]}>
            <Text style={[styles.bodyStatValue, { color: '#4ECDC4' }]}>{user?.profile?.currentWeight || '--'}</Text>
            <Text style={styles.bodyStatLabel}>体重 kg</Text>
          </View>
          <View style={[styles.bodyStatItem, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.bodyStatValue, { color: '#FFB300' }]}>{bmi || '--'}</Text>
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
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
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

      <View style={styles.bottomSpacing} />

      {/* ========== 编辑资料模态框 ========== */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>编辑资料</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>昵称</Text>
                <TextInput style={styles.fieldInput} value={editData.name} onChangeText={(t) => setEditData({ ...editData, name: t })} placeholder="输入昵称" />
              </View>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>身高 (cm)</Text>
                  <TextInput style={styles.fieldInput} value={editData.height} onChangeText={(t) => setEditData({ ...editData, height: t })} keyboardType="numeric" placeholder="170" />
                </View>
                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.fieldLabel}>体重 (kg)</Text>
                  <TextInput style={styles.fieldInput} value={editData.currentWeight} onChangeText={(t) => setEditData({ ...editData, currentWeight: t })} keyboardType="numeric" placeholder="65" />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>目标体重 (kg)</Text>
                <TextInput style={styles.fieldInput} value={editData.targetWeight} onChangeText={(t) => setEditData({ ...editData, targetWeight: t })} keyboardType="numeric" placeholder="60" />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile}>
                <Text style={styles.modalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== 饮食目标模态框 ========== */}
      <Modal visible={showGoalsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎯 饮食目标</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowGoalsModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>每日目标热量 (千卡)</Text>
                <TextInput style={styles.fieldInput} value={editData.dailyCalories} onChangeText={(t) => setEditData({ ...editData, dailyCalories: t })} keyboardType="numeric" placeholder="2000" />
              </View>
              <Text style={styles.fieldHint}>以下为建议值，可根据自身情况调整</Text>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 4 }]}>
                  <Text style={styles.fieldLabel}>蛋白质 (g)</Text>
                  <TextInput style={styles.fieldInput} value={editData.protein} onChangeText={(t) => setEditData({ ...editData, protein: t })} keyboardType="numeric" placeholder="60" />
                </View>
                <View style={[styles.fieldGroup, { flex: 1, marginHorizontal: 4 }]}>
                  <Text style={styles.fieldLabel}>碳水 (g)</Text>
                  <TextInput style={styles.fieldInput} value={editData.carbs} onChangeText={(t) => setEditData({ ...editData, carbs: t })} keyboardType="numeric" placeholder="250" />
                </View>
                <View style={[styles.fieldGroup, { flex: 1, marginLeft: 4 }]}>
                  <Text style={styles.fieldLabel}>脂肪 (g)</Text>
                  <TextInput style={styles.fieldInput} value={editData.fat} onChangeText={(t) => setEditData({ ...editData, fat: t })} keyboardType="numeric" placeholder="65" />
                </View>
              </View>
              {/* 快捷预设 */}
              <Text style={styles.presetTitle}>快捷预设</Text>
              <View style={styles.presetRow}>
                {[
                  { label: '减脂', cal: 1500, p: 80, c: 150, f: 50 },
                  { label: '维持', cal: 2000, p: 60, c: 250, f: 65 },
                  { label: '增肌', cal: 2500, p: 100, c: 300, f: 80 },
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={styles.presetBtn}
                    onPress={() => setEditData({
                      ...editData,
                      dailyCalories: preset.cal.toString(),
                      protein: preset.p.toString(),
                      carbs: preset.c.toString(),
                      fat: preset.f.toString(),
                    })}
                  >
                    <Text style={styles.presetBtnText}>{preset.label}</Text>
                    <Text style={styles.presetBtnCal}>{preset.cal}千卡</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowGoalsModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveGoals}>
                <Text style={styles.modalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== 我的收藏模态框 ========== */}
      <Modal visible={showFavoritesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ 我的收藏 ({favorites.length})</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowFavoritesModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {favorites.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>⭐</Text>
                  <Text style={styles.emptyText}>还没有收藏的食物</Text>
                  <Text style={styles.emptyHint}>在记录页搜索食物时可以收藏哦~</Text>
                  <TouchableOpacity
                    style={styles.emptyGoBtn}
                    onPress={() => {
                      setShowFavoritesModal(false);
                      navigation.navigate('RecordTab');
                    }}
                  >
                    <Text style={styles.emptyGoBtnText}>去记录页 →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                favorites.map((food) => (
                  <View key={food._id} style={styles.favCard}>
                    <View style={styles.favCardHeader}>
                      <View style={styles.favCardLeft}>
                        <View style={styles.favIcon}>
                          <Text style={styles.favIconText}>🍽️</Text>
                        </View>
                        <View style={styles.favInfo}>
                          <Text style={styles.favName}>{food.nameZh || food.name}</Text>
                          <Text style={styles.favCategory}>{food.category}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.favRemoveBtn}
                        onPress={() => handleRemoveFavorite(food._id, food.nameZh || food.name)}
                      >
                        <Text style={styles.favRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    {/* 营养素标签 */}
                    <View style={styles.favNutrients}>
                      <View style={[styles.favNutrientTag, { backgroundColor: '#FFE4E1' }]}>
                        <Text style={[styles.favNutrientValue, { color: '#FF6B6B' }]}>
                          {Math.round(food.nutrition.calories)}
                        </Text>
                        <Text style={styles.favNutrientLabel}>千卡</Text>
                      </View>
                      <View style={[styles.favNutrientTag, { backgroundColor: '#E0F7FA' }]}>
                        <Text style={[styles.favNutrientValue, { color: '#4ECDC4' }]}>
                          {Math.round(food.nutrition.protein)}g
                        </Text>
                        <Text style={styles.favNutrientLabel}>蛋白</Text>
                      </View>
                      <View style={[styles.favNutrientTag, { backgroundColor: '#FFF8E1' }]}>
                        <Text style={[styles.favNutrientValue, { color: '#FFB300' }]}>
                          {Math.round(food.nutrition.carbs)}g
                        </Text>
                        <Text style={styles.favNutrientLabel}>碳水</Text>
                      </View>
                      <View style={[styles.favNutrientTag, { backgroundColor: '#F3E5F5' }]}>
                        <Text style={[styles.favNutrientValue, { color: '#9C27B0' }]}>
                          {Math.round(food.nutrition.fat)}g
                        </Text>
                        <Text style={styles.favNutrientLabel}>脂肪</Text>
                      </View>
                    </View>
                    {/* 快速添加按钮 */}
                    <TouchableOpacity
                      style={styles.favAddBtn}
                      onPress={() => handleQuickAdd(food)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.favAddBtnText}>+ 快速添加</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========== 数据导出模态框 ========== */}
      <Modal visible={showExportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📤 数据导出</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowExportModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <View style={styles.exportInfo}>
                <Text style={styles.exportStats}>共 {records.length} 条饮食记录</Text>
                <Text style={styles.exportStats}>涵盖 {uniqueDays} 天</Text>
              </View>
              <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
                <Text style={styles.exportBtnIcon}>📋</Text>
                <Text style={styles.exportBtnText}>复制数据到剪贴板</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  contentContainer: { padding: 16 },

  // 用户卡片
  userCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center', marginRight: 16, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  username: { fontSize: 20, fontWeight: '700', color: '#333333', marginBottom: 4 },
  email: { fontSize: 13, color: '#999999' },
  editBtn: { backgroundColor: '#FFF0F0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  editBtnText: { fontSize: 13, color: '#FF6B6B', fontWeight: '600' },
  bodyStats: { flexDirection: 'row', justifyContent: 'space-between' },
  bodyStatItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginHorizontal: 4 },
  bodyStatValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  bodyStatLabel: { fontSize: 11, color: '#666666' },

  // 统计
  statsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: '700', color: '#333333', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginHorizontal: 4 },
  statValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666666' },

  // 菜单
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333333', marginBottom: 12 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuIconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuIcon: { fontSize: 20 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#333333', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#999999' },
  menuArrow: { fontSize: 10, color: '#CCCCCC' },

  // 退出
  logoutButton: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFE4E1' },
  logoutButtonText: { fontSize: 15, fontWeight: '600', color: '#FF6B6B' },
  bottomSpacing: { height: 20 },

  // 通用模态框
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333333' },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { fontSize: 14, color: '#999999' },
  modalContent: { padding: 16 },
  modalFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, marginRight: 8 },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#666666' },
  modalSaveBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#FF6B6B', borderRadius: 12, marginLeft: 8 },
  modalSaveText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },

  // 表单
  fieldGroup: { marginBottom: 16 },
  fieldRow: { flexDirection: 'row' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 8 },
  fieldInput: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 14, fontSize: 15, color: '#333333', borderWidth: 1, borderColor: '#F0F0F0' },
  fieldHint: { fontSize: 12, color: '#999999', marginBottom: 16, fontStyle: 'italic' },

  // 预设
  presetTitle: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 10 },
  presetRow: { flexDirection: 'row', justifyContent: 'space-between' },
  presetBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: '#FFF0F0', borderRadius: 12, marginHorizontal: 4 },
  presetBtnText: { fontSize: 14, fontWeight: '700', color: '#FF6B6B', marginBottom: 2 },
  presetBtnCal: { fontSize: 11, color: '#999999' },

  // 收藏
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#999999', marginBottom: 4 },
  emptyHint: { fontSize: 12, color: '#CCCCCC', marginBottom: 16 },
  emptyGoBtn: { backgroundColor: '#FF6B6B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyGoBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  favCard: { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12, marginBottom: 10 },
  favCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  favCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  favIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  favIconText: { fontSize: 18 },
  favInfo: { flex: 1 },
  favName: { fontSize: 15, fontWeight: '700', color: '#333333', marginBottom: 2 },
  favCategory: { fontSize: 12, color: '#999999' },
  favRemoveBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFE4E1', justifyContent: 'center', alignItems: 'center' },
  favRemoveText: { fontSize: 12, color: '#FF6B6B', fontWeight: '600' },
  favNutrients: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  favNutrientTag: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, marginHorizontal: 2 },
  favNutrientValue: { fontSize: 13, fontWeight: '700' },
  favNutrientLabel: { fontSize: 10, color: '#666666', marginTop: 2 },
  favAddBtn: { backgroundColor: '#FF6B6B', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  favAddBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // 导出
  exportInfo: { alignItems: 'center', marginBottom: 20, paddingVertical: 16, backgroundColor: '#F8F8F8', borderRadius: 12 },
  exportStats: { fontSize: 15, color: '#333333', marginBottom: 4 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#FF6B6B', borderRadius: 12 },
  exportBtnIcon: { fontSize: 18, marginRight: 8 },
  exportBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});

export default ProfileScreen;
