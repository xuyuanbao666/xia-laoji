import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CalorieProgressProps {
  consumed: number;
  target: number;
}

const CalorieProgress: React.FC<CalorieProgressProps> = ({
  consumed,
  target,
}) => {
  const remaining = Math.max(target - consumed, 0);
  const percentage = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const isOver = consumed > target;

  return (
    <View style={styles.container}>
      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>🔥 今日热量</Text>
      </View>

      {/* 热量数字 */}
      <View style={styles.calorieDisplay}>
        <Text style={styles.consumedValue}>{consumed}</Text>
        <Text style={styles.unit}> / {target} 千卡</Text>
      </View>

      {/* 进度条 */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: isOver ? '#FF6B6B' : '#4ECDC4',
            },
          ]}
        />
      </View>

      {/* 底部统计 */}
      <View style={styles.footer}>
        <View style={[styles.footerItem, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.footerValue, { color: '#4CAF50' }]}>
            {consumed}
          </Text>
          <Text style={styles.footerLabel}>已摄入</Text>
        </View>
        <View style={[styles.footerItem, { backgroundColor: isOver ? '#FFEBEE' : '#E0F7FA' }]}>
          <Text style={[styles.footerValue, { color: isOver ? '#FF6B6B' : '#4ECDC4' }]}>
            {isOver ? `超 ${consumed - target}` : remaining}
          </Text>
          <Text style={styles.footerLabel}>{isOver ? '超出' : '剩余'}</Text>
        </View>
        <View style={[styles.footerItem, { backgroundColor: '#F3E5F5' }]}>
          <Text style={[styles.footerValue, { color: '#9C27B0' }]}>
            {target}
          </Text>
          <Text style={styles.footerLabel}>目标</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  calorieDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  consumedValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  unit: {
    fontSize: 16,
    color: '#999999',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  footerLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 4,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CalorieProgress;
