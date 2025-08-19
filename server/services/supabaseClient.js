import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjnqptvfkwzrilabxtun.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqbnFwdHZma3d6cmlsYWJ4dHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Nzg1ODcsImV4cCI6MjA2OTU1NDU4N30.BTnR9TAn4TozfRTAI-RQxh4jS9lpUVshGxsquiqOHVY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
