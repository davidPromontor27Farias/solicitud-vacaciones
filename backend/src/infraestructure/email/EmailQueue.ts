import { Queue } from "bullmq";
import { redis } from "../cache/redisClient";


export const EMAIL_QUEUE_NAME = "email";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {connection: redis})
