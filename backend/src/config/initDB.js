const db = require('./database');
const bcrypt = require('bcryptjs');

function initDatabase() {
  console.log('开始初始化数据库...');

  const adminCount = db.count('users', { role: 'admin' });
  
  if (adminCount === 0) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const studentPassword = bcrypt.hashSync('student123', 10);
    const examinerPassword = bcrypt.hashSync('examiner123', 10);

    db.insert('users', {
      username: 'admin',
      password: adminPassword,
      name: '系统管理员',
      role: 'admin',
      phone: '13800000000',
      id_card: '110101199001010001'
    });

    const student1 = db.insert('users', {
      username: 'student001',
      password: studentPassword,
      name: '张三',
      role: 'student',
      phone: '13900000001',
      id_card: '110101199501010001'
    });

    const student2 = db.insert('users', {
      username: 'student002',
      password: studentPassword,
      name: '李四',
      role: 'student',
      phone: '13900000002',
      id_card: '110101199502020002'
    });

    const student3 = db.insert('users', {
      username: 'student003',
      password: studentPassword,
      name: '王五',
      role: 'student',
      phone: '13900000003',
      id_card: '110101199503030003'
    });

    const examiner1 = db.insert('users', {
      username: 'examiner001',
      password: examinerPassword,
      name: '陈师傅',
      role: 'examiner',
      phone: '13700000001',
      id_card: '110101198001010001'
    });

    const examiner2 = db.insert('users', {
      username: 'examiner002',
      password: examinerPassword,
      name: '刘师傅',
      role: 'examiner',
      phone: '13700000002',
      id_card: '110101198002020002'
    });

    const examiner3 = db.insert('users', {
      username: 'examiner003',
      password: examinerPassword,
      name: '王师傅',
      role: 'examiner',
      phone: '13700000003',
      id_card: '110101198003030003'
    });

    const examiner4 = db.insert('users', {
      username: 'examiner004',
      password: examinerPassword,
      name: '赵师傅',
      role: 'examiner',
      phone: '13700000004',
      id_card: '110101198004040004'
    });

    const weldingId = db.insert('exam_projects', {
      name: '电焊工',
      code: 'DH',
      description: '电焊工职业技能实操考试',
      duration: 120,
      status: 1
    }).lastInsertRowid;

    const cookingId = db.insert('exam_projects', {
      name: '中式烹调师',
      code: 'PR',
      description: '中式烹调师职业技能实操考试',
      duration: 180,
      status: 1
    }).lastInsertRowid;

    const autoId = db.insert('exam_projects', {
      name: '汽车维修工',
      code: 'QC',
      description: '汽车维修工职业技能实操考试',
      duration: 150,
      status: 1
    }).lastInsertRowid;

    const beautyId = db.insert('exam_projects', {
      name: '美容师',
      code: 'MR',
      description: '美容师职业技能实操考试',
      duration: 90,
      status: 1
    }).lastInsertRowid;

    for (let i = 1; i <= 5; i++) {
      db.insert('workstations', {
        name: `电焊工位${i}`,
        code: `DH-GW-${i}`,
        project_id: weldingId,
        status: 1
      });
    }
    for (let i = 1; i <= 4; i++) {
      db.insert('workstations', {
        name: `烹饪工位${i}`,
        code: `PR-GW-${i}`,
        project_id: cookingId,
        status: 1
      });
    }
    for (let i = 1; i <= 4; i++) {
      db.insert('workstations', {
        name: `汽修工位${i}`,
        code: `QC-GW-${i}`,
        project_id: autoId,
        status: 1
      });
    }
    for (let i = 1; i <= 6; i++) {
      db.insert('workstations', {
        name: `美容工位${i}`,
        code: `MR-GW-${i}`,
        project_id: beautyId,
        status: 1
      });
    }

    db.insert('materials', { name: '焊条', unit: '根', quantity: 500, project_id: weldingId });
    db.insert('materials', { name: '钢板', unit: '块', quantity: 100, project_id: weldingId });
    db.insert('materials', { name: '防护面罩', unit: '个', quantity: 20, project_id: weldingId });
    db.insert('materials', { name: '手套', unit: '副', quantity: 100, project_id: weldingId });

    db.insert('materials', { name: '食材套餐', unit: '份', quantity: 50, project_id: cookingId });
    db.insert('materials', { name: '食用油', unit: '升', quantity: 100, project_id: cookingId });
    db.insert('materials', { name: '调料包', unit: '份', quantity: 50, project_id: cookingId });
    db.insert('materials', { name: '厨具', unit: '套', quantity: 20, project_id: cookingId });

    db.insert('materials', { name: '汽车配件', unit: '套', quantity: 30, project_id: autoId });
    db.insert('materials', { name: '机油', unit: '升', quantity: 200, project_id: autoId });
    db.insert('materials', { name: '工具套装', unit: '套', quantity: 15, project_id: autoId });

    db.insert('materials', { name: '护肤品套装', unit: '套', quantity: 40, project_id: beautyId });
    db.insert('materials', { name: '面膜', unit: '片', quantity: 200, project_id: beautyId });
    db.insert('materials', { name: '化妆工具', unit: '套', quantity: 30, project_id: beautyId });

    db.insert('examiners', { user_id: examiner1.lastInsertRowid, project_id: weldingId, title: '高级电焊技师' });
    db.insert('examiners', { user_id: examiner2.lastInsertRowid, project_id: cookingId, title: '高级烹饪技师' });
    db.insert('examiners', { user_id: examiner3.lastInsertRowid, project_id: autoId, title: '高级汽修技师' });
    db.insert('examiners', { user_id: examiner4.lastInsertRowid, project_id: beautyId, title: '高级美容技师' });

    const criteriaData = [
      { project_id: weldingId, category: 'step', name: '焊前准备', max_score: 15, sort_order: 1 },
      { project_id: weldingId, category: 'step', name: '焊接参数调整', max_score: 15, sort_order: 2 },
      { project_id: weldingId, category: 'step', name: '焊接操作规范', max_score: 20, sort_order: 3 },
      { project_id: weldingId, category: 'product', name: '焊缝外观质量', max_score: 20, sort_order: 4 },
      { project_id: weldingId, category: 'product', name: '焊缝内部质量', max_score: 15, sort_order: 5 },
      { project_id: weldingId, category: 'safety', name: '安全防护穿戴', max_score: 10, sort_order: 6 },
      { project_id: weldingId, category: 'safety', name: '操作规程遵守', max_score: 5, sort_order: 7 },

      { project_id: cookingId, category: 'step', name: '食材初加工', max_score: 15, sort_order: 1 },
      { project_id: cookingId, category: 'step', name: '刀工技艺', max_score: 15, sort_order: 2 },
      { project_id: cookingId, category: 'step', name: '烹调火候控制', max_score: 20, sort_order: 3 },
      { project_id: cookingId, category: 'product', name: '菜品色香味形', max_score: 25, sort_order: 4 },
      { project_id: cookingId, category: 'product', name: '成品卫生质量', max_score: 10, sort_order: 5 },
      { project_id: cookingId, category: 'safety', name: '食品安全操作', max_score: 10, sort_order: 6 },
      { project_id: cookingId, category: 'safety', name: '设备安全使用', max_score: 5, sort_order: 7 },

      { project_id: autoId, category: 'step', name: '故障诊断', max_score: 20, sort_order: 1 },
      { project_id: autoId, category: 'step', name: '维修方案制定', max_score: 10, sort_order: 2 },
      { project_id: autoId, category: 'step', name: '拆卸与安装', max_score: 20, sort_order: 3 },
      { project_id: autoId, category: 'product', name: '维修质量', max_score: 25, sort_order: 4 },
      { project_id: autoId, category: 'product', name: '功能测试', max_score: 15, sort_order: 5 },
      { project_id: autoId, category: 'safety', name: '安全操作规程', max_score: 8, sort_order: 6 },
      { project_id: autoId, category: 'safety', name: '工具规范使用', max_score: 2, sort_order: 7 },

      { project_id: beautyId, category: 'step', name: '皮肤检测与分析', max_score: 15, sort_order: 1 },
      { project_id: beautyId, category: 'step', name: '护理方案制定', max_score: 10, sort_order: 2 },
      { project_id: beautyId, category: 'step', name: '操作流程规范', max_score: 25, sort_order: 3 },
      { project_id: beautyId, category: 'product', name: '护理效果', max_score: 30, sort_order: 4 },
      { project_id: beautyId, category: 'product', name: '客户满意度', max_score: 10, sort_order: 5 },
      { project_id: beautyId, category: 'safety', name: '卫生消毒规范', max_score: 7, sort_order: 6 },
      { project_id: beautyId, category: 'safety', name: '产品安全使用', max_score: 3, sort_order: 7 }
    ];

    for (const c of criteriaData) {
      db.insert('scoring_criteria', c);
    }

    console.log('数据库初始化完成！');
    console.log('');
    console.log('测试账号：');
    console.log('  管理员: admin / admin123');
    console.log('  考生:   student001 / student123');
    console.log('  考评员: examiner001 / examiner123');
  } else {
    console.log('数据库已存在，跳过初始化');
  }
}

initDatabase();

module.exports = initDatabase;
