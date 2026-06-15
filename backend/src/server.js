const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const workstationRoutes = require('./routes/workstations');
const materialRoutes = require('./routes/materials');
const examinerRoutes = require('./routes/examiners');
const userRoutes = require('./routes/users');
const appointmentRoutes = require('./routes/appointments');
const scoreRoutes = require('./routes/scores');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

require('./config/initDB');

const app = express();
const PORT = 3088;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/workstations', workstationRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/examiners', examinerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/scores', scoreRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '职业技能实操预约评分系统运行正常' });
});

app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误', error: err.message });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║   职业技能实操预约评分系统 - 后端服务               ║
  ║   服务地址: http://localhost:${PORT}                       ║
  ║   测试账号:                                          ║
  ║     管理员: admin / admin123                         ║
  ║     考生:   student001 / student123                  ║
  ║     考评员: examiner001 / examiner123                ║
  ╚══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
