import React from 'react';
import { Modal, Spin, Typography, Button } from 'antd';

const { Text } = Typography;

export default function DeleteProgressModal({ 
  isVisible, 
  deleteProgress, 
  onCancel 
}) {
  const handleClose = () => {
    onCancel();
  };

  return (
    <Modal
      title="Delete Progress"
      open={isVisible}
      onCancel={handleClose}
      footer={
        deleteProgress.stage === 'deleting' ? null : [
          <Button key="close" onClick={handleClose}>
            Close
          </Button>
        ]
      }
      width={500}
      closable={deleteProgress.stage !== 'deleting'}
      maskClosable={deleteProgress.stage !== 'deleting'}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {deleteProgress.stage === 'deleting' && (
          <div>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text strong>{deleteProgress.message}</Text>
              <br />
              <Text type="secondary">Please wait while Jenkins processes your delete request...</Text>
              {deleteProgress.branchName && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Branch: {deleteProgress.branchName}</Text>
                </div>
              )}
              {deleteProgress.domainName && (
                <div style={{ marginTop: '4px' }}>
                  <Text type="secondary">Domain: {deleteProgress.domainName}</Text>
                </div>
              )}
            </div>
          </div>
        )}
        
        {deleteProgress.stage === 'completed' && (
          <div>
            <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>
              ✅
            </div>
            <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
              {deleteProgress.message}
            </Text>
            <br />
            <Text type="secondary">
              Branch "{deleteProgress.branchName}" and domain "{deleteProgress.domainName}" have been successfully deleted
            </Text>
          </div>
        )}
        
        {deleteProgress.stage === 'failed' && (
          <div>
            <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
              ❌
            </div>
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
              Delete Failed
            </Text>
            <br />
            <Text type="secondary">
              {deleteProgress.message}
            </Text>
            {deleteProgress.branchName && (
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Branch: {deleteProgress.branchName}</Text>
              </div>
            )}
            {deleteProgress.domainName && (
              <div style={{ marginTop: '4px' }}>
                <Text type="secondary">Domain: {deleteProgress.domainName}</Text>
              </div>
            )}
          </div>
        )}
        
        {deleteProgress.stage === 'error' && (
          <div>
            <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
              ⚠️
            </div>
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
              Delete Error
            </Text>
            <br />
            <Text type="secondary">
              {deleteProgress.message}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
} 