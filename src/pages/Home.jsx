"use client";
import { useState } from "react";
import { Card, Typography, Layout, Space, Row, Col } from "antd";
import RepoSelector from "../components/RepoSelector";
import BranchSelector from "../components/BranchSelector";
import BuildStatus from "../components/BuildStatus";
import BuildTrigger from "../components/BuildTrigger";
import { ErrorBoundary } from "./ErrorBoundary";

const { Title } = Typography;
const { Header, Content } = Layout;

export default function Home() {
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState(null);
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState("idle"); // idle | prCreated
  const [prUrl, setPrUrl] = useState(null);

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch);
    setStatus(null);
    setStep("idle");
    setPrUrl(null);

  };

  const handleRepoChange = (newRepo) => {
    setRepo(newRepo);
    setBranch(null);
    setStatus(null);
    setStep("idle");
    setPrUrl(null);
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)",
      }}
    >
      <Header
        style={{
          backgroundColor: "#ffffff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Title
          level={2}
          style={{ color: "#3b82f6", margin: 0, userSelect: "none" }}
        >
          PEP Preview
        </Title>
      </Header>

      <Content style={{ padding: 0, maxWidth: "100%", overflow: "hidden" }}>
        <Row
          gutter={0}
          style={{
            margin: 0,
            width: "100%",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          {/* Left: Controls */}
          <Col
            xs={24}
            lg={8}
            style={{
              padding: "24px 12px 24px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                backgroundColor: "#ffffff",
                color: "#1e293b",
                flex: 1,
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e2e8f0",
              }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <RepoSelector repo={repo} setRepo={handleRepoChange} />
                <BranchSelector
                  repo={repo}
                  branch={branch}
                  setBranch={handleBranchChange}
                />
                <ErrorBoundary>
                  <BuildTrigger
                    repo={repo}
                    branch={branch}
                    setStatus={setStatus}
                    step={step}
                    setStep={setStep}
                    setPrUrl={setPrUrl}
                  />
                </ErrorBoundary>

                <BuildStatus status={status} />
              </Space>
            </Card>
          </Col>

          {/* Right: Preview Panel */}
          <Col
            xs={24}
            lg={16}
            style={{
              padding: "24px 24px 24px 12px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Card
              bordered={false}
              style={{
                height: "80vh",
                borderRadius: 12,
                backgroundColor: "#ffffff",
                overflow: "hidden",
                flex: 1,
                boxShadow:
                  "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                border: "1px solid #e2e8f0",
              }}
              bodyStyle={{ padding: 0, height: "80vh" }}
            >
              {step === "prCreated" && prUrl ? (
                <iframe
                  src={prUrl}
                  title="PR Preview"
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    fontSize: "16px",
                    padding: "20px",
                    textAlign: "center",
                    backgroundColor: "#f8fafc",
                  }}
                >
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
