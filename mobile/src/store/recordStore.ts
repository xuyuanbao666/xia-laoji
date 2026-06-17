import { create } from 'zustand';
import { DietRecord, CreateRecordRequest, UpdateRecordRequest, DailySummary } from '../types';
import * as recordService from '../services/record';

interface RecordState {
  records: DietRecord[];
  dailySummary: DailySummary | null;
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  setSelectedDate: (date: string) => void;
  createRecord: (data: CreateRecordRequest) => Promise<DietRecord>;
  loadRecords: (startDate?: string, endDate?: string) => Promise<void>;
  loadMoreRecords: (startDate?: string, endDate?: string) => Promise<void>;
  loadDailySummary: (date: string) => Promise<void>;
  updateRecord: (id: string, data: UpdateRecordRequest) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  clearError: () => void;
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
const getToday = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  dailySummary: null,
  selectedDate: getToday(),
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  createRecord: async (data: CreateRecordRequest) => {
    set({ isLoading: true, error: null });
    try {
      console.log('=== Creating Record ===', JSON.stringify(data, null, 2));
      const record = await recordService.createRecord(data);
      console.log('=== Record Created ===', JSON.stringify(record, null, 2));
      // 重新加载当天的摘要
      const { selectedDate } = get();
      await get().loadDailySummary(selectedDate);
      set({ isLoading: false });
      return record;
    } catch (error: any) {
      console.log('=== Create Record Error ===', error.message, error.response?.data);
      const message = error.response?.data?.message || '创建记录失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  loadRecords: async (startDate?: string, endDate?: string) => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const response = await recordService.getRecords({
        startDate,
        endDate,
        page: 1,
        limit: 100,
      });
      // 后端返回数组或 {items: [...]} 格式
      const items = Array.isArray(response) ? response : (response.items || []);
      set({
        records: items,
        page: 1,
        hasMore: false,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '加载记录失败';
      set({ error: message, isLoading: false });
    }
  },

  loadMoreRecords: async (startDate?: string, endDate?: string) => {
    const { page, hasMore, records } = get();
    if (!hasMore) return;

    set({ isLoading: true });
    try {
      const nextPage = page + 1;
      const response = await recordService.getRecords({
        startDate,
        endDate,
        page: nextPage,
        limit: 20,
      });
      set({
        records: [...records, ...response.items],
        page: nextPage,
        hasMore: response.items.length < response.total,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '加载更多失败';
      set({ error: message, isLoading: false });
    }
  },

  loadDailySummary: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await recordService.getDailySummary(date);
      const data = result.data || result;
      console.log('=== Daily Summary Raw Data ===', JSON.stringify(data, null, 2));

      // 后端 meals 是数组 [{meal: 'breakfast', records: [...], totalNutrition: {...}}, ...]
      // 前端需要对象 { breakfast: { foods: [...], totalNutrition: {...} }, ... }
      const mealsArray = data.meals || [];
      const mealsObj: Record<string, any> = {};
      if (Array.isArray(mealsArray)) {
        mealsArray.forEach((m: any) => {
          // 每个 record 有 foods 数组，每项是 {foodId: {...}, amount, unit, nutrition}
          const allFoods: any[] = [];
          (m.records || []).forEach((r: any) => {
            (r.foods || []).forEach((f: any) => {
              allFoods.push({
                ...(f.foodId || f.food || {}),
                nameZh: f.foodId?.nameZh || f.food?.nameZh || f.name || '',
                name: f.foodId?.name || f.food?.name || '',
                amount: f.amount,
                unit: f.unit || 'g',
                nutrition: f.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
              });
            });
          });
          // 四舍五入营养素
          const round = (n: number) => Math.round(n * 10) / 10;
          mealsObj[m.meal] = {
            foods: allFoods,
            totalCalories: Math.round(m.totalNutrition?.calories || 0),
            totalProtein: round(m.totalNutrition?.protein || 0),
            totalCarbs: round(m.totalNutrition?.carbs || 0),
            totalFat: round(m.totalNutrition?.fat || 0),
            totalNutrition: {
              calories: Math.round(m.totalNutrition?.calories || 0),
              protein: round(m.totalNutrition?.protein || 0),
              carbs: round(m.totalNutrition?.carbs || 0),
              fat: round(m.totalNutrition?.fat || 0),
            },
          };
        });
      }

      console.log('=== Converted Meals Obj ===', JSON.stringify(mealsObj, null, 2));

      // 转换后端格式为前端格式（四舍五入）
      const round = (n: number) => Math.round(n * 10) / 10;
      const summary = {
        totalCalories: Math.round(data.totalNutrition?.calories || data.totalCalories || 0),
        totalProtein: round(data.totalNutrition?.protein || data.totalProtein || 0),
        totalCarbs: round(data.totalNutrition?.carbs || data.totalCarbs || 0),
        totalFat: round(data.totalNutrition?.fat || data.totalFat || 0),
        meals: mealsObj,
      };
      set({
        dailySummary: summary,
        isLoading: false,
      });
    } catch (error: any) {
      console.log('=== Daily Summary Error ===', error.message);
      const message = error.response?.data?.message || '加载每日摘要失败';
      set({ error: message, isLoading: false });
    }
  },

  updateRecord: async (id: string, data: UpdateRecordRequest) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.updateRecord(id, data);
      // 重新加载当天的摘要
      const { selectedDate } = get();
      await get().loadDailySummary(selectedDate);
      set({ isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || '更新记录失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteRecord: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await recordService.deleteRecord(id);
      // 重新加载当天的摘要
      const { selectedDate } = get();
      await get().loadDailySummary(selectedDate);
      set({ isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || '删除记录失败';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
