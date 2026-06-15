const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { role } = req.query;
  
  let conditions = {};
  if (role) {
    conditions.role = role;
  }
  
  const users = db.all('users', conditions)
    .sort((a, b) => a.id - b.id)
    .map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      phone: u.phone,
      id_card: u.id_card,
      created_at: u.created_at
    }));
  
  res.json(users);
});

router.get('/:id', authMiddleware, (req, res) => {
  const user = db.get('users', parseInt(req.params.id));
  
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }
  
  const result = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    id_card: user.id_card,
    created_at: user.created_at
  };
  
  res.json(result);
});

router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { username, password, name, role, phone, id_card } = req.body;

  if (!username || !password || !name || !role) {
    return res.status(400).json({ message: '用户名、密码、姓名和角色不能为空' });
  }

  if (!['admin', 'examiner', 'student'].includes(role)) {
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
      role,
      phone: phone || null,
      id_card: id_card || null
    });
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, phone, id_card, role, password } = req.body;

  const user = db.get('users', parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  let hashedPassword = null;
  if (password) {
    hashedPassword = bcrypt.hashSync(password, 10);
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (id_card !== undefined) updateData.id_card = id_card;
    if (role !== undefined) updateData.role = role;
    if (hashedPassword !== null) updateData.password = hashedPassword;
    
    db.update('users', parseInt(req.params.id), updateData);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const user = db.get('users', parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  try {
    if (user.role === 'examiner') {
      db.removeWhere('examiners', { user_id: parseInt(req.params.id) });
    }
    db.remove('users', parseInt(req.params.id));
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
