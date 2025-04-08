import jwt from 'jsonwebtoken';

// Middleware để xác thực token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401); // Không có token

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) return res.sendStatus(403); // Token không hợp lệ

        req.user = user; // Gán thông tin người dùng vào yêu cầu
        next();
    });
};

export default authenticateToken;
