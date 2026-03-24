import { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/services/authService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { admissionNumber, namePart } = req.body;

  if (!admissionNumber || !namePart) {
    return res.status(400).json({ error: 'Missing admission number or name' });
  }

  try {
    const result = await authService.studentLoginVerify(admissionNumber, namePart);
    res.json(result);
  } catch (error: any) {
    console.error('Student Login Verify Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
