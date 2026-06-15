import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, message } from 'antd'
import {
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getAppointments } from '../../api'
import { useAuth } from '../../utils/auth.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({
    pendingCount: 0,
    todayCount: 0,
    completedCount: 0
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
      
      const today = new Date().toISOString().split('T')[0]
      const todayExams = appointments.filter(
        a => a.exam_date === today && a.status === 'approved' && a.examiner_id
      )
      
      const pending = appointments.filter(
        a => a.status === 'approved' && a.examiner_id && !a.completed
      )
      
      const completed = appointments.filter(
        a => a.status === 'completed' && a.examiner_id
      )

      setStats({
        pendingCount: pending.length,
        todayCount: todayExams.length,
        completedCount: completed.length
      })
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: '待考评数',
      value: stats.pendingCount,
      icon: <ClockCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: '今日考评数',
      value: stats.todayCount,
      icon: <CalendarOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: '已完成数',
      value: stats.completedCount,
      icon: <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      color: '#52c41a'
    }
  ]

  return (
    <div>
      <h2 className="page-title">欢迎，{user?.name || '考评员'}</h2>
      
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
        <Col xs={24} sm={12}>
          <Card
            hoverable
            onClick={() => navigate('/examiner/appointments')}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <FileTextOutlined style={{ fontSize: 36, color: '#1890ff' }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                  待考评列表
                </div>
                <div style={{ color: '#999', fontSize: 14 }}>
                  查看和管理分配给您的考评任务
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
