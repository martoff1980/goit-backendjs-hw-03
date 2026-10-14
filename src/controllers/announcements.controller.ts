import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';

export const getAnnouncements = async (req: Request, res: Response) => {
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
};

export const getAnnouncementById = async (req: Request, res: Response) => {
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
};

export const createAnnouncement = async (req: Request, res: Response) => {
	const userId = req.user!.id;
	const { title, description, price, category } = req.body;

	const announcement = await prisma.announcement.create({
		data: {
			title,
			description,
			price,
			category,
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

	return res.status(201).json(announcement);
};

export const updateAnnouncement = async (req: Request, res: Response) => {
	const id = Number(req.params.id);
	const userId = req.user!.id;

	const announcement = await prisma.announcement.findUnique({ where: { id } });

	if (!announcement) {
		return res.status(404).json({ error: 'Announcement not found' });
	}

	if (announcement.userId !== Number(userId)) {
		return res.status(403).json({ error: 'Access denied' });
	}

	const updated = await prisma.announcement.update({
		where: { id },
		data: req.body,
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

	return res.status(200).json(updated);
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
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

	return res.status(204).end();
};
