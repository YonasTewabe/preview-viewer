import React from 'react';
import { Tag, Button, Dropdown } from 'antd';
import { previewKindShortLabel } from '../../utils/projectServiceKind';
import { 
  EditOutlined, 
  DeleteOutlined, 
  MoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ 
  project, 
  onEdit, 
  onDelete, 
  canEdit = false, 
  canDelete = false 
}) => {
  const navigate = useNavigate();

  const menuItems = [
    ...(canEdit ? [{
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Project',
      onClick: () => onEdit(project)
    }] : []),
    ...(canDelete ? [{
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Project',
      onClick: () => onDelete(project),
      danger: true
    }] : [])
  ];

  return (
    <div
      className="p-5 bg-transparent border-2 border-gray-200 h-full hover:shadow-md transition-shadow duration-300 border border-gray-200  rounded-lg"
      onClick={() => navigate(`/projects/${project.id}`)}
     
    >
      <div className="space-y-3">
        {/* Title and Options Menu */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-xl mb-0">
              {project.name}
            </h3>
          </div>
          <Dropdown
            menu={{ items: menuItems.length > 0 ? menuItems : [] }}
            trigger={['click']}
            placement="bottomRight"
            onClick={(e) => e.stopPropagation()}
            disabled={menuItems.length === 0}
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              className="text-gray-500 hover:text-gray-700 -mt-1"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>

        {/* Project tag */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Tag
            color={project.tag === "backend" ? "purple" : "blue"}
            className="text-xs"
          >
            {previewKindShortLabel(project.tag)}
          </Tag>
        </div>

        {/* Creation Date */}
        <div className="text-gray-900 text-sm mb-3">
          Created {dayjs(project.createdAt || project.created_at).format('MMM D,YYYY')}
        </div>

        {/* Separator */}
        <hr className="border-gray-200 my-3" />

        {/* Description */}
        <p className="text-gray-500 text-sm leading-relaxed">
          {project.description || 'No description available'}
        </p>
      </div>
    </div>
  );
};

export default ProjectCard;