import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { unread_only } = req.query;

    let query = `
      SELECT 
        id,
        title,
        message,
        type,
        is_read,
        created_at
      FROM notifications 
      WHERE student_id = $1
    `;

    const params = [studentId];

    if (unread_only === 'true') {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      status: 'success',
      data: {
        notifications: result.rows
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND student_id = $2
      RETURNING id, title, is_read
    `, [notificationId, studentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Notification marked as read',
      data: {
        notification: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      UPDATE notifications 
      SET is_read = true 
      WHERE student_id = $1 AND is_read = false
      RETURNING COUNT(*) as updated_count
    `, [studentId]);

    res.json({
      status: 'success',
      message: 'All notifications marked as read',
      data: {
        updatedCount: result.rows[0].updated_count
      }
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Get notification count
router.get('/count/unread', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE student_id = $1 AND is_read = false',
      [studentId]
    );

    res.json({
      status: 'success',
      data: {
        unreadCount: parseInt(result.rows[0].unread_count)
      }
    });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notification count'
    });
  }
});

// Delete notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND student_id = $2 RETURNING id',
      [notificationId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification'
    });
  }
});

export default router;
