"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Baby, Search, X, ChevronLeft, ChevronRight,
  MapPin, Calendar, Heart, School, Shield, Plus, Upload, Loader2,
} from "lucide-react";
import api from "@/lib/api";

interface Child {
  id: string;
  firstName: string;
  lastName?: string;
  dateOfBirth: string;
  gender: string;
  district: string;
  status: string;
  photo?: string;
  background?: string;
  medicalHistory?: string;
  educationLevel?: string;
  hasInsurance?: boolean;
  isInSchool?: boolean;
  schoolName?: string;
  orphanageName?: string;
  adoptionType?: string;
  createdById?: string;
}

const RWANDA_DISTRICTS = [
  "Bugesera","Burera","Gakenke","Gasabo","Gatsibo","Gicumbi","Gisagara",
  "Huye","Kamonyi","Karongi","Kayonza","Kicukiro","Kirehe","Muhanga",
  "Musanze","Ngabo","Ngoma","Ngororero","Nyabihu","Nyagatare","Nyamagabe",
  "Nyamasheke","Nyanza","Nyarugenge","Nyaruguru","Rubavu","Ruhango",
  "Rulindo","Rusizi","Rutsiro","Rwamagana",
];

const STATUS_COLOR: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  matched: "bg-amber-100 text-amber-700",
  adopted: "bg-blue-100 text-blue-700",
  unavailable: "bg-gray-100 text-gray-500",
};

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getAge(dob: string) {
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return years < 1 ? "< 1 yr" : `${years} yr${years !== 1 ? "s" : ""}`;
}

const PAGE_SIZE = 12;

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  district: "",
  orphanageName: "",
  background: "",
  medicalHistory: "",
  hasInsurance: false,
  isInSchool: false,
  schoolName: "",
};

export default function KidsPage() {
  const { user } = useAuth();
  const isOrphanageAdmin = user?.role === "orphanage_admin";

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Child | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Add child modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadChildren = () => {
    setLoading(true);
    api.get("/staff/children")
      .then((r) => setChildren(r.data.children ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadChildren(); }, []);

  // Close drawer on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (selected && drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setSelected(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  const districts = Array.from(new Set(children.map((c) => c.district).filter(Boolean))).sort();

  const filtered = children.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.firstName.toLowerCase().includes(q) || (c.lastName ?? "").toLowerCase().includes(q) || c.district.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchGender = filterGender === "all" || c.gender === filterGender;
    const matchDistrict = filterDistrict === "all" || c.district === filterDistrict;
    return matchSearch && matchStatus && matchGender && matchDistrict;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilterChange = (setter: (v: string) => void) => (v: string | null) => {
    setter(v ?? "all");
    setPage(1);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openModal = () => {
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.gender || !form.district) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (photoFile) fd.append("photo", photoFile);
      await api.post("/staff/children", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setShowModal(false);
      loadChildren();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to add child.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Children</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Loading..." : `${filtered.length} child${filtered.length !== 1 ? "ren" : ""}`}
          </p>
        </div>
        {isOrphanageAdmin && (
          <Button className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-2" onClick={openModal}>
            <Plus className="h-4 w-4" /> Add Child
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search by name or district..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={filterStatus} onValueChange={handleFilterChange(setFilterStatus)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="matched">Matched</SelectItem>
            <SelectItem value="adopted">Adopted</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGender} onValueChange={handleFilterChange(setFilterGender)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDistrict} onValueChange={handleFilterChange(setFilterDistrict)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || filterStatus !== "all" || filterGender !== "all" || filterDistrict !== "all") && (
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterGender("all"); setFilterDistrict("all"); setPage(1); }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center py-16 gap-3 text-center">
            <Baby className="h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-500">No children found</p>
            {isOrphanageAdmin ? (
              <Button size="sm" className="bg-[#6c63ff] hover:bg-[#5a52d5] gap-1 mt-1" onClick={openModal}>
                <Plus className="h-3.5 w-3.5" /> Add First Child
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginated.map((c) => (
              <div
                key={c.id}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer group"
                onClick={() => setSelected(c)}
              >
                <div className="relative w-full aspect-square bg-muted">
                  {c.photo ? (
                    <img src={c.photo} alt={c.firstName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Baby className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={`text-[10px] border-0 shadow-sm ${STATUS_COLOR[c.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {statusLabel(c.status)}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{c.firstName} {c.lastName ?? ""}</p>
                  <p className="text-xs text-muted-foreground">{getAge(c.dateOfBirth)} · {c.gender}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">{c.district}</p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {c.isInSchool && <School className="h-3 w-3 text-blue-500" title="In school" />}
                    {c.hasInsurance && <Shield className="h-3 w-3 text-green-500" title="Has insurance" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div
            ref={drawerRef}
            className="relative z-10 w-full max-w-md bg-background h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
          >
            <div className="relative h-56 bg-muted flex-shrink-0">
              {selected.photo ? (
                <img src={selected.photo} alt={selected.firstName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Baby className="h-16 w-16 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4 text-white" />
              </button>
              <div className="absolute bottom-4 left-4">
                <p className="text-white text-xl font-bold">{selected.firstName} {selected.lastName ?? ""}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-[10px] border-0 ${STATUS_COLOR[selected.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {statusLabel(selected.status)}
                  </Badge>
                  {selected.adoptionType && (
                    <Badge variant="outline" className="text-[10px] border-white/40 text-white bg-transparent">
                      {selected.adoptionType.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Age</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">{getAge(selected.dateOfBirth)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(selected.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Gender</p>
                  <p className="text-sm font-semibold capitalize">{selected.gender}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">District</p>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">{selected.district}</p>
                  </div>
                </div>
                {selected.orphanageName && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Orphanage</p>
                    <p className="text-sm font-semibold">{selected.orphanageName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Services</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selected.isInSchool ? (
                      <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <School className="h-3.5 w-3.5" /> In School
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No school</span>
                    )}
                    {selected.hasInsurance && (
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Shield className="h-3.5 w-3.5" /> Insured
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selected.schoolName && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">School</p>
                  <p className="text-sm text-foreground">{selected.schoolName}</p>
                </div>
              )}

              {selected.background && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Background</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.background}</p>
                </div>
              )}

              {selected.medicalHistory && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Medical History</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.medicalHistory}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Child Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-lg bg-background rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-bold">Add New Child</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {formError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{formError}</div>
              )}

              {/* Photo upload */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-24 h-24 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#6c63ff]/50 transition"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-[10px]">Photo</span>
                    </div>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <button onClick={() => photoInputRef.current?.click()} className="text-xs text-primary hover:underline">
                  {photoPreview ? "Change photo" : "Upload photo (optional)"}
                </button>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                  <Input id="firstName" value={form.firstName} onChange={(e) => handleFormChange("firstName", e.target.value)} placeholder="e.g. Jean" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
                  <Input id="lastName" value={form.lastName} onChange={(e) => handleFormChange("lastName", e.target.value)} placeholder="e.g. Baptiste" />
                </div>
              </div>

              {/* DOB + Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
                  <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => handleFormChange("dateOfBirth", e.target.value)} max={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender <span className="text-destructive">*</span></Label>
                  <select
                    value={form.gender}
                    onChange={(e) => handleFormChange("gender", e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <Label>District <span className="text-destructive">*</span></Label>
                <select
                  value={form.district}
                  onChange={(e) => handleFormChange("district", e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Select district...</option>
                  {RWANDA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Orphanage name */}
              <div className="space-y-1.5">
                <Label htmlFor="orphanageName">Orphanage Name</Label>
                <Input id="orphanageName" value={form.orphanageName} onChange={(e) => handleFormChange("orphanageName", e.target.value)} placeholder="e.g. Hope Children's Home" />
              </div>

              {/* School */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    id="isInSchool"
                    type="checkbox"
                    checked={form.isInSchool}
                    onChange={(e) => handleFormChange("isInSchool", e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-[#6c63ff]"
                  />
                  <Label htmlFor="isInSchool" className="cursor-pointer">Currently in school</Label>
                </div>
                {form.isInSchool && (
                  <Input
                    value={form.schoolName}
                    onChange={(e) => handleFormChange("schoolName", e.target.value)}
                    placeholder="School name"
                  />
                )}
              </div>

              {/* Insurance */}
              <div className="flex items-center gap-3">
                <input
                  id="hasInsurance"
                  type="checkbox"
                  checked={form.hasInsurance}
                  onChange={(e) => handleFormChange("hasInsurance", e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-[#6c63ff]"
                />
                <Label htmlFor="hasInsurance" className="cursor-pointer">Has health insurance (Mutuelle)</Label>
              </div>

              {/* Background */}
              <div className="space-y-1.5">
                <Label htmlFor="background">Background / Family History</Label>
                <textarea
                  id="background"
                  value={form.background}
                  onChange={(e) => handleFormChange("background", e.target.value)}
                  rows={3}
                  placeholder="Brief background story..."
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Medical history */}
              <div className="space-y-1.5">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <textarea
                  id="medicalHistory"
                  value={form.medicalHistory}
                  onChange={(e) => handleFormChange("medicalHistory", e.target.value)}
                  rows={3}
                  placeholder="Known conditions, allergies, etc."
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border flex-shrink-0">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button className="flex-1 bg-[#6c63ff] hover:bg-[#5a52d5]" onClick={handleSubmit} disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Add Child"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
