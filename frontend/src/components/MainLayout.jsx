import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../utils/auth.jsx'
import {
  DashboardOutlined,
  ProjectOutlined,
  ToolOutlined,
  InboxOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  EditOutlined,
  LogoutOutlined
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

const menuConfig = {
  admin: [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '数据概览' },
    { key: '/admin/projects', icon: <ProjectOutlined />, label: '考试项目' },
    { key: '/admin/workstations', icon: <ToolOutlined />, label: '工位管理' },
    { key: '/admin/materials', icon: <InboxOutlined />, label: '耗材管理' },
    { key: '/admin/examiners', icon: <UserOutlined />, label: '考评员管理' },
    { key: '/admin/appointments', icon: <CalendarOutlined />, label: '预约管理' },
  ],
  student: [
    { key: '/student/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/student/appointments', icon: <CalendarOutlined />, label: '我的预约' },
    { key: '/student/scores', icon: <TrophyOutlined />, label: '我的成绩' },
  ],
  examiner: [
    { key: '/examiner/dashboard', icon: <DashboardOutlined />, label: '首页' },
    { key: '/examiner/appointments', icon: <CalendarOutlined />, label: '待考评列表' },
  ]
}

const roleNames = {
  admin: '管理员',
  student: '考生',
  examiner: '考评员'
}

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenu = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  const selectedKey = `/${location.pathname.split('/').slice(1, 3).join('/')}`

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="layout-header">
        <div className="logo">职业技能实操预约评分系统</div>
        <div className="user-info">
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Button type="text" style={{ color: '#fff', height: 'auto', padding: '0 8px' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span style={{ marginLeft: 8 }}>
                {user?.name}（{roleNames[user?.role]}）
              </span>
            </Button>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={200} className="sider">
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[selectedKey]}
            items={menuConfig[user?.role] || []}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content className="content-wrapper">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
