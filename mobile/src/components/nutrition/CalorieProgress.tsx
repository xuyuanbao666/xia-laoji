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
      {/* 顶部：已摄入 / 目标 */}
      <View style={styles.header}>
        <Text style={styles.title}>今日热量</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.consumedValue}>{consumed}</Text>
          <Text style={styles.unit}> / {target} kcal</Text>
        </Text>
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

      {/* 底部：剩余热量 */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>已摄入</Text>
          <Text style={[styles.footerValue, { color: '#4ECDC4' }]}>
            {consumed} kcal
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>剩余</Text>
          <Text
            style={[
              styles.footerValue,
              { color: isOver ? '#FF6B6B' : '#4ECDC4' },
            ]}
          >
            {isOver ? `超 ${consumed - target}` : remaining} kcal
          </Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>目标</Text>
          <Text style={styles.footerValue}>{target} kcal</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 4,
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  consumedValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333333',
  },
  unit: {
    fontSize: 16,
    color: '#999999',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
});

export default CalorieProgress;
