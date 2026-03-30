"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Baby, ClipboardList, Clock, CheckCircle2,
  UserPlus, ArrowRight, ChevronRight, AlertCircle,
  Users, FileText,
} from "lucide-react";
import api from "@/lib/api";

interface Proposal {
  id: string;
  applicationNumber: string;
  status: string;
  adoptionType: string;
  submittedAt: string;
  updatedAt: string;
  applicantFirstName: string;
  applicantLastName: string;
  assignedSocialWorker: { firstName: string; lastName: string } | null;
  child: { id: string; firstName: string; district: string; photo?: string; dateOfBirth: string } | null;
}

interface Child {
  id: string;
  status: string;
}

interface Report {
  id: string;
  reportMonth: string;
  createdAt: string;
  child: { firstName: string } | null;
  author: { firstName: string; lastName: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700",
  home_visit_scheduled: "bg-amber-100 text-amber-700",
  home_visit_completed: "bg-purple-100 text-purple-700",
  level1_approved: "bg-green-100 text-green-700",
  level1_rejected: "bg-red-100 text-red-600",
  level2_approved: "bg-green-100 text-green-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

function statusLabel(s: string) {
  const map: Record<string, string> = {
    submitted: "Submitted",
    home_visit_scheduled: "Visit Scheduled",
    home_visit_completed: "Visit Done",
    level1_approved: "SW Approved",
    level1_rejected: "SW Rejected",
    level2_approved: "DC Approved",
    approved: "Approved",
    rejected: "Rejected",
  };
  return map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "short", year: "numeric" });
}

export default function StaffOverview() {
  const { user } = useAuth();
  const isAdmin = user?.role === "system_admin";

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/staff/proposals"),
      api.get("/staff/children"),
      api.get("/staff/reports"),
    ])
      .then(([pRes, cRes, rRes]) => {
        setProposals(pRes.data.proposals ?? []);
        setChildren(cRes.data.children ?? []);
        setReports(rRes.data.reports ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeProposals = proposals.filter((p) =>
    !["approved", "rejected", "withdrawn"].includes(p.status)
  );
  const pendingApprovals = proposals.filter((p) =>
    ["level1_approved", "level2_approved"].includes(p.status)
  );
  const completedAdoptions = proposals.filter((p) => p.status === "approved");
  const availableChildren = children.filter((c) => c.status === "available");
  const unassigned = proposals.filter((p) => p.status === "submitted" && !p.assignedSocialWorker);

  const stats = [
    {
      label: "Available Children",
      value: availableChildren.length,
      total: `${children.length} total`,
      icon: Baby,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      href: "/kids",
    },
    {
      label: "Active Proposals",
      value: activeProposals.length,
      total: unassigned.length > 0 ? `${unassigned.length} unassigned` : "All assigned",
      icon: ClipboardList,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      href: "/requests/proposals",
      alert: unassigned.length > 0,
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals.length,
      total: "Across all levels",
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      href: "/requests/approvals",
      alert: pendingApprovals.length > 0,
    },
    {
      label: "Completed Adoptions",
      value: completedAdoptions.length,
      total: `${proposals.length} total submitted`,
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      href: "/requests/proposals",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user?.firstName}</p>
        </div>
        {isAdmin && (
          <Link href="/staff">
            <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2">
              <UserPlus className="h-4 w-4" />
              Manage Staff
            </Button>
          </Link>
        )}
      </div>

      {/* Unassigned alert */}
      {unassigned.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {unassigned.length} proposal{unassigned.length > 1 ? "s have" : " has"} no social worker assigned.{" "}
            <Link href="/requests/proposals" className="underline">Assign now →</Link>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`shadow-sm hover:shadow-md transition-shadow ${s.alert ? "border-amber-200" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${s.iconColor}`} />
                  </div>
                  {s.alert && <AlertCircle className="h-4 w-4 text-amber-500" />}
                </div>
                <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className={`text-xs mt-1 border-t border-border pt-2 ${s.alert ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                  {loading ? "—" : s.total}
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
        {/* Recent proposals */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Recent Proposals</CardTitle>
            <Link href="/requests/proposals">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                All <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : proposals.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">No proposals yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {proposals.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition">
                    {p.child?.photo ? (
                      <img src={p.child.photo} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
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
                        {p.applicationNumber} · {daysSince(p.submittedAt)}d ago
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-[10px] border-0 ${STATUS_COLOR[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel(p.status)}
                      </Badge>
                      <Link href="/requests/proposals">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent parent reports */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Recent Monthly Reports</CardTitle>
            <Link href="/reports">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                All <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No parent reports submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {r.child?.firstName ?? "—"} — {formatMonth(r.reportMonth)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        By {r.author?.firstName} {r.author?.lastName} · {daysSince(r.createdAt)}d ago
                      </p>
                    </div>
                    <Link href="/reports">
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </Link>
                  </div>
                ))}
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
            { label: "View All Proposals", href: "/requests/proposals", icon: ClipboardList, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
            { label: "Pending Approvals", href: "/requests/approvals", icon: Clock, color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
            { label: "Browse Children", href: "/kids", icon: Baby, color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
            { label: isAdmin ? "Manage Staff" : "Monthly Reports", href: isAdmin ? "/staff" : "/reports", icon: isAdmin ? Users : FileText, color: "text-green-600 bg-green-50 hover:bg-green-100" },
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
