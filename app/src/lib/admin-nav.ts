import {
  BarChart3,
  Clock,
  Flag,
  LayoutDashboard,
  Settings as SettingsIcon,
  Shield,
  Users,
} from "lucide-react";
import type { NavItem } from "../components/DashboardLayout";

export const ADMIN_NAV: NavItem[] = [
  { label: "Overview", to: "/admin/dashboard", icon: LayoutDashboard, end: true },
  { label: "Pending Listings", to: "/admin/dashboard/pending", icon: Clock },
  { label: "Users", to: "/admin/dashboard/users", icon: Users },
  { label: "Reported", to: "/admin/dashboard/reported", icon: Flag },
  { label: "System Health", to: "/admin/dashboard/support", icon: Shield },
  { label: "Analytics", to: "/admin/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
];
