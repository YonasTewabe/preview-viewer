import React, { useState } from 'react';
import { Collapse, Typography, Space, Button, Tag, List, Popconfirm, Dropdown, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, RightOutlined, MoreOutlined, PlusOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

export default function ServiceAccordion({ 
  backendServices, 
  onEditService, 
  onDeleteService, 
  onAddBranch, 
  onDeleteBranch, 
  onGetBuildArtifacts,
  onRebuildBranch,
  getServiceTypeColor 
}) {
  console.log(backendServices,"backendServices");
  const [expandedBranches, setExpandedBranches] = useState({});

  const toggleBranchDetails = (branchId) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchId]: !prev[branchId]
    }));
  };

  const handleCopyUrl = (service) => {
    const urlToCopy = service.repo_url || service.url || service.service_name || '';
    navigator.clipboard.writeText(urlToCopy).then(() => {
      message.success('URL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      message.error('Failed to copy URL.');
    });
  };

  const getMenuItems = (service) => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => onEditService(service),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: 'Delete this backend service?',
          content: 'Are you sure you want to delete this service?',
          okText: 'Yes',
          okType: 'danger',
          cancelText: 'No',
          onOk: () => onDeleteService(service.id),
        });
      },
    },
  ];

  return (
    <Collapse 
      defaultActiveKey={[]}
      style={{ backgroundColor: "transparent", border: "none"}}
      expandIcon={({ isActive }) => (
        <RightOutlined 
          style={{ 
            color: '#64748b', 
            fontSize: '12px', 
            transition: 'transform 0.3s',
            transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)'
          }} 
        />
      )}
    >
      {backendServices?.map((service) => {
        // Get the first branch name or default
        const branchName = service.branches && service.branches.length > 0 
          ? service.branches[0].name 
          : service.repository_name || 'N/A';
        
        return (
          <Panel
            key={service.id}
            header={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                paddingRight: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text strong style={{ fontSize: '16px' }}>{service.service_name}</Text>
                  <Tag color={getServiceTypeColor(service.type)} style={{ marginLeft: '4px' }}>
                    {service.type}
                  </Tag>
                </div>
                <Space>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyUrl(service);
                    }}
                    style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                  >
                    Copy URL
                  </Button>
                  <Dropdown
                    menu={{ items: getMenuItems(service) }}
                    trigger={['click']}
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </Dropdown>
                </Space>
              </div>
            }
            style={{
              marginBottom: "12px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              // backgroundColor: "#ffffff",
            }}
          >
            <div style={{ padding: '20px 0' }}>

            {/* Service Details Section - Rounded Label Badges */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div
              className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-md p-2 inline-flex items-center"
              >
                <Text strong style={{ fontSize: '12px', color: '#475569', marginRight: '6px' }}>Branch:</Text>
                <Text style={{ fontSize: '12px', color: '#1e293b' }}>{branchName}</Text>
              </div>
              
              {service.repo_url && (
                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  <Text strong style={{ fontSize: '12px', color: '#475569', marginRight: '6px' }}>Repo:</Text>
                  <Text style={{ fontSize: '12px', color: '#1e293b' }}>{service.repo_url}</Text>
                </div>
              )}
              
              {service.repo_url && (
                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  <Text strong style={{ fontSize: '12px', color: '#475569', marginRight: '6px' }}>URL:</Text>
                  <Text style={{ fontSize: '12px', color: '#1e293b' }}>{service.repo_url}</Text>
                </div>
              )}
              
              {service.env_name && (
                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  <Text strong style={{ fontSize: '12px', color: '#475569', marginRight: '6px' }}>Env:</Text>
                  <Text style={{ fontSize: '12px', color: '#1e293b' }}>{service.env_name}</Text>
                </div>
              )}
              
              {service.port && (
                <div style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  <Text strong style={{ fontSize: '12px', color: '#475569', marginRight: '6px' }}>Port:</Text>
                  <Text style={{ fontSize: '12px', color: '#1e293b' }}>{service.port}</Text>
                </div>
              )}
            </div>

            {/* Branches Section */}
            <div style={{ 
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #e2e8f0',
              position: 'relative',
              minHeight: '120px'
            }}>
              <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '20px' }}>
                Branches
              </Text>
              
              {/* Branches List or Empty State */}
              {service.branches && service.branches.length > 0 ? (
                <List
                  size="small"
                  dataSource={service.branches}
                  renderItem={(branch) => (
                    <List.Item
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        marginBottom: "8px",
                        // backgroundColor: "#ffffff",
                      }}
                      actions={[
                        branch.build_number && (
                          <Button
                            size="small"
                            type="text"
                            onClick={() => onGetBuildArtifacts(branch.build_number)}
                            title="View Build Artifacts"
                          >
                            📋
                          </Button>
                        ),
                        <Popconfirm
                          title="Delete this branch?"
                          description={`Are you sure you want to delete branch "${branch.name}" and its domain "${branch.domain_name}"? This will also delete the domain from Jenkins.`}
                          onConfirm={() => onDeleteBranch(service.id, branch.id)}
                          okText="Yes, Delete"
                          cancelText="Cancel"
                        >
                          <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            type="text"
                            title="Delete branch and domain"
                          />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Text strong style={{ fontSize: "13px" }}>{branch.name}</Text>
                            <Tag color={branch.status === 'active' ? 'green' : 'orange'} size="small">
                              {branch.status}
                            </Tag>
                            {branch.domain_name && (
                              <Tag color="blue" size="small">
                                {branch.domain_name}
                              </Tag>
                            )}
                          </div>
                        }
                        description={
                          <div>
                            {branch.description && (
                              <Text type="secondary" style={{ fontSize: "11px" }}>
                                {branch.description}
                              </Text>
                            )}
                            <div style={{ marginTop: "4px" }}>
                              <Text type="secondary" style={{ fontSize: "10px" }}>
                                Created: {new Date(branch.created_at).toLocaleDateString()}
                              </Text>
                              {branch.port && (
                                <Text type="secondary" style={{ fontSize: "10px", marginLeft: "8px" }}>
                                  Port: {branch.port}
                                </Text>
                              )}
                            </div>
                            
                            {/* Show more details section */}
                            {(branch.jenkins_job_url || branch.build_result || branch.preview_link) && (
                              <>
                                {expandedBranches[branch.id] && (
                                  <>
                                    {branch.jenkins_job_url && (
                                      <div style={{ marginTop: "4px" }}>
                                        <Text type="secondary" style={{ fontSize: "10px" }}>
                                          Jenkins Job: {branch.jenkins_job_url}
                                        </Text>
                                      </div>
                                    )}
                                    {branch.build_result && (
                                      <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Text type="secondary" style={{ fontSize: "10px" }}>
                                          Build Status: 
                                          <Tag 
                                            color={branch.build_result === 'success' ? 'green' : branch.build_result === 'failed' ? 'red' : 'orange'} 
                                            size="small" 
                                            style={{ marginLeft: "4px" }}
                                          >
                                            {branch.build_result}
                                          </Tag>
                                        </Text>
                                      
                                          <Button
                                            size="small"
                                            type="primary"
                                            danger
                                            onClick={() => onRebuildBranch(service.id, branch.id, branch.name)}
                                            title="Rebuild Branch"
                                          >
                                            🔄 Rebuild
                                          </Button>
                                       
                                      </div>
                                    )}
                                    {branch.preview_link && (
                                      <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Text type="secondary" style={{ fontSize: "10px" }}>
                                          Preview Link: {branch.preview_link}
                                        </Text>
                                        <Button
                                          size="small"
                                          type="text"
                                          style={{ padding: "0 4px", fontSize: "10px" }}
                                          onClick={() => {
                                            navigator.clipboard.writeText(branch.preview_link);
                                            message.success('Preview link copied to clipboard!');
                                          }}
                                          title="Copy Preview Link"
                                        >
                                          📋
                                        </Button>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {/* Show more/less button */}
                                <div style={{ marginTop: "8px" }}>
                                  <Button
                                    type="link"
                                    size="small"
                                    onClick={() => toggleBranchDetails(branch.id)}
                                    style={{ 
                                      padding: 0, 
                                      height: 'auto',
                                      fontSize: "10px",
                                      color: '#3b82f6'
                                    }}
                                    icon={expandedBranches[branch.id] ? <UpOutlined /> : <DownOutlined />}
                                  >
                                    {expandedBranches[branch.id] ? 'Show less' : 'Show more'}
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ 
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#64748b'
                }}>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    No branches created yet
                  </Text>
                </div>
              )}
              
              {/* Add Branch Button - Bottom Right */}
              <div className='flex justify-end'>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => onAddBranch(service.id)}
                  style={{
                    backgroundColor: '#3b82f6',
                    borderColor: '#3b82f6',
                  }}
                >
                  Branch
                </Button>
              </div>
            </div>
            </div>
          </Panel>
        );
      })}
    </Collapse>
  );
}
