import { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Typography, Space, Checkbox } from 'antd';
import { MailOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await login(values.username, values.password);
      
      if (result.success) {
        // Redirect to home page
        navigate('/', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div className="min-h-screen bg-blue-200 dark:bg-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white dark:bg-black border dark:border-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-purple-600 dark:bg-purple-500 rounded-lg mr-3 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <Title level={3} className="!mb-0 !text-black dark:!text-white font-bold">
                Preview Builder
              </Title>
            </div>
            <Title level={2} className="!mb-2 !text-black dark:!text-white font-bold">
              Welcome back
            </Title>
            <Text className="text-gray-600 dark:text-gray-300">
              Please enter your details
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-6 rounded-lg"
              closable
              onClose={() => setError('')}
            />
          )}

          <Form
            name="login"
            initialValues={{ 
              username: 'admin', 
              password: 'admin',
              remember: false 
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            className="space-y-4"
          >
            <Form.Item
              label="Email or Username"
              name="username"
              className="mb-4"
              rules={[
                { required: true, message: 'Please input your email or username!' },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.reject();
                    }
                    // Accept if it's a valid email OR if it's a username (no @ symbol)
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/;
                    
                    if (emailRegex.test(value) || usernameRegex.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Please enter a valid email or username (min 3 characters, letters, numbers, _, -, . only)'));
                  }
                }
              ]}
            >
              <Input 
                placeholder="Enter your email or username"
                className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 hover:border-purple-400 focus:border-purple-500"
                style={{ fontSize: '16px' }}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              className="mb-4"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 3, message: 'Password must be at least 3 characters long!' }
              ]}
            >
              <Input.Password
                placeholder="••••••••"
                className="h-12 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 hover:border-purple-400 focus:border-purple-500"
                style={{ fontSize: '16px' }}
              />
            </Form.Item>

            <div className="flex items-center justify-between mb-6">
              <Form.Item name="remember" valuePropName="checked" className="!mb-0">
                <Checkbox 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="text-black dark:text-white"
                >
                  Remember for 30 days
                </Checkbox>
              </Form.Item>
              
              <Button 
                type="link" 
                className="!p-0 !h-auto text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password
              </Button>
            </div>

            <Form.Item className="mb-4">
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="w-full h-12 text-base font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 border-none shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </Form.Item>

            {/* <Form.Item className="mb-6">
              <Button 
                type="default"
                className="w-full h-12 text-base font-medium rounded-lg border-gray-300 hover:border-gray-400 flex items-center justify-center"
                icon={<GoogleOutlined className="text-red-500" />}
                onClick={() => {
                  // Handle Google sign in
                  console.log('Google sign in clicked');
                }}
              >
                Sign in with Google
              </Button>
            </Form.Item> */}
          </Form>

          <div className="text-center">
            <Text className="text-black dark:text-white">
              Don't have an account?{' '}
              <Button 
                type="link" 
                className="!p-0 !h-auto text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
                onClick={() => {
                  // Handle sign up
                  console.log('Sign up clicked');
                }}
              >
                Sign up
              </Button>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;