import { useState, useMemo } from "react";
import { Button, Pagination, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Search } from "lucide-react";
import ProjectCard from "../Profile/ProjectCard";
import AddProjectModal from "./AddProjectModal";
import { useProjects } from "../../hooks/useProjects";
import { App } from "antd";
import PageHeader from "../Layout/PageHeader";

const PAGE_SIZE = 9;

/** Small filter tab pill */
function FilterTab({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
      style={
        active
          ? { background: "var(--app-primary, #6366f1)", color: "#fff" }
          : { background: "transparent", color: "var(--app-text-muted, #94a3b8)" }
      }
    >
      {label}
      {count != null && (
        <span className={`ml-1.5 text-xs ${active ? "opacity-80" : "opacity-60"}`}>
          ({count})
        </span>
      )}
    </button>
  );
}

const MyProjects = () => {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();

  const [searchTerm,    setSearchTerm]    = useState("");
  const [inputVal,      setInputVal]      = useState("");
  const [tagFilter,     setTagFilter]     = useState("all");
  const [currentPage,   setCurrentPage]   = useState(1);
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // Tag counts for filter tabs
  const tagCounts = useMemo(() => {
    const counts = { frontend: 0, backend: 0 };
    projects.forEach((p) => {
      const t = String(p.tag ?? "").toLowerCase();
      if (t === "frontend") counts.frontend += 1;
      if (t === "backend")  counts.backend  += 1;
    });
    return counts;
  }, [projects]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = projects;
    if (tagFilter !== "all") {
      list = list.filter((p) => String(p.tag ?? "").toLowerCase() === tagFilter);
    }
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        String(p.name ?? "").toLowerCase().includes(q) ||
        String(p.tag ?? "").toLowerCase().includes(q) ||
        String(p.short_code ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [projects, tagFilter, searchTerm]);

  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Handlers
  const commitSearch = (val) => { setSearchTerm(val); setCurrentPage(1); };
  const handleTagFilter = (t) => { setTagFilter(t); setCurrentPage(1); };

  const handleEdit = (project) => {
    const full = projects.find((p) => p.id === project?.id) ?? project;
    setEditingProject(full);
    setIsModalOpen(true);
  };

  const handleDelete = async (project) => {
    try {
      await deleteProject(project.id);
    } catch {
      // error toast handled inside hook
    }
  };

  const handleModalSubmit = async (formData) => {
      if (editingProject?.id != null) {
        await updateProject({ id: editingProject.id, ...formData });
      } else {
        await createProject(formData);
      }
      setIsModalOpen(false);
      setEditingProject(null);
  };

  return (
    <div className="space-y-5" style={{ color: "var(--app-text)" }}>

      {/* ── Page header ── */}
      <PageHeader
        title="All projects"
        subtitle={`${filtered.length} ${filtered.length === 1 ? "result" : "results"}`}
        actions={
          <>
            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
              style={{ borderColor: "var(--app-border)", background: "var(--app-surface)" }}
            >
              <Search size={13} style={{ color: "var(--app-text-muted)" }} />
              <input
                type="text"
                placeholder="Search by name or tag..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && commitSearch(inputVal)}
                onBlur={() => commitSearch(inputVal)}
                className="w-48 bg-transparent text-sm outline-none placeholder:text-zinc-500"
                style={{ color: "var(--app-text)" }}
              />
            </div>
            {/* Tag filter tabs */}
            <div
              className="flex rounded-lg p-0.5"
              style={{ border: "1px solid var(--app-border)", background: "var(--app-surface)" }}
            >
              {["all", "frontend", "backend"].map((s) => (
                <FilterTab
                  key={s}
                  label={s.charAt(0).toUpperCase() + s.slice(1)}
                  count={s === "all" ? projects.length : tagCounts[s]}
                  active={tagFilter === s}
                  onClick={() => handleTagFilter(s)}
                />
              ))}
            </div>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingProject(null); setIsModalOpen(true); }}>
              New project
            </Button>
          </>
        }
      />

      {/* ── Grid ── */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spin size="large" />
        </div>
      ) : paginated.length === 0 ? (
        <div
          className="flex h-64 items-center justify-center rounded-xl border text-sm"
          style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}
        >
          No projects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit
              canDelete
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex justify-end pt-2">
          <Pagination
            current={currentPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onChange={(p) => setCurrentPage(p)}
            showSizeChanger={false}
            size="small"
          />
        </div>
      )}

      {/* ── Modal ── */}
      <AddProjectModal
        visible={isModalOpen}
        project={editingProject}
        onSubmit={handleModalSubmit}
        onCancel={() => { setIsModalOpen(false); setEditingProject(null); }}
        isEdit={!!editingProject}
      />
    </div>
  );
};

export default MyProjects;
