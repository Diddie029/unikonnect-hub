
-- Content reports/flags table for incident reporting
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID,
  reported_content_id UUID,
  content_type TEXT NOT NULL DEFAULT 'post',
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id AND NOT is_suspended(auth.uid()));

CREATE POLICY "Users can view own reports" ON public.reports
FOR SELECT TO authenticated
USING (auth.uid() = reporter_id OR is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can update reports" ON public.reports
FOR UPDATE TO authenticated
USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can delete reports" ON public.reports
FOR DELETE TO authenticated
USING (is_admin_or_mod(auth.uid()));

-- System alerts table for admin notifications
CREATE TABLE public.system_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alerts" ON public.system_alerts
FOR SELECT TO authenticated
USING (is_admin_or_mod(auth.uid()));

CREATE POLICY "Admins can manage alerts" ON public.system_alerts
FOR ALL TO authenticated
USING (is_admin_or_mod(auth.uid()))
WITH CHECK (is_admin_or_mod(auth.uid()));
