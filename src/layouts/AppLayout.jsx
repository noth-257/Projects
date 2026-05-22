import { useStore, THEMES } from '../store/useStore';
import Sidebar from '../components/sidebar/Sidebar';
import ArticleList from '../components/articles/ArticleList';
import ArticleReader from '../components/articles/ArticleReader';
import StatusBar from '../components/ui/StatusBar';
import CreateFolderModal from '../components/modals/CreateFolderModal';
import CreateArticleModal from '../components/modals/CreateArticleModal';
import SettingsModal from '../components/modals/SettingsModal';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function AppLayout() {
  const { sidebarCollapsed, dashboardVisible, theme } = useStore();
  const t = THEMES[theme] || THEMES.dark;

  const themeVars = {
    '--bg': t.bg, '--sidebar-bg': t.sidebar,
    '--accent': t.accent, '--accent2': t.accent2,
  };

  const lightOverride = t.isLight ? {
    '--ink-100': '#0f172a', '--ink-200': '#1e293b', '--ink-300': '#334155',
    '--ink-400': '#475569', '--ink-500': '#64748b', '--ink-600': '#94a3b8',
    '--card-bg': 'rgba(0,0,0,0.05)', '--card-border': 'rgba(0,0,0,0.1)',
    '--input-bg': 'rgba(0,0,0,0.05)', '--input-border': 'rgba(0,0,0,0.12)',
    '--sidebar-border': 'rgba(0,0,0,0.1)',
    '--text-primary': '#0f172a', '--text-secondary': '#334155', '--text-muted': '#64748b',
  } : {
    '--sidebar-border': 'rgba(255,255,255,0.06)',
    '--text-primary': '#e8eaf6', '--text-secondary': '#c5c9e8', '--text-muted': '#64748b',
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden"
      style={{ background: t.bg, ...themeVars, ...lightOverride }}>
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="flex-shrink-0 overflow-hidden transition-all duration-300"
          style={{ width: sidebarCollapsed ? '64px' : '256px' }}>
          <Sidebar />
        </div>

        {/* Dashboard — smooth width transition via CSS, never unmounted */}
        <div className="flex-shrink-0 overflow-hidden transition-all duration-300 relative"
          style={{ width: dashboardVisible ? '320px' : '0px' }}>
          {/* Fixed-width inner so content doesn't compress during transition */}
          <div style={{ width: '320px', height: '100%' }}>
            <ArticleList />
          </div>
        </div>

        {/* Collapse handle — lives on the boundary between dashboard & reader */}
        <DashboardHandle />

        {/* ReaderView */}
        <div className="flex-1 overflow-hidden min-w-0">
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

/* Double-arrow handle sitting on the right edge of the dashboard */
function DashboardHandle() {
  const { toggleDashboard, dashboardVisible, theme } = useStore();
  const t = THEMES[theme] || THEMES.dark;
  return (
    <div className="flex-shrink-0 flex items-center justify-center relative z-10"
      style={{ width: '16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={toggleDashboard}
        title={dashboardVisible ? 'Collapse panel' : 'Expand panel'}
        className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: t.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(30,33,55,0.95)',
          border: t.isLight ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          color: t.isLight ? '#475569' : '#9da4d4',
        }}
      >
        {dashboardVisible
          ? <ChevronsLeft size={13} />
          : <ChevronsRight size={13} />}
      </button>
    </div>
  );
}
