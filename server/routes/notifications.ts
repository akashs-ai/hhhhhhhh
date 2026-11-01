import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth } from '../auth.js';
import { storage } from '../storage.js';

const router = Router();

// GET /api/notifications - Get all in-app notifications for authenticated user
router.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const notifications = await storage.getNotificationsByUser(userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  res.json({
    success: true,
    count: notifications.length,
    unread_count: unreadCount,
    data: notifications,
  });
});

// POST /api/notifications/:id/read - Mark single notification as read
router.post('/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const notifId = req.params.id;

  const success = await storage.markNotificationAsRead(notifId, userId);
  if (!success) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Notification ${notifId} not found or unauthorized` },
    });
    return;
  }

  res.json({
    success: true,
    message: `Notification ${notifId} marked as read`,
  });
});

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/notifications/read-all', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const count = await storage.markAllNotificationsAsRead(userId);

  res.json({
    success: true,
    message: `Marked ${count} notifications as read`,
    updated_count: count,
  });
});

export default router;
