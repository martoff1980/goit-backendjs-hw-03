import { Router } from 'express';
import { getAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../controllers/announcements.controller';
import { authenticate } from '../middleware/authenticate';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { createAnnouncementSchema, updateAnnouncementSchema, getAnnouncementsQuerySchema, announcementIdParamSchema } from '../validators/announcements.validator';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', validateQuery(getAnnouncementsQuerySchema), getAnnouncements);
router.get('/:id', validateParams(announcementIdParamSchema), getAnnouncementById);
router.post('/', authenticate, upload.single('imageUrl'), validateBody(createAnnouncementSchema), createAnnouncement);
router.patch('/:id', authenticate, upload.single('imageUrl'), validateParams(announcementIdParamSchema), validateBody(updateAnnouncementSchema), updateAnnouncement);
router.delete('/:id', authenticate, validateParams(announcementIdParamSchema), deleteAnnouncement);

export default router;
