"use client";

import * as React from "react";
import {
  HouseIcon,
  ScrollIcon,
  TerminalIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

// This is sample data.
type SideBarData = Array<{
  icon: React.ReactNode;
  title: string;
  url: string;
}>;
const data = [
  {
    title: "Home",
    url: "/",
    icon: <HouseIcon size={32} weight="fill" />,
  },
  {
    title: "Terminal",
    url: "/term",
    icon: <TerminalIcon size={32} weight="fill" />,
  },
  {
    title: "Identity",
    url: "/identity",
    icon: <UserIcon size={32} weight="fill" />,
  },
  {
    title: "Logs",
    url: "/logs",
    icon: <ScrollIcon size={32} weight="fill" />,
  },
] satisfies SideBarData;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader />
      <SidebarContent>
        <SidebarMenu className="px-2">
          {data.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                aschild
                isActive={pathname === item.url}
                className="border border-transparent data-active:border-sidebar-primary/30 data-active:bg-sidebar-primary/7 data-active:text-sidebar-primary hover:data-active:bg-sidebar-primary/20"
              >
                <Link
                  className="flex flex-row items-center gap-2"
                  href={item.url}
                >
                  <span className="text-sidebar-primary">{item.icon}</span>
                  {item.title}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
