'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Skeleton,
  Alert,
  Input,
  Space,
  Table,
  Popconfirm,
  Tooltip,
  message,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftOutlined, EnvironmentOutlined, DeleteOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import { projectService } from '../../services/projectService';

const { TextArea } = Input;

// Skeleton Component for ProjectEnvironments
const ProjectEnvironmentsSkeleton = () => {
  return (
    <div className="h-screen">
      <div className="mb-4 flex item-center gap-4">
        <Skeleton.Button active size="default" style={{ width: 60, height: 32 }} />
      </div>
      <Card>
        <Skeleton active paragraph={{ rows: 12 }} />
      </Card>
    </div>
  );
};

const ProjectEnvironments = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [isEditingEnvironments, setIsEditingEnvironments] = useState(true);
  const [isSavingEnvironments, setIsSavingEnvironments] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['envVars', projectId],
    queryFn: () => projectService.listEnvVars(projectId),
  });

  // Convert environments array to text format
  // Initialize environments state when data loads
  useEffect(() => {
    if (data && Array.isArray(data.env_vars)) {
      setRows(
        data.env_vars.map((e) => ({
          env_variable: e.key,
          env: e.value ?? '',
        }))
      );
    }
  }, [data]);

  if (isLoading) {
    return <ProjectEnvironmentsSkeleton />;
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Failed to load project"
        description={error?.message || String(error)}
        showIcon
      />
    );
  }

  if (!data) {
    return <Alert type="warning" message="No project data available" showIcon />;
  }

  const invalidateEnvRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['envVars', projectId] });
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  };

  const handleCancelEditEnvironments = () => {
    setRows(
      (Array.isArray(data.env_vars) ? data.env_vars : []).map((e) => ({
        env_variable: e.key,
        env: e.value ?? '',
      }))
    );
    setNewKey('');
    setNewValue('');
    setEditingKey(null);
    setIsEditingEnvironments(false);
  };

  const handleEdit = () => {
    setIsEditingEnvironments(true);
  };

  const handleAddOrUpdate = () => {
    const key = newKey.trim();
    const value = String(newValue ?? '').trim();
    if (!key) return message.error('Key is required');
    if (!value) return message.error('Value is required');
    if (!/^[A-Z0-9_]+$/i.test(key)) return message.error('Key can only contain letters, numbers, and underscore');

    const normalizedNewKey = key;
    const normalizedOldKey = editingKey ? String(editingKey).trim() : null;
    const keyLc = (k) => String(k).trim().toLowerCase();
    const dupMsg =
      'An environment variable with this key already exists for this project. Use edit to change its value.';

    if (!editingKey) {
      if (rows.some((r) => keyLc(r.env_variable) === keyLc(normalizedNewKey))) {
        return message.error(dupMsg);
      }
    } else if (
      keyLc(normalizedNewKey) !== keyLc(normalizedOldKey) &&
      rows.some(
        (r) =>
          keyLc(r.env_variable) === keyLc(normalizedNewKey) &&
          keyLc(r.env_variable) !== keyLc(normalizedOldKey),
      )
    ) {
      return message.error(dupMsg);
    }

    setIsSavingEnvironments(true);

    let action;
    if (!editingKey) {
      action = projectService.addEnvVar(projectId, normalizedNewKey, value);
    } else if (normalizedOldKey && normalizedNewKey.toLowerCase() === normalizedOldKey.toLowerCase()) {
      // Same key, just update value
      action = projectService.updateEnvVar(projectId, normalizedOldKey, value);
    } else {
      // Key rename: delete old, create new
      action = projectService
        .deleteEnvVar(projectId, normalizedOldKey)
        .then(() => projectService.addEnvVar(projectId, normalizedNewKey, value));
    }

    Promise.resolve(action)
      .then(() => invalidateEnvRelatedQueries())
      .then(() => {
        setNewKey('');
        setNewValue('');
        setEditingKey(null);
        message.success('Saved');
      })
      .catch((error) => {
        const msg = error?.response?.data?.error || 'Failed to save environment variable';
        message.error(msg);
      })
      .finally(() => setIsSavingEnvironments(false));
  };

  const startEditRow = (record) => {
    setEditingKey(record.env_variable);
    setNewKey(record.env_variable);
    setNewValue(record.env ?? '');
  };

  const cancelRowEdit = () => {
    setEditingKey(null);
    setNewKey('');
    setNewValue('');
  };

  const handleDeleteRow = (key) => {
    setIsSavingEnvironments(true);
    projectService
      .deleteEnvVar(projectId, key)
      .then(() => invalidateEnvRelatedQueries())
      .then(() => message.success('Deleted'))
      .catch((error) => {
        const msg = error?.response?.data?.error || 'Failed to delete environment variable';
        message.error(msg);
      })
      .finally(() => setIsSavingEnvironments(false));
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'env_variable',
      key: 'env_variable',
      width: 240,
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: 'Value',
      dataIndex: 'env',
      key: 'env',
      render: (v) => (
        <span style={{ fontFamily: 'monospace' }}>
          {String(v ?? '')}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {isEditingEnvironments && (
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => startEditRow(record)}
            />
          )}
          <Popconfirm
            title="Delete this env var?"
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
            onConfirm={() => handleDeleteRow(record.env_variable)}
          >
            <Button danger type="text" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="h-screen">
      <div className="mb-4 flex items-center gap-4">
        <Button
          className="!text-black !font-semibold !text-lg"
          type="link"
          onClick={() => navigate(`/projects/${projectId}`)}
          icon={<ArrowLeftOutlined />}
        >
          Back to Project
        </Button>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <EnvironmentOutlined className="text-blue-600" />
            <span>Project Environments - {data.env_name || ''}</span>
          </div>
        }
        extra={
          !isEditingEnvironments ? (
            <Space>
              <Button type="primary" onClick={handleEdit}>Edit</Button>
            </Space>
          ) : (
            <Space>
              <Button onClick={handleCancelEditEnvironments}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={isSavingEnvironments}
                onClick={() => setIsEditingEnvironments(false)}
              >
                Done
              </Button>
            </Space>
          )
        }
      >
        {isEditingEnvironments ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, alignItems: 'start' }}>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="key"
                autoComplete="off"
              />
              <Input.TextArea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="value"
                rows={1}
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
              <Space>
                {editingKey ? (
                  <>
                    <Button onClick={cancelRowEdit} icon={<CloseOutlined />}>
                      Cancel
                    </Button>
                    <Button type="primary" loading={isSavingEnvironments} onClick={handleAddOrUpdate}>
                      Update
                    </Button>
                  </>
                ) : (
                  <Button type="primary" loading={isSavingEnvironments} onClick={handleAddOrUpdate}>
                    Add
                  </Button>
                )}
              </Space>
            </div>

            <div style={{ marginTop: 16 }}>
              <Table
                rowKey="env_variable"
                size="small"
                columns={columns}
                dataSource={rows}
                pagination={rows.length > 10 ? { pageSize: 10 } : false}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            <Table
              rowKey="env_variable"
              size="small"
              columns={columns.filter((c) => c.key !== 'action')}
              dataSource={rows}
              pagination={rows.length > 10 ? { pageSize: 10 } : false}
              locale={{
                emptyText: (
                  <div style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                    <EnvironmentOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <p>No environments configured.</p>
                    <p>Click Edit to add environment variables.</p>
                  </div>
                ),
              }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProjectEnvironments;

