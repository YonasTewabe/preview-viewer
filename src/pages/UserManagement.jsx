import { useState } from 'react';
import { 
  Table, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Popconfirm, 
  Card,
  Row,
  Col,
  Typography,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
  MailOutlined
} from '@ant-design/icons';
import UserFormModal from '../components/UserFormModal';
import { 
  useUsers, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser,
  useResendWelcomeEmail 
} from '../hooks/useUsers';

const { Title } = Typography;
const { Search } = Input;

const UserManagement = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  // React Query hooks
  const { 
    data: usersData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useUsers({
    page: pagination.current,
    pageSize: pagination.pageSize,
    search: searchText
  });

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const resendEmailMutation = useResendWelcomeEmail();

  // Extract users and pagination info from API response
  const users = usersData || [];
  const total = usersData?.total || 0;
  const loading = isLoading || createUserMutation.isPending || updateUserMutation.isPending || deleteUserMutation.isPending;

  // Handle search functionality
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page on search
  };

  // Handle create new user
  const handleCreateUser = () => {
    setEditingUser(null);
    setModalVisible(true);
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setModalVisible(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    deleteUserMutation.mutate(userId);
  };

  // Handle resend welcome email
  const handleResendEmail = (userId) => {
    resendEmailMutation.mutate(userId);
  };

  // Handle form submission (create/update)
  const handleFormSubmit = (values) => {
    if (editingUser) {
      // Update existing user
      updateUserMutation.mutate(
        { id: editingUser.id, ...values },
        {
          onSuccess: () => {
            setModalVisible(false);
            setEditingUser(null);
          }
        }
      );
    } else {
      // Create new user
      createUserMutation.mutate(values, {
        onSuccess: () => {
          setModalVisible(false);
          setEditingUser(null);
        }
      });
    }
  };

  // Handle pagination change
  const handleTableChange = (paginationInfo, filters, sorter) => {
    setPagination({
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
      render: (text) => (
        <div className="flex items-center">
          <UserOutlined className="mr-2 text-gray-400" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Full Name',
      key: 'fullName',
      sorter: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
      render: (_, record) => (
        <span className="font-medium">
          {`${record.first_name} ${record.last_name}`}
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (email) => (
        <span className="text-blue-600 dark:text-blue-400">{email}</span>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: [
        { text: 'Admin', value: 'Admin' },
        { text: 'Developer', value: 'Developer' },
        { text: 'Viewer', value: 'Viewer' },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => {
        let color = 'blue';
        if (role === 'Admin') color = 'red';
        if (role === 'Developer') color = 'orange';
        if (role === 'Viewer') color = 'green';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Active', value: 'Active' },
        { text: 'Inactive', value: 'Inactive' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            size="small"
            title="Edit user"
          />
          <Button
            type="link"
            icon={<MailOutlined />}
            onClick={() => handleResendEmail(record.id)}
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
            size="small"
            loading={resendEmailMutation.isPending}
            title="Resend welcome email"
          />
          <Popconfirm
            title="Delete User"
            description="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              icon={<DeleteOutlined />}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              size="small"
              title="Delete user"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white dark:bg-black min-h-screen text-black dark:text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Title level={2} className="!mb-2 !text-black dark:!text-white">
            User Management
          </Title>
          <p className="text-gray-700 dark:text-gray-300">
            Manage your application users, roles, and permissions
          </p>
        </div>

        {/* Error Display */}
        {isError && (
          <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="text-red-600 dark:text-red-400">
              <p className="font-medium">Error loading users:</p>
              <p className="text-sm">{error?.message || 'An unexpected error occurred'}</p>
              <Button 
                type="primary" 
                danger 
                size="small" 
                onClick={handleRefresh}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Controls */}
        <Card className="mb-6 shadow-sm dark:bg-black dark:border-gray-800">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder="Search by username, name, or email"
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
                loading={isLoading}
              />
            </Col>
            <Col xs={24} sm={12} md={16} className="text-right">
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  size="large"
                  loading={isLoading}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateUser}
                  size="large"
                  className="bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                >
                  Create New User
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Users Table */}
        <Card className="shadow-sm dark:bg-black dark:border-gray-800">
          {isLoading && !users.length ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              onChange={handleTableChange}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} users`,
                className: 'mt-4',
                pageSizeOptions: ['10', '20', '50', '100'],
              }}
              scroll={{ x: 800 }}
              className="ant-table-responsive"
            />
          )}
        </Card>

        {/* User Form Modal */}
        <UserFormModal
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingUser(null);
          }}
          onSubmit={handleFormSubmit}
          initialValues={editingUser}
          loading={createUserMutation.isPending || updateUserMutation.isPending}
        />
      </div>
    </div>
  );
};

export default UserManagement;