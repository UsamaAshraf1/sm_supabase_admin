import { createClient } from "@supabase/supabase-js";

const SupabaseUrl = "https://itelvvaretjpaveepvxd.supabase.co";
const SupbaseAnonKey = "sb_publishable_bMlnOr-kakopb8Rf7JmEiQ_4n-JKhIv";

const supabase = createClient(SupabaseUrl, SupbaseAnonKey);

export default supabase;
