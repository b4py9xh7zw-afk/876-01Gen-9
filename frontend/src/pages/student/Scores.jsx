import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  message,
  Space,
  Tag,
  Descriptions,
  Divider,
  Spin
} from 'antd'
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import {
  getAppointments,
  getScores,
  exportScore,
  getProjects
} from '../../api'

const criteriaTypeLabels = {
  step: '步骤分',
  product: '成品分',
  safety: '安全行为分'
}

const criteriaTypeColors = {
  step: '#1890ff',
  product: '#52c41a',
  safety: '#faad14'
}

export default function Scores() {
  const [appointments, setAppointments] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [scoreDetail, setScoreDetail] = useState(null)
  const [currentAppointment, setCurrentAppointment] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchScores()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await getProjects()
      setProjects(res || [])
    } catch (error) {
      // 错误已在拦截器中处理
    }
  }

  const fetchScores = async () => {
    setLoading(true)
    try {
      const res = await getAppointments({ status: 'completed' })
      setAppointments(res || [])
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (record) => {
    setCurrentAppointment(record)
    setDetailLoading(true)
    try {
      const res = await getScores(record.id)
      setScoreDetail(res)
      setDetailVisible(true)
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setDetailLoading(false)
    }
  }

  const handleExport = (record) => {
    exportScore(record.id)
    message.success('正在导出评分表...')
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '-'
  }

  const getGrade = (score, maxScore) => {
    if (!score && score !== 0) return { text: '-', color: 'default' }
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return { text: '优秀', color: 'gold' }
    if (percentage >= 80) return { text: '良好', color: 'green' }
    if (percentage >= 60) return { text: '及格', color: 'blue' }
    return { text: '不及格', color: 'red' }
  }

  const getScoresByCategory = (category) => {
    if (!scoreDetail || !scoreDetail.criteria) return []
    return scoreDetail.criteria.filter(s => s.category === category)
  }

  const calculateSectionTotal = (category) => {
    return getScoresByCategory(category).reduce((sum, item) => sum + (item.score || 0), 0)
  }

  const calculateSectionMax = (category) => {
    return getScoresByCategory(category).reduce((sum, item) => sum + item.max_score, 0)
  }

  const columns = [
    {
      title: '考试项目',
      dataIndex: 'project_name',
      key: 'project_name'
    },
    {
      title: '考试日期',
      dataIndex: 'exam_date',
      key: 'exam_date',
      width: 120
    },
    {
      title: '考试时间',
      dataIndex: 'exam_time',
      key: 'exam_time',
      width: 100
    },
    {
      title: '总分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score) => (
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>
          {score !== undefined && score !== null ? score : '-'}
        </span>
      )
    },
    {
      title: '成绩等级',
      dataIndex: 'score_grade',
      key: 'score_grade',
      width: 100,
      render: (grade, record) => {
        if (!grade) return '-'
        const colorMap = {
          '优秀': 'gold',
          '良好': 'green',
          '中等': 'cyan',
          '及格': 'blue',
          '不及格': 'red'
        }
        return <Tag color={colorMap[grade] || 'default'}>{grade}</Tag>
      }
    },
    {
      title: '考评员',
      dataIndex: 'examiner_name',
      key: 'examiner_name',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(record)}
          >
            导出
          </Button>
        </Space>
      )
    }
  ]

  const renderScoreSection = (category) => {
    const items = getScoresByCategory(category)
    if (items.length === 0) return null

    const color = criteriaTypeColors[category]
    const label = criteriaTypeLabels[category]

    return (
      <div className="scoring-section" style={{ borderLeftColor: color }}>
        <div className="scoring-section-title" style={{ color }}>
          {label}（{calculateSectionTotal(category)} / {calculateSectionMax(category)}分）
        </div>
        {items.map(item => (
          <div key={item.id} style={{ marginBottom: 12, padding: '8px 12px', background: '#fff', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{item.name}</span>
              <span style={{ color, fontWeight: 'bold' }}>
                {item.score !== null && item.score !== undefined ? item.score : '-'} / {item.max_score}
              </span>
            </div>
            {item.comment && (
              <div style={{ color: '#666', fontSize: 13 }}>
                评语：{item.comment}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <h2 className="page-title">我的成绩</h2>
      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="成绩详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="export" icon={<DownloadOutlined />} onClick={() => handleExport(currentAppointment)}>
            导出评分表
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : scoreDetail && scoreDetail.criteria && scoreDetail.criteria.length > 0 ? (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="考试项目">
                {currentAppointment?.project_name || getProjectName(currentAppointment?.project_id)}
              </Descriptions.Item>
              <Descriptions.Item label="考试日期">
                {currentAppointment?.exam_date}
              </Descriptions.Item>
              <Descriptions.Item label="考试时间">
                {currentAppointment?.exam_time}
              </Descriptions.Item>
              <Descriptions.Item label="考评员">
                {currentAppointment?.examiner_name || '-'}
              </Descriptions.Item>
            </Descriptions>
            
            {renderScoreSection('step')}
            {renderScoreSection('product')}
            {renderScoreSection('safety')}

            <Divider />
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div className="total-score">
                {scoreDetail.total_score}
                <span style={{ fontSize: 20, color: '#999' }}> / {scoreDetail.max_score}</span>
              </div>
              <div className="score-grade">
                <Tag color={getGrade(scoreDetail.total_score, scoreDetail.max_score).color} style={{ fontSize: 18, padding: '4px 16px' }}>
                  {scoreDetail.score_grade || getGrade(scoreDetail.total_score, scoreDetail.max_score).text}
                </Tag>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无成绩数据
          </div>
        )}
      </Modal>
    </div>
  )
}
