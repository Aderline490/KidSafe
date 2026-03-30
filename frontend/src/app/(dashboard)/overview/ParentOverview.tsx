"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  HeartHandshake,
  ChevronRight,
  ArrowRight,
  Upload,
  FileBarChart,
  MapPin,
} from "lucide-react";
import api from "@/lib/api";

interface Proposal {
  id: string;
  applicationNumber: string;
  status: string;
  adoptionType?: string;
  submittedAt: string;
  createdAt: string;
  child: {
    id: string;
    firstName: string;
    photo: string;
    district: string;
    dateOfBirth: string;
  };
}

const STATUS_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "home_visit_scheduled", label: "Home Visit Scheduled" },
  { key: "home_visit_completed", label: "Home Visit Done" },
  { key: "level1_approved", label: "Social Worker" },
  { key: "level2_approved", label: "Commissioner" },
  { key: "level3_approved", label: "NCDA" },
  { key: "approved", label: "Approved" },
];

const TERMINAL_STATUSES = ["rejected", "level1_rejected", "level2_rejected", "level3_rejected", "withdrawn"];

function getStepIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function getAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function statusBadge(status: string) {
  if (status === "approved") return <Badge className="bg-green-100 text-green-700 border-0">Approved</Badge>;
  if (TERMINAL_STATUSES.includes(status)) return <Badge className="bg-red-100 text-red-600 border-0">Rejected</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-0">In Review</Badge>;
}

function adoptionTypeLabel(type?: string) {
  if (type === "foster_care") return "Foster Care";
  if (type === "emergent") return "Emergent Adoption";
  return "Permanent Adoption";
}

export default function ParentOverview() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/proposals/my")
      .then((r) => setProposals(r.data.proposals ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = proposals.filter((p) => !TERMINAL_STATUSES.includes(p.status) && p.status !== "approved");
  const completed = proposals.filter((p) => p.status === "approved");
  const rejected = proposals.filter((p) => TERMINAL_STATUSES.includes(p.status));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your adoption journey from here.
          </p>
        </div>
        <Link href="/explore">
          <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2">
            <Search className="h-4 w-4" />
            Browse Children
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Active Applications",
            value: active.length,
            icon: ClipboardList,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            sub: active.length === 0 ? "None yet" : `${active.length} in progress`,
          },
          {
            label: "Completed Adoptions",
            value: completed.length,
            icon: HeartHandshake,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            sub: completed.length === 0 ? "None yet" : "Fully approved",
          },
          {
            label: "Total Submitted",
            value: proposals.length,
            icon: CheckCircle2,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            sub: `${rejected.length} rejected`,
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-4">
                <div className={`h-10 w-10 rounded-lg ${s.iconBg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-xs text-muted-foreground border-t border-border mt-2 pt-2">{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active applications */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold">My Active Applications</CardTitle>
          <Link href="/my-applications">
            <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : active.length === 0 ? (
            <div className="px-4 py-10 flex flex-col items-center gap-3 text-center">
              <Search className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No active applications</p>
              <p className="text-xs text-muted-foreground">Browse children and click "Adopt" to start.</p>
              <Link href="/explore">
                <Button size="sm" className="bg-[#6c63ff] hover:bg-[#5a52d5] mt-1">Browse Children</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {active.slice(0, 3).map((p) => {
                const stepIdx = getStepIndex(p.status);
                return (
                  <div key={p.id} className="px-4 py-4">
                    {/* Child info */}
                    <div className="flex items-center gap-3 mb-3">
                      {p.child.photo ? (
                        <img
                          src={p.child.photo}
                          alt={p.child.firstName}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">👶</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{p.child.firstName}</p>
                          {statusBadge(p.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getAge(p.child.dateOfBirth)} yrs · {p.child.district} · {adoptionTypeLabel(p.adoptionType)}
                        </p>
                      </div>
                      <Link href="/my-applications">
                        <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                          Details <ChevronRight className="h-3 w-3" />
                        </button>
                      </Link>
                    </div>

                    {/* Progress steps */}
                    <div className="flex items-center gap-0">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= stepIdx;
                        const current = i === stepIdx;
                        return (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className={`flex flex-col items-center flex-1`}>
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-colors ${
                                  done
                                    ? "bg-[#6c63ff] border-[#6c63ff] text-white"
                                    : "bg-white border-gray-200 text-gray-400"
                                } ${current ? "ring-2 ring-[#6c63ff]/30" : ""}`}
                              >
                                {done ? "✓" : i + 1}
                              </div>
                              <span className={`text-[9px] mt-1 text-center leading-tight ${done ? "text-[#6c63ff] font-medium" : "text-gray-400"}`}>
                                {step.label}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`h-0.5 flex-1 -mt-4 ${i < stepIdx ? "bg-[#6c63ff]" : "bg-gray-200"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Browse Children",
                desc: "Find a child to adopt",
                icon: Search,
                href: "/explore",
                color: "bg-[#6c63ff]/10 text-[#6c63ff]",
              },
              {
                label: "Upload Documents",
                desc: "Submit required files",
                icon: Upload,
                href: active[0]?.applicationNumber
                  ? `/documents?app=${active[0].applicationNumber}`
                  : "/documents",
                color: "bg-amber-100 text-amber-600",
              },
              {
                label: "Monthly Reports",
                desc: "Submit progress reports",
                icon: FileBarChart,
                href: "/my-reports",
                color: "bg-green-100 text-green-600",
              },
              {
                label: "Track Application",
                desc: "Check your status",
                icon: MapPin,
                href: "/track",
                color: "bg-blue-100 text-blue-600",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.label} href={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-[#6c63ff]/30 hover:bg-muted/40 transition cursor-pointer text-center group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-[#6c63ff] transition">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
