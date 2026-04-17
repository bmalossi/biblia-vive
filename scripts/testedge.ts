import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!; // use service role to avoid auth issue on edge function if needed, or anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing commentary Edge Function...");
    console.time("commentary_fn");
    const { data, error } = await supabase.functions.invoke('commentary', {
        body: {
            bookId: "JHN",
            chapter: 3,
            verse: 16,
            verseText: "Porque Deus amou o mundo...",
            version: "acf",
            language: "pt"
        }
    });
    console.timeEnd("commentary_fn");

    if (error) {
        console.error("Function Error:", error);
    } else {
        console.log("Function Success Data:", data);
    }
}

test().catch(console.error);
