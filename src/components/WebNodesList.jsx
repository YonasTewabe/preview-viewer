import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  Typography,
  Button,
  Spin,
  Empty,
  Pagination,
  Input,
  Dropdown,
  Popover,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
} from "@ant-design/icons";

function NodeRowActions({
  node,
  onEditNode,
  onDeleteNode,
  deletingThis,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const wrapRef = useRef(null);

  const deleteContent = (
    <div style={{ maxWidth: 300 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Delete this service?</div>
      <p style={{ marginBottom: 12 }}>
        Are you sure you want to delete <strong>{node.service_name}</strong>?
        This cannot be undone.
      </p>
      <Space style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
        <Button size="small" onClick={() => setDeleteOpen(false)}>
          Cancel
        </Button>
        <Button
          size="small"
          type="primary"
          danger
          onClick={() => {
            setDeleteOpen(false);
            void onDeleteNode(node);
          }}
        >
          Delete
        </Button>
      </Space>
    </div>
  );

  return (
    <span
      ref={wrapRef}
      className="inline-flex shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <Popover
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        placement="bottomRight"
        trigger={[]}
        arrow={false}
        getPopupContainer={() => wrapRef.current ?? document.body}
        content={deleteContent}
      >
        <span className="inline-flex">
          <Dropdown
            open={menuOpen}
            onOpenChange={setMenuOpen}
            trigger={["click"]}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: "edit",
                  label: "Edit",
                  icon: <EditOutlined />,
                  onClick: () => {
                    setMenuOpen(false);
                    window.setTimeout(() => onEditNode(node), 0);
                  },
                },
                {
                  key: "delete",
                  label: "Delete",
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => {
                    setMenuOpen(false);
                    window.setTimeout(() => setDeleteOpen(true), 0);
                  },
                },
              ],
            }}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              aria-label="Node actions"
              disabled={deletingThis}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </span>
      </Popover>
    </span>
  );
}

const { Text } = Typography;
const { Search } = Input;

export default function WebNodesList({
  frontendNodes,
  isLoadingFrontendNodes,
  onAddNode,
  onEditNode,
  onDeleteNode,
  onNodeClick,
  deletingNodeId = null,
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
            {paginatedNodes.map((node) => {
              const deletingThis =
                deletingNodeId != null &&
                Number(node.id) === Number(deletingNodeId);

              return (
              <Card
                key={node.id}
                className="shadow-sm relative"
                onClick={() => {
                  if (!deletingThis) onNodeClick(node);
                }}
                hoverable={!deletingThis}
              >
                {deletingThis ? (
                  <div className="absolute inset-0 z-[1] flex items-center justify-center rounded-[inherit] bg-white/70">
                    <Spin tip="Deleting…" />
                  </div>
                ) : null}
                {/* Name + branch (match FrontendConfig service detail fields) */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Node Name:
                      </Text>
                      <Input
                        value={
                          node.service_name
                            ? String(node.service_name)
                            : "—"
                        }
                        readOnly
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      />
                    </div>
                    <div>
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Branch:
                      </Text>
                      <Input
                        value={
                          node.branch_name
                            ? String(node.branch_name)
                            : "—"
                        }
                        readOnly
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      />
                    </div>
                  </div>
                  <NodeRowActions
                    node={node}
                    onEditNode={onEditNode}
                    onDeleteNode={onDeleteNode}
                    deletingThis={deletingThis}
                  />
                </div>
              </Card>
              );
            })}
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
