const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const projects = db.all('exam_projects', { status: 1 }).sort((a, b) => a.id - b.id);
  
  const result = projects.map(project => ({
    ...project,
    workstation_count: db.count('workstations', { project_id: project.id }),
    examiner_count: db.count('examiners', { project_id: project.id })
  }));
  
  res.json(result);
});

router.get('/all', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const projects = db.all('exam_projects').sort((a, b) => a.id - b.id);
  
  const result = projects.map(project => ({
    ...project,
    workstation_count: db.count('workstations', { project_id: project.id }),
    examiner_count: db.count('examiners', { project_id: project.id }),
    criteria_count: db.count('scoring_criteria', { project_id: project.id })
  }));
  
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const project = db.get('exam_projects', parseInt(req.params.id));
  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }
  res.json(project);
});

router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, code, description, duration } = req.body;

  if (!name || !code) {
    return res.status(400).json({ message: '项目名称和编码不能为空' });
  }

  const existing = db.findOne('exam_projects', { code });
  if (existing) {
    return res.status(400).json({ message: '项目编码已存在' });
  }

  try {
    const result = db.insert('exam_projects', {
      name,
      code,
      description: description || '',
      duration: duration || 120,
      status: 1
    });
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, code, description, duration, status } = req.body;

  const project = db.get('exam_projects', parseInt(req.params.id));
  if (!project) {
    return res.status(404).json({ message: '项目不存在' });
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = duration;
    if (status !== undefined) updateData.status = status;
    
    db.update('exam_projects', parseInt(req.params.id), updateData);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    db.remove('exam_projects', parseInt(req.params.id));
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

router.get('/:id/criteria', authMiddleware, (req, res) => {
  const criteria = db.all('scoring_criteria', { project_id: parseInt(req.params.id) })
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  res.json(criteria);
});

router.post('/:id/criteria', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { category, name, max_score, sort_order } = req.body;

  if (!category || !name || !max_score) {
    return res.status(400).json({ message: '分类、名称和满分不能为空' });
  }

  if (!['step', 'product', 'safety'].includes(category)) {
    return res.status(400).json({ message: '无效的评分分类' });
  }

  try {
    const result = db.insert('scoring_criteria', {
      project_id: parseInt(req.params.id),
      category,
      name,
      max_score,
      sort_order: sort_order || 0
    });
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/criteria/:criteriaId', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { category, name, max_score, sort_order } = req.body;

  try {
    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (name !== undefined) updateData.name = name;
    if (max_score !== undefined) updateData.max_score = max_score;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    
    db.update('scoring_criteria', parseInt(req.params.criteriaId), updateData);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/criteria/:criteriaId', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    db.remove('scoring_criteria', parseInt(req.params.criteriaId));
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
