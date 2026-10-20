import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import logger from '../logger';
import { existsSync } from 'fs';

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
	try {
		// Loading file to Cloudinary
		const result = await cloudinary.uploader.upload(filePath, {
			folder: 'announcements',
		});
		return result.secure_url;
	} finally {
		// Ensure local file is unlinked even if upload fails
		try {
			// Remove local file
			if (filePath && existsSync(filePath)) {
				await fs.unlink(filePath);
			}
		} catch (unlinkError: string | any) {
			logger.error({ unlinkError }, 'Error deleting local file:');
		}
	}
};
