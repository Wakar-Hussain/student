import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new student
router.post('/register', async (req, res) => {
  try {
    const {
      student_id,
      name,
      email,
      password,
      phone,
      department,
      year,
      semester,
      roll_number,
      address,
      date_of_birth,
      parent_name,
      parent_phone
    } = req.body;

    // Validation
    if (!student_id || !name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID, name, email, and password are required'
      });
    }

    // Check if student already exists
    const existingStudent = await pool.query(
      'SELECT id FROM students WHERE email = $1 OR student_id = $2 OR roll_number = $3',
      [email, student_id, roll_number]
    );

    if (existingStudent.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Student with this email, student ID, or roll number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert new student
    const result = await pool.query(`
      INSERT INTO students (
        student_id, name, email, password, phone, department, year, semester,
        roll_number, address, date_of_birth, parent_name, parent_phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, student_id, name, email, department, year, semester, roll_number
    `, [
      student_id, name, email, hashedPassword, phone, department, year, semester,
      roll_number, address, date_of_birth, parent_name, parent_phone
    ]);

    const student = result.rows[0];

    // Generate JWT token
    const token = generateToken({ id: student.id, email: student.email });

    res.status(201).json({
      status: 'success',
      message: 'Student registered successfully',
      data: {
        token,
        student: {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          email: student.email,
          department: student.department,
          year: student.year,
          semester: student.semester,
          roll_number: student.roll_number
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed'
    });
  }
});

// Login student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Find student by email
    const result = await pool.query(
      'SELECT id, student_id, name, email, password, department, year, semester, roll_number FROM students WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const student = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({ id: student.id, email: student.email });

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        token,
        student: {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          email: student.email,
          department: student.department,
          year: student.year,
          semester: student.semester,
          roll_number: student.roll_number
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, student_id, name, email, phone, department, year, semester, roll_number, profile_image, address, date_of_birth, parent_name, parent_phone FROM students WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        student: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
});

export default router;
