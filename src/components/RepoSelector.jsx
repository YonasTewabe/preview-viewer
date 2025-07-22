import { useEffect, useState } from "react";
import { Select, Spin, Typography } from "antd";
import repoConfig from "../config/repos.json";

const { Title } = Typography;
const { Option } = Select;

export default function RepoSelector({ repo, setRepo }) {
  const [tag, setTag] = useState("");
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [loading, setLoading] = useState(false);

  const uniqueTags = Array.from(new Set(repoConfig.map((r) => r.tag)));

  useEffect(() => {
    if (tag) {
      setLoading(true);
      const timeout = setTimeout(() => {
        const filtered = repoConfig.filter((r) => r.tag === tag);
        setFilteredRepos(filtered);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setFilteredRepos([]);
    }
  }, [tag]);

  return (
    <div className="space-y-4">
      <Title level={4} className="!text-white">
      </Title>

      <Select
        placeholder="Select tag"
        value={tag || undefined}
        onChange={(value) => {
          setTag(value);
          setRepo("");
        }}
        allowClear
        className="w-full"
      >
        {uniqueTags.map((t) => (
          <Option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Option>
        ))}
      </Select>

      <Select
        placeholder="Select repository"
        value={repo || undefined}
        onChange={(value) => setRepo(value)}
        disabled={!tag || loading}
        loading={loading}
        showSearch
        allowClear
        optionFilterProp="children"
        filterOption={(input, option) =>
          (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
        }
        style={{
          minWidth: 300,
        }}
      >
        {filteredRepos.map((r) => (
          <Option key={r.name} value={r.name}>
            {r.name}
          </Option>
        ))}
      </Select>

      {loading && <Spin tip="Loading repositories..." />}
    </div>
  );
}
