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
            
            // await this.resetTransactionExpirations();
        });

    }

    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    // async resetTransactionExpirations() {
    //     console.log("Đang quét các key transaction:* để đặt lại TTL...");
    //     let cursor = '0';
    //     let totalKeysProcessed = 0;

    //     do {
    //         const reply = await this.client.scan(cursor, {
    //             MATCH: "transaction:*",
    //             COUNT: 100
    //         });

    //         cursor = String(reply.cursor);
    //         const keys = reply.keys;

    //         for (const key of keys) {
    //             const ttl = await this.client.ttl(key);
    //             if (ttl === -1 || ttl <= 10) {
    //                 await this.client.expire(key, 10);
    //                 console.log(`Đã đặt lại TTL cho ${key}`);
    //             } else if (ttl > 10) {
    //                 await this.client.expire(key, ttl);
    //                 console.log(`${key} vẫn có TTL ${ttl}s, không cần đặt lại.`);
    //             }
    //             totalKeysProcessed++;
    //         }
    //     } while (cursor !== '0'); //cursor đáng ra phải là chuỗi nhưng redis ép kiểu sang số

    //     console.log(`Hoàn tất! Đã kiểm tra ${totalKeysProcessed} key transaction:*`);
    // }
}

export default RedisClient.getInstance();
