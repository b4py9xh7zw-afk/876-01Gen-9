import { useState } from 'react'
import { Form, Input, Button, Radio, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'
import { login as apiLogin } from '../api'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('student')
  const { login } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const result = await apiLogin(values)
      login(result.token, result.user)
      message.success('登录成功')
      
      switch (result.user.role) {
        case 'admin':
          navigate('/admin/dashboard')
          break
        case 'examiner':
          navigate('/examiner/dashboard')
          break
        case 'student':
        default:
          navigate('/student/dashboard')
          break
      }
    } catch (error) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">职业技能实操预约评分系统</h2>
        <Form
          name="login"
          onFinish={onFinish}
          initialValues={{ username: 'student001', password: 'student123' }}
        >
          <Form.Item>
            <Radio.Group value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%' }}>
              <Radio.Button value="student" style={{ width: '33.3%', textAlign: 'center' }}>考生</Radio.Button>
              <Radio.Button value="examiner" style={{ width: '33.3%', textAlign: 'center' }}>考评员</Radio.Button>
              <Radio.Button value="admin" style={{ width: '33.3%', textAlign: 'center' }}>管理员</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <span>还没有账号？</span>
            <Link to="/register">立即注册</Link>
          </div>

          <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4, fontSize: 12, color: '#999' }}>
            <div>测试账号：</div>
            <div>管理员：admin / admin123</div>
            <div>考生：student001 / student123</div>
            <div>考评员：examiner001 / examiner123</div>
          </div>
        </Form>
      </div>
    </div>
  )
}
