"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Upload, FileText, CheckCircle2, XCircle, Loader2,
  ShieldCheck, ExternalLink, Trash2, AlertCircle, RefreshCw,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const DOC_TYPES = [
  { value: "id_document",          label: "National ID / Passport",        required: true },
  { value: "criminal_record",      label: "Criminal Record Certificate",   required: true },
  { value: "income_certificate",   label: "Proof of Income / Employment",  required: true },
  { value: "marriage_certificate", label: "Marriage Certificate",          required: false },
  { value: "medical_report",       label: "Medical Report",                required: false },
  { value: "other",                label: "Other Supporting Document",     required: false },
] as const;

type DocTypeValue = (typeof DOC_TYPES)[number]["value"];

interface UploadedDoc {
  id: string;
  docType: DocTypeValue;
  fileName: string;
  filePath: string;
  isValid: boolean;
  createdAt: string;
}

function DocUploadForm() {
  const searchParams = useSearchParams();
  const [appNumber, setAppNumber] = useState(searchParams.get("app") ?? "");
  const [nationalId, setNationalId] = useState(searchParams.get("nationalId") ?? "");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [selectedType, setSelectedType] = useState<DocTypeValue>("id_document");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-verify if URL params provided
  useEffect(() => {
    if (searchParams.get("app") && searchParams.get("nationalId")) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await axios.get(`${API_BASE}/proposals/documents`, {
        params: { app: appNumber, nationalId },
      });
      setDocs(res.data.documents ?? []);
    } catch {
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleVerify = async () => {
    if (!appNumber.trim() || !nationalId.trim()) {
      setVerifyError("Both fields are required.");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await axios.get(`${API_BASE}/proposals/documents`, {
        params: { app: appNumber.trim(), nationalId: nationalId.trim() },
      });
      setDocs(res.data.documents ?? []);
      setVerified(true);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setVerifyError("Invalid application number or national ID. Please check and try again.");
      } else {
        setVerifyError("Unable to verify. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setUploadError("Please select a file."); return; }
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("applicationNumber", appNumber.trim());
    formData.append("nationalId", nationalId.trim());
    formData.append("docType", selectedType);
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE}/proposals/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess("Document uploaded successfully.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocs();
    } catch (err: any) {
      setUploadError(err.response?.data?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const uploadedTypes = new Set(docs.map((d) => d.docType));
  const requiredDone = DOC_TYPES.filter((t) => t.required).every((t) => uploadedTypes.has(t.value));

  if (!verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-[#6c63ff]/10 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-[#6c63ff]" />
            </div>
            <CardTitle className="text-xl font-bold">Document Upload</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your application number and national ID to access your document portal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifyError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {verifyError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="appNumber">Application Number</Label>
              <Input
                id="appNumber"
                placeholder="e.g. KS-2024-001"
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID Number</Label>
              <Input
                id="nationalId"
                placeholder="Your national ID"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
            <Button
              className="w-full bg-[#6c63ff] hover:bg-[#5a52d5]"
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Access My Documents"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Don&apos;t have an application number?{" "}
              <Link href="/track" className="text-[#6c63ff] hover:underline">Track your application</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Application <span className="font-semibold text-foreground">{appNumber}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {requiredDone ? (
              <Badge className="bg-green-100 text-green-700 border-0 gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> All required docs uploaded
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-0 gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Some required docs missing
              </Badge>
            )}
          </div>
        </div>

        {/* Document checklist */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Document Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingDocs ? (
              <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : (
              DOC_TYPES.map((dt) => {
                const uploaded = docs.filter((d) => d.docType === dt.value);
                const done = uploaded.length > 0;
                return (
                  <div key={dt.value} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-100" : "bg-gray-100"}`}>
                      {done
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        : <XCircle className="h-3.5 w-3.5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{dt.label}</span>
                        {dt.required && (
                          <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">required</span>
                        )}
                      </div>
                      {uploaded.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {uploaded.map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#6c63ff] hover:underline"
                            >
                              <FileText className="h-3 w-3" />
                              {doc.fileName}
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upload form */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload a Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              {uploadError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  {uploadSuccess}
                </div>
              )}

              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocTypeValue)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>
                        {dt.label}
                        {dt.required && " *"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6c63ff]/10 file:text-[#6c63ff] hover:file:bg-[#6c63ff]/20 cursor-pointer border border-input rounded-md px-1 py-1"
                />
                <p className="text-xs text-muted-foreground">JPG, PNG, PDF or DOC — max 10 MB</p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2"
                  disabled={uploading || !file}
                >
                  {uploading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                    : <><Upload className="h-4 w-4" /> Upload</>}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={fetchDocs}
                  disabled={loadingDocs}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingDocs ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Need help?{" "}
          <Link href="/track" className="text-[#6c63ff] hover:underline">Track your application</Link>
          {" "}·{" "}
          <Link href="/" className="text-[#6c63ff] hover:underline">Home</Link>
        </p>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#6c63ff]" />
      </div>
    }>
      <DocUploadForm />
    </Suspense>
  );
}
