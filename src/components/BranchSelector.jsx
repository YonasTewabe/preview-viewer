// src/components/BranchSelector.jsx
import { useEffect, useState } from "react";
import { Select, Alert } from "antd";

const { Option } = Select;

export default function BranchSelector({ repo, branch, setBranch }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const org = import.meta.env.VITE_GITHUB_OWNER;

  useEffect(() => {
    if (!repo) {
      setBranches([]);
      return;
    }

    async function fetchBranches() {
      setLoading(true);
      try {
        const res = await fetch(`/api/github/branches?org=${org}&repo=${repo}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setBranches(data);
      } catch (err) {
        console.error("Failed to fetch branches:", err);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, [repo, org]);

  return (
    <div style={{ marginTop: 16 }}>
      <Select
        id="branch"
        value={branch || undefined}
        onChange={setBranch}
        placeholder="Select branch"
        loading={loading}
        style={{ width: "100%" }}
        disabled={!repo || !branches.length}
        allowClear
        showSearch
        filterOption={(input, option) =>
          option.children.toLowerCase().includes(input.toLowerCase())
        }
      >
        {branches.map((b) => (
          <Option key={b.name} value={b.name}>
            {b.name}
          </Option>
        ))}
      </Select>
    </div>
  );
}
