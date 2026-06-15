const express = require('express');
const ExcelJS = require('exceljs');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/appointment/:appointmentId', authMiddleware, (req, res) => {
  const appointment = db.get('appointments', parseInt(req.params.appointmentId));
  
  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (req.user.role === 'student' && appointment.student_id !== req.user.id) {
    return res.status(403).json({ message: '无权查看他人成绩' });
  }

  if (req.user.role === 'examiner') {
    const examiner = db.findOne('examiners', { user_id: req.user.id });
    if (!examiner || examiner.id !== appointment.examiner_id) {
      return res.status(403).json({ message: '无权查看该考试成绩' });
    }
  }

  const criteriaList = db.all('scoring_criteria', { project_id: appointment.project_id })
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  
  const scores = db.all('scores', { appointment_id: appointment.id });
  const scoreMap = {};
  for (const s of scores) {
    scoreMap[s.criteria_id] = s;
  }
  
  const criteria = criteriaList.map(c => {
    const score = scoreMap[c.id];
    return {
      ...c,
      score_id: score ? score.id : null,
      score: score ? score.score : null,
      comment: score ? score.comment : null
    };
  });

  const totalScore = criteria.reduce((sum, c) => sum + (c.score || 0), 0);
  const maxScore = criteria.reduce((sum, c) => sum + c.max_score, 0);

  res.json({
    appointment_id: appointment.id,
    total_score: totalScore,
    max_score: maxScore,
    score_grade: appointment.score_grade,
    criteria
  });
});

router.post('/appointment/:appointmentId', authMiddleware, roleMiddleware('examiner', 'admin'), (req, res) => {
  const { scores } = req.body;

  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return res.status(400).json({ message: '评分数据不能为空' });
  }

  const appointment = db.get('appointments', parseInt(req.params.appointmentId));
  
  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (appointment.status === 'completed') {
    return res.status(400).json({ message: '考试已完成，无法再修改评分' });
  }

  if (req.user.role === 'examiner') {
    const examiner = db.findOne('examiners', { user_id: req.user.id });
    if (!examiner || examiner.id !== appointment.examiner_id) {
      return res.status(403).json({ message: '无权对该考试评分' });
    }
  }

  try {
    const result = db.transaction(() => {
      db.removeWhere('scores', { appointment_id: parseInt(req.params.appointmentId) });

      let totalScore = 0;
      let maxScore = 0;

      for (const item of scores) {
        const criteria = db.get('scoring_criteria', parseInt(item.criteria_id));
        if (!criteria || criteria.project_id !== appointment.project_id) {
          throw new Error(`评分标准 ${item.criteria_id} 不存在`);
        }
        if (item.score < 0 || item.score > criteria.max_score) {
          throw new Error(`${criteria.name} 分数超出范围`);
        }

        db.insert('scores', {
          appointment_id: parseInt(req.params.appointmentId),
          criteria_id: parseInt(item.criteria_id),
          score: item.score,
          comment: item.comment || ''
        });
        
        totalScore += item.score;
        maxScore += criteria.max_score;
      }

      const percentage = (totalScore / maxScore) * 100;
      let grade = '不及格';
      if (percentage >= 90) grade = '优秀';
      else if (percentage >= 80) grade = '良好';
      else if (percentage >= 70) grade = '中等';
      else if (percentage >= 60) grade = '及格';

      db.update('appointments', parseInt(req.params.appointmentId), {
        score: totalScore,
        score_grade: grade
      });

      return { totalScore, maxScore, grade };
    });

    res.json({ 
      message: '评分保存成功',
      total_score: result.totalScore,
      max_score: result.maxScore,
      grade: result.grade
    });
  } catch (error) {
    res.status(500).json({ message: '评分保存失败', error: error.message });
  }
});

router.put('/appointment/:appointmentId/complete', authMiddleware, roleMiddleware('examiner', 'admin'), (req, res) => {
  const appointment = db.get('appointments', parseInt(req.params.appointmentId));
  
  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (req.user.role === 'examiner') {
    const examiner = db.findOne('examiners', { user_id: req.user.id });
    if (!examiner || examiner.id !== appointment.examiner_id) {
      return res.status(403).json({ message: '无权操作该考试' });
    }
  }

  const scoreCount = db.count('scores', { appointment_id: parseInt(req.params.appointmentId) });
  if (scoreCount === 0) {
    return res.status(400).json({ message: '请先完成评分再提交' });
  }

  try {
    db.update('appointments', parseInt(req.params.appointmentId), { status: 'completed' });
    res.json({ message: '考试已完成' });
  } catch (error) {
    res.status(500).json({ message: '操作失败', error: error.message });
  }
});

router.get('/export/:appointmentId', authMiddleware, async (req, res) => {
  const appointment = db.get('appointments', parseInt(req.params.appointmentId));

  if (!appointment) {
    return res.status(404).json({ message: '预约不存在' });
  }

  if (req.user.role === 'student' && appointment.student_id !== req.user.id) {
    return res.status(403).json({ message: '无权导出他人成绩' });
  }

  const student = db.get('users', appointment.student_id);
  const project = db.get('exam_projects', appointment.project_id);
  const workstation = appointment.workstation_id ? db.get('workstations', appointment.workstation_id) : null;
  const examiner = appointment.examiner_id ? db.get('examiners', appointment.examiner_id) : null;
  const examinerUser = examiner ? db.get('users', examiner.user_id) : null;

  const appointmentInfo = {
    ...appointment,
    student_name: student ? student.name : null,
    student_phone: student ? student.phone : null,
    student_id_card: student ? student.id_card : null,
    project_name: project ? project.name : null,
    project_code: project ? project.code : null,
    workstation_name: workstation ? workstation.name : null,
    examiner_name: examinerUser ? examinerUser.name : null,
    examiner_title: examiner ? examiner.title : null
  };

  const criteriaList = db.all('scoring_criteria', { project_id: appointment.project_id })
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  
  const scores = db.all('scores', { appointment_id: appointment.id });
  const scoreMap = {};
  for (const s of scores) {
    scoreMap[s.criteria_id] = s;
  }
  
  const criteria = criteriaList.map(c => {
    const score = scoreMap[c.id];
    return {
      ...c,
      score: score ? score.score : null,
      comment: score ? score.comment : null
    };
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('评分表');

  worksheet.columns = [
    { header: '评分项目', key: 'category', width: 15 },
    { header: '评分标准', key: 'name', width: 25 },
    { header: '满分', key: 'max_score', width: 10 },
    { header: '得分', key: 'score', width: 10 },
    { header: '评语', key: 'comment', width: 30 }
  ];

  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  worksheet.spliceRows(1, 0, ['职业技能实操考试评分表']);
  worksheet.mergeCells('A1:E1');
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const infoRows = [
    ['考试项目', appointmentInfo.project_name, '考试编码', appointmentInfo.project_code, ''],
    ['考生姓名', appointmentInfo.student_name, '身份证号', appointmentInfo.student_id_card || '', ''],
    ['考试日期', appointmentInfo.exam_date, '考试时间', appointmentInfo.exam_time, ''],
    ['工位', appointmentInfo.workstation_name || '未安排', '考评员', appointmentInfo.examiner_name || '未安排', ''],
  ];

  infoRows.forEach((row, index) => {
    worksheet.spliceRows(index + 2, 0, row);
  });

  const categoryMap = {
    step: '步骤分',
    product: '成品分',
    safety: '安全行为'
  };

  let startRow = 7;
  const headerRow = worksheet.getRow(startRow);
  headerRow.values = ['分类', '评分项', '满分', '得分', '评语'];
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  let currentRow = startRow + 1;
  let totalMax = 0;
  let totalScore = 0;

  const categories = ['step', 'product', 'safety'];
  categories.forEach(cat => {
    const items = criteria.filter(c => c.category === cat);
    if (items.length > 0) {
      items.forEach((item, idx) => {
        worksheet.getRow(currentRow).values = [
          idx === 0 ? categoryMap[cat] : '',
          item.name,
          item.max_score,
          item.score || 0,
          item.comment || ''
        ];
        totalMax += item.max_score;
        totalScore += item.score || 0;
        currentRow++;
      });
    }
  });

  worksheet.getRow(currentRow).values = ['合计', '', totalMax, totalScore, appointment.score_grade || ''];
  worksheet.getRow(currentRow).font = { bold: true };
  worksheet.getRow(currentRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

  currentRow += 2;
  worksheet.getRow(currentRow).values = ['考评员签字：', '', '', '考生签字：', ''];
  currentRow += 2;
  worksheet.getRow(currentRow).values = ['日期：', '', '', '日期：', ''];

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="评分表_${appointmentInfo.student_name}_${appointmentInfo.project_name}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;
