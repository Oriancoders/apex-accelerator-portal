
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
  ('Salesforce Inspector Reloaded', 'Inspect data, run SOQL queries, export results and navigate records directly from your browser.', 'https://chrome.google.com/webstore', 'Developer Tools', '400K+'),
  ('Salesforce DevTools', 'Debug logs explorer, schema browser, and real-time event monitoring all in one Chrome extension.', 'https://chrome.google.com/webstore', 'Developer Tools', '150K+'),
  ('ORGanizer for Salesforce', 'Multi-org management with quick links, org notes, and instant switching between sandboxes and production.', 'https://chrome.google.com/webstore', 'Productivity', '200K+'),
  ('Salesforce Colored Favicons', 'Identify your Salesforce orgs instantly with custom color-coded browser tab favicons.', 'https://chrome.google.com/webstore', 'Productivity', '100K+'),
  ('Apex PMD', 'Static code analysis for Apex directly in Chrome — catch bugs and code quality issues before deployment.', 'https://chrome.google.com/webstore', 'Developer Tools', '50K+'),
  ('Salesforce Mass Edit & Mass Update', 'Mass edit and update Salesforce records inline — like a spreadsheet, without leaving the list view.', 'https://chrome.google.com/webstore', 'Data Management', '80K+'),
  ('Salesforce.com Quick Login As', 'Quickly login as any user in your org for testing and support — saves hours compared to the native approach.', 'https://chrome.google.com/webstore', 'Admin Tools', '120K+'),
  ('Salesforce Field Audit', 'See field history, audit trail, and data changes for any Salesforce record in a clean timeline view.', 'https://chrome.google.com/webstore', 'Admin Tools', '60K+'),
  ('Salesforce Metadata Search', 'Search across all metadata types in your org — find where a field is used across flows, triggers, and layouts.', 'https://chrome.google.com/webstore', 'Developer Tools', '70K+'),
  ('Lightning Extension', 'Debug Lightning components, view component trees, and analyze performance metrics in Salesforce Lightning.', 'https://chrome.google.com/webstore', 'Developer Tools', '90K+');
