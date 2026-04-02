import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MailCheckIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: async (values) => {
      return axios.post(`${import.meta.env.VITE_BACKEND_URL}auth/forgot-password`, {
        email: values.email
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      message.success('If an account exists, a reset link has been sent.');
    },
    onError: (error) => {
      const errMsg = error?.response?.data?.error || 'An error occurred. Please try again.';
      message.error(errMsg);
    }
  });

  const onFinish = (values) => {
    forgotPasswordMutation.mutate(values);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-200 dark:bg-black px-4">
        <Card className="w-full max-w-md dark:bg-black dark:border-gray-800">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <MailCheckIcon className="text-2xl text-green-600 dark:text-green-400" />
            </div>
            <Title level={3} className="mb-2 !text-black dark:!text-white">
              Check Your Email
            </Title>
            <Text className="text-gray-700 dark:text-gray-300 mb-6 block">
              If an account with that email exists, a password reset link has been sent to your email address. 
              Please check your inbox and spam folder.
            </Text>
            <Space direction="vertical" className="w-full">
              <Link to="/login">
                <Button type="primary" block>
                  Return to Login
                </Button>
              </Link>
              <Button 
                onClick={() => setSubmitted(false)}
                block
              >
                Send Another Email
              </Button>
            </Space>
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
            <MailCheckIcon className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <Title level={3} className="mb-2 !text-black dark:!text-white">
            Forgot Password?
          </Title>
          <Text className="text-gray-700 dark:text-gray-300">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </div>

        <Form
          name="forgot-password"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              {
                required: true,
                message: 'Please enter your email address!',
              },
              {
                type: 'email',
                message: 'Please enter a valid email address!',
              },
            ]}
          >
            <Input
              prefix={<MailCheckIcon className="text-gray-400" />}
              placeholder="Enter your email"
            />
          </Form.Item>

          <Form.Item className="mb-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={forgotPasswordMutation.isPending}
              block
            >
              Send Reset Link
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

export default ForgotPassword;
