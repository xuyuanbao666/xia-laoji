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
      const record = await recordService.createRecord(data);
      // 重新加载当天的摘要
      const { selectedDate } = get();
      await get().loadDailySummary(selectedDate);
      set({ isLoading: false });
      return record;
    } catch (error: any) {
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
        limit: 20,
      });
      set({
        records: response.items,
        page: 1,
        hasMore: response.items.length < response.total,
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
      // 转换后端格式为前端格式
      const summary = {
        totalCalories: data.totalNutrition?.calories || data.totalCalories || 0,
        totalProtein: data.totalNutrition?.protein || data.totalProtein || 0,
        totalCarbs: data.totalNutrition?.carbs || data.totalCarbs || 0,
        totalFat: data.totalNutrition?.fat || data.totalFat || 0,
        meals: data.meals || {},
      };
      set({
        dailySummary: summary,
        isLoading: false,
      });
    } catch (error: any) {
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
