"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  Baby,
  FileText,
  Users,
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const adoptionTrend = [
  { month: "Jan", proposals: 4, approved: 1 },
  { month: "Feb", proposals: 6, approved: 2 },
  { month: "Mar", proposals: 5, approved: 3 },
  { month: "Apr", proposals: 8, approved: 4 },
  { month: "May", proposals: 10, approved: 5 },
  { month: "Jun", proposals: 9, approved: 6 },
  { month: "Jul", proposals: 12, approved: 7 },
  { month: "Aug", proposals: 14, approved: 8 },
  { month: "Sep", proposals: 11, approved: 9 },
  { month: "Oct", proposals: 13, approved: 7 },
  { month: "Nov", proposals: 10, approved: 6 },
  { month: "Dec", proposals: 8, approved: 5 },
];

const insuranceData = [
  { name: "With insurance", value: 63, color: "#6c63ff" },
  { name: "Without insurance", value: 37, color: "#c4b5fd" },
];

const educationData = [
  { name: "Attending school", value: 78, color: "#6c63ff" },
  { name: "Not yet in school", value: 22, color: "#c4b5fd" },
];

const activities = [
  { initials: "JM", name: "Jean Mugisha", title: "New proposal submitted", subtitle: "For child Amina, Kigali", time: "11:04 a.m.", type: "proposal" },
  { initials: "SW", name: "Sarah Worker", title: "Home visit completed", subtitle: "Musanze district", time: "Yesterday", type: "visit" },
  { initials: "AG", name: "Aderline G.", title: "Adoption approved", subtitle: "Level 3 — NCDA Final", time: "Yesterday", type: "approved" },
  { initials: "DC", name: "District Comm.", title: "Proposal rejected", subtitle: "Missing documents", time: "2 days ago", type: "rejected" },
  { initials: "MU", name: "Marie Uwera", title: "New child registered", subtitle: "Bibare, Kimironko", time: "2 days ago", type: "child" },
];

const typeColors: Record<string, string> = {
  proposal: "bg-blue-100 text-blue-600",
  visit: "bg-orange-100 text-orange-600",
  approved: "bg-green-100 text-green-600",
  rejected: "bg-red-100 text-red-600",
  child: "bg-purple-100 text-purple-600",
};

const pendingApprovals = [
  { name: "Uwera Family", child: "Grace M.", level: "Level 1 — Social Worker", days: 3 },
  { name: "Mugisha Family", child: "Eric H.", level: "Level 2 — Commissioner", days: 7 },
  { name: "Habimana Family", child: "Joy I.", level: "Level 3 — NCDA", days: 12 },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "system_admin";

  const stats = [
    {
      title: "Total Children",
      value: "24",
      sub: "5 matched this month",
      icon: Baby,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      trend: "+12%",
      href: "/kids",
    },
    {
      title: "Active Proposals",
      value: "12",
      sub: "3 pending review",
      icon: ClipboardList,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-500",
      trend: "+8%",
      href: "/requests/proposals",
    },
    {
      title: "Pending Approvals",
      value: "7",
      sub: "2 overdue (>14 days)",
      icon: Clock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      trend: null,
      href: "/requests/approvals",
    },
    {
      title: isAdmin ? "Total Staff" : "Completed Adoptions",
      value: isAdmin ? "8" : "9",
      sub: isAdmin ? "2 social workers, 3 admins" : "This year",
      icon: isAdmin ? Users : CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      trend: "+5%",
      href: isAdmin ? "/staff/manage" : "/reports",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user?.firstName}
          </p>
        </div>
        {isAdmin && (
          <Link href="/staff/invite">
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Staff
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  {stat.trend && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
                <p className="text-xs text-muted-foreground mt-1 border-t border-border pt-2">{stat.sub}</p>
                <Link href={stat.href} className="text-xs text-primary hover:underline mt-1 flex items-center gap-0.5">
                  View <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adoption Trend Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Adoption Trends</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Proposals</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Approved</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={adoptionTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="proposals" stroke="#6c63ff" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="approved" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Recent Activity</CardTitle>
            <button className="text-xs text-primary hover:underline">See all</button>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={`text-xs font-semibold ${typeColors[a.type]}`}>
                    {a.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.subtitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                  <button className="text-[10px] text-primary hover:underline">View</button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals + Health/Education */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pending Approvals Table */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">Pending Approvals</CardTitle>
            <Link href="/requests/approvals">
              <button className="text-xs text-primary hover:underline">View all</button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {pendingApprovals.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Child: {item.child}</p>
                    <Badge variant="outline" className="mt-1 text-[10px] text-primary border-primary/30">
                      {item.level}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${item.days > 10 ? "text-red-500" : item.days > 7 ? "text-orange-500" : "text-muted-foreground"}`}>
                      {item.days}d waiting
                    </p>
                    <button className="text-xs text-primary hover:underline mt-1">Review</button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Health & Education Charts */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Health & Education</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Insurance</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={insuranceData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                      {insuranceData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-1">
                  {insuranceData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.value}% {d.name.split(" ")[0]}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Education</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={educationData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={0}>
                      {educationData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-1">
                  {educationData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.value}% {d.name.split(" ")[0]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
