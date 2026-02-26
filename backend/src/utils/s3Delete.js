import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3.js";
import config from "../config/index.js";
import logger from "./logger.js";

/**
 * Delete an object from S3 by its key
 * @param {string} key - The S3 object key (e.g. "hubs/1234-banner.png")
 * @returns {Promise<boolean>} True if deleted, false if failed
 */
export const deleteS3Object = async (key) => {
    if (!key) return false;

    // Skip if it's a full URL from an external source
    if (key.startsWith("http")) {
        logger.warn("Skipping S3 delete for external URL: %s", key);
        return false;
    }

    try {
        // Determine bucket (scripts vs images)
        const isScript = key.endsWith('.lua') || key.endsWith('.luau') || key.endsWith('.txt');
        const targetBucket = isScript ? config.s3.bucketScripts : config.s3.bucketImages;

        const command = new DeleteObjectCommand({
            Bucket: targetBucket,
            Key: key,
        });

        await s3Client.send(command);
        logger.info("Deleted S3 object: %s", key);
        return true;
    } catch (error) {
        logger.error("Failed to delete S3 object %s: %o", key, error);
        return false;
    }
};
