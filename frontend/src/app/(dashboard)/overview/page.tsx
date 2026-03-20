"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Baby,
  FileText,
  DollarSign,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const statsCards = [
  {
    title: "Kids I am in charge of",
    label: "Total Kids",
    value: "5",
    icon: Baby,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    extra: (
      <span className="text-xs text-primary font-medium flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> 80%
      </span>
    ),
  },
  {
    title: "Incoming reports",
    label: "Total reports",
    value: "10",
    icon: FileText,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    extra: (
      <div className="flex items-center gap-2 text-xs">
        <span className="flex items-center gap-0.5 text-green-500">
          <CheckCircle className="h-3 w-3" /> 3
        </span>
        <span className="flex items-center gap-0.5 text-red-500">
          <AlertCircle className="h-3 w-3" /> 1
        </span>
      </div>
    ),
  },
  {
    title: "Donations",
    label: "Donations",
    value: "300$",
    icon: DollarSign,
    iconBg: "bg-green-100",
    iconColor: "text-green-500",
    extra: (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-green-500 font-medium">4</span>
        <span className="text-primary font-medium">20</span>
      </div>
    ),
  },
  {
    title: "Parents' requests",
    label: "Total Requests",
    value: "6",
    icon: ClipboardList,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    extra: (
      <span className="text-xs text-primary font-medium flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> 80%
      </span>
    ),
  },
];

const activities = [
  {
    initials: "AG",
    title: "Report for child abuse",
    subtitle: "Rubungo, Bumbogo",
    time: "11:04 a.m.",
  },
  {
    initials: "AG",
    title: "New Child reported",
    subtitle: "Bibare, Kimironko",
    time: "Yesterday",
  },
  {
    initials: "AG",
    title: "Parent request",
    subtitle: "Request for aderline gashugi",
    time: "Yesterday",
  },
  {
    initials: "AG",
    title: "New Donation",
    subtitle: "From Aderline Gashugi",
    time: "Yesterday",
  },
  {
    initials: "AG",
    title: "New Donation",
    subtitle: "From Aderline Gashugi",
    time: "Yesterday",
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  {stat.title}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {stat.extra}
                    <button className="text-xs text-primary hover:underline mt-1 block">
                      View
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Donations Chart + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donations Chart Placeholder */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Donations chart will be rendered here
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">
              What happened...
            </CardTitle>
            <button className="text-sm text-primary hover:underline">
              See all
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {activity.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.subtitle}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">
                    {activity.time}
                  </p>
                  <button className="text-xs text-primary hover:underline">
                    View
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Health & Education Analysis */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Health & Education analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Insurance Chart Placeholder */}
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Insurance donut chart (with/without insurance)
            </div>
            {/* Education Chart Placeholder */}
            <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Education donut chart (attending/not in school)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
