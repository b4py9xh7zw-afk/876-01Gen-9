import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, message } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getAppointments } from '../../api'
import { useAuth } from '../../utils/auth.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalAppointments: 0,
    completedExams: 0,
    passedExams: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await getAppointments()
      const appointments = res || []
      
      const completed = appointments.filter(a => a.status === 'completed')
      const passed = completed.filter(a => a.passed === true)

      setStats({
        totalAppointments: appointments.length,
        completedExams: completed.length,
        passedExams: passed.length
      })
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: '我的预约数',
      value: stats.totalAppointments,
      icon: <CalendarOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: '已完成考试',
      value: stats.completedExams,
      icon: <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: '通过数',
      value: stats.passedExams,
      icon: <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      color: '#faad14'
    }
  ]

  const quickActions = [
    {
      title: '预约考试',
      description: '选择项目和时间进行预约',
      icon: <PlusOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
      onClick: () => navigate('/student/appointments')
    },
    {
      title: '查看成绩',
      description: '查看已完成考试的成绩',
      icon: <FileTextOutlined style={{ fontSize: 36, color: '#52c41a' }} />,
      onClick: () => navigate('/student/scores')
    }
  ]

  return (
    <div>
      <h2 className="page-title">欢迎，{user?.name || '考生'}</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((card, index) => (
          <Col xs={24} sm={8} key={index}>
            <Card loading={loading} className="stats-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                <div>
                  <div className="stats-number" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="stats-label">{card.title}</div>
                </div>
                {card.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <h3 style={{ marginBottom: 16 }}>快捷入口</h3>
      <Row gutter={[16, 16]}>
        {quickActions.map((action, index) => (
          <Col xs={24} sm={12} key={index}>
            <Card
              hoverable
              onClick={action.onClick}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {action.icon}
                <div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                    {action.title}
                  </div>
                  <div style={{ color: '#999', fontSize: 14 }}>
                    {action.description}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
