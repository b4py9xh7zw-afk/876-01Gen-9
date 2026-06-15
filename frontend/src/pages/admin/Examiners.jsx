import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import {
  getExaminers,
  createExaminer,
  updateExaminer,
  deleteExaminer,
  getAllProjects
} from '../../api'

export default function Examiners() {
  const [examiners, setExaminers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchProjects()
    fetchExaminers()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects()
      setProjects(res || [])
    } catch (error) {
      message.error('获取项目列表失败')
    }
  }

  const fetchExaminers = async () => {
    setLoading(true)
    try {
      const res = await getExaminers()
      setExaminers(res || [])
    } catch (error) {
      message.error('获取考评员列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteExaminer(id)
      message.success('删除成功')
      fetchExaminers()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await updateExaminer(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await createExaminer(values)
        message.success('创建成功，同时已创建用户账号')
      }
      setModalVisible(false)
      fetchExaminers()
    } catch (error) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const getProjectNames = (projectIds) => {
    if (!projectIds || projectIds.length === 0) return '-'
    return projectIds
      .map(id => projects.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join('、')
  }

  const columns = [
    {
      title: '工号',
      dataIndex: 'employee_id',
      key: 'employee_id',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender) => gender === 'male' ? '男' : '女'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '负责项目',
      dataIndex: 'project_ids',
      key: 'project_ids',
      render: (projectIds) => getProjectNames(projectIds)
    },
    {
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      width: 120
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个考评员吗？"
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

  return (
    <div>
      <h2 className="page-title">考评员管理</h2>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增考评员
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={examiners}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingRecord ? '编辑考评员' : '新增考评员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="employee_id"
            label="工号"
            rules={[{ required: true, message: '请输入工号' }]}
          >
            <Input placeholder="请输入工号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="请选择性别">
              <Select.Option value="male">男</Select.Option>
              <Select.Option value="female">女</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          {!editingRecord && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}
          <Form.Item
            name="project_ids"
            label="负责项目"
            rules={[{ required: true, message: '请选择负责项目' }]}
          >
            <Select mode="multiple" placeholder="请选择负责项目">
              {projects.map(project => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="职称"
          >
            <Input placeholder="请输入职称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
