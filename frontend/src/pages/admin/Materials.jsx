import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Space,
  Tag
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getAllProjects
} from '../../api'

export default function Materials() {
  const [materials, setMaterials] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [filterProject, setFilterProject] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [filterProject])

  const fetchProjects = async () => {
    try {
      const res = await getAllProjects()
      setProjects(res || [])
    } catch (error) {
      message.error('获取项目列表失败')
    }
  }

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const params = filterProject ? { project_id: filterProject } : {}
      const res = await getMaterials(params)
      setMaterials(res || [])
    } catch (error) {
      message.error('获取耗材列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ stock: 0 })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteMaterial(id)
      message.success('删除成功')
      fetchMaterials()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await updateMaterial(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await createMaterial(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchMaterials()
    } catch (error) {
      if (error.errorFields) return
      message.error('操作失败')
    }
  }

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId)
    return project ? project.name : '-'
  }

  const getStockTag = (stock) => {
    if (stock <= 0) return <Tag color="red">库存不足</Tag>
    if (stock < 10) return <Tag color="orange">库存紧张</Tag>
    return <Tag color="green">库存充足</Tag>
  }

  const columns = [
    {
      title: '耗材名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      key: 'spec',
      width: 150
    },
    {
      title: '所属项目',
      dataIndex: 'project_id',
      key: 'project_id',
      render: (projectId) => getProjectName(projectId)
    },
    {
      title: '库存数量',
      dataIndex: 'stock',
      key: 'stock',
      width: 120,
      render: (stock) => (
        <Space>
          <span style={{ fontWeight: 'bold' }}>{stock}</span>
          {getStockTag(stock)}
        </Space>
      )
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
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
            title="确定要删除这个耗材吗？"
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
      <h2 className="page-title">耗材管理</h2>
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
          新增耗材
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={materials}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingRecord ? '编辑耗材' : '新增耗材'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="耗材名称"
            rules={[{ required: true, message: '请输入耗材名称' }]}
          >
            <Input placeholder="请输入耗材名称" />
          </Form.Item>
          <Form.Item
            name="spec"
            label="规格型号"
          >
            <Input placeholder="请输入规格型号" />
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
            name="stock"
            label="库存数量"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入库存数量" />
          </Form.Item>
          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input placeholder="如：个、套、件等" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
