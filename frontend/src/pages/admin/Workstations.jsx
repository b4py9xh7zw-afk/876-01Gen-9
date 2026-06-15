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
  Space,
  Tag
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getWorkstations,
  createWorkstation,
  updateWorkstation,
  deleteWorkstation,
  getAllProjects
} from '../../api'

export default function Workstations() {
  const [workstations, setWorkstations] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [filterProject, setFilterProject] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchProjects()
    fetchWorkstations()
  }, [])

  useEffect(() => {
    fetchWorkstations()
  }, [filterProject])

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects()
      setProjects(res || [])
    } catch (error) {
      message.error('获取项目列表失败')
    }
  }

  const fetchWorkstations = async () => {
    setLoading(true)
    try {
      const params = filterProject ? { project_id: filterProject } : {}
      const res = await getWorkstations(params)
      setWorkstations(res || [])
    } catch (error) {
      message.error('获取工位列表失败')
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
      await deleteWorkstation(id)
      message.success('删除成功')
      fetchWorkstations()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await updateWorkstation(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await createWorkstation(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchWorkstations()
    } catch (error) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '-'
  }

  const columns = [
    {
      title: '工位编号',
      dataIndex: 'code',
      key: 'code',
      width: 120
    },
    {
      title: '工位名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '所属项目',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (projectId) => getProjectName(projectId)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'available' ? 'green' : 'red'}>
          {status === 'available' ? '可用' : '不可用'}
        </Tag>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
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
            title="确定要删除这个工位吗？"
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
      <h2 className="page-title">工位管理</h2>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Select
          placeholder="按项目筛选"
          style={{ width: 200 }}
          allowClear
          value={filterProject}
          onChange={setFilterProject}
          options={projects.map(p => ({ value: p.id, label: p.name }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增工位
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={workstations}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingRecord ? '编辑工位' : '新增工位'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="工位编号"
            rules={[{ required: true, message: '请输入工位编号' }]}
          >
            <Input placeholder="请输入工位编号" />
          </Form.Item>
          <Form.Item
            name="name"
            label="工位名称"
            rules={[{ required: true, message: '请输入工位名称' }]}
          >
            <Input placeholder="请输入工位名称" />
          </Form.Item>
          <Form.Item
            name="project_id"
            label="所属项目"
            rules={[{ required: true, message: '请选择所属项目' }]}
          >
            <Select placeholder="请选择项目">
              {projects.map(project => (
                <Select.Option key={project.id} value={project.id}>
                  {project.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="available">可用</Select.Option>
              <Select.Option value="unavailable">不可用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
