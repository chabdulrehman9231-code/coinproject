const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setup() {
  const connectionString = 'postgresql://postgres.yqvffocoeebkxwypspff:H6wNnKZWr6Oi8LMn@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString,
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected!');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../../supabase_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL Schema...');
    await client.query(sql);
    console.log('SQL Executed Successfully! Tables, functions, and triggers created.');

    console.log('Setting up Super Admin User...');
    const supabase = createClient(
      'https://yqvffocoeebkxwypspff.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdmZmb2NvZWVia3h3eXBzcGZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzk1NDkyNSwiZXhwIjoyMDk5NTMwOTI1fQ.7vTgfyJFZIPuCdfhnmttv7OEb6eZEhpMjtl6UcnyrOY'
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@crypto.com',
      password: 'AdminPassword123!',
      email_confirm: true,
    });

    if (error) {
      console.error('Error creating admin user:', error.message);
    } else {
      console.log('Admin user created successfully!');
      console.log('Email: admin@crypto.com');
      console.log('Password: AdminPassword123!');
    }

  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await client.end();
  }
}

setup();
