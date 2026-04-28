/**
 * Shared ticket constants — single source of truth for status, priority,
 * and stage metadata used across user-facing and admin pages.
 */
import {
  ClipboardCheck,
  HelpCircle,
  CheckCircle,
  PlayCircle,
  Target,
  Award,
  XCircle,
} from "lucide-react";
import { createElement } from "react";

// ── Status metadata ─────────────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  desc: string;
}

export const STATUS_META: Record<string, StatusMeta> = {
  submitted: {
    label: "Submitted",
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    icon: createElement(ClipboardCheck, { className: "h-3.5 w-3.5" }),
    desc: "Your request has been received and is waiting for expert review.",
  },
  under_review: {
    label: "Under Review",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    icon: createElement(HelpCircle, { className: "h-3.5 w-3.5" }),
    desc: "Our expert team is analyzing your request and preparing a proposal.",
  },
  approved: {
    label: "Approved",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
    icon: createElement(CheckCircle, { className: "h-3.5 w-3.5" }),
    desc: "You approved the proposal. Work is about to begin.",
  },
  in_progress: {
    label: "In Progress",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
    icon: createElement(PlayCircle, { className: "h-3.5 w-3.5" }),
    desc: "Our team is actively working on your request.",
  },
  uat: {
    label: "UAT",
    color: "text-info",
    bg: "bg-info/10",
    border: "border-info/20",
    icon: createElement(Target, { className: "h-3.5 w-3.5" }),
    desc: "The work is ready. Please test and confirm the deliverables.",
  },
  completed: {
    label: "Completed",
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
    icon: createElement(Award, { className: "h-3.5 w-3.5" }),
    desc: "Work is confirmed complete.",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    icon: createElement(XCircle, { className: "h-3.5 w-3.5" }),
    desc: "This ticket was cancelled.",
  },
};

// ── Priority metadata ───────────────────────────────────────────────────────

export interface PriorityMeta {
  color: string;
  bg: string;
  dot: string;
}

export const PRIORITY_META: Record<string, PriorityMeta> = {
  low: { color: "text-success", bg: "bg-success/10", dot: "bg-success" },
  medium: { color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
  high: { color: "text-accent", bg: "bg-accent/10", dot: "bg-accent" },
  critical: { color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
};

// ── Stage pipeline ──────────────────────────────────────────────────────────

export const STAGES = [
  "submitted",
  "under_review",
  "approved",
  "in_progress",
  "uat",
  "completed",
] as const;

export const STAGE_IDX: Record<string, number> = {
  submitted: 0,
  under_review: 1,
  approved: 2,
  in_progress: 3,
  uat: 4,
  completed: 5,
  cancelled: -1,
};

// ── Status workflow actions (admin context) ─────────────────────────────────

export const STATUS_ACTION: Record<string, { label: string; desc: string; urgent?: boolean }> = {
  submitted: { label: "Needs Proposal", desc: "Write and submit a proposal for this ticket.", urgent: true },
  under_review: { label: "Awaiting Approval", desc: "Client is reviewing your proposal." },
  approved: { label: "Start Work", desc: "Client approved. Move to In Progress.", urgent: true },
  in_progress: { label: "In Development", desc: "Move to UAT when work is ready.", urgent: false },
  uat: { label: "UAT Active", desc: "Client is testing. Monitor for issues." },
  completed: { label: "Completed", desc: "Client confirmed and review is submitted." },
  cancelled: { label: "Cancelled", desc: "This ticket was cancelled." },
};

// ── Filter tabs ─────────────────────────────────────────────────────────────

export const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

export const TICKET_PAGE_SIZE = 5;

export function isActiveStatus(status: string): boolean {
  return ["submitted", "under_review", "approved", "in_progress", "uat"].includes(status);
}
