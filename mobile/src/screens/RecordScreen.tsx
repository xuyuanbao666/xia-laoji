import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFoodStore } from '../store/foodStore';
import { useRecordStore } from '../store/recordStore';
import { Food, CreateRecordRequest } from '../types';
import { Card, Button, Input } from '../components/common';

/**
 * 记录页 - 搜索食物并添加到饮食记录
 */
const RecordScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { searchResults, isLoading, searchFoods, clearSearch } = useFoodStore();
  const { createRecord, selectedDate } = useRecordStore();

  // 搜索关键词
  const [keyword, setKeyword] = useState('');
  // 选择的餐次
  const [mealType, setMealType] = useState<CreateRecordRequest['meal']>(
    route.params?.mealType || 'breakfast'
  );
  // 选中的食物
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  // 份数
  const [servings, setServings] = useState('1');

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
    }
  }, [keyword, searchFoods]);

  // 选择食物
  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setServings('1');
  };

  // 添加食物到记录
  const handleAddFood = async () => {
    if (!selectedFood) return;

    const servingsNum = parseFloat(servings) || 1;
    const data: CreateRecordRequest = {
      foodId: selectedFood._id,
      meal: mealType,
      amount: servingsNum,
      date: selectedDate,
    };

    try {
      await createRecord(data);
      Alert.alert('成功', `已添加 ${selectedFood.name} 到${mealTypes.find(m => m.key === mealType)?.label}`);
      setSelectedFood(null);
      setServings('1');
    } catch (error) {
      Alert.alert('错误', '添加失败，请重试');
    }
  };

  // 渲染搜索结果项
  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={[
        styles.foodItem,
        selectedFood?._id === item._id && styles.foodItemSelected,
      ]}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodCategory}>{item.category}</Text>
      </View>
      <View style={styles.foodCalories}>
        <Text style={styles.caloriesValue}>{item.nutrition.calories}</Text>
        <Text style={styles.caloriesUnit}>kcal/{item.servingName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* 搜索框 */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="搜索食物..."
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Button title="搜索" onPress={handleSearch} style={styles.searchButton} />
        </View>

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

        {/* 搜索结果列表 */}
        <Text style={styles.sectionTitle}>搜索结果</Text>
        <FlatList
          data={searchResults}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item._id}
          style={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {keyword ? '没有找到相关食物' : '输入关键词搜索食物'}
            </Text>
          }
        />

        {/* 选中食物后的添加面板 */}
        {selectedFood && (
          <Card style={styles.selectedPanel}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedName}>{selectedFood.name}</Text>
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
      </View>
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
    marginBottom: 16,
  },
  searchButton: {
    marginLeft: 8,
    width: 80,
    height: 48,
  },
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
  list: {
    flex: 1,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  foodItemSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF8F8',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  foodCategory: {
    fontSize: 12,
    color: '#999999',
  },
  foodCalories: {
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
  },
  emptyText: {
    textAlign: 'center',
    color: '#CCCCCC',
    marginTop: 40,
    fontSize: 14,
  },
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
});

export default RecordScreen;
