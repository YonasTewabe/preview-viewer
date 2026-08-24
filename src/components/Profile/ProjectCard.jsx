import { useRef, useState } from "react";
import { Button, Dropdown, Popover, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

/** Small "P" logo badge matching the screenshot */
function ProjectLogo() {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
      style={{ background: "var(--app-primary, #6366f1)" }}
    >
      P
    </span>
  );
}

const ProjectCard = ({
  project,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const navigate  = useNavigate();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const moreWrapRef = useRef(null);

  const nodeCount = Number(project.nodes_count ?? project.node_count ?? 0) || 0;
  const tag       = String(project.tag ?? "").toLowerCase();
  const shortCode = String(project.short_code ?? project.shortCode ?? "").toLowerCase();

  const tagLabel =
    tag === "backend"  ? "Backend"  :
    tag === "frontend" ? "Frontend" :
    tag || null;

  const tagColor =
    tag === "backend"  ? { bg: "bg-violet-500/15", text: "text-violet-400", border: "border-violet-500/30" } :
    tag === "frontend" ? { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/30"   } :
                         { bg: "bg-zinc-500/15",   text: "text-zinc-400",   border: "border-zinc-500/30"   };

  const menuItems = [
    ...(canEdit ? [{
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit Project",
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation?.();
        setMenuOpen(false);
        window.setTimeout(() => onEdit?.(project), 0);
      },
    }] : []),
    ...(canDelete ? [{
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete Project",
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation?.();
        setMenuOpen(false);
        window.setTimeout(() => setDeleteOpen(true), 0);
      },
    }] : []),
  ];

  const deleteContent = (
    <div style={{ maxWidth: 280 }}>
      <p className="mb-2 font-semibold" style={{ color: "var(--app-text)" }}>
        Delete this project?
      </p>
      <p className="mb-3 text-sm" style={{ color: "var(--app-text-muted)" }}>
        Are you sure you want to delete <strong>{project.name}</strong>?
      </p>
      <Space className="flex justify-end w-full">
        <Button size="small" onClick={() => setDeleteOpen(false)}>Cancel</Button>
        <Button size="small" type="primary" danger onClick={async () => { setDeleteOpen(false); await onDelete?.(project); }}>
          Delete
        </Button>
      </Space>
    </div>
  );

  return (
    <div
      className="flex h-full cursor-pointer flex-col rounded-xl border transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background:   "var(--app-surface)",
        borderColor:  "var(--app-border)",
      }}
      onClick={() => navigate(`/projects/${project.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/projects/${project.id}`)}
    >
      {/* ── Card body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">

        {/* Top row: logo + name + kebab */}
        <div className="flex items-start gap-3">
          <ProjectLogo />
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-sm font-semibold leading-tight"
              style={{ color: "var(--app-text)" }}
            >
              {project.name}
            </h3>
            {/* Tags: type + short_code */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {tagLabel && (
                <span
                  className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${tagColor.bg} ${tagColor.text} ${tagColor.border}`}
                >
                  {tagLabel}
                </span>
              )}
              {shortCode && (
                <span
                  className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[11px]"
                  style={{
                    borderColor: "var(--app-border)",
                    color: "var(--app-text-muted)",
                    background: "var(--app-surface)",
                  }}
                >
                  {shortCode}
                </span>
              )}
            </div>
          </div>

          {/* Kebab menu */}
          <span
            ref={moreWrapRef}
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Popover
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              placement="bottomRight"
              trigger={[]}
              arrow={false}
              getPopupContainer={() => moreWrapRef.current ?? document.body}
              content={deleteContent}
            >
              <Dropdown
                open={menuOpen}
                onOpenChange={setMenuOpen}
                menu={{ items: menuItems }}
                trigger={["click"]}
                placement="bottomRight"
                disabled={menuItems.length === 0}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreHorizontal size={15} />}
                  style={{ color: "var(--app-text-muted)" }}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Project actions"
                />
              </Dropdown>
            </Popover>
          </span>
        </div>

        {/* Description */}
        <p
          className="line-clamp-2 text-sm leading-relaxed"
          style={{ color: "var(--app-text-muted)" }}
        >
          {project.description || "No description available"}
        </p>
      </div>

      {/* ── Footer ── */}
      <div
        className="flex items-center justify-between border-t px-4 py-2.5"
        style={{ borderColor: "var(--app-border)" }}
      >
        <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>
          {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
        </span>
        <button
          className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: "var(--app-primary, #6366f1)", background: "transparent" }}
          onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
        >
          Open →
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
