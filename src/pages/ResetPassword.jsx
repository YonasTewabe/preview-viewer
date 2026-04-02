import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Space, Alert } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeOffIcon, LockIcon, LockOpenIcon, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (!tokenParam || !emailParam) {
      setIsValidToken(false);
      message.error('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    setToken(tokenParam);
    setEmail(emailParam);
  }, [searchParams]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (values) => {
      return axios.post(`${import.meta.env.VITE_BACKEND_URL}auth/reset-password`, {
        email: email,
        token: token,
        password: values.password,
        passwordConfirmation: values.passwordConfirmation
      });
    },
    onSuccess: () => {
      message.success('Password has been reset successfully!');
      setTimeout(() => navigate('/login'), 1200);
    },
    onError: (error) => {
      const errMsg = error?.response?.data?.error || 'An error occurred. Please try again.';
      message.error(errMsg);
    }
  });

  const onFinish = (values) => {
    resetPasswordMutation.mutate(values);
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
        <Card className="w-full max-w-md dark:bg-black dark:border-gray-800">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <LockOpenIcon className="text-2xl text-red-600 dark:text-red-400" />
            </div>
            <Title level={3} className="mb-2 !text-black dark:!text-white">
              Invalid Reset Link
            </Title>
            <Text className="text-gray-700 dark:text-gray-300 mb-6 block">
              The password reset link is invalid or has expired. Please request a new password reset.
            </Text>
            <Link to="/forgot-password">
              <Button type="primary" block>
                Request New Reset
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <Card className="w-full max-w-md dark:bg-black dark:border-gray-800">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <LockIcon className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <Title level={3} className="mb-2 !text-black dark:!text-white">
            Reset Your Password
          </Title>
          <Text className="text-gray-700 dark:text-gray-300">
            Enter your new password below.
          </Text>
        </div>

        <Alert
          message="Reset Link Valid"
          description={`Password reset for: ${email}`}
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          name="reset-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="password"
            label="New Password"
            rules={[
              {
                required: true,
                message: 'Please enter your new password!',
              },
              {
                min: 8,
                message: 'Password must be at least 8 characters long!',
              },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number!',
              },
            ]}
          >
            <Input.Password
              prefix={<LockIcon className="text-gray-400" />}
              placeholder="Enter new password"
              iconRender={(visible) => (visible ? <EyeIcon /> : <EyeOffIcon  />)}
            />
          </Form.Item>

          <Form.Item
            name="passwordConfirmation"
            label="Confirm New Password"
            rules={[
              {
                required: true,
                message: 'Please confirm your new password!',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockIcon className="text-gray-400" />}
              placeholder="Confirm new password"
              iconRender={(visible) => (visible ? <EyeIcon /> : <EyeOffIcon />)}
            />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={resetPasswordMutation.isPending}
              block
            >
              Reset Password
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center">
              <ArrowLeft className="mr-1" />
              Back to Login
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
