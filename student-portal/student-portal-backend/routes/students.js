import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get student dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student basic info
    const studentResult = await pool.query(
      'SELECT id, student_id, name, email, department, year, semester, roll_number, profile_image FROM students WHERE id = $1',
      [studentId]
    );

    // Get enrolled courses
    const coursesResult = await pool.query(`
      SELECT c.course_code, c.course_name, c.credits, c.faculty_name, e.grade
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1 AND e.status = 'active'
    `, [studentId]);

    // Get attendance summary
    const attendanceResult = await pool.query(`
      SELECT 
        c.course_name,
        COUNT(*) as total_classes,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_classes,
        ROUND(
          (COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as attendance_percentage
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      WHERE a.student_id = $1
      GROUP BY c.course_name
    `, [studentId]);

    // Get recent notifications
    const notificationsResult = await pool.query(
      'SELECT id, title, message, type, is_read, created_at FROM notifications WHERE student_id = $1 ORDER BY created_at DESC LIMIT 5',
      [studentId]
    );

    // Get upcoming assignments
    const assignmentsResult = await pool.query(`
      SELECT a.id, a.title, a.due_date, c.course_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = $1 AND a.due_date > NOW()
      ORDER BY a.due_date ASC
      LIMIT 5
    `, [studentId]);

    // Get fee summary
    const feesResult = await pool.query(`
      SELECT 
        COUNT(*) as total_fees,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_fees,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_fees,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
      FROM fees WHERE student_id = $1
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        student: studentResult.rows[0],
        courses: coursesResult.rows,
        attendance: attendanceResult.rows,
        notifications: notificationsResult.rows,
        upcomingAssignments: assignmentsResult.rows,
        feeSummary: feesResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get student profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM students WHERE id = $1',
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    const student = result.rows[0];
    delete student.password; // Remove password from response

    res.json({
      status: 'success',
      data: {
        student
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
});

// Update student profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      name,
      phone,
      address,
      parent_name,
      parent_phone
    } = req.body;

    const result = await pool.query(`
      UPDATE students 
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          address = COALESCE($3, address),
          parent_name = COALESCE($4, parent_name),
          parent_phone = COALESCE($5, parent_phone),
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, student_id, name, email, phone, department, year, semester, roll_number, address, parent_name, parent_phone
    `, [name, phone, address, parent_name, parent_phone, studentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        student: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
});

// Get academic performance
router.get('/academic-performance', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get semester-wise performance
    const performanceResult = await pool.query(`
      SELECT 
        e.semester,
        e.year,
        COUNT(*) as total_courses,
        AVG(CASE 
          WHEN e.grade = 'A+' THEN 10
          WHEN e.grade = 'A' THEN 9
          WHEN e.grade = 'B+' THEN 8
          WHEN e.grade = 'B' THEN 7
          WHEN e.grade = 'C+' THEN 6
          WHEN e.grade = 'C' THEN 5
          WHEN e.grade = 'D' THEN 4
          WHEN e.grade = 'F' THEN 0
          ELSE 0
        END) as sgpa
      FROM enrollments e
      WHERE e.student_id = $1 AND e.grade IS NOT NULL
      GROUP BY e.semester, e.year
      ORDER BY e.year, e.semester
    `, [studentId]);

    // Get course-wise grades
    const gradesResult = await pool.query(`
      SELECT 
        c.course_name,
        c.course_code,
        c.credits,
        e.grade,
        e.semester,
        e.year
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1 AND e.grade IS NOT NULL
      ORDER BY e.year DESC, e.semester DESC
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        semesterPerformance: performanceResult.rows,
        courseGrades: gradesResult.rows
      }
    });
  } catch (error) {
    console.error('Academic performance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch academic performance'
    });
  }
});

export default router;
