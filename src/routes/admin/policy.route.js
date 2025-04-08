import express from 'express';
const router = express.Router();

// Định nghĩa route cho /admin-policy
router.get('/', (req, res) => {
  res.render('admin-policy'); // Render file admin-policy.ejs
});

export default router;
