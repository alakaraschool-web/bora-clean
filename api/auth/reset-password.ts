import { VercelRequest, VercelResponse } from '@vercel/node';
import { authService } from '../../src/services/authService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { profileId, newPassword } = req.body;

  if (!profileId || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await authService.resetPassword(profileId, newPassword);
    res.json(result);
  } catch (error: any) {
    console.error('Server Reset Password Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
