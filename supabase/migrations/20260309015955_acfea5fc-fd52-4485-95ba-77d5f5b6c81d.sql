CREATE TABLE public.news_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published news"
  ON public.news_items FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can manage news"
  ON public.news_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.news_items (title, summary, url, category) VALUES
  ('Service Request Trends', 'Teams are standardizing intake, proposal approval, and delivery review workflows to reduce operational handoff gaps.', 'https://example.com/news/service-request-trends', 'Operations'),
  ('Credit-Based Delivery Models', 'Pay-as-you-go credit systems help clients control spend while keeping delivery teams accountable to approved work.', 'https://example.com/news/credit-based-delivery', 'Finance'),
  ('Company Workspace Improvements', 'Multi-tenant workspaces are becoming the default for service teams that support several client organizations.', 'https://example.com/news/company-workspaces', 'Product'),
  ('Consultant Queue Design', 'Focused assignment queues help delivery teams accept work faster and move completed work into UAT with clearer ownership.', 'https://example.com/news/consultant-queues', 'Delivery'),
  ('UAT Feedback Loops', 'Structured review stages make it easier for clients to approve delivered work or request specific changes.', 'https://example.com/news/uat-feedback', 'Quality'),
  ('Member Invite Flows', 'Password setup links and role-aware membership rules simplify onboarding for company teams.', 'https://example.com/news/member-invites', 'Access'),
  ('Operational AI Assistants', 'Workflow-aware AI assistants can help users understand ticket status, pricing, and next steps without leaving the portal.', 'https://example.com/news/ai-assistants', 'AI'),
  ('Subscription Delivery Plans', 'Company subscriptions can route work directly to delivery while preserving audit trails and admin control.', 'https://example.com/news/subscription-delivery', 'Subscriptions'),
  ('Attachment Validation Practices', 'Early validation of uploaded files reduces rework and keeps service requests ready for review.', 'https://example.com/news/attachment-validation', 'Security'),
  ('Admin Finance Controls', 'Centralized credit settings, withdrawals, and subscription panels give operators a cleaner finance workflow.', 'https://example.com/news/admin-finance-controls', 'Finance');
