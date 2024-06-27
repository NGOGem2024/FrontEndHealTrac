import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

const supabaseUrl = "https://jcrthrchiiritoafbfcs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcnRocmNoaWlyaXRvYWZiZmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc5OTQwNjMsImV4cCI6MjAzMzU3MDA2M30.XKZrGpJ9XA12OGQ4sXuK7yA6TTd7g9tWc-bE4YhMgOM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Directly use AsyncStorage here
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
