import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useRecordStore } from '../store/recordStore';
import { useAuthStore } from '../store/authStore';
import { NutrientChart } from '../components/nutrition';

const screenWidth = Dimensions.get('window').width;

/**
 * 分析页 - 显示热量趋势和营养素占比
 */
const AnalysisScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { records, isLoading, loadRecords } = useRecordStore();

  // 报告类型：周报/月报
  const [reportType, setReportType] = useState<'week' | 'month'>('week');

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

    if (reportType === 'week') {
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
    const dayCount = reportType === 'week' ? 7 : 30;
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

      if (reportType === 'week') {
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

      {/* 每日详情 */}
      <Text style={styles.sectionTitle}>📅 每日记录</Text>
      {dailyData.dates.map((date, index) => {
        const cal = calories[index];
        const hasData = cal > 0;
        const percentage = hasData ? Math.min((cal / calorieGoal) * 100, 100) : 0;
        const isOver = cal > calorieGoal;

        // 格式化日期显示
        const dateObj = new Date(date + 'T00:00:00');
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dateDisplay = reportType === 'week'
          ? weekdays[dateObj.getDay()]
          : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

        return (
          <View key={date} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={styles.dayLeft}>
                <Text style={styles.dayDate}>{dateDisplay}</Text>
                {hasData && (
                  <Text style={styles.dayNutrients}>
                    蛋白{dailyData.protein[index]}g · 碳水{dailyData.carbs[index]}g · 脂肪{dailyData.fat[index]}g
                  </Text>
                )}
              </View>
              <Text style={[styles.dayCalories, isOver && styles.dayCaloriesOver]}>
                {hasData ? `${cal}` : '-'}
              </Text>
              <Text style={styles.dayUnit}>千卡</Text>
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
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLeft: {
    flex: 1,
  },
  dayDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  dayNutrients: {
    fontSize: 11,
    color: '#999999',
  },
  dayCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
    marginRight: 4,
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

  bottomSpacing: {
    height: 20,
  },
});

export default AnalysisScreen;
