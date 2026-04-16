import { db } from './src/db';

async function verify() {
  try {
    const usersRes = await db.query('SELECT COUNT(*) FROM users');
    const projectsRes = await db.query('SELECT COUNT(*) FROM projects');
    const tasksRes = await db.query('SELECT COUNT(*) FROM tasks');
    const tagsRes = await db.query('SELECT COUNT(*) FROM tags');
    
    console.log('Verification Results:');
    console.log(`  Users: ${usersRes.rows[0].count}`);
    console.log(`  Projects: ${projectsRes.rows[0].count}`);
    console.log(`  Tasks: ${tasksRes.rows[0].count}`);
    console.log(`  Tags: ${tagsRes.rows[0].count}`);
    
    await db.end();
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
