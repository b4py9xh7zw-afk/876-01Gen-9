const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { project_id } = req.query;
  
  let conditions = {};
  if (project_id) {
    conditions.project_id = parseInt(project_id);
  }
  
  const examiners = db.all('examiners', conditions).sort((a, b) => a.id - b.id);
  
  const result = examiners.map(e => {
    const user = db.get('users', e.user_id);
    const project = db.get('exam_projects', e.project_id);
    return {
      ...e,
      name: user ? user.name : null,
      username: user ? user.username : null,
      phone: user ? user.phone : null,
      project_name: project ? project.name : null
    };
  });
  
  res.json(result);
});

router.get('/available', authMiddleware, (req, res) => {
  const { project_id, date, time } = req.query;

  if (!project_id || !date || !time) {
    return res.status(400).json({ message: '参数不完整' });
  }

  const appointments = db.all('appointments', { 
    project_id: parseInt(project_id), 
    exam_date: date, 
    exam_time: time 
  }).filter(a => a.status === 'pending' || a.status === 'approved');
  
  const occupiedIds = appointments.map(a => a.examiner_id).filter(Boolean);
  
  const examiners = db.all('examiners', { project_id: parseInt(project_id) })
    .filter(e => !occupiedIds.includes(e.id))
    .sort((a, b) => a.id - b.id);
  
  const result = examiners.map(e => {
    const user = db.get('users', e.user_id);
    return {
      ...e,
      name: user ? user.name : null,
      username: user ? user.username : null
    };
  });
  
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const examiner = db.get('examiners', parseInt(req.params.id));
  
  if (!examiner) {
    return res.status(404).json({ message: '考评员不存在' });
  }
  
  const user = db.get('users', examiner.user_id);
  const project = db.get('exam_projects', examiner.project_id);
  
  const result = {
    ...examiner,
    name: user ? user.name : null,
    username: user ? user.username : null,
    phone: user ? user.phone : null,
    id_card: user ? user.id_card : null,
    project_name: project ? project.name : null
  };
  
  res.json(result);
});

router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { username, password, name, phone, id_card, project_id, title } = req.body;

  if (!username || !password || !name || !project_id) {
    return res.status(400).json({ message: '用户名、密码、姓名和项目不能为空' });
  }

  const existingUser = db.findOne('users', { username });
  if (existingUser) {
    return res.status(400).json({ message: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    const userId = db.transaction(() => {
      const userResult = db.insert('users', {
        username,
        password: hashedPassword,
        name,
        role: 'examiner',
        phone: phone || null,
        id_card: id_card || null
      });

      db.insert('examiners', {
        user_id: userResult.lastInsertRowid,
        project_id: parseInt(project_id),
        title: title || ''
      });

      return userResult.lastInsertRowid;
    });

    res.status(201).json({ id: userId, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, phone, id_card, project_id, title } = req.body;

  const examiner = db.get('examiners', parseInt(req.params.id));
  if (!examiner) {
    return res.status(404).json({ message: '考评员不存在' });
  }

  try {
    db.transaction(() => {
      const userUpdateData = {};
      if (name !== undefined) userUpdateData.name = name;
      if (phone !== undefined) userUpdateData.phone = phone;
      if (id_card !== undefined) userUpdateData.id_card = id_card;
      
      if (Object.keys(userUpdateData).length > 0) {
        db.update('users', examiner.user_id, userUpdateData);
      }

      const examinerUpdateData = {};
      if (project_id !== undefined) examinerUpdateData.project_id = parseInt(project_id);
      if (title !== undefined) examinerUpdateData.title = title;
      
      if (Object.keys(examinerUpdateData).length > 0) {
        db.update('examiners', parseInt(req.params.id), examinerUpdateData);
      }
    });

    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const examiner = db.get('examiners', parseInt(req.params.id));
  if (!examiner) {
    return res.status(404).json({ message: '考评员不存在' });
  }

  try {
    db.transaction(() => {
      db.remove('examiners', parseInt(req.params.id));
      db.remove('users', examiner.user_id);
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
