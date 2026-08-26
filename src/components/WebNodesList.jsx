import React, { useState, useEffect, useMemo, useRef } from "react";
import {
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
  RightOutlined,
} from "@ant-design/icons";
import { GitBranch } from "lucide-react";

// ─── Row-level actions (⋮ menu + delete confirmation popover) ─────────────────
function NodeRowActions({ node, onEditNode, onDeleteNode, deletingThis }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const wrapRef = useRef(null);

  const deleteContent = (
    <div style={{ maxWidth: 280 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--app-text)" }}>
        Delete this node?
      </div>
      <p style={{ marginBottom: 12, color: "var(--app-text-muted)", fontSize: 13 }}>
        Are you sure you want to delete <strong>{node.service_name}</strong>?
      </p>
      <Space style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
        <Button size="small" onClick={() => setDeleteOpen(false)}>Cancel</Button>
        <Button
          size="small"
          type="primary"
          danger
          onClick={() => { setDeleteOpen(false); void onDeleteNode(node); }}
        >
          Delete
        </Button>
      </Space>
    </div>
  );

  return (
    <span
      ref={wrapRef}
      className="inline-flex shrink-0 items-center"
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
              icon={<MoreOutlined style={{ color: "var(--app-text-muted)" }} />}
              aria-label="Node actions"
              disabled={deletingThis}
              size="small"
              onClick={(e) => e.stopPropagation()}
              style={{ background: "transparent", border: "none" }}
            />
          </Dropdown>
        </span>
      </Popover>
    </span>
  );
}

// ─── Small coloured icon matching the screenshot's purple "P" glyph ───────────
function NodeIcon({ name }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-lg text-sm font-bold"
      style={{
        width: 50,
        height: 50,
        background: "rgba(99,102,241,0.15)",
        color: "#818cf8",
      }}
    >
      {String(name ?? "?")[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

// ─── Main list component ───────────────────────────────────────────────────────
export default function WebNodesList({
  nodesData,
  isLoadingNodes,
  onAddNode,
  onEditNode,
  onDeleteNode,
  onNodeClick,
  deletingNodeId = null,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setCurrentPage(1);
  }, [nodesData?.data?.length, searchTerm]);

  const filteredNodes = useMemo(() => {
    if (!nodesData?.data) return [];
    return nodesData.data.filter((node) =>
      !searchTerm ||
      node.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nodesData?.data, searchTerm]);

  const paginatedNodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNodes.slice(start, start + pageSize);
  }, [filteredNodes, currentPage]);

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddNode}
          style={{ flexShrink: 0, backgroundColor: "#6366f1", borderColor: "#6366f1" }}
        >
          Add Node
        </Button>
        <Input
          placeholder="Search nodes by name"
          allowClear
          prefix={<SearchOutlined style={{ color: "var(--app-text-muted)" }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            background: "var(--app-surface)",
            borderColor: "var(--app-border)",
            color: "var(--app-text)",
          }}
        />
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {isLoadingNodes ? (
        <div className="flex h-48 items-center justify-center">
          <Spin size="large" />
        </div>
      ) : filteredNodes.length === 0 ? (
        <div className="flex h-48 items-center justify-center">
          <Empty
            description={
              nodesData?.data?.length === 0
                ? 'No nodes yet. Use "Add Node" to create one.'
                : "No nodes match your search."
            }
          />
        </div>
      ) : (
        <>
          {/* ── Node rows ─────────────────────────────────────────────────── */}
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--app-border)" }}
          >
            {paginatedNodes.map((node, idx) => {
              const deletingThis =
                deletingNodeId != null &&
                String(node.id) === String(deletingNodeId);
              const isLast = idx === paginatedNodes.length - 1;

              return (
                <div
                  key={node.id}
                  className="relative flex items-center gap-4 px-5 py-4 transition-colors"
                  style={{
                    background: "var(--app-card, var(--app-bg))",
                    borderBottom: isLast ? "none" : "1px solid var(--app-border)",
                    cursor: deletingThis ? "default" : "pointer",
                    opacity: deletingThis ? 0.6 : 1,
                  }}
                  onClick={() => { if (!deletingThis) onNodeClick(node); }}
                >
                  {/* Deleting overlay */}
                  {deletingThis && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit]"
                      style={{ background: "var(--app-surface, rgba(0,0,0,0.15))" }}
                    >
                      <Spin size="small" />
                    </div>
                  )}

                  {/* Icon */}
                  <NodeIcon name={node.service_name} />

                  {/* Name + branch */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span
                      className="truncate text-sm font-semibold leading-tight"
                      style={{ color: "var(--app-text)", fontSize: 15 }}
                    >
                      {node.service_name || "—"}
                    </span>
                    {node.branch_name && (
                      <span
                        className="inline-flex items-center gap-1 self-start rounded border px-2 py-0.5 font-mono text-xs"
                        style={{
                          borderColor: "var(--app-border)",
                          color: "var(--app-text-muted)",
                          background: "var(--app-surface)",
                          fontSize: 12,
                        }}
                      >
                        <GitBranch size={11} className="shrink-0" />
                        {node.branch_name}
                      </span>
                    )}
                  </div>

                  {/* Actions + chevron */}
                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <NodeRowActions
                      node={node}
                      onEditNode={onEditNode}
                      onDeleteNode={onDeleteNode}
                      deletingThis={deletingThis}
                    />
                    <RightOutlined
                      style={{ fontSize: 11, color: "var(--app-text-muted)" }}
                      onClick={(e) => { e.stopPropagation(); if (!deletingThis) onNodeClick(node); }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ──────────────────────────────────────────────────── */}
          {filteredNodes.length > pageSize && (
            <div className="mt-4 flex justify-center">
              <Pagination
                current={currentPage}
                total={filteredNodes.length}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                size="small"
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}–${range[1]} of ${total}`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
