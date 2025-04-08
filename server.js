import dotenv from 'dotenv'
dotenv.config()
import app from './src/app.js'
import ngrok from 'ngrok'
const PORT =  3007;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})

// Hàm hủy kết nối ngrok
async function disconnectNgrok() {
    try {
        await ngrok.disconnect();  // Dừng phiên hiện tại
        await ngrok.kill();        // Dừng tất cả kết nối
        console.log('Đã tắt ngrok');
    } catch (err) {
        console.error('Lỗi khi tắt ngrok:', err);
    }
}

process.on('SIGTERM', async () => { // Khi tiến trình bị dừng
    if (process.env.NODE_ENV !== 'production') {
        await disconnectNgrok(); // Ngắt kết nối ngrok
    }
    process.exit(0);
});

process.on('SIGINT', (err, promise) => {
    server.close(async () => {
        console.log(`Server stopped`);
        if (process.env.NODE_ENV !== 'production') {
            await disconnectNgrok(); // Ngắt kết nối ngrok
        }
        process.exit(1);
    })
})

