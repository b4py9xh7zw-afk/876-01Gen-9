const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { project_id } = req.query;
  
  let conditions = {};
  if (project_id) {
    conditions.project_id = parseInt(project_id);
  }
  
  const workstations = db.all('workstations', conditions).sort((a, b) => a.id - b.id);
  
  const result = workstations.map(ws => {
    const project = db.get('exam_projects', ws.project_id);
    return {
      ...ws,
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
  
  const occupiedIds = appointments.map(a => a.workstation_id).filter(Boolean);
  
  const workstations = db.all('workstations', { 
    project_id: parseInt(project_id), 
    status: 1 
  })
    .filter(ws => !occupiedIds.includes(ws.id))
    .sort((a, b) => a.id - b.id);
  
  const result = workstations.map(ws => {
    const project = db.get('exam_projects', ws.project_id);
    return {
      ...ws,
      project_name: project ? project.name : null
    };
  });
  
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const workstation = db.get('workstations', parseInt(req.params.id));
  
  if (!workstation) {
    return res.status(404).json({ message: '工位不存在' });
  }
  
  const project = db.get('exam_projects', workstation.project_id);
  const result = {
    ...workstation,
    project_name: project ? project.name : null
  };
  
  res.json(result);
});

router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, code, project_id, status } = req.body;

  if (!name || !code || !project_id) {
    return res.status(400).json({ message: '名称、编码和项目不能为空' });
  }

  const existing = db.findOne('workstations', { code });
  if (existing) {
    return res.status(400).json({ message: '工位编码已存在' });
  }

  try {
    const result = db.insert('workstations', {
      name,
      code,
      project_id: parseInt(project_id),
      status: status !== undefined ? status : 1
    });
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, code, project_id, status } = req.body;

  const workstation = db.get('workstations', parseInt(req.params.id));
  if (!workstation) {
    return res.status(404).json({ message: '工位不存在' });
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (project_id !== undefined) updateData.project_id = parseInt(project_id);
    if (status !== undefined) updateData.status = status;
    
    db.update('workstations', parseInt(req.params.id), updateData);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    db.remove('workstations', parseInt(req.params.id));
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
