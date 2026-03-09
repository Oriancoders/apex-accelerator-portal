
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

-- Seed with initial data
INSERT INTO public.news_items (title, summary, url, category) VALUES
  ('Spring ''26 Release Highlights', 'Salesforce Spring ''26 introduces over 200 new features across Sales Cloud, Service Cloud, and Marketing Cloud including enhanced Einstein AI capabilities.', 'https://www.salesforce.com/news/', 'Release Notes'),
  ('Einstein AI Copilot Now GA', 'Einstein Copilot is now generally available, bringing conversational AI directly into every Salesforce workflow to help users take action faster.', 'https://www.salesforce.com/news/', 'AI & Einstein'),
  ('Flow Builder: New Screen Components', 'Salesforce Flow Builder ships with 15 new screen components including rich text, data tables, and location pickers to build richer user experiences.', 'https://www.salesforce.com/news/', 'Automation'),
  ('Salesforce Acquires Data Cloud Startup', 'Salesforce expands its Data Cloud capabilities with the acquisition of a leading real-time data streaming startup to power unified customer profiles.', 'https://www.salesforce.com/news/', 'Company News'),
  ('Apex Test Performance Improvements', 'Apex test execution is now up to 40% faster with new parallel test runner infrastructure rolled out across all Salesforce production orgs.', 'https://www.salesforce.com/news/', 'Developer'),
  ('Agentforce 2.0 Launched', 'Agentforce 2.0 brings autonomous AI agents that can handle complex multi-step tasks across service, sales, and marketing without human intervention.', 'https://www.salesforce.com/news/', 'AI & Einstein'),
  ('Salesforce Launches Slack AI', 'Slack AI introduces channel recaps, thread summaries, and search answers powered by large language models, rolled out to all paid Slack plans.', 'https://www.salesforce.com/news/', 'Productivity'),
  ('MuleSoft Integration Templates Expansion', 'MuleSoft adds 50+ new pre-built integration templates for SAP, Workday, and ServiceNow, cutting integration project timelines by half.', 'https://www.salesforce.com/news/', 'Integration'),
  ('Salesforce Trailhead Adds AI Learning Paths', 'Trailhead expands with 20 new AI-focused learning paths, including hands-on modules for Prompt Builder, Einstein Copilot, and AI model deployment.', 'https://www.salesforce.com/news/', 'Learning'),
  ('Hyperforce Expansion to New Regions', 'Salesforce Hyperforce now available in 8 new regions including Southeast Asia, Middle East, and South America for data residency compliance.', 'https://www.salesforce.com/news/', 'Infrastructure');
