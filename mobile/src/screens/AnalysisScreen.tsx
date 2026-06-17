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
import { Card } from '../components/common';

const screenWidth = Dimensions.get('window').width;

/**
 * 分析页 - 显示热量趋势和营养素占比
 */
const AnalysisScreen: React.FC = () => {
  const { user } = useAuthStore();
  const { records, isLoading, loadRecords } = useRecordStore();

  // 报告类型：周报/月报
  const [reportType, setReportType] = useState<'week' | 'month'>('week');
  // 模拟数据（实际应从API获取）
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);

  // 营养素累计数据
  const [totalNutrients, setTotalNutrients] = useState({
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // 目标热量
  const calorieGoal = user?.goals?.dailyCalories || 2000;

  // 加载数据
  useEffect(() => {
    loadData();
  }, [reportType]);

  const loadData = useCallback(() => {
    const today = new Date();
    let startDate: string;
    let labels: string[];

    if (reportType === 'week') {
      // 最近7天
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      startDate = weekAgo.toISOString().split('T')[0];
      labels = ['一', '二', '三', '四', '五', '六', '日'];
    } else {
      // 最近30天
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 29);
      startDate = monthAgo.toISOString().split('T')[0];
      labels = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(monthAgo);
        date.setDate(date.getDate() + i);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      });
    }

    setChartLabels(labels);
    loadRecords(startDate, today.toISOString().split('T')[0]);

    // 生成模拟数据（实际应从records计算）
    const mockData = labels.map(() => Math.floor(Math.random() * 1000) + 1000);
    setChartData(mockData);

    // 模拟营养素数据
    setTotalNutrients({
      protein: Math.floor(Math.random() * 200) + 100,
      carbs: Math.floor(Math.random() * 300) + 200,
      fat: Math.floor(Math.random() * 100) + 50,
    });
  }, [reportType, loadRecords]);

  const onRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // 计算平均值
  const averageCalories = chartData.length > 0
    ? Math.round(chartData.reduce((a, b) => a + b, 0) / chartData.length)
    : 0;

  // 计算达标天数
  const daysOnTarget = chartData.filter((c) => c <= calorieGoal).length;

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
        >
          <Text style={[styles.tabText, reportType === 'week' && styles.tabTextActive]}>
            周报
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, reportType === 'month' && styles.tabActive]}
          onPress={() => setReportType('month')}
        >
          <Text style={[styles.tabText, reportType === 'month' && styles.tabTextActive]}>
            月报
          </Text>
        </TouchableOpacity>
      </View>

      {/* 统计概览 */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{averageCalories}</Text>
            <Text style={styles.statLabel}>平均热量 (kcal)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{daysOnTarget}</Text>
            <Text style={styles.statLabel}>达标天数</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#4ECDC4' }]}>
              {calorieGoal}
            </Text>
            <Text style={styles.statLabel}>每日目标</Text>
          </View>
        </View>
      </Card>

      {/* 热量趋势图 */}
      <Text style={styles.sectionTitle}>热量趋势</Text>
      <Card style={styles.chartCard}>
        {chartData.length > 0 ? (
          <LineChart
            data={{
              labels: reportType === 'week'
                ? chartLabels
                : chartLabels.filter((_, i) => i % 5 === 0),
              datasets: [
                {
                  data: chartData,
                  color: () => '#FF6B6B',
                  strokeWidth: 2,
                },
                // 目标线
                {
                  data: Array(chartData.length).fill(calorieGoal),
                  color: () => '#4ECDC4',
                  strokeWidth: 1,
                  withDots: false,
                },
              ],
            }}
            width={screenWidth - 64}
            height={200}
            yAxisSuffix="kcal"
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
          <Text style={styles.emptyChart}>暂无数据</Text>
        )}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>实际摄入</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.legendText}>目标热量</Text>
          </View>
        </View>
      </Card>

      {/* 营养素占比 */}
      <Text style={styles.sectionTitle}>营养素分布</Text>
      <NutrientChart
        protein={totalNutrients.protein}
        carbs={totalNutrients.carbs}
        fat={totalNutrients.fat}
      />

      {/* 每日详情 */}
      <Text style={styles.sectionTitle}>每日记录</Text>
      {chartData.map((calories, index) => (
        <Card key={index} style={styles.dayCard}>
          <View style={styles.dayRow}>
            <Text style={styles.dayLabel}>{chartLabels[index]}</Text>
            <View style={styles.dayBar}>
              <View
                style={[
                  styles.dayBarFill,
                  {
                    width: `${Math.min((calories / calorieGoal) * 100, 100)}%`,
                    backgroundColor: calories > calorieGoal ? '#FF6B6B' : '#4ECDC4',
                  },
                ]}
              />
            </View>
            <Text style={styles.dayCalories}>{calories} kcal</Text>
          </View>
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999999',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  chartCard: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  emptyChart: {
    height: 200,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#CCCCCC',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
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
  dayCard: {
    marginBottom: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLabel: {
    width: 40,
    fontSize: 13,
    color: '#666666',
  },
  dayBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  dayBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dayCalories: {
    width: 70,
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default AnalysisScreen;
