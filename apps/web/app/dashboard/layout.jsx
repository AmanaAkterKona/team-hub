"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore, useWorkspaceStore } from "../../src/store/useStore";

// ─── Icons ──────────────────────────────────────────────────────────────────
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Goals: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Kanban: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="11" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" />
    </svg>
  ),
  Announcements: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Team: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Analytics: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Logout: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Profile: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Workspace: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

// ─── Dropdown Items ──────────────────────────────────────────────────────────
const DROPDOWN_ITEMS = [
  { label: "My Profile", href: "/dashboard/profile", icon: Icons.Profile },
  { label: "Settings", href: "/dashboard/settings", icon: Icons.Settings },
  { label: "Logout", href: "/auth/logout", icon: Icons.Logout, danger: true },
];

// ─── Logo ────────────────────────────────────────────────────────────────────
function TeamHubLogo({ collapsed = false }) {
  return (
    <Link href="/" className="flex items-center gap-3 group no-underline">
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 bg-[#254283] rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-all duration-300 shadow-md shadow-blue-900/20">
          <div className="w-4 h-4 border-2 border-white/40 rounded-md rotate-45 flex items-center justify-center">
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        </div>
      </div>
      {!collapsed && (
        <div className="flex flex-col overflow-hidden">
          <span className="text-lg font-black text-[#1a1a1a] tracking-tighter leading-none">
            TEAM<span className="text-[#254283]">HUB</span>
          </span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">
            Workspace
          </span>
        </div>
      )}
    </Link>
  );
}

// ─── NavItem ─────────────────────────────────────────────────────────────────
function NavItem({ item, active, collapsed }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 no-underline group relative
        ${active ? "bg-[#254283] text-white shadow-md shadow-blue-900/20" : "text-gray-600 hover:bg-gray-100 hover:text-[#254283]"}
        ${collapsed ? "justify-center" : ""}
      `}
    >
      <span className={`flex-shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-[#254283]"}`}>
        <Icon />
      </span>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {item.label}
        </div>
      )}
    </Link>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, user, workspaceNav, adminNav }) {
  const pathname = usePathname();

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 z-40 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? "w-[72px]" : "w-[240px]"}`}>
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-gray-100 flex-shrink-0 px-4 ${collapsed ? "justify-center" : "justify-between"}`}>
        <TeamHubLogo collapsed={collapsed} />
        {!collapsed && (
          <button onClick={onToggle} className="p-1.5 rounded-lg text-gray-400 hover:text-[#254283] hover:bg-gray-100 transition-colors">
            <Icons.Close />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">
        {!collapsed && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] px-3 mb-2">Workspace</p>}
        {collapsed && <div className="h-px bg-gray-100 mb-3" />}

        {workspaceNav.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + "?")}
            collapsed={collapsed}
          />
        ))}

        <div className={collapsed ? "mt-4" : "mt-6"}>
          {!collapsed && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] px-3 mb-2">Admin Panel</p>}
          {collapsed && <div className="h-px bg-gray-100 mb-3" />}
          {adminNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-9 h-9 rounded-xl bg-[#254283]/10 flex items-center justify-center">
              <span className="text-[#254283] text-xs font-bold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#254283]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[#254283] text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name || "User"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ sidebarCollapsed, onSidebarToggle, user, currentWorkspace }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const { logout } = useAuthStore();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-30 flex items-center px-6 justify-between transition-all duration-300"
      style={{ left: sidebarWidth }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        {sidebarCollapsed && (
          <button onClick={onSidebarToggle} className="p-2 rounded-xl text-gray-400 hover:text-[#254283] hover:bg-gray-100 transition-colors">
            <Icons.Menu />
          </button>
        )}
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">
            {currentWorkspace?.name || "Dashboard"}
          </h1>
          <p className="text-xs text-gray-400">Welcome back, {user?.name?.split(" ")[0] || "there"}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); }}
            className="relative p-2.5 rounded-xl text-gray-500 hover:text-[#254283] hover:bg-gray-100 transition-colors"
          >
            <Icons.Bell />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#254283] rounded-full border-2 border-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-800">Notifications</p>
                <span className="text-xs text-[#254283] font-semibold cursor-pointer hover:underline">Mark all read</span>
              </div>
              {[
                { title: "Goal deadline approaching", time: "2h ago", unread: true },
                { title: "New announcement posted", time: "5h ago", unread: true },
                { title: "Kanban task completed", time: "1d ago", unread: false },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3 border-b border-gray-50 transition-colors">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? "bg-[#254283]" : ""}`} />
                  <div>
                    <p className={`text-sm ${n.unread ? "font-semibold text-gray-800" : "text-gray-500"}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 text-center">
                <span className="text-xs text-[#254283] font-semibold cursor-pointer hover:underline">View all</span>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#254283]/10 flex items-center justify-center">
              <span className="text-[#254283] text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || "User"}</p>
              <p className="text-xs text-gray-400">{user?.email || ""}</p>
            </div>
            <span className="text-gray-400 group-hover:text-gray-600"><Icons.ChevronDown /></span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden py-1">
              {DROPDOWN_ITEMS.map((item) => {
                const Icon = item.icon;
                if (item.danger) {
                  return (
                    <button
                      key={item.label}
                      onClick={async () => { setDropdownOpen(false); await logout(); window.location.href = "/"; }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Icon />
                      {item.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm no-underline text-gray-700 hover:bg-gray-50 hover:text-[#254283] transition-colors"
                  >
                    <Icon />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  // Workspace ID থেকে dynamic nav বানাও
  const wid = currentWorkspace?.id || "";

 const WORKSPACE_NAV = [
  { label: "Overview", href: "/dashboard", icon: Icons.Dashboard },
  ...(wid ? [
    { label: "Goals & Milestones", href: `/workspace/${wid}?tab=goals`, icon: Icons.Goals },
    { label: "Kanban Board", href: `/workspace/${wid}?tab=kanban`, icon: Icons.Kanban },
    { label: "Announcements", href: `/workspace/${wid}?tab=announcements`, icon: Icons.Announcements },
  ] : [
{ label: "My Workspace", href: "/dashboard", icon: Icons.Workspace },
  ]),
];

  const ADMIN_NAV = [
    ...(wid ? [
      { label: "Team Members", href: `/workspace/${wid}?tab=team`, icon: Icons.Team },
      { label: "Analytics", href: `/workspace/${wid}?tab=analytics`, icon: Icons.Analytics },
    ] : []),
    { label: "Settings", href: "/dashboard/settings", icon: Icons.Settings },
  ];

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        workspaceNav={WORKSPACE_NAV}
        adminNav={ADMIN_NAV}
      />
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        currentWorkspace={currentWorkspace}
      />
      <main className="transition-all duration-300 pt-16" style={{ marginLeft: sidebarWidth }}>
        <div className="p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}