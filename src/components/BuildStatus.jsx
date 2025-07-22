import { Alert, Typography } from "antd";

const { Text, Link } = Typography;

export default function BuildStatus({ status }) {
  console.log("BuildStatus status:", status);

  if (!status) return null;

  // Show error alert separately
  if (status.error) {
    return (
      <Alert
        style={{ marginTop: 16 }}
        message="Error"
        description={status.message || status.error}
        type="error"
        showIcon
      />
    );
  }

  // Show success/info status
  return (
    <Alert
      style={{ marginTop: 16 }}
      type="success"
      showIcon
      message={
        <div>
          {/* Show status text */}
          {status.status && (
            <div>
              <Text strong>Status: </Text> <Text>{status.status}</Text>
            </div>
          )}

          {/* Show info text */}
          {status.info && (
            <div>
              <Text strong>Info: </Text> <Text>{status.info}</Text>
            </div>
          )}

          {/* Show general message */}
          {status.message && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">{status.message}</Text>
            </div>
          )}

          {/* Show clickable preview URL */}
          {status.previewUrl && (
            <div style={{ marginTop: 8 }}>
              <Text strong>Preview: </Text>
              <Link
                href={status.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {status.previewUrl}
              </Link>
            </div>
          )}
        </div>
      }
    />
  );
}
