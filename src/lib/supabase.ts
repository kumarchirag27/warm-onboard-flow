import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'https://wvtyebsctlwbkmvvykfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dHllYnNjdGx3YmttdnZ5a2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjgyODgsImV4cCI6MjA4NzcwNDI4OH0.sFXIFMIxS_6gg8rr6DADljsbInqvLoJnP37sUgTfgWc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const DASHBOARD_URL = 'https://app.sentrashield.com/dashboard';
