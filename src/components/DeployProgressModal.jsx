import React from 'react';
import { Modal, Spin, Typography, Button } from 'antd';

const { Text } = Typography;

export default function DeployProgressModal({ 
  isVisible, 
  deployProgress, 
  onCancel,
  previewLink,
  portNumber,
  onSuccess
}) {
  const handleOk = () => {
    if (deployProgress.stage === 'completed') {
      const isDeleteOperation = deployProgress.message && deployProgress.message.includes('deleted');
      if (isDeleteOperation && onSuccess) {
        // For delete operations, call onSuccess to navigate
        onSuccess();
      } else if (onSuccess) {
        // For successful deployments, call onSuccess to navigate
        onSuccess();
      } else {
        // Fallback to onCancel if no onSuccess handler
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Add a small delay for successful deployments to ensure user sees the details
  const canCloseModal = () => {
    if (deployProgress.stage === 'completed') {
      const isDeleteOperation = deployProgress.message && deployProgress.message.includes('deleted');
      // For successful deployments, add a small delay
      if (!isDeleteOperation) {
        return true; // Allow immediate closing for deployments
      }
    }
    return true;
  };

  const getModalTitle = () => {
    if (deployProgress.stage === 'deleting') {
      return "Delete Progress";
    }
    return "Frontend Deployment Progress";
  };

  const getFooterButtons = () => {
    if (deployProgress.stage === 'completed') {
      // Show OK button for both delete operations and successful deployments
      const isDeleteOperation = deployProgress.message && deployProgress.message.includes('deleted');
      if (isDeleteOperation) {
        return [
          <Button key="ok" type="primary" onClick={handleOk}>
            OK
          </Button>
        ];
      }
      // For successful deployment, show OK button to navigate
      return [
        <Button key="ok" type="primary" onClick={handleOk}>
          OK
        </Button>
      ];
    }
    return [
      <Button key="close" onClick={onCancel}>
        Close
      </Button>
    ];
  };

  return (
    <Modal
      title={getModalTitle()}
      open={isVisible}
      onCancel={onCancel}
      footer={getFooterButtons()}
      width={500}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {deployProgress.stage === 'deploying' && (
          <div>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text strong>{deployProgress.message}</Text>
              <br />
              <Text type="secondary">Please wait while Jenkins processes your deployment request...</Text>
            </div>
          </div>
        )}
        
        {deployProgress.stage === 'deleting' && (
          <div>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text strong>{deployProgress.message}</Text>
              <br />
              <Text type="secondary">Please wait while Jenkins processes your delete request...</Text>
            </div>
          </div>
        )}
        
        {deployProgress.stage === 'completed' && (
          <div>
            <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>
              ✅
            </div>
            <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
              {deployProgress.message}
            </Text>
            <br />
            <Text type="secondary">
              Build #{deployProgress.buildNumber} completed successfully
            </Text>
            
            {/* Deployment Details */}
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
              <Text strong style={{ display: 'block', marginBottom: '12px' }}>
                Deployment Details:
              </Text>
              
              {portNumber && (
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Port Number:</Text>
                  <br />
                  <Text code style={{ fontSize: '14px' }}>
                    {portNumber}
                  </Text>
                </div>
              )}
              
              {previewLink && (
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>Preview Link:</Text>
                  <br />
                  <Text code style={{ fontSize: '14px', wordBreak: 'break-all' }}>
                    {previewLink}
                  </Text>
                  <Button
                    size="small"
                    type="text"
                    style={{ marginLeft: '8px', padding: '0 4px' }}
                    onClick={() => {
                      navigator.clipboard.writeText(previewLink);
                      // You can add a message here if needed
                    }}
                    title="Copy Preview Link"
                  >
                    📋
                  </Button>
                </div>
              )}
              
              {/* Additional deployment info */}
              <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ✅ URL configurations saved to database
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  🔗 Frontend node updated successfully
                </Text>
              </div>
              
              {/* User instruction */}
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                  Click OK to continue to the configuration page
                </Text>
              </div>
            </div>
          </div>
        )}
        
        {deployProgress.stage === 'failed' && (
          <div>
            <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
              ❌
            </div>
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
              Deployment Failed
            </Text>
            <br />
            <Text type="secondary">
              {deployProgress.message}
            </Text>
            {deployProgress.buildNumber && (
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Build #{deployProgress.buildNumber}</Text>
              </div>
            )}
          </div>
        )}
        
        {deployProgress.stage === 'error' && (
          <div>
            <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
              ⚠️
            </div>
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
              Deployment Error
            </Text>
            <br />
            <Text type="secondary">
              {deployProgress.message}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
} 