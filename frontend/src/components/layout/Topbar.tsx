"use client";

import { Search, Bell, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search here..."
          className="pl-10 bg-muted border-0 focus-visible:ring-primary"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Messages */}
        <button className="relative rounded-full bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors">
          <MessageSquare className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button className="relative rounded-full bg-primary/10 p-2.5 text-primary hover:bg-primary/20 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Profile */}
        <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20">
          <AvatarImage src="" alt="Profile" />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            AG
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
