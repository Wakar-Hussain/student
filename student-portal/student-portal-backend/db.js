import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(15),
        department VARCHAR(50),
        year INTEGER,
        semester INTEGER,
        roll_number VARCHAR(20) UNIQUE,
        profile_image TEXT,
        address TEXT,
        date_of_birth DATE,
        parent_name VARCHAR(100),
        parent_phone VARCHAR(15),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create courses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        course_code VARCHAR(20) UNIQUE NOT NULL,
        course_name VARCHAR(100) NOT NULL,
        department VARCHAR(50),
        semester INTEGER,
        credits INTEGER,
        faculty_name VARCHAR(100),
        faculty_email VARCHAR(100),
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        course_id INTEGER REFERENCES courses(id),
        semester INTEGER,
        year INTEGER,
        grade VARCHAR(5),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(student_id, course_id, semester, year)
      );
    `);

    // Create attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        course_id INTEGER REFERENCES courses(id),
        date DATE NOT NULL,
        status VARCHAR(10) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        due_date TIMESTAMPTZ,
        max_marks INTEGER,
        file_path TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create submissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        assignment_id INTEGER REFERENCES assignments(id),
        student_id INTEGER REFERENCES students(id),
        file_path TEXT,
        submission_date TIMESTAMPTZ DEFAULT NOW(),
        marks_obtained INTEGER,
        feedback TEXT,
        status VARCHAR(20) DEFAULT 'submitted'
      );
    `);

    // Create fees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fees (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        fee_type VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        due_date DATE,
        paid_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        event_date TIMESTAMPTZ,
        location VARCHAR(100),
        event_type VARCHAR(50),
        max_participants INTEGER,
        registration_deadline TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create event_registrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id),
        student_id INTEGER REFERENCES students(id),
        registration_date TIMESTAMPTZ DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'registered',
        UNIQUE(event_id, student_id)
      );
    `);

    // Create notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        title VARCHAR(200) NOT NULL,
        message TEXT,
        type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_email ON students (email);
      CREATE INDEX IF NOT EXISTS idx_students_student_id ON students (student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_student_course ON attendance (student_id, course_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);
      CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments (student_id);
      CREATE INDEX IF NOT EXISTS idx_fees_student ON fees (student_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_student ON notifications (student_id);
    `);

    // Create trigger function for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger for students table
    await client.query(`
      DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
      CREATE TRIGGER trg_students_updated_at
      BEFORE UPDATE ON students
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Insert dummy data
export async function insertDummyData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if dummy data already exists
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    if (parseInt(studentCount.rows[0].count) > 0) {
      console.log('Dummy data already exists, skipping...');
      await client.query('COMMIT');
      return;
    }

    // Insert dummy students
    const students = [
      {
        student_id: 'STU001',
        name: 'John Doe',
        email: 'john.doe@university.edu',
        password: '$2a$12$XvJMv1aBc5/HkQjzMu8A2Oqb8/cHJRAtaSCpLoUNmWNsV5I0ZlSx6', // password
        phone: '+1234567890',
        department: 'Computer Science',
        year: 3,
        semester: 6,
        roll_number: 'CS2021001',
        address: '123 University Ave, City, State',
        date_of_birth: '2002-05-15',
        parent_name: 'Robert Doe',
        parent_phone: '+1234567891'
      },
      {
        student_id: 'STU002',
        name: 'Jane Smith',
        email: 'jane.smith@university.edu',
        password: '$2a$12$XvJMv1aBc5/HkQjzMu8A2Oqb8/cHJRAtaSCpLoUNmWNsV5I0ZlSx6', // password
        phone: '+1234567892',
        department: 'Electronics',
        year: 2,
        semester: 4,
        roll_number: 'EC2022001',
        address: '456 College St, City, State',
        date_of_birth: '2003-08-20',
        parent_name: 'Mary Smith',
        parent_phone: '+1234567893'
      }
    ];

    for (const student of students) {
      await client.query(`
        INSERT INTO students (student_id, name, email, password, phone, department, year, semester, roll_number, address, date_of_birth, parent_name, parent_phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        student.student_id, student.name, student.email, student.password,
        student.phone, student.department, student.year, student.semester,
        student.roll_number, student.address, student.date_of_birth,
        student.parent_name, student.parent_phone
      ]);
    }

    // Insert dummy courses
    const courses = [
      {
        course_code: 'CS301',
        course_name: 'Data Structures and Algorithms',
        department: 'Computer Science',
        semester: 5,
        credits: 4,
        faculty_name: 'Dr. Alice Johnson',
        faculty_email: 'alice.johnson@university.edu',
        description: 'Advanced data structures and algorithm analysis'
      },
      {
        course_code: 'CS302',
        course_name: 'Database Management Systems',
        department: 'Computer Science',
        semester: 5,
        credits: 3,
        faculty_name: 'Dr. Bob Wilson',
        faculty_email: 'bob.wilson@university.edu',
        description: 'Database design and management principles'
      },
      {
        course_code: 'EC201',
        course_name: 'Digital Electronics',
        department: 'Electronics',
        semester: 3,
        credits: 4,
        faculty_name: 'Dr. Carol Davis',
        faculty_email: 'carol.davis@university.edu',
        description: 'Digital circuit design and analysis'
      }
    ];

    for (const course of courses) {
      await client.query(`
        INSERT INTO courses (course_code, course_name, department, semester, credits, faculty_name, faculty_email, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        course.course_code, course.course_name, course.department,
        course.semester, course.credits, course.faculty_name,
        course.faculty_email, course.description
      ]);
    }

    // Insert dummy enrollments
    const enrollments = [
      { student_id: 1, course_id: 1, semester: 5, year: 2024, grade: 'A' },
      { student_id: 1, course_id: 2, semester: 5, year: 2024, grade: 'B+' },
      { student_id: 2, course_id: 3, semester: 3, year: 2024, grade: 'A-' }
    ];

    for (const enrollment of enrollments) {
      await client.query(`
        INSERT INTO enrollments (student_id, course_id, semester, year, grade, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [enrollment.student_id, enrollment.course_id, enrollment.semester, enrollment.year, enrollment.grade, 'active']);
    }

    // Insert dummy fees
    const fees = [
      { student_id: 1, fee_type: 'Tuition Fee', amount: 50000.00, due_date: '2024-01-15', status: 'paid', paid_date: '2024-01-10' },
      { student_id: 1, fee_type: 'Library Fee', amount: 2000.00, due_date: '2024-02-01', status: 'paid', paid_date: '2024-01-25' },
      { student_id: 1, fee_type: 'Exam Fee', amount: 3000.00, due_date: '2024-03-01', status: 'pending' },
      { student_id: 2, fee_type: 'Tuition Fee', amount: 50000.00, due_date: '2024-01-15', status: 'paid', paid_date: '2024-01-12' },
      { student_id: 2, fee_type: 'Library Fee', amount: 2000.00, due_date: '2024-02-01', status: 'pending' }
    ];

    for (const fee of fees) {
      await client.query(`
        INSERT INTO fees (student_id, fee_type, amount, due_date, status, paid_date)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [fee.student_id, fee.fee_type, fee.amount, fee.due_date, fee.status, fee.paid_date]);
    }

    // Insert dummy events
    const events = [
      {
        title: 'Tech Fest 2024',
        description: 'Annual technology festival with coding competitions and workshops',
        event_date: '2024-04-15 09:00:00',
        location: 'Main Auditorium',
        event_type: 'Festival',
        max_participants: 500,
        registration_deadline: '2024-04-10 23:59:59'
      },
      {
        title: 'Career Guidance Workshop',
        description: 'Workshop on resume building and interview preparation',
        event_date: '2024-03-20 14:00:00',
        location: 'Conference Room A',
        event_type: 'Workshop',
        max_participants: 50,
        registration_deadline: '2024-03-18 23:59:59'
      }
    ];

    for (const event of events) {
      await client.query(`
        INSERT INTO events (title, description, event_date, location, event_type, max_participants, registration_deadline)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        event.title, event.description, event.event_date, event.location,
        event.event_type, event.max_participants, event.registration_deadline
      ]);
    }

    // Insert dummy notifications
    const notifications = [
      { student_id: 1, title: 'Fee Payment Reminder', message: 'Your exam fee is due on March 1, 2024', type: 'fee' },
      { student_id: 1, title: 'Assignment Due', message: 'Data Structures assignment is due tomorrow', type: 'academic' },
      { student_id: 2, title: 'Library Fee Due', message: 'Your library fee is due on February 1, 2024', type: 'fee' }
    ];

    for (const notification of notifications) {
      await client.query(`
        INSERT INTO notifications (student_id, title, message, type, is_read)
        VALUES ($1, $2, $3, $4, $5)
      `, [notification.student_id, notification.title, notification.message, notification.type, false]);
    }

    await client.query('COMMIT');
    console.log('Dummy data inserted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to insert dummy data:', err);
    throw err;
  } finally {
    client.release();
  }
}