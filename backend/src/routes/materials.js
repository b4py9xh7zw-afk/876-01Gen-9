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
  
  const materials = db.all('materials', conditions).sort((a, b) => a.id - b.id);
  
  const result = materials.map(m => {
    const project = db.get('exam_projects', m.project_id);
    return {
      ...m,
      project_name: project ? project.name : null
    };
  });
  
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const material = db.get('materials', parseInt(req.params.id));
  
  if (!material) {
    return res.status(404).json({ message: '耗材不存在' });
  }
  
  const project = db.get('exam_projects', material.project_id);
  const result = {
    ...material,
    project_name: project ? project.name : null
  };
  
  res.json(result);
});

router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, unit, quantity, project_id } = req.body;

  if (!name || !unit || !project_id) {
    return res.status(400).json({ message: '名称、单位和项目不能为空' });
  }

  try {
    const result = db.insert('materials', {
      name,
      unit,
      quantity: quantity !== undefined ? quantity : 0,
      project_id: parseInt(project_id)
    });
    res.status(201).json({ id: result.lastInsertRowid, message: '创建成功' });
  } catch (error) {
    res.status(500).json({ message: '创建失败', error: error.message });
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { name, unit, quantity, project_id } = req.body;

  const material = db.get('materials', parseInt(req.params.id));
  if (!material) {
    return res.status(404).json({ message: '耗材不存在' });
  }

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (project_id !== undefined) updateData.project_id = parseInt(project_id);
    
    db.update('materials', parseInt(req.params.id), updateData);
    res.json({ message: '更新成功' });
  } catch (error) {
    res.status(500).json({ message: '更新失败', error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    db.remove('materials', parseInt(req.params.id));
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
