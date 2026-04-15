import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Layout, Button, Space, Dropdown, Avatar, Tooltip, Grid } from "antd";
import {
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import Sidebar from "./Sidebar";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Content } = Layout;
const { useBreakpoint } = Grid;

/** Header control hovers match active `.sidebar-menu .ant-menu-item-selected` colors */
const headerCtrlHover =
  "hover:!bg-[rgba(37,99,235,0.12)] hover:!text-[#1d4ed8] dark:hover:!bg-[rgba(59,130,246,0.18)] dark:hover:!text-[#93c5fd]";

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mainScrollRef = useRef(null);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  useLayoutEffect(() => {
    mainScrollRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout
      className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-[#f5f5f5]"}`}
      style={{ minHeight: "100vh" }}
    >
      <Sidebar
        collapsed={collapsed}
        isMobile={isMobile}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <Layout
        className={`min-h-screen ${isDark ? "bg-neutral-950" : "bg-[#f5f5f5]"}`}
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 280,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          className={`!h-14 !min-h-14 !leading-none !px-4 sm:!px-6 flex items-center justify-between gap-4 border-b shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)] z-30 sticky top-0 !py-0 ${
            isDark
              ? "!bg-zinc-950/90 backdrop-blur-md border-zinc-800"
              : "!bg-white/90 backdrop-blur-md border-gray-200/80"
          }`}
        >
          <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Tooltip
              title={
                isMobile
                  ? "Open navigation"
                  : collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
            >
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                className={`!inline-flex !size-10 shrink-0 !items-center !justify-center rounded-lg text-zinc-700 transition-colors dark:text-zinc-300 ${headerCtrlHover}`}
                onClick={() =>
                  isMobile ? setMobileNavOpen(true) : setCollapsed((c) => !c)
                }
                aria-label={
                  isMobile
                    ? "Open navigation"
                    : collapsed
                      ? "Expand sidebar"
                      : "Collapse sidebar"
                }
              />
            </Tooltip>
          </div>
          <div className="flex h-14 shrink-0 items-center">
            <Space
              size="small"
              align="center"
              className="!mr-0 !flex !items-center"
            >
              <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                <Button
                  type="text"
                  icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                  className={`!inline-flex !size-10 !items-center !justify-center rounded-lg text-zinc-700 transition-colors dark:text-zinc-300 ${headerCtrlHover}`}
                  onClick={toggleTheme}
                />
              </Tooltip>
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Button
                  type="text"
                  className={`!inline-flex !h-10 !max-w-[200px] !items-center !justify-start rounded-lg px-2 text-zinc-800 transition-colors dark:text-zinc-100 sm:px-3 ${headerCtrlHover}`}
                >
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    className="shrink-0 bg-blue-600"
                  />
                  <span className="ml-2 hidden min-w-0 truncate text-sm font-medium sm:inline">
                    {user?.first_name || user?.username || "Account"}
                  </span>
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* Content — inner div is the scroll container so we can reset scroll on navigation */}
        <Content className="flex min-h-0 flex-1 flex-col p-0">
          <div
            ref={mainScrollRef}
            className={`min-h-0 flex-1 overflow-y-auto p-3 sm:p-6 ${isDark ? "bg-neutral-950" : "bg-[#f5f5f5]"}`}
          >
            <div className="text-zinc-900 dark:text-zinc-50">{children}</div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
