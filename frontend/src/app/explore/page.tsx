"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Child {
  id: string;
  firstName: string;
  age: number;
  gender: string;
  district: string;
  photo: string;
  isInSchool: boolean;
  hasInsurance: boolean;
}

interface FetchResult {
  children: Child[];
  total: number;
  page: number;
  totalPages: number;
}

const DISTRICTS = [
  "Any", "Kigali", "Musanze", "Huye", "Rubavu", "Nyagatare",
  "Muhanga", "Rwamagana", "Karongi", "Rusizi", "Nyamagabe",
];

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    district: searchParams.get("district") || "Any",
    gender: searchParams.get("gender") || "Any",
    minAge: searchParams.get("minAge") || "",
    maxAge: searchParams.get("maxAge") || "",
  });
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const [result, setResult] = useState<FetchResult>({ children: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchChildren = useCallback(async (f: typeof filters, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "12", page: String(p) });
    if (f.district && f.district !== "Any") params.set("district", f.district);
    if (f.gender && f.gender !== "Any") params.set("gender", f.gender);
    if (f.minAge) params.set("minAge", f.minAge);
    if (f.maxAge) params.set("maxAge", f.maxAge);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/children?${params}`);
      const data = await res.json();
      setResult(data);
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren(filters, page);
  }, [fetchChildren, filters, page]);

  const applyFilters = () => {
    setPage(1);
    fetchChildren(filters, 1);
  };

  const resetFilters = () => {
    const reset = { district: "Any", gender: "Any", minAge: "", maxAge: "" };
    setFilters(reset);
    setPage(1);
    fetchChildren(reset, 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-[#6c63ff]">KidSafe</Link>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-[#6c63ff] hover:bg-[#5a52d5]">Register</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Find a Child</h1>
        <p className="text-gray-500 mb-8">
          Browse children available for adoption. Click "Adopt" on a child to begin your application.
        </p>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
            <SlidersHorizontal size={16} />
            Filter Children
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">District</label>
              <Select
                value={filters.district}
                onValueChange={(v) => setFilters((f) => ({ ...f, district: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any district" />
                </SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Gender</label>
              <Select
                value={filters.gender}
                onValueChange={(v) => setFilters((f) => ({ ...f, gender: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Min Age</label>
              <Input
                type="number"
                min="0"
                max="17"
                placeholder="0"
                value={filters.minAge}
                onChange={(e) => setFilters((f) => ({ ...f, minAge: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max Age</label>
              <Input
                type="number"
                min="0"
                max="17"
                placeholder="17"
                value={filters.maxAge}
                onChange={(e) => setFilters((f) => ({ ...f, maxAge: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button onClick={applyFilters} className="bg-[#6c63ff] hover:bg-[#5a52d5]" size="sm">
              <Search size={14} className="mr-2" />
              Search
            </Button>
            <Button onClick={resetFilters} variant="outline" size="sm">
              Reset
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : result.children.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-semibold">No children found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              Showing {result.children.length} of {result.total} children
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {result.children.map((child) => (
                <div
                  key={child.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition"
                >
                  <div className="relative">
                    <img
                      src={child.photo}
                      alt={child.firstName}
                      className="w-full h-48 object-cover"
                    />
                    <span className="absolute top-2 right-2 text-xs font-semibold text-gray-700 bg-white/90 px-2 py-0.5 rounded">
                      {child.district}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-sm text-gray-900">{child.firstName}</p>
                    <p className="text-xs text-gray-500">{child.age} years old · {child.gender}</p>
                    <div className="flex gap-1 mt-1 mb-3">
                      {child.isInSchool && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">In school</span>
                      )}
                      {child.hasInsurance && (
                        <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Insured</span>
                      )}
                    </div>
                    <Link
                      href={`/propose/${child.id}`}
                      className="block w-full text-center px-3 py-1.5 bg-[#6c63ff] text-white text-xs font-bold rounded hover:bg-[#5a52d5] transition"
                    >
                      Adopt
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {result.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= result.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
