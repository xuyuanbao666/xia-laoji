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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFoodStore } from '../store/foodStore';
import { useRecordStore } from '../store/recordStore';
import { Food, CreateRecordRequest } from '../types';
import { Card, Button, Input } from '../components/common';
import CollapsibleSection from '../components/CollapsibleSection';

/**
 * 记录页 - 搜索食物并添加到饮食记录
 */
const RecordScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { searchResults, isLoading, searchFoods } = useFoodStore();
  const { createRecord, selectedDate, dailySummary, loadDailySummary } = useRecordStore();

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

  // 当页面获得焦点时，检查是否有新的餐次参数
  useFocusEffect(
    useCallback(() => {
      const globalMeal = (globalThis as any).selectedMealType;
      if (globalMeal) {
        setMealType(globalMeal);
        (globalThis as any).selectedMealType = null;
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
    { key: 'breakfast', label: '早餐', icon: '🌅' },
    { key: 'lunch', label: '午餐', icon: '☀️' },
    { key: 'dinner', label: '晚餐', icon: '🌙' },
    { key: 'snack', label: '加餐', icon: '🍪' },
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

  // 添加食物到记录
  const handleAddFood = async () => {
    if (!selectedFood) return;

    const servingsNum = parseFloat(servings) || 1;
    const amount = servingsNum * selectedFood.servingSize;
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
    } catch (error) {
      Alert.alert('错误', '添加失败，请重试');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="搜索食物..."
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Button title="搜索" onPress={handleSearch} style={styles.searchButton} />
        </View>

        {/* 搜索结果收纳条 */}
        {searchResults.length > 0 && (
          <TouchableOpacity
            style={styles.resultsToggle}
            onPress={() => setIsResultsExpanded(!isResultsExpanded)}
          >
            <Text style={styles.resultsToggleText}>
              搜索结果 ({searchResults.length})
            </Text>
            <Text style={styles.resultsToggleIcon}>
              {isResultsExpanded ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 展开的搜索结果列表 */}
        {isResultsExpanded && searchResults.length > 0 && (
          <View style={styles.resultsList}>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.foodItem,
                  selectedFood?._id === item._id && styles.foodItemSelected,
                ]}
                onPress={() => handleSelectFood(item)}
              >
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.nameZh}</Text>
                  <Text style={styles.foodCategory}>{item.category}</Text>
                </View>
                <View style={styles.foodCalories}>
                  <Text style={styles.caloriesValue}>{item.nutrition.calories}</Text>
                  <Text style={styles.caloriesUnit}>kcal/{item.servingName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 历史记录收纳条 */}
        {history.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.resultsToggle}
              onPress={() => setIsHistoryExpanded(!isHistoryExpanded)}
            >
              <Text style={styles.resultsToggleText}>
                常用食物 ({history.length})
              </Text>
              <Text style={styles.resultsToggleIcon}>
                {isHistoryExpanded ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {isHistoryExpanded && (
              <View style={styles.resultsList}>
                {history.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.foodItem,
                      selectedFood?._id === item._id && styles.foodItemSelected,
                    ]}
                    onPress={() => handleSelectFood(item)}
                  >
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{item.nameZh}</Text>
                      <Text style={styles.foodCategory}>{item.category}</Text>
                    </View>
                    <View style={styles.foodCalories}>
                      <Text style={styles.caloriesValue}>{item.nutrition.calories}</Text>
                      <Text style={styles.caloriesUnit}>kcal/{item.servingName}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* 餐次选择 */}
        <Text style={styles.sectionTitle}>选择餐次</Text>
        <View style={styles.mealTypeRow}>
          {mealTypes.map((meal) => (
            <TouchableOpacity
              key={meal.key}
              style={[
                styles.mealTypeItem,
                mealType === meal.key && styles.mealTypeSelected,
              ]}
              onPress={() => setMealType(meal.key as CreateRecordRequest['meal'])}
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

        {/* 选中食物后的添加面板 */}
        {selectedFood && (
          <Card style={styles.selectedPanel}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedName}>{selectedFood.nameZh}</Text>
              <TouchableOpacity onPress={() => setSelectedFood(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.selectedNutrients}>
              <Text style={styles.nutrientText}>
                蛋白质 {selectedFood.nutrition.protein}g · 碳水 {selectedFood.nutrition.carbs}g · 脂肪 {selectedFood.nutrition.fat}g
              </Text>
            </View>
            <View style={styles.servingsRow}>
              <Text style={styles.servingsLabel}>份数：</Text>
              <Input
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                style={styles.servingsInput}
              />
              <Text style={styles.servingsUnit}>{selectedFood.servingName}</Text>
            </View>
            <Text style={styles.totalCalories}>
              共 {Math.round(selectedFood.nutrition.calories * (parseFloat(servings) || 1))} kcal
            </Text>
            <Button
              title={`添加到${mealTypes.find(m => m.key === mealType)?.label}`}
              onPress={handleAddFood}
              loading={isLoading}
            />
          </Card>
        )}

        {/* 今日餐次概览 */}
        <CollapsibleSection title="🍽️ 今日餐次" defaultExpanded={true}>
          {(['breakfast', 'lunch', 'dinner', 'snack'] as CreateRecordRequest['meal'][]).map((meal) => {
            const mealData = dailySummary?.meals?.[meal];
            const hasFood = mealData && mealData.foods && mealData.foods.length > 0;
            if (!hasFood) {
              return (
                <View key={meal} style={styles.mealOverviewRow}>
                  <Text style={styles.mealOverviewLabel}>
                    {mealTypes.find(m => m.key === meal)?.icon}{' '}
                    {mealTypes.find(m => m.key === meal)?.label}
                  </Text>
                  <Text style={styles.mealOverviewEmpty}>暂无记录</Text>
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
                  <Text style={styles.mealOverviewLabel}>
                    {mealTypes.find(m => m.key === meal)?.icon}{' '}
                    {mealTypes.find(m => m.key === meal)?.label}
                  </Text>
                  <Text style={styles.mealOverviewCalories}>
                    {Math.round(mealData.totalNutrition?.calories || 0)} 千卡
                  </Text>
                </View>
                {mergedFoods.map((food: any, index: number) => (
                  <View key={index} style={styles.mealFoodRow}>
                    <Text style={styles.mealFoodName} numberOfLines={1}>
                      {food.nameZh || food.name}
                    </Text>
                    <Text style={styles.mealFoodAmount}>
                      {food.amount ? `${food.amount}${food.unit || 'g'}` : ''}
                    </Text>
                  </View>
                ))}
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
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    marginLeft: 8,
    width: 80,
    height: 48,
  },
  // 搜索结果收纳条
  resultsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  resultsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  resultsToggleIcon: {
    fontSize: 12,
    color: '#999999',
  },
  // 展开的搜索结果列表
  resultsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    maxHeight: 200,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  foodItemSelected: {
    backgroundColor: '#FFF8F8',
    borderColor: '#FF6B6B',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  foodCategory: {
    fontSize: 12,
    color: '#999999',
  },
  foodCalories: {
    alignItems: 'flex-end',
  },
  caloriesValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  caloriesUnit: {
    fontSize: 11,
    color: '#999999',
  },
  // 餐次选择
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealTypeItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  mealTypeSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF0F0',
  },
  mealTypeIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealTypeLabel: {
    fontSize: 12,
    color: '#666666',
  },
  mealTypeLabelSelected: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  // 选中食物面板
  selectedPanel: {
    marginTop: 8,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    fontSize: 18,
    color: '#999999',
  },
  selectedNutrients: {
    marginBottom: 12,
  },
  nutrientText: {
    fontSize: 12,
    color: '#666666',
  },
  servingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  servingsLabel: {
    fontSize: 14,
    color: '#333333',
  },
  servingsInput: {
    width: 60,
    height: 36,
    marginHorizontal: 8,
    textAlign: 'center',
  },
  servingsUnit: {
    fontSize: 14,
    color: '#666666',
  },
  totalCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 12,
  },
  // 餐次概览
  mealOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF0F0',
  },
  mealOverviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  mealOverviewEmpty: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  mealOverviewBlock: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF0F0',
  },
  mealOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealOverviewCalories: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  mealFoodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingLeft: 16,
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
