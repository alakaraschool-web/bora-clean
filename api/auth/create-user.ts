import { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/services/authService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password, role, name, phone, school_id, student_id } = req.body;

  if (!email || !password || !role || !name || !school_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await authService.createUser(email, password, role, name, phone, school_id, student_id);
    res.json(result);
  } catch (error: any) {
    console.error('Server Create User Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
