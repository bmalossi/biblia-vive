import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing user_subscriptions...");
    console.time("user_subscriptions");
    const { data: subData, error: subErr } = await supabase
        .from('user_subscriptions')
        .select('*')
        .limit(1);
    console.timeEnd("user_subscriptions");
    console.log("Sub Data:", subData);
    console.log("Sub Error:", subErr);

    console.log("\nTesting user_plan_progress...");
    console.time("user_plan_progress");
    const { data: planData, error: planErr } = await supabase
        .from('user_plan_progress')
        .select('*')
        .limit(1);
    console.timeEnd("user_plan_progress");
    console.log("Plan Data:", planData);
    console.log("Plan Error:", planErr);
}

test().catch(console.error);
