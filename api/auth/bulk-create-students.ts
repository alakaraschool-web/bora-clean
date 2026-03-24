import { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/services/authService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { students, school_id } = req.body;

  if (!students || !Array.isArray(students) || !school_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await authService.bulkCreateStudents(students, school_id);
    res.json(result);
  } catch (error: any) {
    console.error('Server Bulk Create Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
