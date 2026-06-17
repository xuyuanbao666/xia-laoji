import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useRecordStore } from '../store/recordStore';
import { useAuthStore } from '../store/authStore';
import { CalorieProgress } from '../components/nutrition';

/**
 * 首页 - 显示今日热量进度和各餐次记录
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { dailySummary, loadDailySummary, selectedDate, isLoading } = useRecordStore();
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  // 今天的日期
  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      loadDailySummary(today);
    }, [today, loadDailySummary])
  );

  const onRefresh = useCallback(() => {
    loadDailySummary(today);
  }, [today, loadDailySummary]);

  // 获取目标热量
  const calorieGoal = user?.goals?.dailyCalories || 2000;

  // 获取各餐次数据
  const mealsData = dailySummary?.meals || {};
  const getMealData = (mealKey: string) => {
    const meal = mealsData[mealKey];
    const round = (n: number) => Math.round(n * 10) / 10;
    return {
      calories: Math.round(meal?.totalCalories || 0),
      recordCount: meal?.foods?.length || 0,
      protein: round(meal?.foods?.reduce((sum: number, f: any) => sum + (f.nutrition?.protein || 0), 0) || 0),
      carbs: round(meal?.foods?.reduce((sum: number, f: any) => sum + (f.nutrition?.carbs || 0), 0) || 0),
      fat: round(meal?.foods?.reduce((sum: number, f: any) => sum + (f.nutrition?.fat || 0), 0) || 0),
    };
  };

  const meals = [
    { key: 'breakfast', label: '早餐', icon: '🌅', color: '#FFE4B5', data: getMealData('breakfast') },
    { key: 'lunch', label: '午餐', icon: '☀️', color: '#FFDAB9', data: getMealData('lunch') },
    { key: 'dinner', label: '晚餐', icon: '🌙', color: '#E6E6FA', data: getMealData('dinner') },
    { key: 'snack', label: '加餐', icon: '🍪', color: '#FFF0F5', data: getMealData('snack') },
  ];

  // 快速添加食物
  const handleQuickAdd = (mealType: string) => {
    // 使用全局状态传递餐次
    (globalThis as any).selectedMealType = mealType;
    navigation.navigate('RecordTab');
  };

  // 切换展开/收起
  const toggleMeal = (mealKey: string) => {
    setExpandedMeal(expandedMeal === mealKey ? null : mealKey);
  };

  // 获取餐次的食物列表（合并同名食物）
  const getMealFoods = (mealKey: string) => {
    const meal = mealsData[mealKey];
    const foods = meal?.foods || [];
    // 按名称合并同名食物
    const merged: Record<string, any> = {};
    foods.forEach((f: any) => {
      const key = f.nameZh || f.name || '';
      if (merged[key]) {
        merged[key].amount += f.amount || 0;
        merged[key].nutrition.calories += f.nutrition?.calories || 0;
        merged[key].nutrition.protein += f.nutrition?.protein || 0;
        merged[key].nutrition.carbs += f.nutrition?.carbs || 0;
        merged[key].nutrition.fat += f.nutrition?.fat || 0;
      } else {
        merged[key] = {
          ...f,
          nameZh: f.nameZh || f.name,
          amount: f.amount || 0,
          nutrition: { ...f.nutrition },
        };
      }
    });
    return Object.values(merged);
  };

  // 获取问候语（使用北京时间）
  const getGreeting = () => {
    const now = new Date();
    // 获取北京时间（UTC+8）
    const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const hour = beijingTime.getHours();
    if (hour < 6) return '夜深了 🌙';
    if (hour < 9) return '早上好 🌅';
    if (hour < 12) return '上午好 ☀️';
    if (hour < 14) return '中午好 🍱';
    if (hour < 18) return '下午好 🍵';
    if (hour < 22) return '晚上好 🌆';
    return '夜深了 🌙';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {/* 顶部问候 */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>
            {getGreeting()}
          </Text>
          <Text style={styles.userName}>
            {user?.profile?.name || '小伙伴'} ✨
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </Text>
      </View>

      {/* 热量进度 */}
      <CalorieProgress
        consumed={dailySummary?.totalCalories || 0}
        target={calorieGoal}
      />

      {/* 营养素概览 */}
      <View style={styles.nutrientCard}>
        <Text style={styles.nutrientTitle}>📊 今日营养素</Text>
        <View style={styles.nutrientRow}>
          <View style={[styles.nutrientItem, { backgroundColor: '#FFE4E1' }]}>
            <Text style={[styles.nutrientValue, { color: '#FF6B6B' }]}>
              {dailySummary?.totalProtein || 0}g
            </Text>
            <Text style={styles.nutrientLabel}>蛋白质</Text>
          </View>
          <View style={[styles.nutrientItem, { backgroundColor: '#E0F7FA' }]}>
            <Text style={[styles.nutrientValue, { color: '#4ECDC4' }]}>
              {dailySummary?.totalCarbs || 0}g
            </Text>
            <Text style={styles.nutrientLabel}>碳水</Text>
          </View>
          <View style={[styles.nutrientItem, { backgroundColor: '#FFF8E1' }]}>
            <Text style={[styles.nutrientValue, { color: '#FFB300' }]}>
              {dailySummary?.totalFat || 0}g
            </Text>
            <Text style={styles.nutrientLabel}>脂肪</Text>
          </View>
        </View>
      </View>

      {/* 各餐次记录 */}
      <Text style={styles.sectionTitle}>🍽️ 饮食记录</Text>
      {meals.map((meal) => {
        const isExpanded = expandedMeal === meal.key;
        const foods = getMealFoods(meal.key);
        const hasFood = meal.data.recordCount > 0;

        return (
          <View key={meal.key} style={styles.mealCard}>
            {/* 餐次头部 */}
            <TouchableOpacity
              onPress={() => hasFood && toggleMeal(meal.key)}
              activeOpacity={hasFood ? 0.7 : 1}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                  <View style={[styles.mealIconContainer, { backgroundColor: meal.color }]}>
                    <Text style={styles.mealIcon}>{meal.icon}</Text>
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealLabel}>{meal.label}</Text>
                    {hasFood && (
                      <Text style={styles.mealCalories}>
                        {meal.data.calories} 千卡
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.mealRight}>
                  {hasFood && (
                    <Text style={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleQuickAdd(meal.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.addButtonText}>+ 添加</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>

            {/* 营养素摘要（有记录时显示） */}
            {hasFood && !isExpanded && (
              <View style={styles.mealNutrients}>
                <View style={styles.nutrientDot}>
                  <View style={[styles.dot, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={styles.nutrientText}>蛋白 {meal.data.protein}g</Text>
                </View>
                <View style={styles.nutrientDot}>
                  <View style={[styles.dot, { backgroundColor: '#4ECDC4' }]} />
                  <Text style={styles.nutrientText}>碳水 {meal.data.carbs}g</Text>
                </View>
                <View style={styles.nutrientDot}>
                  <View style={[styles.dot, { backgroundColor: '#FFB300' }]} />
                  <Text style={styles.nutrientText}>脂肪 {meal.data.fat}g</Text>
                </View>
              </View>
            )}

            {/* 空状态 */}
            {!hasFood && (
              <TouchableOpacity
                style={styles.emptyMealContainer}
                onPress={() => handleQuickAdd(meal.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.emptyMealText}>还没有记录，点击添加~</Text>
                <Text style={styles.emptyMealIcon}>👉</Text>
              </TouchableOpacity>
            )}

            {/* 展开的食物列表 */}
            {isExpanded && foods.length > 0 && (
              <View style={styles.foodList}>
                <View style={styles.foodListHeader}>
                  <Text style={styles.foodListTitle}>📝 记录详情</Text>
                </View>
                {foods.map((food: any, index: number) => (
                  <View key={index} style={styles.foodItem}>
                    <View style={styles.foodItemLeft}>
                      <View style={styles.foodDot} />
                      <Text style={styles.foodName} numberOfLines={1}>
                        {food.nameZh || food.name}
                      </Text>
                    </View>
                    <View style={styles.foodItemRight}>
                      <Text style={styles.foodAmount}>{Math.round(food.amount)}g</Text>
                      <Text style={styles.foodCalories}>
                        {Math.round(food.nutrition?.calories || 0)} 千卡
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* 底部间距 */}
      <View style={styles.bottomSpacing} />
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

  // 顶部问候
  header: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  greetingContainer: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  date: {
    fontSize: 14,
    color: '#999999',
  },

  // 营养素卡片
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  nutrientTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutrientItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666666',
  },

  // 饮食记录标题
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginTop: 24,
    marginBottom: 12,
  },

  // 餐次卡片
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealInfo: {
    flex: 1,
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  mealRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 12,
    color: '#CCCCCC',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '600',
  },

  // 营养素摘要
  mealNutrients: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  nutrientDot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  nutrientText: {
    fontSize: 12,
    color: '#666666',
  },

  // 空状态
  emptyMealContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  emptyMealText: {
    fontSize: 13,
    color: '#CCCCCC',
    marginRight: 8,
  },
  emptyMealIcon: {
    fontSize: 14,
  },

  // 食物列表
  foodList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  foodListHeader: {
    marginBottom: 8,
  },
  foodListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB5B5',
    marginRight: 10,
  },
  foodName: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
  },
  foodItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodAmount: {
    fontSize: 13,
    color: '#999999',
    marginRight: 12,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;
