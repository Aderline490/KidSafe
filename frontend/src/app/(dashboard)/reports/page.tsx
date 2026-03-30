"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText, Search, Baby, ChevronDown, ChevronUp,
  Heart, GraduationCap, Smile, StickyNote, Paperclip, ExternalLink,
} from "lucide-react";
import api from "@/lib/api";

interface Report {
  id: string;
  reportMonth: string;
  generalWellbeing: string;
  healthStatus?: string;
  schoolPerformance?: string;
  emotionalStatus?: string;
  additionalNotes?: string;
  supportingDocs?: Array<{ fileName: string; url: string }>;
  createdAt: string;
  child: { id: string; firstName: string; photo?: string; district: string } | null;
  author: { firstName: string; lastName: string; email: string } | null;
  proposal: { id: string; applicationNumber: string } | null;
}

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "long", year: "numeric" });
}

function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    api.get("/staff/reports")
      .then((r) => setReports(r.data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.child?.firstName.toLowerCase().includes(q) ||
      r.author?.firstName.toLowerCase().includes(q) ||
      r.author?.lastName.toLowerCase().includes(q) ||
      r.reportMonth.includes(q) ||
      r.proposal?.applicationNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Monthly Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Reports submitted by adoptive families about their children's progress.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Reports", value: reports.length, color: "bg-blue-100 text-blue-600" },
          {
            label: "This Month",
            value: reports.filter((r) => {
              const now = new Date();
              return r.reportMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            }).length,
            color: "bg-green-100 text-green-600",
          },
          {
            label: "Families Reporting",
            value: new Set(reports.map((r) => r.author?.email).filter(Boolean)).size,
            color: "bg-purple-100 text-purple-600",
          },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{loading ? "—" : s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search by child, family, or application..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">
              {search ? "No reports match your search" : "No reports submitted yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {search ? "Try different keywords." : "Families with approved adoptions will submit monthly reports here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isExpanded = expanded === r.id;
            return (
              <Card key={r.id} className="shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  {r.child?.photo ? (
                    <img src={r.child.photo} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Baby className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{r.child?.firstName ?? "Unknown child"}</p>
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">
                        {formatMonth(r.reportMonth)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted by {r.author?.firstName} {r.author?.lastName}
                      {r.proposal ? ` · ${r.proposal.applicationNumber}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{r.child?.district} · {timeAgo(r.createdAt)}</p>
                  </div>

                  <div className="flex-shrink-0">
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-5 py-5 space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> General Wellbeing
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">{r.generalWellbeing}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {r.healthStatus && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Heart className="h-3.5 w-3.5 text-red-400" /> Health
                          </p>
                          <p className="text-sm text-foreground">{r.healthStatus}</p>
                        </div>
                      )}
                      {r.schoolPerformance && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-400" /> Education
                          </p>
                          <p className="text-sm text-foreground">{r.schoolPerformance}</p>
                        </div>
                      )}
                      {r.emotionalStatus && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Smile className="h-3.5 w-3.5 text-amber-400" /> Emotional
                          </p>
                          <p className="text-sm text-foreground">{r.emotionalStatus}</p>
                        </div>
                      )}
                    </div>

                    {r.additionalNotes && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                          <StickyNote className="h-3.5 w-3.5" /> Additional Notes
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">{r.additionalNotes}</p>
                      </div>
                    )}

                    {r.supportingDocs && r.supportingDocs.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Paperclip className="h-3.5 w-3.5" /> Supporting Documents
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {r.supportingDocs.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-lg hover:bg-muted/80 border border-border"
                            >
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              {doc.fileName}
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground border-t border-border pt-3">
                      Submitted by <span className="font-medium">{r.author?.firstName} {r.author?.lastName}</span>
                      {" "}({r.author?.email}) · {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
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
