import { useState } from 'react';
import {
  Card,
  Switch,
  Row,
  Col,
  Typography,
  Divider,
  Button,
  Space,
  message,
  Select,
  TimePicker
} from 'antd';
import {
  BellOutlined,
  MailOutlined,
  MobileOutlined,
  SoundOutlined,
  NotificationOutlined,
  SettingOutlined,
  SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const NotificationSettings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // Email Notifications
    emailEnabled: true,
    emailNewUsers: true,
    emailSystemUpdates: false,
    emailSecurityAlerts: true,
    emailWeeklyReports: true,
    
    // Push Notifications
    pushEnabled: true,
    pushInstantMessages: true,
    pushTaskUpdates: false,
    pushSystemAlerts: true,
    
    // SMS Notifications
    smsEnabled: false,
    smsSecurityOnly: true,
    
    // General Settings
    soundEnabled: true,
    frequency: 'immediately',
    quietHoursEnabled: false,
    quietHoursStart: dayjs('22:00', 'HH:mm'),
    quietHoursEnd: dayjs('08:00', 'HH:mm'),
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('Notification settings saved successfully!');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const NotificationItem = ({ icon, title, description, checked, onChange, disabled = false }) => (
    <Row gutter={[16, 16]} align="middle" className="py-3">
      <Col xs={24} sm={18}>
        <div className="flex items-start space-x-3">
          <div className="text-xl text-purple-600 mt-1">
            {icon}
          </div>
          <div>
            <Title level={5} className="!mb-1">
              {title}
            </Title>
            <Text type="secondary" className="text-sm">
              {description}
            </Text>
          </div>
        </div>
      </Col>
      <Col xs={24} sm={6} className="text-right">
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          size="default"
        />
      </Col>
    </Row>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Email Notifications */}
      <Card title="Email Notifications" className="shadow-sm">
        <NotificationItem
          icon={<MailOutlined />}
          title="Enable Email Notifications"
          description="Receive notifications via email"
          checked={settings.emailEnabled}
          onChange={(value) => handleSettingChange('emailEnabled', value)}
        />
        
        <Divider />
        
        <div className={`space-y-2 ${!settings.emailEnabled ? 'opacity-50' : ''}`}>
          <NotificationItem
            icon={<NotificationOutlined />}
            title="New User Registrations"
            description="Get notified when new users join the platform"
            checked={settings.emailNewUsers}
            onChange={(value) => handleSettingChange('emailNewUsers', value)}
            disabled={!settings.emailEnabled}
          />
          
          <NotificationItem
            icon={<SettingOutlined />}
            title="System Updates"
            description="Receive updates about system maintenance and new features"
            checked={settings.emailSystemUpdates}
            onChange={(value) => handleSettingChange('emailSystemUpdates', value)}
            disabled={!settings.emailEnabled}
          />
          
          <NotificationItem
            icon={<BellOutlined />}
            title="Security Alerts"
            description="Important security notifications and login alerts"
            checked={settings.emailSecurityAlerts}
            onChange={(value) => handleSettingChange('emailSecurityAlerts', value)}
            disabled={!settings.emailEnabled}
          />
          
          <NotificationItem
            icon={<MailOutlined />}
            title="Weekly Reports"
            description="Weekly summary of platform activity and statistics"
            checked={settings.emailWeeklyReports}
            onChange={(value) => handleSettingChange('emailWeeklyReports', value)}
            disabled={!settings.emailEnabled}
          />
        </div>
      </Card>

      {/* Push Notifications */}
      <Card title="Push Notifications" className="shadow-sm">
        <NotificationItem
          icon={<BellOutlined />}
          title="Enable Push Notifications"
          description="Receive browser push notifications"
          checked={settings.pushEnabled}
          onChange={(value) => handleSettingChange('pushEnabled', value)}
        />
        
        <Divider />
        
        <div className={`space-y-2 ${!settings.pushEnabled ? 'opacity-50' : ''}`}>
          <NotificationItem
            icon={<NotificationOutlined />}
            title="Instant Messages"
            description="Get notified of new messages immediately"
            checked={settings.pushInstantMessages}
            onChange={(value) => handleSettingChange('pushInstantMessages', value)}
            disabled={!settings.pushEnabled}
          />
          
          <NotificationItem
            icon={<SettingOutlined />}
            title="Task Updates"
            description="Notifications about task assignments and completions"
            checked={settings.pushTaskUpdates}
            onChange={(value) => handleSettingChange('pushTaskUpdates', value)}
            disabled={!settings.pushEnabled}
          />
          
          <NotificationItem
            icon={<BellOutlined />}
            title="System Alerts"
            description="Critical system notifications and alerts"
            checked={settings.pushSystemAlerts}
            onChange={(value) => handleSettingChange('pushSystemAlerts', value)}
            disabled={!settings.pushEnabled}
          />
        </div>
      </Card>

      {/* SMS Notifications */}
      <Card title="SMS Notifications" className="shadow-sm">
        <NotificationItem
          icon={<MobileOutlined />}
          title="Enable SMS Notifications"
          description="Receive notifications via SMS (charges may apply)"
          checked={settings.smsEnabled}
          onChange={(value) => handleSettingChange('smsEnabled', value)}
        />
        
        <Divider />
        
        <div className={`space-y-2 ${!settings.smsEnabled ? 'opacity-50' : ''}`}>
          <NotificationItem
            icon={<BellOutlined />}
            title="Security Alerts Only"
            description="Only receive SMS for critical security notifications"
            checked={settings.smsSecurityOnly}
            onChange={(value) => handleSettingChange('smsSecurityOnly', value)}
            disabled={!settings.smsEnabled}
          />
        </div>

        {settings.smsEnabled && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Text className="text-blue-700">
              <MobileOutlined className="mr-2" />
              SMS notifications will be sent to: +1 (555) ***-4567
            </Text>
            <br />
            <Button type="link" className="!p-0 text-blue-600">
              Change phone number
            </Button>
          </div>
        )}
      </Card>

      {/* General Settings */}
      <Card title="General Settings" className="shadow-sm">
        <div className="space-y-4">
          <NotificationItem
            icon={<SoundOutlined />}
            title="Sound Notifications"
            description="Play sound when receiving notifications"
            checked={settings.soundEnabled}
            onChange={(value) => handleSettingChange('soundEnabled', value)}
          />
          
          <Divider />
          
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12}>
              <div>
                <Title level={5} className="!mb-1">
                  Notification Frequency
                </Title>
                <Text type="secondary" className="text-sm">
                  How often should we send notifications
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <Select
                value={settings.frequency}
                onChange={(value) => handleSettingChange('frequency', value)}
                className="w-full"
                size="large"
              >
                <Option value="immediately">Immediately</Option>
                <Option value="hourly">Hourly Digest</Option>
                <Option value="daily">Daily Digest</Option>
                <Option value="weekly">Weekly Digest</Option>
              </Select>
            </Col>
          </Row>
          
          <Divider />
          
          <NotificationItem
            icon={<BellOutlined />}
            title="Quiet Hours"
            description="Disable notifications during specified hours"
            checked={settings.quietHoursEnabled}
            onChange={(value) => handleSettingChange('quietHoursEnabled', value)}
          />
          
          {settings.quietHoursEnabled && (
            <div className="ml-12 mt-4 space-y-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div>
                    <Text strong>Start Time</Text>
                    <TimePicker
                      value={settings.quietHoursStart}
                      onChange={(time) => handleSettingChange('quietHoursStart', time)}
                      format="HH:mm"
                      size="large"
                      className="w-full mt-2"
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <Text strong>End Time</Text>
                    <TimePicker
                      value={settings.quietHoursEnd}
                      onChange={(time) => handleSettingChange('quietHoursEnd', time)}
                      format="HH:mm"
                      size="large"
                      className="w-full mt-2"
                    />
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <Card className="text-center">
        <Space size="large">
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            loading={loading}
            onClick={handleSave}
            className="min-w-[160px] bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700"
          >
            Save Settings
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default NotificationSettings;