import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

async function test() {
    console.log("Testing commentary Edge Function directly with fetch...");
    console.time("commentary_fetch");

    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/commentary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                bookId: "JHN",
                chapter: 3,
                verse: 16,
                verseText: "Porque Deus amou...",
                version: "acf",
                language: "pt"
            })
        });

        console.timeEnd("commentary_fetch");
        console.log("Status:", response.status, response.statusText);

        const text = await response.text();
        console.log("Response Text:", text.substring(0, 500));
    } catch (e) {
        console.error("Fetch Exception:", e);
    }
}

test();
