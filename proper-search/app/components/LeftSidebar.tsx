"use client";

import { cn } from "@/lib/utils";
import { 
  Search, 
  Home, 
  Users, 
  Megaphone, 
  Phone, 
  Settings, 
  LogOut,
  HelpCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

export type PageId = "search" | "myProperties" | "contacts" | "campaigns" | "dialer" | "account";

type NavItem = {
  id: PageId;
  icon: React.ReactNode;
  label: string;
};

type Props = {
  userName?: string;
  activePage: PageId;
  onPageChange: (page: PageId) => void;
};

export default function LeftSidebar({ userName = "User", activePage, onPageChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const mainNavItems: NavItem[] = [
    { id: "search", icon: <Search className="w-5 h-5" />, label: "Search" },
    { id: "myProperties", icon: <Home className="w-5 h-5" />, label: "My Properties" },
    { id: "contacts", icon: <Users className="w-5 h-5" />, label: "Contacts" },
    { id: "campaigns", icon: <Megaphone className="w-5 h-5" />, label: "Campaigns" },
    { id: "dialer", icon: <Phone className="w-5 h-5" />, label: "Dialer" },
    { id: "account", icon: <Settings className="w-5 h-5" />, label: "Account" },
  ];

  const bottomNavItems = [
    { icon: <HelpCircle className="w-5 h-5" />, label: "Help" },
    { icon: <MessageCircle className="w-5 h-5" />, label: "Chat Support" },
  ];

  return (
    <div 
      className={cn(
        "h-full bg-white border-r flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b flex items-center gap-2">
        <Image
          src="/proper-search-logo.png"
          alt="Proper Search"
          width={40}
          height={40}
          className="shrink-0"
        />
        {!collapsed && (
          <span className="font-bold text-lg text-foreground">ProperSearch</span>
        )}
      </div>

      {/* User */}
      <div className={cn(
        "p-4 border-b flex items-center gap-3",
        collapsed && "justify-center"
      )}>
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{userName}</div>
            <div className="text-xs text-muted-foreground">Pro Plan</div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {mainNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              activePage === item.id
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
        
        {/* Log Out - separate from nav */}
        <button
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            collapsed && "justify-center px-2",
            "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={collapsed ? "Log Out" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Log Out</span>}
        </button>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-2 border-t space-y-1">
        {bottomNavItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 border-t flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
