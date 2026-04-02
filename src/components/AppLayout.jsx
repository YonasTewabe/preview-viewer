import { Layout } from 'antd';
import AppHeader from './AppHeader';

const { Content } = Layout;

const AppLayout = ({ children, title }) => {
  return (
    <Layout className="min-h-screen">
      <AppHeader title={title} />
      <Content className="bg-gray-50">
        {children}
      </Content>
    </Layout>
  );
};

export default AppLayout;