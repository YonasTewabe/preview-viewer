import { createRoot } from "react-dom/client";
import "./index.css";
import { ConfigProvider, theme } from "antd";
import App from "./App";
import { App as AntdApp } from 'antd';
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

// Component to wrap ConfigProvider with theme context
const ThemedApp = () => {
  const { isDark } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "Poppins, sans-serif",
        },
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  );
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}
createRoot(rootElement).render(
  <ThemeProvider>
    <ThemedApp />
  </ThemeProvider>
);
