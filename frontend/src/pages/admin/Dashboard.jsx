import { useState, useEffect } from 'react'
import { Row, Col, Card, message } from 'antd'
import {
  ProjectOutlined,
  ToolOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import {
  getProjects,
  getWorkstations,
  getAppointments
} from '../../api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    projectCount: 0,
    workstationCount: 0,
    pendingAppointments: 0,
    todayExams: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [projectsRes, workstationsRes, appointmentsRes] = await Promise.all([
        getProjects(),
        getWorkstations(),
        getAppointments()
      ])

      const today = new Date().toISOString().split('T')[0]
      const todayExams = appointmentsRes?.filter(
        a => a.exam_date === today && a.status === 'approved'
      ).length || 0

      const pendingCount = appointmentsRes?.filter(
        a => a.status === 'pending'
      ).length || 0

      setStats({
        projectCount: projectsRes?.length || 0,
        workstationCount: workstationsRes?.length || 0,
        pendingAppointments: pendingCount,
        todayExams
      })
    } catch (error) {
      message.error('获取统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: '项目数',
      value: stats.projectCount,
      icon: <ProjectOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: '工位总数',
      value: stats.workstationCount,
      icon: <ToolOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: '待审核预约',
      value: stats.pendingAppointments,
      icon: <CalendarOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      color: '#faad14'
    },
    {
      title: '今日考试数',
      value: stats.todayExams,
      icon: <FileTextOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      color: '#722ed1'
    }
  ]

  return (
    <div>
      <h2 className="page-title">数据概览</h2>
      <Row gutter={[16, 16]}>
        {statsCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
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
    </div>
  )
}
