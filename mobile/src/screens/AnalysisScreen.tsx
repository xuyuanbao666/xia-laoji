import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useRecordStore } from '../store/recordStore';
import { useAuthStore } from '../store/authStore';
import { NutrientChart } from '../components/nutrition';
import { DietRecord } from '../types';

const screenWidth = Dimensions.get('window').width;

/**
 * 分析页 - 显示热量趋势、营养素占比、饮食洞察
 */
const AnalysisScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { records, isLoading, loadRecords } = useRecordStore();

  // 报告类型：日报/周报/月报
  const [reportType, setReportType] = useState<'day' | 'week' | 'month'>('week');

  // 目标热量
  const calorieGoal = user?.goals?.dailyCalories || 2000;

  // 按日期聚合的每日数据
  const [dailyData, setDailyData] = useState<{
    dates: string[];
    labels: string[];
    calories: number[];
    protein: number[];
    carbs: number[];
    fat: number[];
  }>({ dates: [], labels: [], calories: [], protein: [], carbs: [], fat: [] });

  // 营养素累计
  const [totalNutrients, setTotalNutrients] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // 餐次统计
  const [mealStats, setMealStats] = useState<Record<string, number>>({});

  // 选中日期详情
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayRecords, setSelectedDayRecords] = useState<DietRecord[]>([]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [reportType]);

  // 当 records 变化时，聚合数据
  useEffect(() => {
    aggregateData();
  }, [records, reportType]);

  const loadData = useCallback(() => {
    const today = new Date();
    let startDate: string;

    if (reportType === 'day') {
      startDate = today.toISOString().split('T')[0];
    } else if (reportType === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      startDate = weekAgo.toISOString().split('T')[0];
    } else {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 29);
      startDate = monthAgo.toISOString().split('T')[0];
    }

    loadRecords(startDate, today.toISOString().split('T')[0]);
  }, [reportType, loadRecords]);

  // 聚合 records 按日期分组
  const aggregateData = useCallback(() => {
    const today = new Date();
    const dayCount = reportType === 'day' ? 1 : reportType === 'week' ? 7 : 30;
    const dates: string[] = [];
    const labels: string[] = [];
    const caloriesMap: Record<string, number> = {};
    const proteinMap: Record<string, number> = {};
    const carbsMap: Record<string, number> = {};
    const fatMap: Record<string, number> = {};

    // 生成日期列表（从最早到今天）
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);

      if (reportType === 'day') {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        labels.push(weekdays[date.getDay()]);
      } else if (reportType === 'week') {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        labels.push(weekdays[date.getDay()]);
      } else {
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }

      caloriesMap[dateStr] = 0;
      proteinMap[dateStr] = 0;
      carbsMap[dateStr] = 0;
      fatMap[dateStr] = 0;
    }

    // 聚合 records 数据
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const mealStatsTemp: Record<string, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    records.forEach((record) => {
      const dateStr = record.date.split('T')[0];
      if (caloriesMap[dateStr] !== undefined) {
        caloriesMap[dateStr] += record.totalNutrition?.calories || 0;
        proteinMap[dateStr] += record.totalNutrition?.protein || 0;
        carbsMap[dateStr] += record.totalNutrition?.carbs || 0;
        fatMap[dateStr] += record.totalNutrition?.fat || 0;
      }
      totalProtein += record.totalNutrition?.protein || 0;
      totalCarbs += record.totalNutrition?.carbs || 0;
      totalFat += record.totalNutrition?.fat || 0;

      // 统计餐次
      if (mealStatsTemp[record.meal] !== undefined) {
        mealStatsTemp[record.meal] += record.totalNutrition?.calories || 0;
      }
    });

    const calories = dates.map((d) => Math.round(caloriesMap[d] || 0));
    const protein = dates.map((d) => Math.round(proteinMap[d] * 10) / 10);
    const carbs = dates.map((d) => Math.round(carbsMap[d] * 10) / 10);
    const fat = dates.map((d) => Math.round(fatMap[d] * 10) / 10);

    setDailyData({ dates, labels, calories, protein, carbs, fat });
    setTotalNutrients({
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    });
    setMealStats(mealStatsTemp);
  }, [records, reportType]);

  const onRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // 计算统计
  const { calories } = dailyData;
  const daysWithData = calories.filter((c) => c > 0).length;
  const averageCalories = daysWithData > 0
    ? Math.round(calories.reduce((a, b) => a + b, 0) / daysWithData)
    : 0;
  const daysOnTarget = calories.filter((c) => c > 0 && c <= calorieGoal).length;
  const totalCalories = Math.round(calories.reduce((a, b) => a + b, 0));

  // 计算连续达标天数（从今天往回数）
  const getStreak = () => {
    let streak = 0;
    for (let i = calories.length - 1; i >= 0; i--) {
      if (calories[i] > 0 && calories[i] <= calorieGoal) {
        streak++;
      } else if (calories[i] > 0) {
        break;
      }
    }
    return streak;
  };
  const streak = getStreak();

  // 找出最高/最低热量日
  const daysWithDataArr = calories
    .map((cal, i) => ({ cal, index: i }))
    .filter((d) => d.cal > 0);
  const highestDay = daysWithDataArr.length > 0
    ? daysWithDataArr.reduce((max, d) => (d.cal > max.cal ? d : max), daysWithDataArr[0])
    : null;
  const lowestDay = daysWithDataArr.length > 0
    ? daysWithDataArr.reduce((min, d) => (d.cal < min.cal ? d : min), daysWithDataArr[0])
    : null;

  // 餐次热量占比
  const totalMealCalories = Object.values(mealStats).reduce((a, b) => a + b, 0);
  const mealPercentages = {
    breakfast: totalMealCalories > 0 ? Math.round((mealStats.breakfast / totalMealCalories) * 100) : 0,
    lunch: totalMealCalories > 0 ? Math.round((mealStats.lunch / totalMealCalories) * 100) : 0,
    dinner: totalMealCalories > 0 ? Math.round((mealStats.dinner / totalMealCalories) * 100) : 0,
    snack: totalMealCalories > 0 ? Math.round((mealStats.snack / totalMealCalories) * 100) : 0,
  };

  const mealLabels: Record<string, { label: string; icon: string; color: string }> = {
    breakfast: { label: '早餐', icon: '🌅', color: '#FFE4B5' },
    lunch: { label: '午餐', icon: '☀️', color: '#FFDAB9' },
    dinner: { label: '晚餐', icon: '🌙', color: '#E6E6FA' },
    snack: { label: '加餐', icon: '🍪', color: '#FFF0F5' },
  };

  // 点击网格查看某天详情
  const handleDayPress = (date: string) => {
    const dayRecords = records.filter((r) => r.date.split('T')[0] === date);
    setSelectedDay(date);
    setSelectedDayRecords(dayRecords);
  };

  // 合并同名食物
  const mergeFoods = (foods: any[]) => {
    const merged: Record<string, any> = {};
    foods.forEach((f) => {
      const name = f.name || '';
      if (merged[name]) {
        merged[name].amount += f.amount || 0;
        merged[name].nutrition.calories += f.nutrition?.calories || 0;
        merged[name].nutrition.protein += f.nutrition?.protein || 0;
        merged[name].nutrition.carbs += f.nutrition?.carbs || 0;
        merged[name].nutrition.fat += f.nutrition?.fat || 0;
      } else {
        merged[name] = { ...f, amount: f.amount || 0, nutrition: { ...f.nutrition } };
      }
    });
    return Object.values(merged);
  };

  // 格式化选中日期
  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      {/* 报告类型切换 */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, reportType === 'day' && styles.tabActive]}
          onPress={() => setReportType('day')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, reportType === 'day' && styles.tabTextActive]}>
            📅 日报
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, reportType === 'week' && styles.tabActive]}
          onPress={() => setReportType('week')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, reportType === 'week' && styles.tabTextActive]}>
            📊 周报
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, reportType === 'month' && styles.tabActive]}
          onPress={() => setReportType('month')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, reportType === 'month' && styles.tabTextActive]}>
            📈 月报
          </Text>
        </TouchableOpacity>
      </View>

      {/* 统计概览 */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📋 数据概览</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: '#FFE4E1' }]}>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
              {averageCalories}
            </Text>
            <Text style={styles.statLabel}>平均热量</Text>
            <Text style={styles.statUnit}>千卡/天</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statValue, { color: '#4CAF50' }]}>
              {daysOnTarget}/{daysWithData}
            </Text>
            <Text style={styles.statLabel}>达标天数</Text>
            <Text style={styles.statUnit}>≤{calorieGoal}千卡</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#E3F2FD' }]}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}>
              {(totalCalories / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.statLabel}>总摄入</Text>
            <Text style={styles.statUnit}>千卡</Text>
          </View>
        </View>
      </View>

      {/* 饮食洞察 */}
      {daysWithData > 0 && (
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 饮食洞察</Text>
          <View style={styles.insightRow}>
            {streak > 0 && (
              <View style={[styles.insightItem, { backgroundColor: '#FFF8E1' }]}>
                <Text style={styles.insightIcon}>🔥</Text>
                <Text style={styles.insightValue}>{streak}天</Text>
                <Text style={styles.insightLabel}>连续达标</Text>
              </View>
            )}
            {highestDay && (
              <View style={[styles.insightItem, { backgroundColor: '#FFEBEE' }]}>
                <Text style={styles.insightIcon}>📈</Text>
                <Text style={[styles.insightValue, { color: '#FF6B6B' }]}>{highestDay.cal}</Text>
                <Text style={styles.insightLabel}>最高日</Text>
              </View>
            )}
            {lowestDay && (
              <View style={[styles.insightItem, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.insightIcon}>📉</Text>
                <Text style={[styles.insightValue, { color: '#4CAF50' }]}>{lowestDay.cal}</Text>
                <Text style={styles.insightLabel}>最低日</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 热量趋势图 */}
      <Text style={styles.sectionTitle}>🔥 热量趋势</Text>
      <View style={styles.chartCard}>
        {calories.some((c) => c > 0) ? (
          <LineChart
            data={{
              labels: reportType === 'week'
                ? dailyData.labels
                : dailyData.labels.filter((_, i) => i % 5 === 0),
              datasets: [
                {
                  data: calories,
                  color: () => '#FF6B6B',
                  strokeWidth: 2,
                },
                // 目标线
                {
                  data: Array(calories.length).fill(calorieGoal),
                  color: () => '#4ECDC4',
                  strokeWidth: 1,
                  withDots: false,
                },
              ],
            }}
            width={screenWidth - 64}
            height={200}
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#FF6B6B',
              },
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartIcon}>📭</Text>
            <Text style={styles.emptyChartText}>暂无数据</Text>
            <Text style={styles.emptyChartHint}>快去记录你的第一餐吧~</Text>
          </View>
        )}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>实际摄入</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>目标 {calorieGoal}千卡</Text>
          </View>
        </View>
      </View>

      {/* 营养素占比 */}
      <Text style={styles.sectionTitle}>🥗 营养素分布</Text>
      <NutrientChart
        protein={totalNutrients.protein}
        carbs={totalNutrients.carbs}
        fat={totalNutrients.fat}
      />

      {/* 餐次热量分布 */}
      {totalMealCalories > 0 && (
        <>
          <Text style={styles.sectionTitle}>🍽️ 餐次分布</Text>
          <View style={styles.mealDistCard}>
            {Object.entries(mealLabels).map(([key, info]) => {
              const cal = mealStats[key] || 0;
              const pct = mealPercentages[key as keyof typeof mealPercentages];
              if (cal === 0) return null;
              return (
                <View key={key} style={styles.mealDistRow}>
                  <View style={styles.mealDistLeft}>
                    <View style={[styles.mealDistIcon, { backgroundColor: info.color }]}>
                      <Text style={styles.mealDistIconText}>{info.icon}</Text>
                    </View>
                    <Text style={styles.mealDistLabel}>{info.label}</Text>
                  </View>
                  <View style={styles.mealDistBar}>
                    <View
                      style={[
                        styles.mealDistBarFill,
                        { width: `${pct}%`, backgroundColor: info.color.replace('FF', 'CC') },
                      ]}
                    />
                  </View>
                  <View style={styles.mealDistRight}>
                    <Text style={styles.mealDistCal}>{Math.round(cal)}千卡</Text>
                    <Text style={styles.mealDistPct}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* 每日详情 */}
      <Text style={styles.sectionTitle}>📅 每日记录</Text>

      {/* 月报用网格日历视图 */}
      {reportType === 'month' ? (
        <View style={styles.calendarCard}>
          {/* 星期标题 */}
          <View style={styles.calHeaderRow}>
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <Text key={d} style={styles.calHeaderText}>{d}</Text>
            ))}
          </View>
          {/* 日期网格 */}
          <View style={styles.calGrid}>
            {dailyData.dates.map((date, index) => {
              const cal = calories[index];
              const hasData = cal > 0;
              const isOver = cal > calorieGoal;
              const dateObj = new Date(date + 'T00:00:00');
              const dayNum = dateObj.getDate();
              const isToday = date === new Date().toISOString().split('T')[0];

              return (
                <TouchableOpacity
                  key={date}
                  style={styles.calCell}
                  onPress={() => handleDayPress(date)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.calDay,
                      isToday && styles.calDayToday,
                      hasData && isOver && styles.calDayOver,
                      hasData && !isOver && styles.calDayUnder,
                    ]}
                  >
                    <Text style={[styles.calDayNum, isToday && styles.calDayNumToday]}>
                      {dayNum}
                    </Text>
                    {hasData ? (
                      <Text style={[styles.calDayCal, isOver && styles.calDayCalOver]}>
                        {cal}
                      </Text>
                    ) : (
                      <Text style={styles.calDayEmpty}>-</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* 图例 */}
          <View style={styles.calLegend}>
            <View style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={styles.calLegendText}>达标</Text>
            </View>
            <View style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.calLegendText}>超标</Text>
            </View>
            <View style={styles.calLegendItem}>
              <View style={[styles.calLegendDot, { backgroundColor: '#F0F0F0' }]} />
              <Text style={styles.calLegendText}>无记录</Text>
            </View>
          </View>
        </View>

        {/* 每日详情模态框 */}
        <Modal visible={selectedDay !== null} transparent animationType="slide">
          <View style={styles.dayModalOverlay}>
            <View style={styles.dayModal}>
              <View style={styles.dayModalHeader}>
                <Text style={styles.dayModalTitle}>
                  {selectedDay ? formatSelectedDate(selectedDay) : ''}
                </Text>
                <TouchableOpacity
                  style={styles.dayModalClose}
                  onPress={() => setSelectedDay(null)}
                >
                  <Text style={styles.dayModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.dayModalContent}>
                {selectedDayRecords.length === 0 ? (
                  <View style={styles.dayModalEmpty}>
                    <Text style={styles.dayModalEmptyIcon}>📭</Text>
                    <Text style={styles.dayModalEmptyText}>这天没有记录</Text>
                  </View>
                ) : (
                  <>
                    {/* 按餐次分组 */}
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => {
                      const mealRecords = selectedDayRecords.filter((r) => r.meal === meal);
                      if (mealRecords.length === 0) return null;

                      const mealTotalCal = mealRecords.reduce(
                        (sum, r) => sum + (r.totalNutrition?.calories || 0), 0
                      );
                      const allFoods = mealRecords.flatMap((r) => r.foods || []);
                      const mergedFoods = mergeFoods(allFoods);
                      const info = mealLabels[meal];

                      return (
                        <View key={meal} style={styles.dayMealBlock}>
                          <View style={styles.dayMealHeader}>
                            <View style={styles.dayMealTitleRow}>
                              <Text style={styles.dayMealIcon}>{info.icon}</Text>
                              <Text style={styles.dayMealLabel}>{info.label}</Text>
                            </View>
                            <Text style={styles.dayMealCal}>{Math.round(mealTotalCal)} 千卡</Text>
                          </View>
                          {mergedFoods.map((food: any, i: number) => (
                            <View key={i} style={styles.dayFoodRow}>
                              <View style={styles.dayFoodDot} />
                              <Text style={styles.dayFoodName} numberOfLines={1}>
                                {food.name}
                              </Text>
                              <Text style={styles.dayFoodAmount}>
                                {Math.round(food.amount)}g
                              </Text>
                              <Text style={styles.dayFoodCal}>
                                {Math.round(food.nutrition?.calories || 0)} 千卡
                              </Text>
                            </View>
                          ))}
                        </View>
                      );
                    })}

                    {/* 总计 */}
                    <View style={styles.dayTotalRow}>
                      <Text style={styles.dayTotalLabel}>总计</Text>
                      <Text style={styles.dayTotalCal}>
                        {Math.round(selectedDayRecords.reduce(
                          (sum, r) => sum + (r.totalNutrition?.calories || 0), 0
                        ))} 千卡
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : (
        /* 日报/周报用列表视图 */
        dailyData.dates.map((date, index) => {
          const cal = calories[index];
          const hasData = cal > 0;
          const percentage = hasData ? Math.min((cal / calorieGoal) * 100, 100) : 0;
          const isOver = cal > calorieGoal;

          const dateObj = new Date(date + 'T00:00:00');
          const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          const dateDisplay = reportType === 'day'
            ? `${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${weekdays[dateObj.getDay()]}`
            : weekdays[dateObj.getDay()];

          const isHighest = highestDay && highestDay.index === index;
          const isLowest = lowestDay && lowestDay.index === index;

          return (
            <View
              key={date}
              style={[
                styles.dayCard,
                isHighest && styles.dayCardHighest,
                isLowest && styles.dayCardLowest,
              ]}
            >
              <View style={styles.dayHeader}>
                <View style={styles.dayLeft}>
                  <View style={styles.dayDateRow}>
                    <Text style={styles.dayDate}>{dateDisplay}</Text>
                    {isHighest && <Text style={styles.dayBadge}>📈 最高</Text>}
                    {isLowest && <Text style={[styles.dayBadge, { backgroundColor: '#E8F5E9', color: '#4CAF50' }]}>📉 最低</Text>}
                  </View>
                  {hasData && (
                    <Text style={styles.dayNutrients}>
                      蛋白{dailyData.protein[index]}g · 碳水{dailyData.carbs[index]}g · 脂肪{dailyData.fat[index]}g
                    </Text>
                  )}
                </View>
                <View style={styles.dayRight}>
                  <Text style={[styles.dayCalories, isOver && styles.dayCaloriesOver]}>
                    {hasData ? `${cal}` : '-'}
                  </Text>
                  <Text style={styles.dayUnit}>千卡</Text>
                </View>
              </View>
              {hasData && (
                <View style={styles.dayBar}>
                  <View
                    style={[
                      styles.dayBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: isOver ? '#FF6B6B' : '#4ECDC4',
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })
      )}

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

  // 报告类型切换
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 统计概览
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
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 10,
    color: '#999999',
  },

  // 饮食洞察
  insightCard: {
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
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  insightIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 2,
  },
  insightLabel: {
    fontSize: 11,
    color: '#666666',
  },

  // 章节标题
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginTop: 8,
    marginBottom: 12,
  },

  // 图表卡片
  chartCard: {
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
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 4,
  },
  emptyChartHint: {
    fontSize: 13,
    color: '#CCCCCC',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
  },

  // 餐次分布
  mealDistCard: {
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
  mealDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealDistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
  },
  mealDistIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  mealDistIconText: {
    fontSize: 14,
  },
  mealDistLabel: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  mealDistBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  mealDistBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealDistRight: {
    alignItems: 'flex-end',
    width: 70,
  },
  mealDistCal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  mealDistPct: {
    fontSize: 11,
    color: '#999999',
  },

  // 每日记录
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dayCardHighest: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  dayCardLowest: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLeft: {
    flex: 1,
  },
  dayDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  dayBadge: {
    fontSize: 10,
    color: '#FF6B6B',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    overflow: 'hidden',
  },
  dayNutrients: {
    fontSize: 11,
    color: '#999999',
  },
  dayRight: {
    alignItems: 'flex-end',
  },
  dayCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  dayCaloriesOver: {
    color: '#FF6B6B',
  },
  dayUnit: {
    fontSize: 11,
    color: '#999999',
  },
  dayBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10,
  },
  dayBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // 网格日历
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  calHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  calDay: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  calDayToday: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  calDayOver: {
    backgroundColor: '#FFE4E1',
  },
  calDayUnder: {
    backgroundColor: '#E8F5E9',
  },
  calDayNum: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  calDayNumToday: {
    color: '#FF6B6B',
  },
  calDayCal: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  calDayCalOver: {
    color: '#FF6B6B',
  },
  calDayEmpty: {
    fontSize: 9,
    color: '#CCCCCC',
  },
  calLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  calLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  calLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  calLegendText: {
    fontSize: 11,
    color: '#666666',
  },

  // 每日详情模态
  dayModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dayModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  dayModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
  },
  dayModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayModalCloseText: {
    fontSize: 14,
    color: '#999999',
  },
  dayModalContent: {
    padding: 16,
  },
  dayModalEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  dayModalEmptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  dayModalEmptyText: {
    fontSize: 15,
    color: '#999999',
  },

  // 餐次块
  dayMealBlock: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dayMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayMealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayMealIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dayMealLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  dayMealCal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  dayFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 26,
  },
  dayFoodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB5B5',
    marginRight: 10,
  },
  dayFoodName: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  dayFoodAmount: {
    fontSize: 12,
    color: '#999999',
    marginRight: 12,
  },
  dayFoodCal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },

  // 总计
  dayTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
  },
  dayTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
  },
  dayTotalCal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B6B',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default AnalysisScreen;
