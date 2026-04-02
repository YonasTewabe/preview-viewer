import { Card, Statistic, Progress } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined,
} from '@ant-design/icons';

const StatsCard = ({ 
  title, 
  value, 
  prefix, 
  suffix, 
  trend, 
  trendValue, 
  color = 'blue',
  icon,
  progress,
  loading = false 
}) => {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 dark:text-red-400 bg-red-50 border-red-200',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 border-orange-200',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 border-purple-200'
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpOutlined className="text-green-500" />;
    if (trend === 'down') return <ArrowDownOutlined className="text-red-500" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 border-0 shadow-sm dark:bg-black dark:border-gray-800"
      loading={loading}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Statistic
            title={
              <span className="text-black  text-sm font-medium">{title}</span>
            }
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{ 
              color: color === 'green' ? '#10b981' : color === 'red' ? '#ef4444' : '#1f2937',
              fontSize: '28px',
              fontWeight: '600',
              lineHeight: '1.2'
            }}
          />
        </div>
        
        {icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <span className={`text-xl ${
              color === 'green' ? 'text-green-600' :
              color === 'red' ? 'text-red-600' :
              color === 'orange' ? 'text-orange-600' :
              'text-blue-600'
            }`}>{icon}</span>
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trendValue}
            </span>
            <span className="text-gray-600 dark:text-gray-400 text-sm">vs last month</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StatsCard;