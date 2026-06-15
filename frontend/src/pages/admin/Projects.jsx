import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Space,
  Tag,
  Row,
  Col,
  Divider
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectCriteria,
  createCriteria,
  updateCriteria,
  deleteCriteria
} from '../../api'

const criteriaTypes = [
  { value: 'step', label: '步骤分' },
  { value: 'product', label: '成品分' },
  { value: 'safety', label: '安全行为分' }
]

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [criteriaModalVisible, setCriteriaModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [currentProject, setCurrentProject] = useState(null)
  const [criteria, setCriteria] = useState([])
  const [editingCriteria, setEditingCriteria] = useState(null)
  const [form] = Form.useForm()
  const [criteriaForm] = Form.useForm()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await getProjects()
      setProjects(res || [])
    } catch (error) {
      message.error('获取项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingProject(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingProject(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteProject(id)
      message.success('删除成功')
      fetchProjects()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingProject) {
        await updateProject(editingProject.id, values)
        message.success('更新成功')
      } else {
        await createProject(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchProjects()
    } catch (error) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const handleManageCriteria = async (record) => {
    setCurrentProject(record)
    setCriteriaModalVisible(true)
    await fetchCriteria(record.id)
  }

  const fetchCriteria = async (projectId) => {
    try {
      const res = await getProjectCriteria(projectId)
      setCriteria(res || [])
    } catch (error) {
      message.error('获取评分标准失败')
    }
  }

  const handleAddCriteria = () => {
    setEditingCriteria(null)
    criteriaForm.resetFields()
    criteriaForm.setFieldsValue({ type: 'step' })
    Modal.confirm({
      title: '新增评分标准',
      content: (
        <Form form={criteriaForm} layout="vertical">
          <Form.Item
            name="name"
            label="评分项名称"
            rules={[{ required: true, message: '请输入评分项名称' }]}
          >
            <Input placeholder="请输入评分项名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="评分类型"
            rules={[{ required: true, message: '请选择评分类型' }]}
          >
            <Input.Group compact>
              {criteriaTypes.map(type => (
                <Button
                  key={type.value}
                  type={criteriaForm.getFieldValue('type') === type.value ? 'primary' : 'default'}
                  onClick={() => criteriaForm.setFieldsValue({ type: type.value })}
                >
                  {type.label}
                </Button>
              ))}
            </Input.Group>
          </Form.Item>
          <Form.Item
            name="max_score"
            label="满分"
            rules={[{ required: true, message: '请输入满分' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入满分" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await criteriaForm.validateFields()
          await createCriteria(currentProject.id, values)
          message.success('添加成功')
          fetchCriteria(currentProject.id)
        } catch (error) {
          if (error.errorFields) return Promise.reject()
          message.error('添加失败')
          return Promise.reject()
        }
      }
    })
  }

  const handleEditCriteria = (record) => {
    setEditingCriteria(record)
    criteriaForm.setFieldsValue(record)
    Modal.confirm({
      title: '编辑评分标准',
      content: (
        <Form form={criteriaForm} layout="vertical">
          <Form.Item
            name="name"
            label="评分项名称"
            rules={[{ required: true, message: '请输入评分项名称' }]}
          >
            <Input placeholder="请输入评分项名称" />
          </Form.Item>
          <Form.Item
            name="type"
            label="评分类型"
            rules={[{ required: true, message: '请选择评分类型' }]}
          >
            <Input.Group compact>
              {criteriaTypes.map(type => (
                <Button
                  key={type.value}
                  type={criteriaForm.getFieldValue('type') === type.value ? 'primary' : 'default'}
                  onClick={() => criteriaForm.setFieldsValue({ type: type.value })}
                >
                  {type.label}
                </Button>
              ))}
            </Input.Group>
          </Form.Item>
          <Form.Item
            name="max_score"
            label="满分"
            rules={[{ required: true, message: '请输入满分' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入满分" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          const values = await criteriaForm.validateFields()
          await updateCriteria(editingCriteria.id, values)
          message.success('更新成功')
          fetchCriteria(currentProject.id)
        } catch (error) {
          if (error.errorFields) return Promise.reject()
          message.error('更新失败')
          return Promise.reject()
        }
      }
    })
  }

  const handleDeleteCriteria = async (id) => {
    try {
      await deleteCriteria(id)
      message.success('删除成功')
      fetchCriteria(currentProject.id)
    } catch (error) {
      message.error('删除失败')
    }
  }

  const getCriteriaByType = (type) => {
    return criteria.filter(c => c.type === type)
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '考试时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => handleManageCriteria(record)}
          >
            评分标准
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个项目吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const renderCriteriaSection = (type, title) => {
    const items = getCriteriaByType(type)
    return (
      <div className="scoring-section">
        <div className="scoring-section-title">{title}</div>
        <Table
          size="small"
          dataSource={items}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '评分项', dataIndex: 'name', key: 'name' },
            { title: '满分', dataIndex: 'max_score', key: 'max_score', width: 80 },
            { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
            {
              title: '操作',
              key: 'action',
              width: 120,
              render: (_, record) => (
                <Space size="small">
                  <Button type="link" size="small" onClick={() => handleEditCriteria(record)}>
                    编辑
                  </Button>
                  <Popconfirm
                    title="确定删除？"
                    onConfirm={() => handleDeleteCriteria(record.id)}
                  >
                    <Button type="link" size="small" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </div>
    )
  }

  return (
    <div>
      <h2 className="page-title">考试项目管理</h2>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增项目
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="考试时长(分钟)"
            rules={[{ required: true, message: '请输入考试时长' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入考试时长" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`评分标准管理 - ${currentProject?.name || ''}`}
        open={criteriaModalVisible}
        onCancel={() => setCriteriaModalVisible(false)}
        footer={[
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAddCriteria}>
            新增评分项
          </Button>,
          <Button key="close" onClick={() => setCriteriaModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {renderCriteriaSection('step', '步骤分')}
        {renderCriteriaSection('product', '成品分')}
        {renderCriteriaSection('safety', '安全行为分')}
      </Modal>
    </div>
  )
}
