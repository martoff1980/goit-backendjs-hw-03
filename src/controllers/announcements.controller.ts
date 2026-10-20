import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { uploadToCloudinary } from '../utils/cloudinary';
import logger from '../logger';

export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
	const { search, sort, page } = req.query as {
		search?: string;
		sort?: 'newest' | 'oldest';
		page?: number;
	};

	const perPage = 10;
	const currentPage = page || 1;
	const skip = (currentPage - 1) * perPage;

	const where: any = {};
	if (search) {
		where.title = {
			contains: search,
			mode: 'insensitive',
		};
	}

	const orderBy = sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };

	const [total, announcements] = await Promise.all([
		prisma.announcement.count({ where }),
		prisma.announcement.findMany({
			where,
			orderBy,
			skip,
			take: perPage,
			include: {
				user: {
					select: {
						id: true,
						username: true,
						email: true,
						name: true,
					},
				},
			},
		}),
	]);

	const totalPages = Math.ceil(total / perPage);

	return res.status(200).json({
		data: announcements,
		pagination: {
			total,
			page: currentPage,
			totalPages,
			perPage,
		},
	});
});

export const getAnnouncementById = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);

	const announcement = await prisma.announcement.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					id: true,
					username: true,
					email: true,
					name: true,
				},
			},
		},
	});

	if (!announcement) {
		return res.status(404).json({ error: 'Announcement not found' });
	}

	return res.status(200).json(announcement);
});

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const { title, description, price, category } = req.body;
	let imageUrl: string | undefined = undefined;

	if (req.file) {
		imageUrl = await uploadToCloudinary(req.file.path);
		logger.info({ imageUrl }, 'Photo uploaded to Cloudinary and local file removed');
	}

	const announcement = await prisma.announcement.create({
		data: {
			title,
			description,
			price: Number(price),
			category,
			imageUrl,
			userId,
		},
		include: {
			user: {
				select: {
					id: true,
					username: true,
					email: true,
					name: true,
				},
			},
		},
	});

	logger.info({ announcementId: announcement.id }, 'Announcement created');

	return res.status(201).json(announcement);
});

export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	const userId = req.user!.id;

	const announcement = await prisma.announcement.findUnique({ where: { id } });

	if (!announcement) {
		return res.status(404).json({ error: 'Announcement not found' });
	}

	if (announcement.userId !== Number(userId)) {
		return res.status(403).json({ error: 'Access denied' });
	}

	const dataToUpdate: any = { ...req.body };
	if (dataToUpdate.price) {
		dataToUpdate.price = Number(dataToUpdate.price);
	}

	if (req.file) {
		dataToUpdate.imageUrl = await uploadToCloudinary(req.file.path);
		logger.info({ imageUrl: dataToUpdate.imageUrl }, 'Photo updated on Cloudinary and local file removed');
	}

	const updated = await prisma.announcement.update({
		where: { id },
		data: dataToUpdate,
		include: {
			user: {
				select: {
					id: true,
					username: true,
					email: true,
					name: true,
				},
			},
		},
	});

	logger.info({ announcementId: updated.id }, 'Announcement updated');

	return res.status(200).json(updated);
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	const userId = req.user!.id;

	const announcement = await prisma.announcement.findUnique({ where: { id } });
	if (!announcement) {
		return res.status(404).json({ error: 'Announcement not found' });
	}

	if (announcement.userId !== Number(userId)) {
		return res.status(403).json({ error: 'Access denied' });
	}

	await prisma.announcement.delete({ where: { id } });

	logger.info({ announcementId: id }, 'Announcement deleted');

	return res.status(204).end();
});
