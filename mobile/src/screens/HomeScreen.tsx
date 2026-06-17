import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
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
  const { dailySummary, loadDailySummary, selectedDate, setSelectedDate, isLoading } = useRecordStore();
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 每分钟更新一次时间，自动切换问候语
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60秒更新一次
    return () => clearInterval(timer);
  }, []);

  // 日期选择器
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  const today = currentTime.toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      loadDailySummary(selectedDate);
    }, [selectedDate, loadDailySummary])
  );

  const onRefresh = useCallback(() => {
    loadDailySummary(selectedDate);
  }, [selectedDate, loadDailySummary]);

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

  // 日历辅助函数
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowDatePicker(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((date.getTime() - new Date(today + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24));
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;
    if (diffDays === 0) return `今天 · ${monthDay} ${weekday}`;
    if (diffDays === -1) return `昨天 · ${monthDay} ${weekday}`;
    if (diffDays === 1) return `明天 · ${monthDay} ${weekday}`;
    return `${monthDay} ${weekday}`;
  };

  const isToday = selectedDate === today;
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

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

  // 获取问候语（手动计算北京时间 UTC+8）
  const getGreeting = () => {
    // 手动计算北京时间：UTC小时 + 8
    const utcHour = currentTime.getUTCHours();
    const beijingHour = (utcHour + 8) % 24;
    if (beijingHour < 6) return '夜深了 🌙';
    if (beijingHour < 9) return '早上好 🌅';
    if (beijingHour < 12) return '上午好 ☀️';
    if (beijingHour < 14) return '中午好 🍱';
    if (beijingHour < 18) return '下午好 🍵';
    if (beijingHour < 22) return '晚上好 🌆';
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
      {/* 日期选择器 */}
      <TouchableOpacity
        style={styles.datePickerContainer}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.datePickerIcon}>📅</Text>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>
        <View style={styles.datePickerRight}>
          {!isToday && (
            <TouchableOpacity
              onPress={() => setSelectedDate(today)}
              style={styles.dateBackBtn}
            >
              <Text style={styles.dateBackToToday}>回到今天</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.datePickerArrow}>▶</Text>
        </View>
      </TouchableOpacity>

      {/* 自定义日历模态 */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.calendarModal}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity
                  style={styles.calendarNavBtn}
                  onPress={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear(calendarYear - 1);
                    } else {
                      setCalendarMonth(calendarMonth - 1);
                    }
                  }}
                >
                  <Text style={styles.calendarNavText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>
                  {calendarYear}年 {monthNames[calendarMonth]}
                </Text>
                <TouchableOpacity
                  style={styles.calendarNavBtn}
                  onPress={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear(calendarYear + 1);
                    } else {
                      setCalendarMonth(calendarMonth + 1);
                    }
                  }}
                >
                  <Text style={styles.calendarNavText}>▶</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calendarWeekRow}>
                {weekDays.map((day) => (
                  <Text key={day} style={styles.calendarWeekText}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {generateCalendarDays().map((day, index) => {
                  if (day === null) return <View key={`empty-${index}`} style={styles.calendarDay} />;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateStr === selectedDate;
                  const isTodayDate = dateStr === today;
                  const isFuture = new Date(dateStr + 'T00:00:00') > new Date();
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isTodayDate && !isSelected && styles.calendarDayToday,
                      ]}
                      onPress={() => !isFuture && handleDateSelect(day)}
                      disabled={isFuture}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isSelected && styles.calendarDayTextSelected,
                          isTodayDate && !isSelected && styles.calendarDayTextToday,
                          isFuture && styles.calendarDayTextDisabled,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.calendarCloseBtn}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.calendarCloseBtnText}>关闭</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
          {currentTime.toLocaleDateString('zh-CN', {
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

  // 日期选择器
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  datePickerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dateDisplay: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  datePickerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBackBtn: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  dateBackToToday: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  datePickerArrow: {
    fontSize: 12,
    color: '#CCCCCC',
  },

  // 日历模态
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 320,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarNavText: {
    fontSize: 14,
    color: '#FF6B6B',
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
  calendarDayToday: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 15,
    color: '#333333',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: '#DDDDDD',
  },
  calendarCloseBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  calendarCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
});

export default HomeScreen;
