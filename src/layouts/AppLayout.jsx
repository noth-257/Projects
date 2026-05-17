import { useStore, THEMES } from '../store/useStore';
import Sidebar from '../components/sidebar/Sidebar';
import ArticleList from '../components/articles/ArticleList';
import ArticleReader from '../components/articles/ArticleReader';
import StatusBar from '../components/ui/StatusBar';
import CreateFolderModal from '../components/modals/CreateFolderModal';
import CreateArticleModal from '../components/modals/CreateArticleModal';
import SettingsModal from '../components/modals/SettingsModal';

export default function AppLayout() {
  const { sidebarCollapsed, dashboardVisible, theme } = useStore();
  const t = THEMES[theme] || THEMES.dark;

  // Apply theme as CSS vars on root
  const themeVars = {
    '--bg': t.bg,
    '--sidebar-bg': t.sidebar,
    '--accent': t.accent,
    '--accent2': t.accent2,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: t.bg, ...themeVars }}>
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="flex-shrink-0 overflow-hidden transition-all duration-300"
          style={{ width: sidebarCollapsed ? '64px' : '256px' }}>
          <Sidebar />
        </div>

        {/* Dashboard */}
        {dashboardVisible && (
          <div className="w-80 flex-shrink-0 overflow-hidden">
            <ArticleList />
          </div>
        )}

        {/* ReaderView */}
        <div className="flex-1 overflow-hidden">
          <ArticleReader />
        </div>

      </div>

      <StatusBar />
      <CreateFolderModal />
      <CreateArticleModal />
      <SettingsModal />
    </div>
  );
}
