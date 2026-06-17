import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NutrientChartProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

interface SegmentProps {
  color: string;
  percentage: number;
  label: string;
  value: number;
}

const COLORS = {
  protein: '#FF6B6B',
  carbs: '#4ECDC4',
  fat: '#FFD93D',
};

const Segment: React.FC<SegmentProps> = ({ color, percentage, label, value }) => (
  <View style={styles.segment}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <View style={styles.segmentInfo}>
      <Text style={styles.segmentLabel}>{label}</Text>
      <Text style={styles.segmentValue}>{value}g</Text>
    </View>
    <Text style={[styles.segmentPercent, { color }]}>
      {percentage.toFixed(0)}%
    </Text>
  </View>
);

const NutrientChart: React.FC<NutrientChartProps> = ({
  protein,
  carbs,
  fat,
}) => {
  const total = protein + carbs + fat;
  const proteinPct = total > 0 ? (protein / total) * 100 : 0;
  const carbsPct = total > 0 ? (carbs / total) * 100 : 0;
  const fatPct = total > 0 ? (fat / total) * 100 : 0;

  // Bar chart approach - clean and clear
  const maxValue = Math.max(protein, carbs, fat, 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>营养素占比</Text>

      {/* 横向条形图 */}
      <View style={styles.chartArea}>
        {/* 蛋白质 */}
        <View style={styles.barGroup}>
          <Text style={styles.barLabel}>蛋白质</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(protein / maxValue) * 100}%`,
                  backgroundColor: COLORS.protein,
                },
              ]}
            />
          </View>
          <Text style={styles.barValue}>{protein}g</Text>
        </View>

        {/* 碳水 */}
        <View style={styles.barGroup}>
          <Text style={styles.barLabel}>碳水</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(carbs / maxValue) * 100}%`,
                  backgroundColor: COLORS.carbs,
                },
              ]}
            />
          </View>
          <Text style={styles.barValue}>{carbs}g</Text>
        </View>

        {/* 脂肪 */}
        <View style={styles.barGroup}>
          <Text style={styles.barLabel}>脂肪</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(fat / maxValue) * 100}%`,
                  backgroundColor: COLORS.fat,
                },
              ]}
            />
          </View>
          <Text style={styles.barValue}>{fat}g</Text>
        </View>
      </View>

      {/* 百分比明细 */}
      <View style={styles.legendArea}>
        <Segment
          color={COLORS.protein}
          percentage={proteinPct}
          label="蛋白质"
          value={protein}
        />
        <Segment
          color={COLORS.carbs}
          percentage={carbsPct}
          label="碳水"
          value={carbs}
        />
        <Segment
          color={COLORS.fat}
          percentage={fatPct}
          label="脂肪"
          value={fat}
        />
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
  title: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
  },
  chartArea: {
    marginBottom: 20,
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 48,
    fontSize: 13,
    color: '#666666',
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barValue: {
    width: 44,
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'right',
  },
  legendArea: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  segmentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 13,
    color: '#666666',
    marginRight: 8,
  },
  segmentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  segmentPercent: {
    fontSize: 13,
    fontWeight: '700',
    width: 44,
    textAlign: 'right',
  },
});

export default NutrientChart;
