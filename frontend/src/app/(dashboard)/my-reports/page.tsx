"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Plus, Baby, Heart, GraduationCap, Smile,
  StickyNote, ChevronDown, ChevronUp, X, Paperclip, ExternalLink,
} from "lucide-react";
import { useRef } from "react";
import api from "@/lib/api";

interface Proposal {
  id: string;
  applicationNumber: string;
  status: string;
  child: { id: string; firstName: string; photo?: string; district: string } | null;
}

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
  proposal: { id: string; applicationNumber: string } | null;
}

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("default", { month: "long", year: "numeric" });
}

const ELIGIBLE_STATUSES = ["approved", "level1_approved", "level2_approved", "level3_approved"];

export default function MyReportsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  const [form, setForm] = useState({
    proposalId: "",
    childId: "",
    reportMonth: currentMonth,
    generalWellbeing: "",
    healthStatus: "",
    schoolPerformance: "",
    emotionalStatus: "",
    additionalNotes: "",
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get("/proposals/my"),
      api.get("/reports/my"),
    ])
      .then(([pRes, rRes]) => {
        const allProposals: Proposal[] = pRes.data.proposals ?? [];
        setProposals(allProposals.filter((p) => ELIGIBLE_STATUSES.includes(p.status)));
        setReports(rRes.data.reports ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const selectedProposal = proposals.find((p) => p.id === form.proposalId);

  const handleProposalSelect = (id: string) => {
    const p = proposals.find((x) => x.id === id);
    setForm((prev) => ({ ...prev, proposalId: id, childId: p?.child?.id ?? "" }));
  };

  const handleSubmit = async () => {
    if (!form.proposalId || !form.reportMonth || !form.generalWellbeing.trim()) {
      alert("Please select a case, a month, and fill in the general wellbeing section.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      files.forEach((f) => formData.append("files", f));
      await api.post("/reports", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setShowForm(false);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setForm((prev) => ({ ...prev, proposalId: "", childId: "", generalWellbeing: "", healthStatus: "", schoolPerformance: "", emotionalStatus: "", additionalNotes: "" }));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monthly Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit and view your monthly progress reports for your children.
          </p>
        </div>
        {!showForm && proposals.length > 0 && (
          <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Submit Report
          </Button>
        )}
      </div>

      {/* Submit form */}
      {showForm && (
        <Card className="shadow-sm border-[#6c63ff]/20">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">New Monthly Report</CardTitle>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Case / Child</Label>
                <select
                  value={form.proposalId}
                  onChange={(e) => handleProposalSelect(e.target.value)}
                  className="flex w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select a case...</option>
                  {proposals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.child?.firstName ?? "Unknown"} · {p.applicationNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Report Month</Label>
                <Input
                  type="month"
                  value={form.reportMonth}
                  onChange={(e) => setForm((prev) => ({ ...prev, reportMonth: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                General Wellbeing <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Describe how the child is doing overall this month..."
                rows={3}
                value={form.generalWellbeing}
                onChange={(e) => setForm((prev) => ({ ...prev, generalWellbeing: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-red-400" /> Health Status
                </Label>
                <Input
                  placeholder="e.g. Good, had a cold..."
                  value={form.healthStatus}
                  onChange={(e) => setForm((prev) => ({ ...prev, healthStatus: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-400" /> School Performance
                </Label>
                <Input
                  placeholder="e.g. Doing well in maths..."
                  value={form.schoolPerformance}
                  onChange={(e) => setForm((prev) => ({ ...prev, schoolPerformance: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Smile className="h-3.5 w-3.5 text-amber-400" /> Emotional Status
                </Label>
                <Input
                  placeholder="e.g. Happy, settled in well..."
                  value={form.emotionalStatus}
                  onChange={(e) => setForm((prev) => ({ ...prev, emotionalStatus: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5" /> Additional Notes
              </Label>
              <Textarea
                placeholder="Any concerns, milestones, or other observations..."
                rows={2}
                value={form.additionalNotes}
                onChange={(e) => setForm((prev) => ({ ...prev, additionalNotes: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" /> Supporting Documents
                <span className="text-muted-foreground font-normal">(optional, max 5)</span>
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => {
                  const added = Array.from(e.target.files ?? []);
                  setFiles((prev) => {
                    const merged = [...prev, ...added];
                    const seen = new Set<string>();
                    return merged.filter((f) => {
                      const key = `${f.name}-${f.size}`;
                      if (seen.has(key)) return false;
                      seen.add(key);
                      return true;
                    }).slice(0, 5);
                  });
                  // Reset input so the same file can be re-added after removal
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6c63ff]/10 file:text-[#6c63ff] hover:file:bg-[#6c63ff]/20 cursor-pointer border border-input rounded-md px-1 py-1"
              />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {files.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                      <Paperclip className="h-3 w-3" /> {f.name}
                      <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-1 text-muted-foreground hover:text-red-500">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Photos, PDFs or documents — max 10 MB each</p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                className="bg-[#6c63ff] hover:bg-[#5a52d5]"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No eligible proposals */}
      {!loading && proposals.length === 0 && !showForm && (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <FileText className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No active placements</p>
            <p className="text-sm text-muted-foreground">
              Monthly reports become available once an adoption has been approved.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Past reports */}
      {reports.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground mb-3">Your Submitted Reports</h2>
          <div className="space-y-3">
            {reports.map((r) => {
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
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{r.child?.firstName ?? "—"}</p>
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">
                          {formatMonth(r.reportMonth)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.proposal?.applicationNumber} · {r.child?.district}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">General Wellbeing</p>
                        <p className="text-sm text-foreground leading-relaxed">{r.generalWellbeing}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {r.healthStatus && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-400" /> Health
                            </p>
                            <p className="text-sm">{r.healthStatus}</p>
                          </div>
                        )}
                        {r.schoolPerformance && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                              <GraduationCap className="h-3 w-3 text-blue-400" /> Education
                            </p>
                            <p className="text-sm">{r.schoolPerformance}</p>
                          </div>
                        )}
                        {r.emotionalStatus && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                              <Smile className="h-3 w-3 text-amber-400" /> Emotional
                            </p>
                            <p className="text-sm">{r.emotionalStatus}</p>
                          </div>
                        )}
                      </div>
                      {r.additionalNotes && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-foreground">{r.additionalNotes}</p>
                        </div>
                      )}
                      {r.supportingDocs && r.supportingDocs.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                            <Paperclip className="h-3 w-3" /> Supporting Documents
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {r.supportingDocs.map((doc, i) => (
                              <a
                                key={i}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-lg hover:bg-muted/80 text-foreground border border-border"
                              >
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                {doc.fileName}
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
