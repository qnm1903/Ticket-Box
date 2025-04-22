import redisClient from './connectRedis.js';
import { createClient } from "redis";
import ticketTypeModel from "../models/ticket_type.model.js";
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

let notifySet = false;
while (!notifySet) {
    try {
        const result = await redisClient.client.configGet("notify-keyspace-events");
        if (result["notify-keyspace-events"].includes("E")) {
            notifySet = true;
            console.log("notify-keyspace-events đã được bật, khởi chạy subscriber");
        } else {
            console.log("Đang chờ notify-keyspace-events được bật");
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (err) {
        console.error("Lỗi khi kiểm tra notify-keyspace-events:", err);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

// Redis không cho dùng chung kết nối get/set và pub/sub
const redisSubscriber = createClient({
    url: `rediss://default:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisSubscriber.on("error", (error) => {
    console.error("Lỗi kết nối Redis Subscriber:", error);
});

redisSubscriber.on("connect", () => {
    console.log("Connected to Redis Subscriber (Upstash)");
});

await redisSubscriber.connect();

async function handleExpiredTransaction(transactionID) {
    // Lấy dữ liệu từ pending_transactions
    let transactionData = await redisClient.client.hGet("pending_transactions", transactionID);
    if (!transactionData) {
        console.log(`Không tìm thấy ${transactionID} trong pending_transactions.`);
        transactionData = await redisClient.client.get(transactionID);
    }

    const { selectedTicketsArray } = JSON.parse(transactionData);
    console.log('selectedTickets:', selectedTicketsArray);

    for (const ticket of selectedTicketsArray) {
        await ticketTypeModel.updateOne(
            { ticketTypeID: ticket.ticketTypeID },
            { $inc: { quantity: ticket.quantity } }
        );
    }

    console.log(`Đã hoàn lại vé cho giao dịch ${transactionID}.`);

    // Xóa khỏi pending_transactions sau khi xử lý xong
    await redisClient.client.hDel("pending_transactions", transactionID);
}

async function verifyPendingTransactions() {
    console.log("Kiểm tra các pending transactions...");
    const pendingTransactions = await redisClient.client.hGetAll("pending_transactions");
    for (const transactionID in pendingTransactions) {
        // Kiểm tra sự tồn tại của key transaction đó
        const exists = await redisClient.client.exists(transactionID);
        if (!exists) {
            console.log(`Transaction ${transactionID} không còn tồn tại trong Redis, thực hiện xử lý hết hạn`);
            await handleExpiredTransaction(transactionID);
        }
    }
}
await verifyPendingTransactions();

async function startRedisSubscriber() {
    await redisSubscriber.pSubscribe(`__keyevent@0__:*`, async (key, event) => {
        console.log(`Received Event: ${event}, Key: ${key}`);

        if (event === "__keyevent@0__:expired") {
            try {
                if (!key.startsWith("transaction:")) return;

                console.log(`Giao dịch ${key} đã hết hạn! Bắt đầu hoàn vé`);
                await handleExpiredTransaction(key);
            } catch (error) {
                console.error("Lỗi khi xử lý sự kiện hết hạn key:", error);
            }
        }

        if (event === "__keyevent@0__:set") {
            try {
                if (key.startsWith("transaction:")) {
                    const transactionData = await redisClient.client.get(key);
                    if (transactionData) {
                        await redisClient.client.hSet("pending_transactions", key, transactionData);
                        console.log(`Transaction ${key} vừa được tạo và thêm vào pending_transactions.`);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi xử lý sự kiện set key:", error);
            }
        }
    });
}

startRedisSubscriber();