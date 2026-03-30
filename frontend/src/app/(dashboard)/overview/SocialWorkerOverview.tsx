"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  FolderOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Baby,
} from "lucide-react";
import api from "@/lib/api";

interface Proposal {
  id: string;
  applicationNumber: string;
  status: string;
  adoptionType: string;
  submittedAt: string;
  applicantFirstName: string;
  applicantLastName: string;
  child: { id: string; firstName: string; district: string; photo: string; dateOfBirth: string } | null;
}

interface Visit {
  id: string;
  scheduledDate: string;
  status: string;
  proposal: { applicationNumber: string; applicantFirstName: string; applicantLastName: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  home_visit_scheduled: "bg-amber-100 text-amber-700",
  home_visit_completed: "bg-purple-100 text-purple-700",
  level1_approved: "bg-green-100 text-green-700",
  level1_rejected: "bg-red-100 text-red-600",
  approved: "bg-green-100 text-green-700",
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function SocialWorkerOverview() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/staff/proposals?assignedToMe=true"),
      api.get("/staff/home-visits"),
    ])
      .then(([pRes, vRes]) => {
        setProposals(pRes.data.proposals ?? []);
        setVisits(vRes.data.visits ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = proposals.filter((p) =>
    ["submitted", "home_visit_scheduled", "home_visit_completed"].includes(p.status)
  );
  const approved = proposals.filter((p) => p.status === "level1_approved");
  const upcomingVisits = visits.filter(
    (v) => v.status === "scheduled" && new Date(v.scheduledDate) >= new Date()
  );
  const overdueVisits = visits.filter(
    (v) => v.status === "scheduled" && new Date(v.scheduledDate) < new Date()
  );

  const stats = [
    {
      label: "My Active Cases",
      value: pending.length,
      icon: FolderOpen,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      sub: `${proposals.length} total assigned`,
      href: "/requests",
    },
    {
      label: "Upcoming Visits",
      value: upcomingVisits.length,
      icon: CalendarCheck,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      sub: overdueVisits.length > 0 ? `${overdueVisits.length} overdue` : "All on schedule",
      href: "/home-visits",
      alert: overdueVisits.length > 0,
    },
    {
      label: "Approved by Me",
      value: approved.length,
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      sub: "Level 1 approvals",
      href: "/requests",
    },
    {
      label: "Awaiting Action",
      value: proposals.filter((p) => p.status === "home_visit_completed").length,
      icon: Clock,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      sub: "Home visit done, needs review",
      href: "/requests",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good morning, {user?.firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what needs your attention today.
          </p>
        </div>
        <Link href="/requests">
          <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2">
            <FolderOpen className="h-4 w-4" />
            View All Cases
          </Button>
        </Link>
      </div>

      {/* Overdue alert */}
      {overdueVisits.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {overdueVisits.length} home visit{overdueVisits.length > 1 ? "s are" : " is"} overdue.{" "}
            <Link href="/home-visits" className="underline">
              Review now →
            </Link>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`shadow-sm hover:shadow-md transition-shadow ${s.alert ? "border-red-200" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${s.iconColor}`} />
                  </div>
                  {s.alert && <AlertCircle className="h-4 w-4 text-red-500" />}
                </div>
                <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className={`text-xs mt-1 border-t border-border pt-2 ${s.alert ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                  {s.sub}
                </p>
                <Link href={s.href} className="text-xs text-primary hover:underline mt-1 flex items-center gap-0.5">
                  View <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active cases */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Active Cases</CardTitle>
            <Link href="/requests">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                All cases <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : pending.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No active cases assigned to you.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pending.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition">
                    {p.child?.photo ? (
                      <img src={p.child.photo} alt={p.child.firstName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Baby className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {p.applicantFirstName} {p.applicantLastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        For {p.child?.firstName ?? "—"} · {daysSince(p.submittedAt)}d ago
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-[10px] border-0 ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel(p.status)}
                      </Badge>
                      <Link href="/requests">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming home visits */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Upcoming Home Visits</CardTitle>
            <Link href="/home-visits">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                All visits <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : upcomingVisits.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No upcoming visits scheduled.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingVisits.slice(0, 5).map((v) => {
                  const days = daysUntil(v.scheduledDate);
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${days === 0 ? "bg-red-100" : days <= 2 ? "bg-amber-100" : "bg-blue-50"}`}>
                        <p className={`text-lg font-black leading-none ${days === 0 ? "text-red-600" : days <= 2 ? "text-amber-600" : "text-blue-600"}`}>
                          {new Date(v.scheduledDate).getDate()}
                        </p>
                        <p className={`text-[9px] font-semibold uppercase ${days === 0 ? "text-red-500" : days <= 2 ? "text-amber-500" : "text-blue-500"}`}>
                          {new Date(v.scheduledDate).toLocaleString("default", { month: "short" })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {v.proposal?.applicantFirstName} {v.proposal?.applicantLastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.proposal?.applicationNumber}
                        </p>
                        <p className={`text-xs font-medium mt-0.5 ${days === 0 ? "text-red-500" : days <= 2 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                        </p>
                      </div>
                      <Link href="/home-visits">
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Schedule a Home Visit", href: "/home-visits", icon: CalendarCheck, color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
            { label: "Review a Case", href: "/requests", icon: FolderOpen, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
            { label: "View Children", href: "/kids", icon: Baby, color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
            { label: "View Reports", href: "/reports", icon: CheckCircle2, color: "text-green-600 bg-green-50 hover:bg-green-100" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href={a.href}>
                <div className={`flex items-center gap-3 p-4 rounded-xl transition cursor-pointer ${a.color}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm font-semibold leading-tight">{a.label}</p>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
