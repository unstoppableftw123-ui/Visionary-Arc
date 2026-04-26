import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import UpgradeBanner from "./UpgradeBanner";
import GlobalSidebar from "./GlobalSidebar";
import FloatingAIChat from "./FloatingAIChat";

const HIDE_BANNER_ROUTES = ["/settings"];
// Routes that manage their own layout/scrolling and need no padding wrapper
const FULL_HEIGHT_ROUTES = ["/notes-studio", "/practice-hub"];

/**
 * Root layout for all authenticated pages: sidebar + main content area.
 * UpgradeBanner is shown above page content on every route except /settings.
 */
export default function Layout() {
  const location = useLocation();
  const showBanner = !HIDE_BANNER_ROUTES.includes(location.pathname);
  const isFullHeight = FULL_HEIGHT_ROUTES.includes(location.pathname);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {isFullHeight ? (
          <>
            {showBanner && <UpgradeBanner />}
            <Outlet />
          </>
        ) : (
          <div className="flex-1 overflow-auto px-4 pb-24 pt-4 sm:px-4 sm:pb-24 sm:pt-4 md:p-8">
            {showBanner && <UpgradeBanner />}
            <Outlet />
          </div>
        )}
      </main>
      <GlobalSidebar />
      <FloatingAIChat />
    </div>
  );
}
