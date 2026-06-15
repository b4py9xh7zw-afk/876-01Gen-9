const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const user = db.findOne('users', { username });

  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const isValidPassword = bcrypt.compareSync(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const token = generateToken(user);

  res.json({
    message: '登录成功',
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      phone: user.phone
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, name, phone, id_card, role } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ message: '用户名、密码和姓名不能为空' });
  }

  const userRole = role || 'student';
  
  if (!['student', 'examiner', 'admin'].includes(userRole)) {
    return res.status(400).json({ message: '无效的用户角色' });
  }

  const existingUser = db.findOne('users', { username });
  if (existingUser) {
    return res.status(400).json({ message: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const result = db.insert('users', {
      username,
      password: hashedPassword,
      name,
      role: userRole,
      phone: phone || null,
      id_card: id_card || null
    });

    const user = db.get('users', result.lastInsertRowid);
    const token = generateToken(user);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

router.get('/profile', authMiddleware, (req, res) => {
  const user = db.get('users', req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  const profile = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    id_card: user.id_card,
    created_at: user.created_at
  };

  if (user.role === 'examiner') {
    const examiner = db.findOne('examiners', { user_id: user.id });
    if (examiner) {
      const project = db.get('exam_projects', examiner.project_id);
      profile.examiner = {
        ...examiner,
        project_name: project ? project.name : null
      };
    }
  }

  res.json(profile);
});

module.exports = router;
