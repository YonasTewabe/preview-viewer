import { useState } from "react";
import { Button, message } from "antd";

export default function BuildTrigger({
  repo,
  branch,
  setStatus,
  step,
  setStep,
  setPrUrl,
}) {
  const [loading, setLoading] = useState(false);
  const owner = import.meta.env.VITE_GITHUB_OWNER;


  const handleCreatePR = async () => {
    if (!repo || !branch) {
      message.warning("Please select both repo and branch");
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/github/create-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, branch }),
      });
      console.log(owner);

      const data = await res.json();

      if (res.ok) {
        message.success("Pull request created successfully!");
        setStatus({ prNumber: data.number });
        window.open(data.url, "_blank");
        setStep("prCreated");
      } else {
        throw new Error(data.message || "PR creation failed");
      }
    } catch (err) {
      const msg = err.message || "Unknown error";
      setStatus({ error: "Failed to create PR", message: msg });
      message.error("PR creation failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPreview = () => {
    const previewUrl = import.meta.env.VITE_PREVIEW_URL;
    if (previewUrl) {
      setPrUrl(previewUrl);
    } else {
      message.error("Preview URL not set.");
    }
  };

  const onClick = () => {
    if (step === "idle") {
      handleCreatePR();
    } else if (step === "prCreated") {
      handleViewPreview();
    }
  };

  const getButtonLabel = () => {
    switch (step) {
      case "idle":
        return "Create Pull Request to Preview";
      case "prCreated":
        return "View Preview";
      default:
        return "Create Pull Request to Preview";
    }
  };

  return (
    <Button
      type="primary"
      block
      loading={loading}
      disabled={!repo || !branch}
      onClick={onClick}
      size="large"
      style={{ marginTop: 24 }}
    >
      {getButtonLabel()}
    </Button>
  );
}
