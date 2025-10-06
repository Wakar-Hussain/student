import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get attendance summary for all courses
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        c.course_name,
        c.course_code,
        COUNT(*) as total_classes,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_classes,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_classes,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_classes,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as attendance_percentage
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = $1
      GROUP BY c.course_name, c.course_code
      ORDER BY c.course_name
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        attendance: result.rows
      }
    });
  } catch (error) {
    console.error('Attendance summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch attendance summary'
    });
  }
});

// Get attendance for specific course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Check if student is enrolled in this course
    const enrollmentResult = await pool.query(
      'SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [studentId, courseId]
    );

    if (enrollmentResult.rows.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'You are not enrolled in this course'
      });
    }

    const result = await pool.query(`
      SELECT 
        a.date,
        a.status,
        a.remarks,
        c.course_name
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = $1 AND a.course_id = $2
      ORDER BY a.date DESC
    `, [studentId, courseId]);

    res.json({
      status: 'success',
      data: {
        attendance: result.rows
      }
    });
  } catch (error) {
    console.error('Course attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course attendance'
    });
  }
});

// Get monthly attendance
router.get('/monthly/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        a.date,
        a.status,
        c.course_name,
        c.course_code
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = $1 
        AND EXTRACT(YEAR FROM a.date) = $2 
        AND EXTRACT(MONTH FROM a.date) = $3
      ORDER BY a.date DESC
    `, [studentId, year, month]);

    res.json({
      status: 'success',
      data: {
        attendance: result.rows
      }
    });
  } catch (error) {
    console.error('Monthly attendance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch monthly attendance'
    });
  }
});

export default router;
