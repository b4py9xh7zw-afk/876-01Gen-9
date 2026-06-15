import { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'
import { register } from '../api'

export default function Register() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      const result = await register({
        username: values.username,
        password: values.password,
        name: values.name,
        phone: values.phone,
        id_card: values.idCard,
        role: 'student'
      })
      login(result.token, result.user)
      message.success('注册成功')
      navigate('/student/dashboard')
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card" style={{ width: 440 }}>
        <h2 className="login-title">考生注册</h2>
        <Form name="register" onFinish={onFinish}>
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>

          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="真实姓名" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
          </Form.Item>

          <Form.Item name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="手机号（选填）" size="large" />
          </Form.Item>

          <Form.Item name="idCard">
            <Input prefix={<IdcardOutlined />} placeholder="身份证号（选填）" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <span>已有账号？</span>
            <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </div>
    </div>
  )
}
