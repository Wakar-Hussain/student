import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all courses for a student
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        c.id,
        c.course_code,
        c.course_name,
        c.credits,
        c.faculty_name,
        c.faculty_email,
        c.description,
        e.semester,
        e.year,
        e.grade,
        e.status
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1
      ORDER BY e.year DESC, e.semester DESC
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        courses: result.rows
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch courses'
    });
  }
});

// Get course details
router.get('/:courseId', authenticateToken, async (req, res) => {
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

    // Get course details
    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [courseId]
    );

    // Get assignments for this course
    const assignmentsResult = await pool.query(
      'SELECT * FROM assignments WHERE course_id = $1 ORDER BY due_date ASC',
      [courseId]
    );

    // Get attendance for this course
    const attendanceResult = await pool.query(`
      SELECT 
        date,
        status,
        remarks
      FROM attendance 
      WHERE student_id = $1 AND course_id = $2 
      ORDER BY date DESC
    `, [studentId, courseId]);

    res.json({
      status: 'success',
      data: {
        course: courseResult.rows[0],
        assignments: assignmentsResult.rows,
        attendance: attendanceResult.rows
      }
    });
  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch course details'
    });
  }
});

// Get timetable
router.get('/timetable/view', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get current semester courses
    const result = await pool.query(`
      SELECT 
        c.course_code,
        c.course_name,
        c.faculty_name,
        c.credits
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1 AND e.status = 'active'
      ORDER BY c.course_name
    `, [studentId]);

    // Mock timetable data (in real app, this would come from a timetable table)
    const timetable = {
      monday: [
        { time: '09:00-10:00', course: 'Data Structures', faculty: 'Dr. Alice Johnson', room: 'CS-101' },
        { time: '11:00-12:00', course: 'Database Systems', faculty: 'Dr. Bob Wilson', room: 'CS-102' }
      ],
      tuesday: [
        { time: '10:00-11:00', course: 'Data Structures', faculty: 'Dr. Alice Johnson', room: 'CS-101' },
        { time: '14:00-15:00', course: 'Database Systems', faculty: 'Dr. Bob Wilson', room: 'CS-102' }
      ],
      wednesday: [
        { time: '09:00-10:00', course: 'Data Structures', faculty: 'Dr. Alice Johnson', room: 'CS-101' }
      ],
      thursday: [
        { time: '11:00-12:00', course: 'Database Systems', faculty: 'Dr. Bob Wilson', room: 'CS-102' }
      ],
      friday: [
        { time: '10:00-11:00', course: 'Data Structures', faculty: 'Dr. Alice Johnson', room: 'CS-101' },
        { time: '15:00-16:00', course: 'Database Systems', faculty: 'Dr. Bob Wilson', room: 'CS-102' }
      ]
    };

    res.json({
      status: 'success',
      data: {
        courses: result.rows,
        timetable
      }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch timetable'
    });
  }
});

export default router;
