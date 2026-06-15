import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Space,
  Tag,
  Descriptions,
  Row,
  Col
} from 'antd'
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  SettingOutlined
} from '@ant-design/icons'
import {
  getAppointments,
  getAppointment,
  updateAppointmentStatus,
  assignAppointment,
  getAvailableWorkstations,
  getAvailableExaminers,
  getAllProjects,
  getMaterials
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
  const [detailVisible, setDetailVisible] = useState(false)
  const [assignVisible, setAssignVisible] = useState(false)
  const [currentAppointment, setCurrentAppointment] = useState(null)
  const [appointmentDetail, setAppointmentDetail] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterProject, setFilterProject] = useState(null)
  const [filterDate, setFilterDate] = useState(null)
  const [workstations, setWorkstations] = useState([])
  const [examiners, setExaminers] = useState([])
  const [materials, setMaterials] = useState([])
  const [assignForm] = Form.useForm()

  useEffect(() => {
    fetchProjects()
    fetchMaterials()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [filterStatus, filterProject, filterDate])

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects()
      setProjects(res || [])
    } catch (error) {
      message.error('获取项目列表失败')
    }
  }

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials()
      setMaterials(res || [])
    } catch (error) {
      message.error('获取耗材列表失败')
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      if (filterProject) params.project_id = filterProject
      if (filterDate) params.exam_date = filterDate.format('YYYY-MM-DD')
      const res = await getAppointments(params)
      setAppointments(res || [])
    } catch (error) {
      message.error('获取预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (record) => {
    setCurrentAppointment(record)
    try {
      const res = await getAppointment(record.id)
      setAppointmentDetail(res)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取预约详情失败')
    }
  }

  const handleApprove = async (id) => {
    try {
      await updateAppointmentStatus(id, 'approved')
      message.success('审核通过')
      fetchAppointments()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleReject = async (id) => {
    try {
      await updateAppointmentStatus(id, 'rejected')
      message.success('已拒绝')
      fetchAppointments()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleAssign = async (record) => {
    setCurrentAppointment(record)
    assignForm.resetFields()
    try {
      const [wsRes, examinersRes] = await Promise.all([
        getAvailableWorkstations({
          project_id: record.project_id,
          exam_date: record.exam_date,
          exam_time: record.exam_time
        }),
        getAvailableExaminers({
          project_id: record.project_id,
          exam_date: record.exam_date,
          exam_time: record.exam_time
        })
      ])
      setWorkstations(wsRes || [])
      setExaminers(examinersRes || [])
      setAssignVisible(true)
    } catch (error) {
      message.error('获取可用资源失败')
    }
  }

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields()
      await assignAppointment(currentAppointment.id, values)
      message.success('安排成功')
      setAssignVisible(false)
      fetchAppointments()
    } catch (error) {
      if (error.errorFields) return
      message.error('安排失败')
    }
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '-'
  }

  const getMaterialName = (materialId) => {
    const material = materials.find(m => m.id === materialId)
    return material ? material.name : '-'
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
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleAssign(record)}
            >
              安排
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 className="page-title">预约管理</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Select
          placeholder="按状态筛选"
          style={{ width: 150 }}
          allowClear
          value={filterStatus}
          onChange={setFilterStatus}
        >
          <Select.Option value="pending">待审核</Select.Option>
          <Select.Option value="approved">已通过</Select.Option>
          <Select.Option value="rejected">已拒绝</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
          <Select.Option value="completed">已完成</Select.Option>
        </Select>
        <Select
          placeholder="按项目筛选"
          style={{ width: 200 }}
          allowClear
          value={filterProject}
          onChange={setFilterProject}
          options={projects.map(p => ({ value: p.id, label: p.name }))}
        />
        <DatePicker
          placeholder="按日期筛选"
          style={{ width: 150 }}
          allowClear
          value={filterDate}
          onChange={setFilterDate}
        />
      </div>
      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="预约详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {appointmentDetail && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="预约编号">{appointmentDetail.id}</Descriptions.Item>
            <Descriptions.Item label="考生姓名">{appointmentDetail.student_name}</Descriptions.Item>
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

      <Modal
        title="安排考试"
        open={assignVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="workstation_id"
            label="选择工位"
            rules={[{ required: true, message: '请选择工位' }]}
          >
            <Select placeholder="请选择可用工位">
              {workstations.map(ws => (
                <Select.Option key={ws.id} value={ws.id}>
                  {ws.code} - {ws.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="examiner_id"
            label="选择考评员"
            rules={[{ required: true, message: '请选择考评员' }]}
          >
            <Select placeholder="请选择可用考评员">
              {examiners.map(examiner => (
                <Select.Option key={examiner.id} value={examiner.id}>
                  {examiner.name} - {examiner.title || '考评员'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="material_ids"
            label="分配耗材"
          >
            <Select mode="multiple" placeholder="请选择需要的耗材">
              {materials
                .filter(m => m.project_id === currentAppointment?.project_id)
                .map(material => (
                  <Select.Option key={material.id} value={material.id}>
                    {material.name} ({material.spec}) - 库存: {material.stock}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
