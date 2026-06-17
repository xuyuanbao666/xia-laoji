import { Router, Request, Response, NextFunction } from 'express';
import { FoodService } from '../services/foodService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET / - 搜索食物
 * 查询参数: q (搜索关键词), page (页码), limit (每页数量)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, page, limit } = req.query;
    console.log('Food search - q:', q, 'type:', typeof q);

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 20;

    // 验证分页参数
    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
        success: false,
        message: 'Invalid page number',
      });
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        message: 'Invalid limit (1-100)',
      });
      return;
    }

    const result = await FoodService.searchFoods(
      (q as string) || '',
      pageNum,
      limitNum
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /barcode/:code - 通过条形码获取食物
 */
router.get('/barcode/:code', async (req: Request<{ code: string }>, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({
        success: false,
        message: 'Barcode is required',
      });
      return;
    }

    const food = await FoodService.getFoodByBarcode(code);

    if (!food) {
      res.status(404).json({
        success: false,
        message: 'Food not found',
      });
      return;
    }

    res.json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /favorites - 获取收藏食物（需要认证）
 */
router.get('/favorites', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const favorites = await FoodService.getFavorites(userId);

    res.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /favorites/:id - 收藏食物（需要认证）
 */
router.post('/favorites/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    await FoodService.addFavorite(userId, id);

    res.status(201).json({
      success: true,
      message: 'Food added to favorites',
    });
  } catch (error: any) {
    if (error.message === 'Food already in favorites') {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * DELETE /favorites/:id - 取消收藏（需要认证）
 */
router.delete('/favorites/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    await FoodService.removeFavorite(userId, id);

    res.json({
      success: true,
      message: 'Food removed from favorites',
    });
  } catch (error: any) {
    if (error.message === 'Food not in favorites') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

/**
 * GET /:id - 获取食物详情（放在最后，避免被其他路由匹配）
 */
router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const food = await FoodService.getFoodById(id);

    if (!food) {
      res.status(404).json({
        success: false,
        message: 'Food not found',
      });
      return;
    }

    res.json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
