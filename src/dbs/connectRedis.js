import { createClient } from "redis";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

class RedisClient {
    static instance = null;

    constructor() {
        this.client = createClient({
            url: `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        });

        this.client.on("error", (err) => {
            console.error("Redis error:", err);
        });

        this.client.connect().then(async () => {
            console.log("Connected to Redis (Upstash)");

            // Cấu hình notify-keyspace-events
            await this.client.configSet("notify-keyspace-events", "KEA");
            console.log("Đã bật notify-keyspace-events: KEA");
        });

    }

    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
}

export default RedisClient.getInstance();
