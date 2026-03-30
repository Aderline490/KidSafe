"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarCheck, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, AlertCircle, Plus,
} from "lucide-react";
import api from "@/lib/api";

interface Visit {
  id: string;
  scheduledDate: string;
  status: string;
  findings?: string;
  recommendation?: string;
  completedAt?: string;
  proposal: {
    id: string;
    applicationNumber: string;
    applicantFirstName: string;
    applicantLastName: string;
    applicantEmail: string;
    child?: { firstName: string; district: string; photo: string };
  } | null;
  socialWorker: { firstName: string; lastName: string } | null;
}

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function statusBadge(status: string) {
  if (status === "completed") return <Badge className="bg-green-100 text-green-700 border-0">Completed</Badge>;
  if (status === "cancelled") return <Badge className="bg-gray-100 text-gray-600 border-0">Cancelled</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-0">Scheduled</Badge>;
}

const CHECKLIST_ITEMS = [
  "Safe sleeping area for child",
  "Access to clean water and sanitation",
  "Adequate nutrition and food storage",
  "School or education access nearby",
  "Stable income/employment evidence",
  "No signs of domestic conflict",
  "Other household members interviewed",
];

export default function HomeVisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState<Record<string, {
    findings: string; recommendation: string; checklist: Record<string, boolean>;
  }>>({});

  const fetchVisits = () => {
    setLoading(true);
    api.get("/staff/home-visits")
      .then((r) => setVisits(r.data.visits ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVisits(); }, []);

  const initCompleteForm = (visitId: string) => {
    if (!completeForm[visitId]) {
      const checklist: Record<string, boolean> = {};
      CHECKLIST_ITEMS.forEach((item) => { checklist[item] = false; });
      setCompleteForm((prev) => ({ ...prev, [visitId]: { findings: "", recommendation: "", checklist } }));
    }
    setCompleting(visitId);
  };

  const handleComplete = async (visitId: string) => {
    const form = completeForm[visitId];
    if (!form) return;
    try {
      await api.patch(`/staff/home-visits/${visitId}/complete`, {
        findings: form.findings,
        recommendation: form.recommendation,
        checklist: form.checklist,
      });
      fetchVisits();
      setCompleting(null);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to complete visit");
    }
  };

  const handleCancel = async (visitId: string) => {
    if (!confirm("Cancel this home visit?")) return;
    try {
      await api.patch(`/staff/home-visits/${visitId}/cancel`, {});
      fetchVisits();
    } catch {}
  };

  const upcoming = visits.filter((v) => v.status === "scheduled" && new Date(v.scheduledDate) >= new Date());
  const overdue = visits.filter((v) => v.status === "scheduled" && new Date(v.scheduledDate) < new Date());
  const completed = visits.filter((v) => v.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Home Visits</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Schedule, manage, and record findings from applicant home visits.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Upcoming", value: upcoming.length, icon: CalendarCheck, color: "text-amber-600 bg-amber-100" },
          { label: "Overdue", value: overdue.length, icon: AlertCircle, color: "text-red-600 bg-red-100", alert: overdue.length > 0 },
          { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`shadow-sm ${s.alert ? "border-red-200" : ""}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {overdue.length} visit{overdue.length > 1 ? "s are" : " is"} overdue. Please mark as completed or cancelled.
          </p>
        </div>
      )}

      {/* Visits list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : visits.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <CalendarCheck className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No home visits yet</p>
            <p className="text-sm text-muted-foreground">Schedule a visit from a case in the Cases page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...overdue, ...upcoming, ...completed].map((v) => {
            const isExpanded = expanded === v.id;
            const isOverdue = v.status === "scheduled" && new Date(v.scheduledDate) < new Date();
            const days = v.status === "scheduled" ? daysUntil(v.scheduledDate) : null;
            const isCompletingThis = completing === v.id;
            const form = completeForm[v.id];

            return (
              <Card key={v.id} className={`shadow-sm overflow-hidden ${isOverdue ? "border-red-200" : ""}`}>
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition"
                  onClick={() => setExpanded(isExpanded ? null : v.id)}
                >
                  {/* Date box */}
                  <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                    v.status === "completed" ? "bg-green-100" : isOverdue ? "bg-red-100" : "bg-amber-100"
                  }`}>
                    <p className={`text-lg font-black leading-none ${
                      v.status === "completed" ? "text-green-700" : isOverdue ? "text-red-600" : "text-amber-700"
                    }`}>
                      {new Date(v.scheduledDate).getDate()}
                    </p>
                    <p className={`text-[9px] font-bold uppercase ${
                      v.status === "completed" ? "text-green-600" : isOverdue ? "text-red-500" : "text-amber-600"
                    }`}>
                      {new Date(v.scheduledDate).toLocaleString("default", { month: "short" })}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">
                        {v.proposal?.applicantFirstName} {v.proposal?.applicantLastName}
                      </p>
                      {statusBadge(v.status)}
                      {isOverdue && <Badge className="bg-red-100 text-red-600 border-0 text-[10px]">Overdue</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {v.proposal?.applicationNumber} · {v.proposal?.child?.firstName} · {v.proposal?.child?.district}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${
                      days === null ? "text-green-600" :
                      isOverdue ? "text-red-500" :
                      days <= 2 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {days === null
                        ? `Completed ${v.completedAt ? new Date(v.completedAt).toLocaleDateString() : ""}`
                        : isOverdue ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} overdue`
                        : days === 0 ? "Today"
                        : days === 1 ? "Tomorrow"
                        : `In ${days} days`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {v.status === "scheduled" && (
                      <Button
                        size="sm"
                        className="text-xs bg-green-600 hover:bg-green-700 h-7"
                        onClick={(e) => { e.stopPropagation(); initCompleteForm(v.id); }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-5 py-5 space-y-5">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Applicant</p>
                        <p className="text-sm font-semibold">{v.proposal?.applicantFirstName} {v.proposal?.applicantLastName}</p>
                        <p className="text-xs text-muted-foreground">{v.proposal?.applicantEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Scheduled</p>
                        <p className="text-sm font-semibold">
                          {new Date(v.scheduledDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(v.scheduledDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    {/* Completed findings */}
                    {v.status === "completed" && (
                      <>
                        {v.findings && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Findings</p>
                            <p className="text-sm text-foreground leading-relaxed">{v.findings}</p>
                          </div>
                        )}
                        {v.recommendation && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommendation</p>
                            <p className="text-sm font-semibold text-foreground">{v.recommendation}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Complete form */}
                    {isCompletingThis && form && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <p className="text-sm font-bold text-foreground">Record Visit Findings</p>

                        {/* Checklist */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-widest">Assessment Checklist</p>
                          <div className="grid grid-cols-1 gap-2">
                            {CHECKLIST_ITEMS.map((item) => (
                              <label key={item} className="flex items-center gap-2.5 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-[#6c63ff]"
                                  checked={form.checklist[item] ?? false}
                                  onChange={(e) =>
                                    setCompleteForm((prev) => ({
                                      ...prev,
                                      [v.id]: {
                                        ...prev[v.id],
                                        checklist: { ...prev[v.id].checklist, [item]: e.target.checked },
                                      },
                                    }))
                                  }
                                />
                                {item}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label>Findings & Observations</Label>
                          <Textarea
                            placeholder="Describe what you observed during the visit..."
                            rows={4}
                            value={form.findings}
                            onChange={(e) =>
                              setCompleteForm((prev) => ({ ...prev, [v.id]: { ...prev[v.id], findings: e.target.value } }))
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label>Recommendation</Label>
                          <Input
                            placeholder="e.g. Recommend approval / Needs follow-up visit"
                            value={form.recommendation}
                            onChange={(e) =>
                              setCompleteForm((prev) => ({ ...prev, [v.id]: { ...prev[v.id], recommendation: e.target.value } }))
                            }
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleComplete(v.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Save & Complete Visit
                          </Button>
                          <Button variant="outline" onClick={() => setCompleting(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}

                    {/* Cancel button for scheduled */}
                    {v.status === "scheduled" && !isCompletingThis && (
                      <div className="flex gap-3 border-t border-border pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleCancel(v.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Cancel Visit
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
