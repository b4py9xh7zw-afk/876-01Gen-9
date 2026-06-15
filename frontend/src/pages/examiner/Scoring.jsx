import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  InputNumber,
  Input,
  message,
  Space,
  Descriptions,
  Divider,
  Row,
  Col,
  Popconfirm,
  Spin
} from 'antd'
import { SaveOutlined, CheckOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getAppointment,
  getScores,
  saveScores,
  completeExam
} from '../../api'

const criteriaTypeConfig = {
  step: { label: '步骤分', color: '#1890ff' },
  product: { label: '成品分', color: '#52c41a' },
  safety: { label: '安全行为分', color: '#faad14' }
}

export default function Scoring() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [apptRes, scoresRes] = await Promise.all([
        getAppointment(id),
        getScores(id)
      ])
      
      setAppointment(apptRes)
      setIsCompleted(apptRes.status === 'completed')
      
      if (scoresRes && scoresRes.criteria && scoresRes.criteria.length > 0) {
        setScores(scoresRes.criteria.map(c => ({
          criteria_id: c.id,
          name: c.name,
          category: c.category,
          max_score: c.max_score,
          score: c.score !== null && c.score !== undefined ? c.score : null,
          comment: c.comment || ''
        })))
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (criteriaId, value) => {
    setScores(prev => prev.map(s => 
      s.criteria_id === criteriaId ? { ...s, score: value } : s
    ))
  }

  const handleCommentChange = (criteriaId, value) => {
    setScores(prev => prev.map(s => 
      s.criteria_id === criteriaId ? { ...s, comment: value } : s
    ))
  }

  const calculateSectionTotal = (category) => {
    return scores
      .filter(s => s.category === category)
      .reduce((sum, item) => sum + (item.score || 0), 0)
  }

  const calculateSectionMax = (category) => {
    return scores
      .filter(s => s.category === category)
      .reduce((sum, item) => sum + item.max_score, 0)
  }

  const calculateTotalScore = () => {
    return scores.reduce((sum, item) => sum + (item.score || 0), 0)
  }

  const calculateMaxTotal = () => {
    return scores.reduce((sum, item) => sum + item.max_score, 0)
  }

  const getScoresByCategory = (category) => {
    return scores.filter(s => s.category === category)
  }

  const validateScores = () => {
    for (const item of scores) {
      if (item.score === null || item.score === undefined || item.score === '') {
        message.error(`请为"${item.name}"输入分数`)
        return false
      }
      if (item.score < 0 || item.score > item.max_score) {
        message.error(`"${item.name}"的分数应在 0 到 ${item.max_score} 之间`)
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateScores()) return
    
    setSaving(true)
    try {
      const data = scores.map(s => ({
        criteria_id: s.criteria_id,
        score: Number(s.score),
        comment: s.comment
      }))
      await saveScores(id, { scores: data })
      message.success('保存成功')
      fetchData()
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = () => {
    if (!validateScores()) return
    
    Popconfirm.confirm({
      title: '确认提交',
      content: '提交后将无法修改评分，确认提交吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await completeExam(id)
          message.success('考试已完成，评分已提交')
          setIsCompleted(true)
          fetchData()
        } catch (error) {
          // 错误已在拦截器中处理
        }
      }
    })
  }

  const renderScoringSection = (category) => {
    const items = getScoresByCategory(category)
    const config = criteriaTypeConfig[category]
    if (items.length === 0) return null

    return (
      <div className="scoring-section" style={{ borderLeftColor: config.color }}>
        <div className="scoring-section-title" style={{ color: config.color }}>
          {config.label}（{calculateSectionTotal(category)} / {calculateSectionMax(category)}分）
        </div>
        <Row gutter={[16, 16]}>
          {items.map(item => (
            <Col xs={24} md={12} lg={8} key={item.criteria_id}>
              <Card size="small" title={item.name} extra={<span style={{ color: '#999', fontSize: 12 }}>满分: {item.max_score}</span>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <InputNumber
                    min={0}
                    max={item.max_score}
                    step={0.5}
                    value={item.score}
                    onChange={(value) => handleScoreChange(item.criteria_id, value)}
                    disabled={isCompleted}
                    style={{ width: '100%' }}
                    placeholder="请输入分数"
                  />
                  <Input.TextArea
                    rows={2}
                    value={item.comment}
                    onChange={(e) => handleCommentChange(item.criteria_id, e.target.value)}
                    disabled={isCompleted}
                    placeholder="请输入评语（选填）"
                  />
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/examiner/appointments')}>
          返回列表
        </Button>
        <h2 className="page-title" style={{ margin: 0 }}>
          {isCompleted ? '查看评分' : '考试评分'}
        </h2>
        <Space>
          {!isCompleted && (
            <>
              <Button icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
                保存
              </Button>
              <Button type="primary" icon={<CheckOutlined />} onClick={handleComplete}>
                提交完成
              </Button>
            </>
          )}
        </Space>
      </div>

      {appointment && (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="考生姓名">{appointment.student_name}</Descriptions.Item>
              <Descriptions.Item label="考试项目">{appointment.project_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="考试日期">{appointment.exam_date}</Descriptions.Item>
              <Descriptions.Item label="考试时间">{appointment.exam_time}</Descriptions.Item>
              <Descriptions.Item label="工位">{appointment.workstation_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="考评员">{appointment.examiner_name || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {renderScoringSection('step')}
          {renderScoringSection('product')}
          {renderScoringSection('safety')}

          <Divider />
          
          <div style={{ textAlign: 'center', padding: '24px 0', background: '#f9f9f9', borderRadius: 8 }}>
            <div className="total-score">
              {calculateTotalScore()}
              <span style={{ fontSize: 20, color: '#999' }}> / {calculateMaxTotal()}</span>
            </div>
            <div className="score-grade">
              {calculateTotalScore() >= 60 ? (
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>及格</span>
              ) : (
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>不及格</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
