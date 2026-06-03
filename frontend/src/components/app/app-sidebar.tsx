import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  Users,
  CreditCard,
  Settings,
  User,
  ShieldCheck,
  Info,
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronUp,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SilicofellerLogo, LogoMark } from "@/components/silicofeller-logo";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth/auth-context";
import { useDesign } from "@/lib/design-context";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, signOut } = useAuth();
  const { 
    conversations, 
    activeId, 
    setActiveId, 
    handleNew, 
    handleDelete, 
    renameConversation 
  } = useDesign();

  // Rename states
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
  };

  const commitRename = (id: string) => {
    renameConversation(id, renameValue);
    setRenamingId(null);
  };

  const primaryItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "org_manager", "engineer"] },
    { title: "Designer", url: "/designer", icon: Sparkles, roles: ["admin", "org_manager", "engineer"] },
    { title: "Team Management", url: "/team", icon: Users, roles: ["admin", "org_manager"] },
    { title: "Billing", url: "/billing", icon: CreditCard, roles: ["admin", "org_manager"] },
    { title: "Admin Console", url: "/admin", icon: ShieldCheck, roles: ["admin"] },
  ];

  const secondaryItems = [
    { title: "Settings", url: "/settings", icon: Settings, roles: ["admin", "org_manager", "engineer"] },
    { title: "Profile", url: "/profile", icon: User, roles: ["admin", "org_manager", "engineer"] },
    { title: "About", url: "/about", icon: Info, roles: ["admin", "org_manager", "engineer"] },
  ];

  const visiblePrimary = primaryItems.filter((i) => (user ? i.roles.includes(user.role) : false));
  const visibleSecondary = secondaryItems.filter((i) => (user ? i.roles.includes(user.role) : false));

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/50 bg-[#FAFBFD] w-[230px] transition-all duration-200">
      
      {/* Sidebar Header with Logo */}
      <SidebarHeader className="border-b border-slate-200/50 px-4 py-4 bg-white flex justify-center h-12 select-none">
        <Link to="/" aria-label="Back to landing" className="flex items-center">
          {collapsed ? (
            <LogoMark className="mx-auto h-5 w-auto text-slate-800" />
          ) : (
            <SilicofellerLogo />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-3 flex-1 overflow-y-auto space-y-4">
        
        {/* Workspace Group */}
        <SidebarGroup className="p-0">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 px-4.5 mb-1.5">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {visiblePrimary.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-9 rounded-xl transition-all duration-150 relative ${
                        isActive
                          ? "bg-white border border-slate-200/60 text-slate-900 shadow-sm font-bold pl-3"
                          : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-2.5 w-full">
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r" />
                        )}
                        <item.icon
                          className={`h-4 w-4 transition-colors ${
                            isActive ? "text-accent" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span className="text-xs leading-none">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Design History Group (ChatGPT/Claude Style) - Rendered only if designer page is active or collapsed is false */}
        {pathname === "/designer" && (
          <SidebarGroup className="p-0 border-t border-slate-100 pt-3.5">
            <div className="flex items-center justify-between px-4.5 mb-1.5">
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 p-0">
                  Design History
                </SidebarGroupLabel>
              )}
              {!collapsed && (
                <button
                  onClick={handleNew}
                  className="p-1 hover:bg-slate-100 hover:text-slate-900 rounded-lg text-slate-400 cursor-pointer transition-colors"
                  title="New Session"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5 px-2 max-h-[220px] overflow-y-auto">
                {collapsed ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="New design chat" onClick={handleNew} className="h-9 rounded-xl text-slate-500 hover:bg-slate-100/50 pl-3">
                      <Plus className="h-4 w-4 text-slate-400" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : (
                  conversations.map((c) => {
                    const isActive = c.id === activeId;
                    const isRenaming = renamingId === c.id;
                    return (
                      <SidebarMenuItem key={c.id}>
                        <div
                          className={`group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-all relative ${
                            isActive
                              ? "bg-accent-soft text-accent border border-accent/5 font-bold"
                              : "hover:bg-slate-100/50 text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-accent" : "text-slate-400"}`} />
                          
                          {isRenaming ? (
                            <div className="flex items-center gap-1 w-full z-10">
                              <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitRename(c.id);
                                  if (e.key === "Escape") setRenamingId(null);
                                }}
                                autoFocus
                                className="h-6 py-0.5 px-1 bg-white text-[10px] border border-slate-200 focus-visible:ring-accent"
                              />
                              <button onClick={() => commitRename(c.id)} className="text-emerald-600 hover:text-emerald-700 cursor-pointer">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => setRenamingId(null)} className="text-rose-600 hover:text-rose-700 cursor-pointer">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => setActiveId(c.id)}
                                className="min-w-0 flex-1 text-left select-none text-[11px] truncate leading-normal"
                              >
                                {c.title}
                              </button>
                              
                              {/* Edit buttons visible on hover */}
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity ml-1 bg-gradient-to-l from-white group-hover:from-slate-50 group-active:from-white pl-2">
                                <button
                                  onClick={() => startRename(c.id, c.title)}
                                  className="p-0.5 text-slate-400 hover:text-accent transition-colors cursor-pointer"
                                  title="Rename"
                                >
                                  <Pencil className="h-2.5 w-2.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(c.id)}
                                  className="p-0.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </SidebarMenuItem>
                    );
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Secondary Options Group */}
        <SidebarGroup className="p-0 border-t border-slate-100 pt-3.5">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 px-4.5 mb-1.5">
              Support & Settings
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5 px-2">
              {visibleSecondary.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`h-9 rounded-xl transition-all duration-150 relative ${
                        isActive
                          ? "bg-white border border-slate-200/60 text-slate-900 shadow-sm font-bold pl-3"
                          : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-800"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-2.5 w-full">
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r" />
                        )}
                        <item.icon
                          className={`h-4 w-4 transition-colors ${
                            isActive ? "text-accent" : "text-slate-400 group-hover:text-slate-600"
                          }`}
                        />
                        <span className="text-xs leading-none">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Profile & Organization Switcher Lockup */}
      <SidebarFooter className="border-t border-slate-200/50 p-2 bg-white/70 select-none">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white p-2 text-left text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-accent/20 cursor-pointer focus:outline-none w-full">
              <Avatar className="h-7 w-7 border border-slate-100 shrink-0">
                <AvatarFallback className="bg-accent text-[9px] font-black text-white shadow-sm shadow-accent/20">
                  {user?.initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col truncate">
                  <span className="truncate text-slate-800 leading-tight">{user?.name}</span>
                  <span className="truncate text-[9px] text-slate-400 mt-0.5 font-medium">{user?.organization}</span>
                </div>
              )}
              {!collapsed && <ChevronUp className="h-3.5 w-3.5 ml-auto text-slate-400 shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mt-1 rounded-2xl border-slate-200 shadow-xl p-1 bg-white">
            <DropdownMenuLabel className="px-3 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              Account Lockup
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer focus:bg-slate-50">
              <Link to="/profile">
                <User className="mr-2 h-3.5 w-3.5 text-slate-400" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer focus:bg-slate-50">
              <Link to="/settings">
                <Settings className="mr-2 h-3.5 w-3.5 text-slate-400" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer focus:bg-rose-50"
              onClick={() => {
                signOut();
                window.location.href = "/";
              }}
            >
              <LogOut className="mr-2 h-3.5 w-3.5 text-rose-400" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}