import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecordStore } from '../store/recordStore';
import { useAuthStore } from '../store/authStore';
import { CalorieProgress } from '../components/nutrition';
import { Card, Button } from '../components/common';

/**
 * 首页 - 显示今日热量进度和各餐次记录
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { dailySummary, loadDailySummary, selectedDate, isLoading } = useRecordStore();

  // 今天的日期
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadDailySummary(today);
  }, [today, loadDailySummary]);

  const onRefresh = useCallback(() => {
    loadDailySummary(today);
  }, [today, loadDailySummary]);

  // 获取目标热量
  const calorieGoal = user?.goals?.dailyCalories || 2000;

  // 获取各餐次数据
  const mealsData = dailySummary?.meals || {};
  const getMealData = (mealKey: string) => {
    const meal = mealsData[mealKey];
    return {
      calories: meal?.totalCalories || 0,
      recordCount: meal?.foods?.length || 0,
      protein: meal?.foods?.reduce((sum: number, f: any) => sum + (f.nutrition?.protein || 0), 0) || 0,
      carbs: meal?.foods?.reduce((sum: number, f: any) => sum + (f.nutrition?.carbs || 0), 0) || 0,
      fat: meal?.foods?.reduce((sum: number, f: any) => sum + (f.nutrition?.fat || 0), 0) || 0,
    };
  };

  const meals = [
    { key: 'breakfast', label: '早餐', icon: '🌅', data: getMealData('breakfast') },
    { key: 'lunch', label: '午餐', icon: '☀️', data: getMealData('lunch') },
    { key: 'dinner', label: '晚餐', icon: '🌙', data: getMealData('dinner') },
    { key: 'snack', label: '加餐', icon: '🍪', data: getMealData('snack') },
  ];

  // 快速添加食物
  const handleQuickAdd = (mealType: string) => {
    navigation.navigate('RecordTab', {
      screen: 'Record',
      params: { mealType },
    });
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
        <Text style={styles.greeting}>
          你好啊，{user?.profile?.name || '小伙伴'} 👋
        </Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
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
      <Card style={styles.nutrientCard}>
        <Text style={styles.sectionTitle}>今日营养素</Text>
        <View style={styles.nutrientRow}>
          <View style={styles.nutrientItem}>
            <Text style={[styles.nutrientValue, { color: '#FF6B6B' }]}>
              {dailySummary?.totalProtein || 0}g
            </Text>
            <Text style={styles.nutrientLabel}>蛋白质</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={[styles.nutrientValue, { color: '#4ECDC4' }]}>
              {dailySummary?.totalCarbs || 0}g
            </Text>
            <Text style={styles.nutrientLabel}>碳水</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={[styles.nutrientValue, { color: '#FFD93D' }]}>
              {dailySummary?.totalFat || 0}g
            </Text>
            <Text style={styles.nutrientLabel}>脂肪</Text>
          </View>
        </View>
      </Card>

      {/* 各餐次记录 */}
      <Text style={styles.sectionTitle}>饮食记录</Text>
      {meals.map((meal) => (
        <Card key={meal.key} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleRow}>
              <Text style={styles.mealIcon}>{meal.icon}</Text>
              <Text style={styles.mealLabel}>{meal.label}</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleQuickAdd(meal.key)}
            >
              <Text style={styles.addButtonText}>+ 添加</Text>
            </TouchableOpacity>
          </View>
          {meal.data.recordCount > 0 ? (
            <View style={styles.mealStats}>
              <Text style={styles.mealCalories}>{meal.data.calories} kcal</Text>
              <Text style={styles.mealNutrients}>
                蛋白质 {meal.data.protein}g · 碳水 {meal.data.carbs}g · 脂肪 {meal.data.fat}g
              </Text>
            </View>
          ) : (
            <Text style={styles.emptyMeal}>还没有记录，快去添加吧~</Text>
          )}
        </Card>
      ))}

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
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#999999',
  },
  nutrientCard: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
    marginBottom: 12,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#999999',
  },
  mealCard: {
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  mealStats: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  mealNutrients: {
    fontSize: 12,
    color: '#999999',
  },
  emptyMeal: {
    fontSize: 13,
    color: '#CCCCCC',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default HomeScreen;
