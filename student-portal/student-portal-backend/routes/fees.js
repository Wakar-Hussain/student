import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get fee summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_fees,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_fees,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_fees,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_fees,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue,
        SUM(amount) as total_amount
      FROM fees WHERE student_id = $1
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        feeSummary: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Fee summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch fee summary'
    });
  }
});

// Get all fees
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        id,
        fee_type,
        amount,
        due_date,
        paid_date,
        status,
        payment_method,
        transaction_id,
        created_at
      FROM fees 
      WHERE student_id = $1
      ORDER BY due_date ASC
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        fees: result.rows
      }
    });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch fees'
    });
  }
});

// Get fee details
router.get('/:feeId', authenticateToken, async (req, res) => {
  try {
    const { feeId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM fees WHERE id = $1 AND student_id = $2',
      [feeId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Fee not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        fee: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get fee details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch fee details'
    });
  }
});

// Simulate payment (for demo purposes)
router.post('/:feeId/pay', authenticateToken, async (req, res) => {
  try {
    const { feeId } = req.params;
    const studentId = req.user.id;
    const { payment_method, transaction_id } = req.body;

    // Check if fee exists and belongs to student
    const feeResult = await pool.query(
      'SELECT * FROM fees WHERE id = $1 AND student_id = $2',
      [feeId, studentId]
    );

    if (feeResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Fee not found'
      });
    }

    const fee = feeResult.rows[0];

    if (fee.status === 'paid') {
      return res.status(400).json({
        status: 'error',
        message: 'Fee already paid'
      });
    }

    // Update fee status
    const updateResult = await pool.query(`
      UPDATE fees 
      SET status = 'paid',
          paid_date = NOW(),
          payment_method = $1,
          transaction_id = $2
      WHERE id = $3 AND student_id = $4
      RETURNING *
    `, [payment_method, transaction_id, feeId, studentId]);

    res.json({
      status: 'success',
      message: 'Payment successful',
      data: {
        fee: updateResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Payment failed'
    });
  }
});

// Get payment history
router.get('/history/payments', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        id,
        fee_type,
        amount,
        paid_date,
        payment_method,
        transaction_id
      FROM fees 
      WHERE student_id = $1 AND status = 'paid'
      ORDER BY paid_date DESC
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        paymentHistory: result.rows
      }
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment history'
    });
  }
});

export default router;
