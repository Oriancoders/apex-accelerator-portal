CREATE TABLE public.extensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  users_count TEXT DEFAULT '',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published extensions"
  ON public.extensions FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage extensions"
  ON public.extensions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.extensions (name, description, url, category, users_count) VALUES
  ('Ticket Inbox Helper', 'Organize customer requests, surface urgent work, and keep service queues clean.', 'https://example.com/extensions/ticket-inbox-helper', 'Operations', '12K+'),
  ('Workflow Notes', 'Capture repeatable delivery notes and reusable checklist snippets for your team.', 'https://example.com/extensions/workflow-notes', 'Productivity', '8K+'),
  ('Client Timeline Export', 'Export request timelines for handoff, reporting, and client review meetings.', 'https://example.com/extensions/client-timeline-export', 'Reporting', '5K+'),
  ('Attachment Validator', 'Validate uploaded files before work begins and reduce back-and-forth with clients.', 'https://example.com/extensions/attachment-validator', 'Quality', '9K+'),
  ('Proposal Template Kit', 'Create consistent proposals with reusable effort, scope, and deliverable sections.', 'https://example.com/extensions/proposal-template-kit', 'Delivery', '7K+'),
  ('Credit Ledger Export', 'Export credit transactions for finance, reconciliation, and monthly reporting.', 'https://example.com/extensions/credit-ledger-export', 'Finance', '4K+'),
  ('UAT Checklist', 'Track review tasks, client feedback, and final confirmation before completion.', 'https://example.com/extensions/uat-checklist', 'Quality', '6K+'),
  ('Company Access Audit', 'Review membership changes and company access history from one place.', 'https://example.com/extensions/company-access-audit', 'Security', '3K+'),
  ('Consultant Queue View', 'Help consultants prioritize accepted assignments and ready-for-review work.', 'https://example.com/extensions/consultant-queue-view', 'Delivery', '10K+'),
  ('Subscription Health Monitor', 'Monitor active plans, renewals, and subscription-driven ticket flow.', 'https://example.com/extensions/subscription-health-monitor', 'Finance', '2K+');
