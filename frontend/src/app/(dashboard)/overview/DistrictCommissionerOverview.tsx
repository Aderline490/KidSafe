"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ClipboardCheck, CheckCircle2, XCircle, Baby,
  ArrowRight, ChevronRight, AlertCircle, Clock,
  Scale,
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
  child: { id: string; firstName: string; district: string; photo?: string; dateOfBirth: string } | null;
  assignedSocialWorker: { firstName: string; lastName: string } | null;
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function daysSince(d: string) {
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
}

function adoptionTypeLabel(t: string) {
  if (t === "foster_care") return "Foster Care";
  if (t === "emergent") return "Emergent";
  return "Permanent";
}

export default function DistrictCommissionerOverview() {
  const { user } = useAuth();
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/staff/proposals")
      .then((r) => setAllProposals(r.data.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = allProposals.filter((p) => p.status === "level1_approved");
  const approvedByDC = allProposals.filter((p) =>
    ["level2_approved", "level3_approved", "approved"].includes(p.status)
  );
  const rejectedByDC = allProposals.filter((p) => p.status === "level2_rejected");
  const overdue = pending.filter((p) => daysSince(p.updatedAt) > 14);

  const recentDecisions = allProposals
    .filter((p) => ["level2_approved", "level2_rejected"].includes(p.status))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: "Awaiting Your Review",
      value: pending.length,
      icon: ClipboardCheck,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      sub: overdue.length > 0 ? `${overdue.length} overdue (>14 days)` : "All within SLA",
      href: "/requests/approvals",
      alert: overdue.length > 0,
    },
    {
      label: "Approved (Level 2)",
      value: approvedByDC.length,
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      sub: "Passed to NCDA or finalised",
      href: "/requests/proposals",
    },
    {
      label: "Rejected (Level 2)",
      value: rejectedByDC.length,
      icon: XCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      sub: "Declined at district level",
      href: "/requests/proposals",
    },
    {
      label: "Total Cases",
      value: allProposals.length,
      icon: Scale,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      sub: "All proposals in the system",
      href: "/requests/proposals",
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
            District Commissioner — here's your approval queue.
          </p>
        </div>
        <Link href="/requests/approvals">
          <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Review Approvals
          </Button>
        </Link>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {overdue.length} proposal{overdue.length > 1 ? "s have" : " has"} been waiting more than 14 days.{" "}
            <Link href="/requests/approvals" className="underline">Review now →</Link>
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
        {/* Pending approval queue */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Approval Queue</CardTitle>
            <Link href="/requests/approvals">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                All pending <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : pending.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <p className="text-sm font-medium text-gray-500">Queue is clear</p>
                <p className="text-xs text-muted-foreground">No proposals awaiting your review.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pending.slice(0, 5).map((p) => {
                  const days = daysSince(p.updatedAt);
                  const isUrgent = days > 14;
                  return (
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
                        <p className="text-xs text-muted-foreground truncate">
                          For {p.child?.firstName ?? "—"} · {p.child?.district} · {adoptionTypeLabel(p.adoptionType)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-medium flex items-center gap-1 ${isUrgent ? "text-red-500" : "text-amber-600"}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {days}d
                        </span>
                        <Link href="/requests/approvals">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent decisions */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-bold">Recent Decisions</CardTitle>
            <Link href="/requests/proposals">
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                All proposals <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : recentDecisions.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No decisions made yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentDecisions.map((p) => {
                  const approved = p.status === "level2_approved";
                  return (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3">
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
                          For {p.child?.firstName ?? "—"} · {daysSince(p.updatedAt)}d ago
                        </p>
                      </div>
                      <Badge className={`text-[10px] border-0 flex-shrink-0 ${approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {approved ? "Approved" : "Rejected"}
                      </Badge>
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
            { label: "Review Pending Approvals", href: "/requests/approvals", icon: ClipboardCheck, color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
            { label: "View All Proposals", href: "/requests/proposals", icon: Scale, color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
            { label: "Browse Children", href: "/kids", icon: Baby, color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
            { label: "Monthly Reports", href: "/reports", icon: CheckCircle2, color: "text-green-600 bg-green-50 hover:bg-green-100" },
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
