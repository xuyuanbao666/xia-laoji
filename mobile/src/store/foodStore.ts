import { create } from 'zustand';
import { Food } from '../types';
import * as foodService from '../services/food';

interface FoodState {
  foods: Food[];
  favorites: Food[];
  searchResults: Food[];
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  searchFoods: (query: string) => Promise<void>;
  loadMore: (query: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
  addFavorite: (foodId: string) => Promise<void>;
  removeFavorite: (foodId: string) => Promise<void>;
  getFoodById: (id: string) => Promise<Food | undefined>;
  clearSearch: () => void;
  clearError: () => void;
}

export const useFoodStore = create<FoodState>((set, get) => ({
  foods: [],
  favorites: [],
  searchResults: [],
  isLoading: false,
  error: null,
  page: 1,
  hasMore: true,

  searchFoods: async (query: string) => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const result = await foodService.searchFoods(query, 1, 50);
      const foods = result.foods || result.data?.foods || [];
      const total = result.total || result.data?.total || 0;
      set({
        searchResults: foods,
        foods: foods,
        page: 1,
        hasMore: foods.length < total,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '搜索失败，请重试';
      set({ error: message, isLoading: false });
    }
  },

  loadMore: async (query: string) => {
    const { page, hasMore, foods } = get();
    if (!hasMore) return;

    set({ isLoading: true });
    try {
      const nextPage = page + 1;
      const response = await foodService.searchFoods(query, nextPage, 20);
      set({
        foods: [...foods, ...response.foods],
        searchResults: [...foods, ...response.foods],
        page: nextPage,
        hasMore: response.foods.length < response.total,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '加载更多失败';
      set({ error: message, isLoading: false });
    }
  },

  loadFavorites: async () => {
    set({ isLoading: true, error: null });
    try {
      const favorites = await foodService.getFavorites();
      set({ favorites, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || '加载收藏失败';
      set({ error: message, isLoading: false });
    }
  },

  addFavorite: async (foodId: string) => {
    try {
      await foodService.addFavorite(foodId);
      const { favorites, foods } = get();
      // 查找收藏的食物
      const foodToAdd = foods.find((food) => food._id === foodId);
      if (foodToAdd) {
        set({ favorites: [...favorites, foodToAdd] });
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '收藏失败';
      set({ error: message });
      throw error;
    }
  },

  removeFavorite: async (foodId: string) => {
    try {
      await foodService.removeFavorite(foodId);
      const { favorites } = get();
      set({
        favorites: favorites.filter((food) => food._id !== foodId),
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '取消收藏失败';
      set({ error: message });
      throw error;
    }
  },

  getFoodById: async (id: string) => {
    try {
      const food = await foodService.getFoodById(id);
      return food;
    } catch (error: any) {
      const message = error.response?.data?.message || '获取食物详情失败';
      set({ error: message });
      return undefined;
    }
  },

  clearSearch: () => {
    set({ searchResults: [], foods: [], page: 1, hasMore: true });
  },

  clearError: () => {
    set({ error: null });
  },
}));
