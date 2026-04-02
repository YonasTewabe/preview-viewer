import React from 'react';
import { Modal, Spin, Typography, Button } from 'antd';

const { Text } = Typography;

export default function BuildProgressModal({ 
  isVisible, 
  buildProgress, 
  onCancel 
}) {
  return (
    <Modal
      title="Build progress"
      open={isVisible}
      onCancel={onCancel}
              footer={[
          <Button key="close" onClick={onCancel}>
            Close
          </Button>
        ]}
      width={600}
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {buildProgress.stage === 'triggering' && (
          <div>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text strong>{buildProgress.message}</Text>
              <br />
              <Text type="secondary">Please wait while Jenkins processes your request...</Text>
              {buildProgress.buildNumber && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">Build #{buildProgress.buildNumber}</Text>
                </div>
              )}
            </div>
          </div>
        )}
        
        {buildProgress.stage === 'completed' && (
          <div>
            <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>
              ✅
            </div>
            <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
              {buildProgress.message}
            </Text>
            <br />
            <Text type="secondary">
              Build #{buildProgress.buildNumber} completed successfully
            </Text>
            
            {/* Console Logs */}
            {buildProgress.consoleLog && (
              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <Text strong>Console Logs:</Text>
                <pre style={{ 
                  backgroundColor: '#f0f0f0', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '11px',
                  maxHeight: '150px',
                  overflow: 'auto',
                  marginTop: '8px',
                  border: '1px solid #d9d9d9'
                }}>
                  {buildProgress.consoleLog}
                </pre>
              </div>
            )}
            
            {buildProgress.artifactData && (
              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <Text strong>Build Artifacts:</Text>
                <pre style={{ 
                  backgroundColor: '#f6ffed', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  marginTop: '8px'
                }}>
                  {JSON.stringify(buildProgress.artifactData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {buildProgress.stage === 'failed' && (
          <div>
            <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
              ❌
            </div>
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
              {buildProgress.message}
            </Text>
            <br />
            <Text type="secondary">
              Build #{buildProgress.buildNumber} failed
            </Text>
            
            {/* Console Logs */}
            {buildProgress.consoleLog && (
              <div style={{ marginTop: '16px', textAlign: 'left' }}>
                <Text strong>Console Logs:</Text>
                <pre style={{ 
                  backgroundColor: '#fff2f0', 
                  padding: '8px', 
                  borderRadius: '4px',
                  fontSize: '11px',
                  maxHeight: '150px',
                  overflow: 'auto',
                  marginTop: '8px',
                  border: '1px solid #ffccc7'
                }}>
                  {buildProgress.consoleLog}
                </pre>
              </div>
            )}
          </div>
        )}
        
        {buildProgress.stage === 'error' && (
          <div>
            <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>
              ⚠️
            </div>
            <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
              Build Error
            </Text>
            <br />
            <Text type="secondary">
              {buildProgress.message}
            </Text>
          </div>
        )}
      </div>
    </Modal>
  );
} 