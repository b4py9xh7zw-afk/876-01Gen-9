import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  message,
  Popconfirm,
  Space,
  Tag,
  Descriptions
} from 'antd'
import { PlusOutlined, EyeOutlined, CloseOutlined } from '@ant-design/icons'
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  getAppointment,
  getProjects
} from '../../api'

const statusMap = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' },
  cancelled: { text: '已取消', color: 'default' },
  completed: { text: '已完成', color: 'blue' }
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [appointmentDetail, setAppointmentDetail] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchProjects()
    fetchAppointments()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await getProjects()
      setProjects(res || [])
    } catch (error) {
      // 错误已在拦截器中处理
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const res = await getAppointments()
      setAppointments(res || [])
    } catch (error) {
      message.error('获取预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        project_id: values.project_id,
        exam_date: values.exam_date.format('YYYY-MM-DD'),
        exam_time: values.exam_time.format('HH:mm'),
        remark: values.remark
      }
      await createAppointment(data)
      message.success('预约提交成功，等待审核')
      setModalVisible(false)
      fetchAppointments()
    } catch (error) {
      if (error.errorFields) return
      message.error('预约失败')
    }
  }

  const handleCancel = async (id) => {
    try {
      await updateAppointmentStatus(id, 'cancelled')
      message.success('已取消预约')
      fetchAppointments()
    } catch (error) {
      message.error('取消失败')
    }
  }

  const handleViewDetail = async (record) => {
    try {
      const res = await getAppointment(record.id)
      setAppointmentDetail(res)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取详情失败')
    }
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '-'
  }

  const canCancel = (status) => {
    return ['pending', 'approved'].includes(status)
  }

  const columns = [
    {
      title: '预约编号',
      dataIndex: 'id',
      key: 'id',
      width: 80
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
      title: '工位',
      dataIndex: 'workstation_name',
      key: 'workstation_name',
      width: 100,
      render: (name) => name || '-'
    },
    {
      title: '考评员',
      dataIndex: 'examiner_name',
      key: 'examiner_name',
      width: 100,
      render: (name) => name || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {canCancel(record.status) && (
            <Popconfirm
              title="确定要取消这个预约吗？"
              onConfirm={() => handleCancel(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<CloseOutlined />}>
                取消预约
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 className="page-title">我的预约</h2>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建预约
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建预约"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="提交预约"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="project_id"
            label="考试项目"
            rules={[{ required: true, message: '请选择考试项目' }]}
          >
            <Select placeholder="请选择考试项目">
              {projects.map(project => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}（{project.duration}分钟）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="exam_date"
            label="考试日期"
            rules={[{ required: true, message: '请选择考试日期' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择考试日期"
              disabledDate={(current) => current && current < new Date().setHours(0, 0, 0, 0)}
            />
          </Form.Item>
          <Form.Item
            name="exam_time"
            label="考试时间"
            rules={[{ required: true, message: '请选择考试时间' }]}
          >
            <TimePicker
              style={{ width: '100%' }}
              placeholder="请选择考试时间"
              format="HH:mm"
              minuteStep={30}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="预约详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={500}
      >
        {appointmentDetail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="预约编号">{appointmentDetail.id}</Descriptions.Item>
            <Descriptions.Item label="考试项目">
              {getProjectName(appointmentDetail.project_id)}
            </Descriptions.Item>
            <Descriptions.Item label="考试日期">{appointmentDetail.exam_date}</Descriptions.Item>
            <Descriptions.Item label="考试时间">{appointmentDetail.exam_time}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[appointmentDetail.status]?.color}>
                {statusMap[appointmentDetail.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="工位">
              {appointmentDetail.workstation_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="考评员">
              {appointmentDetail.examiner_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {appointmentDetail.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
