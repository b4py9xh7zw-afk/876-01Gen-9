const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { status, project_id, date, student_id, examiner_id } = req.query;
  
  let appointments = db.all('appointments');
  
  if (req.user.role === 'student') {
    appointments = appointments.filter(a => a.student_id === req.user.id);
  }
  
  if (req.user.role === 'examiner') {
    const examiner = db.findOne('examiners', { user_id: req.user.id });
    if (examiner) {
      appointments = appointments.filter(a => a.examiner_id === examiner.id);
    } else {
      return res.json([]);
    }
  }
  
  if (status) {
    appointments = appointments.filter(a => a.status === status);
  }
  
  if (project_id) {
    appointments = appointments.filter(a => a.project_id === parseInt(project_id));
  }
  
  if (date) {
    appointments = appointments.filter(a => a.exam_date === date);
  }
  
  if (student_id && req.user.role === 'admin') {
    appointments = appointments.filter(a => a.student_id === parseInt(student_id));
  }
  
  if (examiner_id && req.user.role === 'admin') {
    appointments = appointments.filter(a => a.examiner_id === parseInt(examiner_id));
  }
  
  appointments.sort((a, b) => {
    if (a.exam_date !== b.exam_date) return b.exam_date.localeCompare(a.exam_date);
    if (a.exam_time !== b.exam_time) return b.exam_time.localeCompare(a.exam_time);
    return b.id - a.id;
  });
  
  const result = appointments.map(a => {
    const student = db.get('users', a.student_id);
    const project = db.get('exam_projects', a.project_id);
    const workstation = a.workstation_id ? db.get('workstations', a.workstation_id) : null;
    const examiner = a.examiner_id ? db.get('examiners', a.examiner_id) : null;
    const examinerUser = examiner ? db.get('users', examiner.user_id) : null;
    
    return {
      ...a,
      student_name: student ? student.name : null,
      student_phone: student ? student.phone : null,
      project_name: project ? project.name : null,
      project_code: project ? project.code : null,
      duration: project ? project.duration : null,
      workstation_name: workstation ? workstation.name : null,
      workstation_code: workstation ? workstation.code : null,
      examiner_name: examinerUser ? examinerUser.name : null
    };
  });
  
  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const appointment = db.get('appointments', parseInt(req.params.id));
  
  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' });
  }
  
  if (req.user.role === 'student' && appointment.student_id !== req.user.id) {
    return res.status(403).json({ message: '无权查看他人预约' });
  }
  
  const student = db.get('users', appointment.student_id);
  const project = db.get('exam_projects', appointment.project_id);
  const workstation = appointment.workstation_id ? db.get('workstations', appointment.workstation_id) : null;
  const examiner = appointment.examiner_id ? db.get('examiners', appointment.examiner_id) : null;
  const examinerUser = examiner ? db.get('users', examiner.user_id) : null;
  
  const materials = db.all('appointment_materials', { appointment_id: appointment.id }).map(am => {
    const material = db.get('materials', am.material_id);
    return {
      ...am,
      name: material ? material.name : null,
      unit: material ? material.unit : null
    };
  });
  
  const result = {
    ...appointment,
    student_name: student ? student.name : null,
    student_phone: student ? student.phone : null,
    student_id_card: student ? student.id_card : null,
    project_name: project ? project.name : null,
    project_code: project ? project.code : null,
    duration: project ? project.duration : null,
    workstation_name: workstation ? workstation.name : null,
    workstation_code: workstation ? workstation.code : null,
    examiner_name: examinerUser ? examinerUser.name : null,
    examiner_title: examiner ? examiner.title : null,
    materials
  };
  
  res.json(result);
});

router.post('/', authMiddleware, (req, res) => {
  const { project_id, exam_date, exam_time } = req.body;

  if (!project_id || !exam_date || !exam_time) {
    return res.status(400).json({ message: '项目、考试日期和时间不能为空' });
  }

  const student_id = req.user.role === 'student' ? req.user.id : req.body.student_id;
  
  if (!student_id) {
    return res.status(400).json({ message: '考生不能为空' });
  }

  const project = db.get('exam_projects', parseInt(project_id));
  if (!project || project.status !== 1) {
    return res.status(400).json({ message: '考试项目不存在或未启用' });
  }

  try {
    const result = db.insert('appointments', {
      student_id: parseInt(student_id),
      project_id: parseInt(project_id),
      exam_date,
      exam_time,
      status: 'pending'
    });
    res.status(201).json({ id: result.lastInsertRowid, message: '预约成功，等待安排' });
  } catch (error) {
    res.status(500).json({ message: '预约失败', error: error.message });
  }
});

router.put('/:id/assign', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { workstation_id, examiner_id, materials } = req.body;

  const appointment = db.get('appointments', parseInt(req.params.id));
  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return res.status(400).json({ message: '该预约状态无法安排' });
  }

  try {
    db.transaction(() => {
      if (workstation_id) {
        const workstation = db.get('workstations', parseInt(workstation_id));
        if (!workstation || workstation.status !== 1) {
          throw new Error('工位不存在或未启用');
        }
      }

      if (examiner_id) {
        const examiner = db.get('examiners', parseInt(examiner_id));
        if (!examiner) {
          throw new Error('考评员不存在');
        }
      }

      const updateData = { status: 'approved' };
      if (workstation_id !== undefined) {
        updateData.workstation_id = workstation_id ? parseInt(workstation_id) : null;
      }
      if (examiner_id !== undefined) {
        updateData.examiner_id = examiner_id ? parseInt(examiner_id) : null;
      }
      db.update('appointments', parseInt(req.params.id), updateData);

      if (materials && materials.length > 0) {
        db.removeWhere('appointment_materials', { appointment_id: parseInt(req.params.id) });
        
        for (const mat of materials) {
          const material = db.get('materials', parseInt(mat.material_id));
          if (!material) {
            throw new Error(`耗材 ${mat.material_id} 不存在`);
          }
          if (material.quantity < mat.quantity) {
            throw new Error(`耗材 ${material.name} 库存不足`);
          }

          db.insert('appointment_materials', {
            appointment_id: parseInt(req.params.id),
            material_id: parseInt(mat.material_id),
            quantity: mat.quantity
          });
          
          db.update('materials', parseInt(mat.material_id), {
            quantity: material.quantity - mat.quantity
          });
        }
      }
    });

    res.json({ message: '安排成功' });
  } catch (error) {
    res.status(500).json({ message: '安排失败', error: error.message });
  }
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: '无效的状态' });
  }

  const appointment = db.get('appointments', parseInt(req.params.id));
  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (req.user.role === 'student' && appointment.student_id !== req.user.id) {
    return res.status(403).json({ message: '无权操作他人预约' });
  }

  if (req.user.role === 'student' && status !== 'cancelled') {
    return res.status(403).json({ message: '考生只能取消预约' });
  }

  try {
    db.update('appointments', parseInt(req.params.id), { status });
    res.json({ message: '状态更新成功' });
  } catch (error) {
    res.status(500).json({ message: '状态更新失败', error: error.message });
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    db.transaction(() => {
      db.removeWhere('appointment_materials', { appointment_id: parseInt(req.params.id) });
      db.removeWhere('scores', { appointment_id: parseInt(req.params.id) });
      db.remove('appointments', parseInt(req.params.id));
    });
    
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
