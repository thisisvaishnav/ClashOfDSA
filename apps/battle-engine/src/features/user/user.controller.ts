import { Request, Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { searchUsers } from './user.service';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().int().positive().max(20).default(10),
});

export const handleSearchUsers = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const parsed = searchQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }

  const data = await searchUsers(parsed.data.q, authReq.user.id, parsed.data.limit);
  res.json({ success: true, data });
};
