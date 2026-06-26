import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      parent_name,
      student_name,
      age,
      country,
      whatsapp_number,
      chess_level,
      preferred_time,
    } = body;

    // Validate inputs
    if (!parent_name || !student_name || !age || !country || !whatsapp_number || !preferred_time) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'Database connection configuration is missing on server.' },
        { status: 500 }
      );
    }

    // Connect to Postgres
    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    // Generate random UUID for the record (corresponds to Django's UUIDField)
    const id = crypto.randomUUID();

    // Insert query to Django's academy_demobooking table
    const query = `
      INSERT INTO academy_demobooking (
        id, parent_name, student_name, age, country, whatsapp_number, chess_level, preferred_time, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      id,
      parent_name,
      student_name,
      parseInt(age, 10),
      country,
      whatsapp_number,
      chess_level || 'beginner',
      preferred_time,
      'new', // Default status: New Lead
      '',    // Default notes: empty
    ];

    const res = await client.query(query, values);
    await client.end();

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Database connection error inside Next.js Route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit demo booking to the database.' },
      { status: 500 }
    );
  }
}
