import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://utcvdlqypjgrgnesbzyg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Y3ZkbHF5cGpncmduZXNienlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MzkzMDUsImV4cCI6MjA3MjQxNTMwNX0.vAUMNpa0UAHtKucsWHEAmoL1pRByMVJXHXk0BnV5QhI';

export const supabase = createClient(supabaseUrl, supabaseKey);
