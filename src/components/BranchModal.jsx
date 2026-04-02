import React from 'react';
import { Modal, Form, Input, Select } from 'antd';

const { Option } = Select;

export default function BranchModal({ 
  isVisible, 
  onOk, 
  onCancel, 
  form, 
  githubBranches, 
  loadingGithubBranches 
}) {
  return (
    <Modal
      title="Add New Branch"
      open={isVisible}
      onOk={onOk}
      onCancel={onCancel}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="Select GitHub Branch"
          rules={[{ required: true, message: "Please select a branch" }]}
        >
          <Select
            placeholder="Select a branch from GitHub"
            loading={loadingGithubBranches}
            showSearch
            filterOption={(input, option) => {
              const optionText = typeof option.children === 'string' 
                ? option.children 
                : String(option.children);
              return optionText.toLowerCase().indexOf(input.toLowerCase()) >= 0;
            }}
          >
            {githubBranches.map((branch,index) => (
              <Option key={index} value={branch}>
               {index+1} {branch}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Description (Optional)"
        >
          <Input.TextArea 
            placeholder="Brief description of the branch"
            rows={3}
          />
        </Form.Item>
        
        <Form.Item
          name="status"
          label="Status"
          initialValue="active"
        >
          <Select>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="merged">Merged</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
} 