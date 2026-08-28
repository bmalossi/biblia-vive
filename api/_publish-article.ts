import { createClient } from "@supabase/supabase-js";

export default async function handler(req: Request) {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

        if (!supabaseUrl || !supabaseServiceKey) {
            return new Response(
                JSON.stringify({ error: "Missing Supabase Environment Variables" }),
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const body = await req.json();
        const { id, title, slug, body: articleBody, status, meta_title, meta_description, cover_image_url, featured } = body;

        if (!title || !slug) {
            return new Response(
                JSON.stringify({ error: "Title and slug are required" }),
                { status: 400 }
            );
        }

        const payload = {
            title,
            slug,
            body: articleBody || "",
            status: status || "rascunho",
            meta_title: meta_title || null,
            meta_description: meta_description || null,
            cover_image_url: cover_image_url || null,
            featured: featured || false,
            published_at: status === "publicado" ? new Date().toISOString() : null,
        };

        let error;
        if (id) {
            const result = await supabase.from("articles").update(payload).eq("id", id);
            error = result.error;
        } else {
            const result = await supabase.from("articles").insert(payload);
            error = result.error;
        }

        if (error) {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500 }
            );
        }

        if (deployHookUrl && status === "publicado") {
            try {
                const deployResponse = await fetch(deployHookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });

                if (!deployResponse.ok) {
                    console.error("Deploy hook failed:", deployResponse.status, await deployResponse.text());
                }
            } catch (deployError) {
                console.error("Deploy hook error:", deployError);
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err: any) {
        console.error("Publish Article Error:", err);
        return new Response(
            JSON.stringify({ error: err.message || "Internal Server Error" }),
            { status: 500 }
        );
    }
}