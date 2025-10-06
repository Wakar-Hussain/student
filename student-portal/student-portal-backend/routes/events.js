import express from 'express';
import { pool } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, upcoming } = req.query;

    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,
        e.location,
        e.event_type,
        e.max_participants,
        e.registration_deadline,
        COUNT(er.id) as registered_count,
        CASE WHEN er.student_id IS NOT NULL THEN true ELSE false END as is_registered
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.student_id = $1
    `;

    const params = [req.user.id];
    const conditions = [];

    if (type) {
      conditions.push(`e.event_type = $${params.length + 1}`);
      params.push(type);
    }

    if (upcoming === 'true') {
      conditions.push(`e.event_date > NOW()`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY e.id, er.student_id
      ORDER BY e.event_date ASC
    `;

    const result = await pool.query(query, params);

    res.json({
      status: 'success',
      data: {
        events: result.rows
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch events'
    });
  }
});

// Get event details
router.get('/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        e.*,
        COUNT(er.id) as registered_count,
        CASE WHEN er.student_id IS NOT NULL THEN true ELSE false END as is_registered
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id AND er.student_id = $1
      WHERE e.id = $2
      GROUP BY e.id, er.student_id
    `, [studentId, eventId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        event: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch event details'
    });
  }
});

// Register for event
router.post('/:eventId/register', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    // Check if event exists
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Check if registration deadline has passed
    if (new Date() > new Date(event.registration_deadline)) {
      return res.status(400).json({
        status: 'error',
        message: 'Registration deadline has passed'
      });
    }

    // Check if already registered
    const existingRegistration = await pool.query(
      'SELECT id FROM event_registrations WHERE event_id = $1 AND student_id = $2',
      [eventId, studentId]
    );

    if (existingRegistration.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Already registered for this event'
      });
    }

    // Check if event is full
    const registrationCount = await pool.query(
      'SELECT COUNT(*) FROM event_registrations WHERE event_id = $1',
      [eventId]
    );

    if (parseInt(registrationCount.rows[0].count) >= event.max_participants) {
      return res.status(400).json({
        status: 'error',
        message: 'Event is full'
      });
    }

    // Register for event
    const registrationResult = await pool.query(`
      INSERT INTO event_registrations (event_id, student_id, registration_date, status)
      VALUES ($1, $2, NOW(), 'registered')
      RETURNING id, registration_date, status
    `, [eventId, studentId]);

    res.status(201).json({
      status: 'success',
      message: 'Successfully registered for event',
      data: {
        registration: registrationResult.rows[0]
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register for event'
    });
  }
});

// Unregister from event
router.delete('/:eventId/unregister', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(
      'DELETE FROM event_registrations WHERE event_id = $1 AND student_id = $2 RETURNING id',
      [eventId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Registration not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Successfully unregistered from event'
    });
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to unregister from event'
    });
  }
});

// Get student's registered events
router.get('/my/registrations', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.event_date,
        e.location,
        e.event_type,
        er.registration_date,
        er.status
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.student_id = $1
      ORDER BY e.event_date ASC
    `, [studentId]);

    res.json({
      status: 'success',
      data: {
        registeredEvents: result.rows
      }
    });
  } catch (error) {
    console.error('Get registered events error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch registered events'
    });
  }
});

export default router;
