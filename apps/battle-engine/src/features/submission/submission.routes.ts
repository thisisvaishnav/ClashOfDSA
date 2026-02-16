import { Router } from 'express';
import { requireAuth } from '../auth/auth.controller';
import {
  handleCreatePracticeSubmission,
  handleGetPracticeSubmissions,
} from './practice-submission.controller';

const submissionRouter = Router();

submissionRouter.use(requireAuth);

submissionRouter.post('/api/submissions/practice', handleCreatePracticeSubmission);
submissionRouter.get('/api/submissions/practice', handleGetPracticeSubmissions);

export { submissionRouter };
