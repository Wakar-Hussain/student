import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all assignments for student
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.max_marks,
        c.course_name,
        c.course_code,
        s.marks_obtained,
        s.feedback,
        s.status as submission_status,
        s.submission_date
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE e.student_id = $1
      ORDER BY a.due_date ASC
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        assignments: result.rows
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignments'
    });
  }
});

// Get assignment details
router.get('/:assignmentId', authenticateToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.max_marks,
        a.file_path,
        c.course_name,
        c.course_code,
        s.marks_obtained,
        s.feedback,
        s.status as submission_status,
        s.submission_date,
        s.file_path as submission_file
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN submissions s ON a.id = s.assignment_id AND s.student_id = $1
      WHERE e.student_id = $1 AND a.id = $2
    `, [studentId, assignmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        assignment: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch assignment details'
    });
  }
});

// Submit assignment
router.post('/:assignmentId/submit', authenticateToken, async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.id;
    const { file_path, submission_text } = req.body;

    // Check if assignment exists and student is enrolled
    const assignmentResult = await pool.query(`
      SELECT a.id, a.due_date, c.course_name
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = $1 AND a.id = $2
    `, [studentId, assignmentId]);

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Assignment not found or you are not enrolled in this course'
      });
    }

    const assignment = assignmentResult.rows[0];

    // Check if due date has passed
    if (new Date() > new Date(assignment.due_date)) {
      return res.status(400).json({
        status: 'error',
        message: 'Assignment submission deadline has passed'
      });
    }

    // Check if already submitted
    const existingSubmission = await pool.query(
      'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
      [assignmentId, studentId]
    );

    if (existingSubmission.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Assignment already submitted'
      });
    }

    // Insert submission
    const submissionResult = await pool.query(`
      INSERT INTO submissions (assignment_id, student_id, file_path, submission_date, status)
      VALUES ($1, $2, $3, NOW(), 'submitted')
      RETURNING id, submission_date, status
    `, [assignmentId, studentId, file_path]);

    res.status(201).json({
      status: 'success',
      message: 'Assignment submitted successfully',
      data: {
        submission: submissionResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit assignment'
    });
  }
});

// Get upcoming assignments
router.get('/upcoming/list', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        a.id,
        a.title,
        a.due_date,
        c.course_name,
        c.course_code,
        EXTRACT(EPOCH FROM (a.due_date - NOW())) / 86400 as days_remaining
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = $1 AND a.due_date > NOW()
      ORDER BY a.due_date ASC
      LIMIT 10
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        upcomingAssignments: result.rows
      }
    });
  } catch (error) {
    console.error('Get upcoming assignments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch upcoming assignments'
    });
  }
});

export default router;
