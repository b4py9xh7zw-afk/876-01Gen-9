import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Select,
  message,
  Space,
  Tag
} from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getAppointments, getAllProjects } from '../../api'
import { useAuth } from '../../utils/auth.jsx'

const statusMap = {
  approved: { text: '待考评', color: 'orange' },
  completed: { text: '已完成', color: 'green' }
}

export default function Appointments() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('approved')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [filterStatus])

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects()
      setProjects(res || [])
    } catch (error) {
      message.error('获取项目列表失败')
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = { status: filterStatus }
      const res = await getAppointments(params)
      const filtered = res?.filter(a => a.examiner_id === user?.id) || []
      setAppointments(filtered)
    } catch (error) {
      message.error('获取预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleScoring = (record) => {
    navigate(`/examiner/scoring/${record.id}`)
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '-'
  }

  const columns = [
    {
      title: '预约编号',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '考生姓名',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 100
    },
    {
      title: '考试项目',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (projectId) => getProjectName(projectId)
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
      title: '工位',
      dataIndex: 'workstation_name',
      key: 'workstation_name',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusMap[status]?.color || 'default'}>
          {statusMap[status]?.text || status}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleScoring(record)}
          >
            {record.status === 'completed' ? '查看' : '评分'}
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 className="page-title">待考评列表</h2>
      <div style={{ marginBottom: 16 }}>
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 150 }}
        >
          <Select.Option value="approved">待考评</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
