# Consistency Audit

Date: 2026-04-21

## Scope
- Completed in this pass:
  - Hook dependency warning cleanup in app flows.
  - Token alignment in selected UI primitives:
    - src/components/ui/sidebar.tsx
    - src/components/ui/toast.tsx
    - src/components/ui/dropdown-menu.tsx
    - src/components/ui/sonner.tsx

## Validation
- ESLint: 8 warnings, 0 errors.
- TypeScript: pass (no output from tsc --noEmit).

## Remaining Lint Warnings
- All remaining warnings are react-refresh/only-export-components in shared UI/context files:
  - src/components/ui/badge.tsx
  - src/components/ui/button.tsx
  - src/components/ui/form.tsx
  - src/components/ui/navigation-menu.tsx
  - src/components/ui/sidebar.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/toggle.tsx
  - src/contexts/AuthContext.tsx

## Remaining Non-Token Exceptions

### Exact border-border leftovers (2)
- src/index.css (base layer apply)
- src/components/ui/chart.tsx (border-border/50 in chart tooltip)

### UI primitives still using legacy rounded/shadow classes
These are mostly shadcn defaults and can be treated as a separate migration phase:
- src/components/ui/alert-dialog.tsx
- src/components/ui/dialog.tsx
- src/components/ui/context-menu.tsx
- src/components/ui/hover-card.tsx
- src/components/ui/navigation-menu.tsx
- src/components/ui/popover.tsx
- src/components/ui/select.tsx
- src/components/ui/sheet.tsx
- src/components/ui/switch.tsx
- src/components/ui/tooltip.tsx
- src/components/ui/tabs.tsx
- src/components/ui/card.tsx
- src/components/ui/button.tsx
- src/components/ui/input.tsx
- src/components/ui/textarea.tsx

### App-level files with residual rounded-lg / shadow-sm|md|lg
These are candidates for next incremental pass:
- src/App.tsx
- src/components/ai-chatbot/ChatLauncher.tsx
- src/components/ai-chatbot/ChatHeader.tsx
- src/components/navbar/BrandLink.tsx
- src/components/navbar/DesktopNavigation.tsx
- src/components/navbar/CompanySwitcher.tsx
- src/components/proposal-builder/ProposalStepsEditor.tsx
- src/components/proposal-builder/TicketCategoryField.tsx
- src/components/ticket-chat/ChatMessagesPane.tsx
- src/pages/TicketDetailPage.tsx
- src/pages/AgentDashboardPage.tsx
- src/pages/ProfilePage.tsx
- src/pages/PricingGuidePage.tsx
- src/pages/NotificationsPage.tsx
- src/pages/admin/AdminNotificationsPage.tsx

## Recommended Next Sweep (Safe Order)
1. Migrate app-level rounded-lg/rounded-md to ds tokens in non-ui directories only.
2. Migrate app-level shadow-sm|md|lg to shadow-soft/shadow-glow/shadow-deep.
3. Keep shadcn UI primitives for a dedicated pass with visual QA to avoid style regressions.
