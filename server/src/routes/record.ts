import { Router, Request, Response, NextFunction } from 'express';
import { RecordService, CreateRecordData, UpdateRecordData } from '../services/recordService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST / - 创建饮食记录（需要认证）
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { date, meal, foods, note, imageUrl } = req.body;

    // 验证必填字段
    if (!date || !meal || !foods || !Array.isArray(foods) || foods.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: date, meal, foods',
      });
      return;
    }

    // 验证 meal 类型
    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(meal)) {
      res.status(400).json({
        success: false,
        message: 'Invalid meal type. Must be: breakfast, lunch, dinner, or snack',
      });
      return;
    }

    // 验证 foods 结构
    for (const food of foods) {
      if (!food.foodId || food.amount === undefined || food.amount < 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid food entry. Each food must have foodId and amount (>= 0)',
        });
        return;
      }
    }

    const recordData: CreateRecordData = {
      date: new Date(date),
      meal,
      foods,
      note,
      imageUrl,
    };

    const record = await RecordService.createRecord(userId, recordData);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    if (error.message.startsWith('Food not found')) {
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
 * GET / - 获取记录列表（需要认证）
 * 查询参数: startDate, endDate
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { startDate, endDate } = req.query;

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid startDate format',
        });
        return;
      }
    }

    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        res.status(400).json({
          success: false,
          message: 'Invalid endDate format',
        });
        return;
      }
    }

    const records = await RecordService.getRecords(userId, start, end);

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /daily/:date - 获取每日汇总（需要认证）
 * date 格式: YYYY-MM-DD
 */
router.get('/daily/:date', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const date = req.params.date as string;

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
      return;
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date',
      });
      return;
    }

    const summary = await RecordService.getDailySummary(userId, targetDate);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /:id - 更新记录（需要认证）
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const { meal, foods, note, imageUrl } = req.body;

    // 验证 meal 类型（如果提供）
    if (meal && !['breakfast', 'lunch', 'dinner', 'snack'].includes(meal)) {
      res.status(400).json({
        success: false,
        message: 'Invalid meal type. Must be: breakfast, lunch, dinner, or snack',
      });
      return;
    }

    // 验证 foods 结构（如果提供）
    if (foods) {
      if (!Array.isArray(foods) || foods.length === 0) {
        res.status(400).json({
          success: false,
          message: 'foods must be a non-empty array',
        });
        return;
      }

      for (const food of foods) {
        if (!food.foodId || food.amount === undefined || food.amount < 0) {
          res.status(400).json({
            success: false,
            message: 'Invalid food entry. Each food must have foodId and amount (>= 0)',
          });
          return;
        }
      }
    }

    const updates: UpdateRecordData = {};
    if (meal) updates.meal = meal;
    if (foods) updates.foods = foods;
    if (note !== undefined) updates.note = note;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;

    const record = await RecordService.updateRecord(id, userId, updates);

    if (!record) {
      res.status(404).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    if (error.message === 'Record not found or access denied') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }
    if (error.message.startsWith('Food not found')) {
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
 * DELETE /:id - 删除记录（需要认证）
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    const deleted = await RecordService.deleteRecord(id, userId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Record not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
