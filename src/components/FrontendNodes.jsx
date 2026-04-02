import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Typography,
  Button,
  Spin,
  Empty,
  Dropdown,
  Pagination,
  Input,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Text } = Typography;
const { Search } = Input;

export default function FrontendNodes({
  frontendNodes,
  isLoadingFrontendNodes,
  onAddNode,
  onEditNode,
  onDeleteNode,
  onNodeClick,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Reset to page 1 when data or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [frontendNodes?.data?.length, searchTerm]);

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    if (!frontendNodes?.data) return [];

    return frontendNodes.data.filter((node) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        node.service_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [frontendNodes?.data, searchTerm]);

  // Calculate paginated data from filtered nodes
  const paginatedNodes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredNodes.slice(startIndex, endIndex);
  }, [filteredNodes, currentPage, pageSize]);

  const totalNodes = filteredNodes.length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddNode}
          size="large"
          style={{
            flexShrink: 0,
            backgroundColor: "#3b82f6",
            borderColor: "#3b82f6",
          }}
        >
          Add Node
        </Button>
        <Search
          placeholder="Search nodes by name"
          allowClear
          size="large"
          style={{ flex: 1, minWidth: "200px" }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={setSearchTerm}
          prefix={<SearchOutlined />}
        />
      </div>

      {isLoadingFrontendNodes ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
          }}
        >
          <Spin size="large" tip="Loading nodes..." />
        </div>
      ) : filteredNodes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#64748b",
          }}
        >
          <Empty
            description={
              frontendNodes?.data?.length === 0
                ? 'No nodes yet. Use "Add Node" to create one.'
                : "No nodes match your search."
            }
          />
        </div>
      ) : (
        <>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {paginatedNodes.map((node) => (
              <Card
                key={node.id}
                className="shadow-sm"
                onClick={() => onNodeClick(node)}
                hoverable
              >
                {/* Header Section */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      fontSize: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <Text strong style={{ fontSize: "16px" }}>
                      {node.service_name}
                    </Text>
                    <Text style={{ fontSize: "16px", fontWeight: 400 }}>
                      {node.branch_name}
                    </Text>
                  </div>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "edit",
                          label: "Edit",
                          icon: <EditOutlined />,
                          onClick: (e) => {
                            e.domEvent?.stopPropagation();
                            onEditNode(node);
                          },
                        },
                        {
                          key: "delete",
                          label: "Delete",
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: (e) => {
                            e.domEvent?.stopPropagation();
                            onDeleteNode(node);
                          },
                        },
                      ],
                    }}
                    trigger={["click"]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                </div>
              </Card>
            ))}
          </div>

          {totalNodes > pageSize && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "24px",
                paddingTop: "16px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <Pagination
                current={currentPage}
                total={totalNodes}
                pageSize={pageSize}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} nodes`
                }
                pageSizeOptions={["5", "10", "20", "50"]}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                onShowSizeChange={(current, size) => {
                  setCurrentPage(1);
                  setPageSize(size);
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
