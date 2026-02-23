import { Router } from 'express';
import { requireAuth } from '../auth/auth.controller';
import { handleSearchUsers } from './user.controller';

const userRouter = Router();

userRouter.get('/api/users/search', requireAuth, handleSearchUsers);

export { userRouter };
