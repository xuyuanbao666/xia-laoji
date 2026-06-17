import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFoodStore } from '../store/foodStore';
import { useRecordStore } from '../store/recordStore';
import { Food, CreateRecordRequest } from '../types';
import CollapsibleSection from '../components/CollapsibleSection';

/**
 * 记录页 - 搜索食物并添加到饮食记录
 */
const RecordScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { searchResults, isLoading, searchFoods, favorites, addFavorite, removeFavorite } = useFoodStore();
  const { createRecord, selectedDate, setSelectedDate, dailySummary, loadDailySummary } = useRecordStore();

  // 搜索关键词
  const [keyword, setKeyword] = useState('');
  // 选择的餐次
  const [mealType, setMealType] = useState<CreateRecordRequest['meal']>(
    (globalThis as any).selectedMealType || route.params?.mealType || 'breakfast'
  );
  // 搜索结果是否展开
  const [isResultsExpanded, setIsResultsExpanded] = useState(false);
  // 历史记录是否展开
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  // 历史记录
  const [history, setHistory] = useState<Food[]>([]);
  // 选中的食物
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  // 份数
  const [servings, setServings] = useState('1');

  // 日期导航
  const changeDate = (offset: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + offset);
    const newDate = current.toISOString().split('T')[0];
    setSelectedDate(newDate);
  };

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`;

    if (diffDays === 0) return `今天 · ${monthDay} ${weekday}`;
    if (diffDays === -1) return `昨天 · ${monthDay} ${weekday}`;
    if (diffDays === 1) return `明天 · ${monthDay} ${weekday}`;
    return `${monthDay} ${weekday}`;
  };

  // 判断是否是今天
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // 日期选择器
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

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

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 当页面获得焦点时，检查是否有新的餐次参数
  useFocusEffect(
    useCallback(() => {
      const globalMeal = (globalThis as any).selectedMealType;
      if (globalMeal) {
        setMealType(globalMeal);
        (globalThis as any).selectedMealType = null;
      }
      // 从收藏快速添加
      const quickAddFood = (globalThis as any).selectedFoodForQuickAdd;
      if (quickAddFood) {
        setSelectedFood(quickAddFood);
        setServings('1');
        (globalThis as any).selectedFoodForQuickAdd = null;
      }
      // 加载历史记录和今日摘要
      loadHistory();
      loadDailySummary(selectedDate);
    }, [selectedDate])
  );

  // 加载历史记录
  const loadHistory = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const saved = await AsyncStorage.getItem('food_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {}
  };

  // 保存到历史记录
  const saveToHistory = async (food: Food) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const newHistory = [food, ...history.filter(h => h._id !== food._id)].slice(0, 10);
      setHistory(newHistory);
      await AsyncStorage.setItem('food_history', JSON.stringify(newHistory));
    } catch (e) {}
  };

  // 餐次选项
  const mealTypes = [
    { key: 'breakfast', label: '早餐', icon: '🌅', color: '#FFE4B5' },
    { key: 'lunch', label: '午餐', icon: '☀️', color: '#FFDAB9' },
    { key: 'dinner', label: '晚餐', icon: '🌙', color: '#E6E6FA' },
    { key: 'snack', label: '加餐', icon: '🍪', color: '#FFF0F5' },
  ];

  // 搜索食物
  const handleSearch = useCallback(() => {
    if (keyword.trim()) {
      searchFoods(keyword.trim());
      setIsResultsExpanded(true);
    }
  }, [keyword, searchFoods]);

  // 选择食物
  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setServings('1');
    setIsResultsExpanded(false);
    saveToHistory(food);
  };

  // 切换收藏
  const toggleFavorite = async () => {
    if (!selectedFood) return;
    try {
      const isFav = favorites.some((f) => f._id === selectedFood._id);
      if (isFav) {
        await removeFavorite(selectedFood._id);
      } else {
        await addFavorite(selectedFood._id);
      }
    } catch (error) {
      Alert.alert('错误', '操作失败');
    }
  };

  // 判断是否已收藏
  const isFavorite = selectedFood ? favorites.some((f) => f._id === selectedFood._id) : false;

  // 添加食物到记录
  const handleAddFood = async () => {
    if (!selectedFood) return;

    const servingsNum = parseFloat(servings) || 1;
    const amount = servingsNum * selectedFood.servingSize;

    // 验证 foodId 是否是有效的 MongoDB ObjectId（24位十六进制字符串）
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(selectedFood._id);
    if (!isValidObjectId) {
      Alert.alert('错误', '食物ID无效，请重新搜索食物');
      return;
    }

    const data = {
      foodId: selectedFood._id,
      foodName: selectedFood.nameZh,
      meal: mealType,
      amount: amount,
      date: selectedDate,
      nutrition: {
        calories: Math.round(selectedFood.nutrition.calories * amount / 100),
        protein: Math.round(selectedFood.nutrition.protein * amount / 100 * 10) / 10,
        carbs: Math.round(selectedFood.nutrition.carbs * amount / 100 * 10) / 10,
        fat: Math.round(selectedFood.nutrition.fat * amount / 100 * 10) / 10,
      },
    };

    try {
      await createRecord(data);
      Alert.alert('成功', `已添加 ${selectedFood.nameZh} 到${mealTypes.find(m => m.key === mealType)?.label}`);
      setSelectedFood(null);
      setServings('1');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || '添加失败，请重试';
      Alert.alert('错误', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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
                onPress={() => setSelectedDate(new Date().toISOString().split('T')[0])}
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
                {/* 日历头部 */}
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

                {/* 星期标题 */}
                <View style={styles.calendarWeekRow}>
                  {weekDays.map((day) => (
                    <Text key={day} style={styles.calendarWeekText}>{day}</Text>
                  ))}
                </View>

                {/* 日期网格 */}
                <View style={styles.calendarGrid}>
                  {generateCalendarDays().map((day, index) => {
                    if (day === null) return <View key={`empty-${index}`} style={styles.calendarDay} />;
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDate;
                    const isTodayDate = dateStr === new Date().toISOString().split('T')[0];
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

                {/* 关闭按钮 */}
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

        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="搜索食物..."
              placeholderTextColor="#BBBBBB"
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={() => setKeyword('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isLoading}
          >
            <Text style={styles.searchButtonText}>{isLoading ? '...' : '搜索'}</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索结果收纳条 */}
        {searchResults.length > 0 && (
          <CollapsibleSection
            title={`🔍 搜索结果`}
            defaultExpanded={isResultsExpanded}
            badge={`${searchResults.length}个`}
          >
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.foodCard,
                  selectedFood?._id === item._id && styles.foodCardSelected,
                ]}
                onPress={() => handleSelectFood(item)}
                activeOpacity={0.7}
              >
                <View style={styles.foodCardLeft}>
                  <View style={styles.foodIcon}>
                    <Text style={styles.foodIconText}>🍽️</Text>
                  </View>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{item.nameZh}</Text>
                    <Text style={styles.foodCategory}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.foodCardRight}>
                  <Text style={styles.caloriesValue}>{Math.round(item.nutrition.calories)}</Text>
                  <Text style={styles.caloriesUnit}>千卡/{item.servingName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </CollapsibleSection>
        )}

        {/* 历史记录收纳条 */}
        {history.length > 0 && (
          <CollapsibleSection
            title="⏱️ 常用食物"
            defaultExpanded={isHistoryExpanded}
            badge={`${history.length}个`}
          >
            {history.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.foodCard,
                  selectedFood?._id === item._id && styles.foodCardSelected,
                ]}
                onPress={() => handleSelectFood(item)}
                activeOpacity={0.7}
              >
                <View style={styles.foodCardLeft}>
                  <View style={[styles.foodIcon, styles.foodIconHistory]}>
                    <Text style={styles.foodIconText}>⭐</Text>
                  </View>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{item.nameZh}</Text>
                    <Text style={styles.foodCategory}>{item.category}</Text>
                  </View>
                </View>
                <View style={styles.foodCardRight}>
                  <Text style={styles.caloriesValue}>{Math.round(item.nutrition.calories)}</Text>
                  <Text style={styles.caloriesUnit}>千卡/{item.servingName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </CollapsibleSection>
        )}

        {/* 餐次选择 */}
        <View style={styles.mealTypeSection}>
          <Text style={styles.sectionTitle}>🍽️ 选择餐次</Text>
          <View style={styles.mealTypeRow}>
            {mealTypes.map((meal) => (
              <TouchableOpacity
                key={meal.key}
                style={[
                  styles.mealTypeItem,
                  { backgroundColor: meal.color + '40' },
                  mealType === meal.key && styles.mealTypeSelected,
                  mealType === meal.key && { backgroundColor: meal.color, borderColor: meal.color.replace('40', '') },
                ]}
                onPress={() => setMealType(meal.key as CreateRecordRequest['meal'])}
                activeOpacity={0.7}
              >
                <Text style={styles.mealTypeIcon}>{meal.icon}</Text>
                <Text
                  style={[
                    styles.mealTypeLabel,
                    mealType === meal.key && styles.mealTypeLabelSelected,
                  ]}
                >
                  {meal.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 选中食物后的添加面板 */}
        {selectedFood && (
          <View style={styles.selectedPanel}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedTitleRow}>
                <View style={styles.selectedIcon}>
                  <Text style={styles.selectedIconText}>✅</Text>
                </View>
                <View>
                  <Text style={styles.selectedName}>{selectedFood.nameZh}</Text>
                  <Text style={styles.selectedCategory}>{selectedFood.category}</Text>
                </View>
              </View>
              <View style={styles.selectedActions}>
                <TouchableOpacity
                  style={[styles.favButton, isFavorite && styles.favButtonActive]}
                  onPress={toggleFavorite}
                >
                  <Text style={styles.favButtonText}>{isFavorite ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedFood(null)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 营养素标签 */}
            <View style={styles.nutrientTags}>
              <View style={[styles.nutrientTag, { backgroundColor: '#FFE4E1' }]}>
                <Text style={styles.nutrientTagValue}>{Math.round(selectedFood.nutrition.protein)}g</Text>
                <Text style={styles.nutrientTagLabel}>蛋白质</Text>
              </View>
              <View style={[styles.nutrientTag, { backgroundColor: '#FFF8DC' }]}>
                <Text style={styles.nutrientTagValue}>{Math.round(selectedFood.nutrition.carbs)}g</Text>
                <Text style={styles.nutrientTagLabel}>碳水</Text>
              </View>
              <View style={[styles.nutrientTag, { backgroundColor: '#F0FFF0' }]}>
                <Text style={styles.nutrientTagValue}>{Math.round(selectedFood.nutrition.fat)}g</Text>
                <Text style={styles.nutrientTagLabel}>脂肪</Text>
              </View>
            </View>

            {/* 份数调节 */}
            <View style={styles.servingsContainer}>
              <Text style={styles.servingsLabel}>份数</Text>
              <View style={styles.servingsControl}>
                <TouchableOpacity
                  style={styles.servingsButton}
                  onPress={() => {
                    const num = parseFloat(servings) || 1;
                    if (num > 1) setServings(String(num - 1));
                  }}
                >
                  <Text style={styles.servingsButtonText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.servingsInput}
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.servingsButton}
                  onPress={() => {
                    const num = parseFloat(servings) || 1;
                    setServings(String(num + 1));
                  }}
                >
                  <Text style={styles.servingsButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.servingsUnit}>{selectedFood.servingName}</Text>
            </View>

            {/* 总热量 */}
            <View style={styles.totalCaloriesContainer}>
              <Text style={styles.totalCaloriesLabel}>总计</Text>
              <Text style={styles.totalCaloriesValue}>
                {Math.round(selectedFood.nutrition.calories * (parseFloat(servings) || 1))} 千卡
              </Text>
            </View>

            {/* 添加按钮 */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFood}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>
                {isLoading ? '添加中...' : `添加到${mealTypes.find(m => m.key === mealType)?.label}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 今日餐次概览 */}
        <CollapsibleSection title="📋 今日餐次" defaultExpanded={true}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as CreateRecordRequest['meal'][]).map((meal) => {
            const mealData = dailySummary?.meals?.[meal];
            const mealInfo = mealTypes.find(m => m.key === meal);
            const hasFood = mealData && mealData.foods && mealData.foods.length > 0;

            if (!hasFood) {
              return (
                <View key={meal} style={styles.mealOverviewEmpty}>
                  <Text style={styles.mealOverviewEmptyIcon}>{mealInfo?.icon}</Text>
                  <Text style={styles.mealOverviewEmptyLabel}>{mealInfo?.label}</Text>
                  <Text style={styles.mealOverviewEmptyText}>暂无记录</Text>
                </View>
              );
            }

            // 合并同名食物
            const merged: Record<string, any> = {};
            mealData.foods.forEach((f: any) => {
              const key = f.nameZh || f.name || '';
              if (merged[key]) {
                merged[key].amount += f.amount || 0;
              } else {
                merged[key] = { ...f, nameZh: f.nameZh || f.name, amount: f.amount || 0 };
              }
            });
            const mergedFoods = Object.values(merged);

            return (
              <View key={meal} style={styles.mealOverviewBlock}>
                <View style={styles.mealOverviewHeader}>
                  <View style={styles.mealOverviewTitleRow}>
                    <Text style={styles.mealOverviewIcon}>{mealInfo?.icon}</Text>
                    <Text style={styles.mealOverviewLabel}>{mealInfo?.label}</Text>
                  </View>
                  <View style={styles.mealOverviewCaloriesBadge}>
                    <Text style={styles.mealOverviewCalories}>
                      {Math.round(mealData.totalNutrition?.calories || 0)} 千卡
                    </Text>
                  </View>
                </View>
                <View style={styles.mealFoodList}>
                  {mergedFoods.map((food: any, index: number) => (
                    <View key={index} style={styles.mealFoodRow}>
                      <View style={styles.mealFoodDot} />
                      <Text style={styles.mealFoodName} numberOfLines={1}>
                        {food.nameZh || food.name}
                      </Text>
                      <Text style={styles.mealFoodAmount}>
                        {food.amount ? `${Math.round(food.amount)}${food.unit || 'g'}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </CollapsibleSection>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  content: {
    flex: 1,
    padding: 16,
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

  // 搜索框
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#FFE4E1',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: '#CCCCCC',
    padding: 4,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#FFB5B5',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // 食物卡片
  foodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#F5F5F5',
  },
  foodCardSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF8F8',
  },
  foodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  foodIconHistory: {
    backgroundColor: '#FFF8E1',
  },
  foodIconText: {
    fontSize: 18,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  foodCategory: {
    fontSize: 12,
    color: '#999999',
  },
  foodCardRight: {
    alignItems: 'flex-end',
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  caloriesUnit: {
    fontSize: 11,
    color: '#999999',
    marginTop: 2,
  },

  // 餐次选择
  mealTypeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTypeItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeSelected: {
    transform: [{ scale: 1.05 }],
  },
  mealTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  mealTypeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
  },
  mealTypeLabelSelected: {
    color: '#333333',
    fontWeight: '700',
  },

  // 选中食物面板
  selectedPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFE4E1',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconText: {
    fontSize: 20,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  selectedCategory: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  selectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  favButtonActive: {
    backgroundColor: '#FFE4B5',
  },
  favButtonText: {
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#999999',
  },

  // 营养素标签
  nutrientTags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutrientTag: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  nutrientTagValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  nutrientTagLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },

  // 份数调节
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
  },
  servingsLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 12,
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingsButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  servingsInput: {
    width: 50,
    height: 36,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  servingsUnit: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
  },

  // 总热量
  totalCaloriesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalCaloriesLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  totalCaloriesValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  // 添加按钮
  addButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // 今日餐次概览
  mealOverviewEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF0F0',
  },
  mealOverviewEmptyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  mealOverviewEmptyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  mealOverviewEmptyText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  mealOverviewBlock: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF0F0',
  },
  mealOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealOverviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealOverviewIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  mealOverviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  mealOverviewCaloriesBadge: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mealOverviewCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  mealFoodList: {
    paddingLeft: 24,
  },
  mealFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mealFoodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB5B5',
    marginRight: 8,
  },
  mealFoodName: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
  },
  mealFoodAmount: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
});

export default RecordScreen;
