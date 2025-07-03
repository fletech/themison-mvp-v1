import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  Menu,
  X,
  Home,
  FileText,
  MessageSquare,
  Building2,
  Bell,
  Settings as SettingsIcon,
  Puzzle,
  HelpCircle,
  LogOut,
  Search,
  Plus,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "react-router-dom";

interface DashboardLayoutProps {
  children: React.ReactNode;
  count?: number;
  title?: string;
  showSearch?: boolean;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export function DashboardLayout({
  children,
  title = "Dashboard",
  showSearch = false,
  showCreateButton = false,
  onCreateClick,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  //member
  const { toast } = useToast();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
    // Force redirect to home page after logout
    window.location.href = "/";
  };

  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      current: location.pathname === "/dashboard",
    },
    {
      name: "Trials",
      href: "/trials",
      icon: FileText,
      current: location.pathname.startsWith("/trials"),
    },
    {
      name: "Document Assistant",
      href: "/document-assistant",
      icon: MessageSquare,
      current: location.pathname.startsWith("/document-assistant"),
    },
    {
      name: "Organisation",
      href: "/organization",
      icon: Building2,
      current: location.pathname.startsWith("/organization"),
    },
    {
      name: "Notifications",
      href: "/#",
      icon: Bell,
      current: location.pathname.startsWith("/notifications"),
    },
    {
      name: "Integrations",
      href: "/#",
      icon: Puzzle,
      current: location.pathname.startsWith("/integrations"),
    },
  ];

  const otherItems = [
    {
      name: "Help",
      href: "/#",
      icon: HelpCircle,
      current: location.pathname.startsWith("/help"),
    },
    {
      name: "Settings",
      href: "/#",
      icon: SettingsIcon,
      current: location.pathname.startsWith("/settings"),
    },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200 justify-center">
        <a href="/dashboard">
          <img className="h-4 w-auto " src="/assets/logo.svg" alt="THEMISON" />
        </a>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-2 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.current
                      ? "bg-blue-50 text-blue-700 "
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      item.current
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Others Section */}
          <div className="pt-6">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Others
            </p>
            <div className="mt-2 space-y-1">
              {otherItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      item.current
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        item.current
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white h-full">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 overflow-y-auto">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-0">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <img className="h-6 w-auto" src="/assets/logo.svg" alt="THEMISON" />
            <div className="w-6" /> {/* Spacer */}
          </div>
        </div>

        {/* Sticky header */}
        {(showSearch || showCreateButton || title !== "Dashboard") && (
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center flex-1">
                  <h1 className="text-xl font-semibold text-gray-900 mr-8">
                    {title}
                  </h1>
                  {showSearch && (
                    <div className="flex-1 max-w-lg">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          type="text"
                          placeholder="Search your trial here"
                          className="pl-10 pr-4 py-2 w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {showCreateButton && (
                  <Button
                    onClick={onCreateClick}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create trial
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main content area with scroll */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
