// Hemenway 80th — combined Cloudflare Worker (leaderboard + email signups + photo album)
// Paste this whole file into the hemenway-leaderboard Worker editor, then Deploy.
// KV binding must stay: variable name LB -> namespace hemenway_lb.
// Private read endpoints use ?key=hemenway80
export default {
  async fetch(req, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(req.url);
    const J = (o) => new Response(JSON.stringify(o), { headers: { ...cors, "Content-Type": "application/json" } });

    // ---- leaderboard ----
    if (url.pathname === "/board") {
      const raw = await env.LB.get("board");
      const b = raw ? JSON.parse(raw) : {};
      const list = Object.entries(b).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score).slice(0, 50);
      return J(list);
    }
    if (url.pathname === "/score" && req.method === "POST") {
      let body; try { body = await req.json(); } catch (e) { return new Response("bad", { status: 400, headers: cors }); }
      const name = (body.name || "").toString().slice(0, 24).trim();
      const score = Math.max(0, Math.min(99999, parseInt(body.score, 10) || 0));
      if (!name) return new Response("no name", { status: 400, headers: cors });
      const raw = await env.LB.get("board");
      const b = raw ? JSON.parse(raw) : {};
      b[name] = Math.max(b[name] || 0, score);
      await env.LB.put("board", JSON.stringify(b));
      return J({ ok: true });
    }

    // ---- email sign-ups ----
    if (url.pathname === "/signup" && req.method === "POST") {
      let body; try { body = await req.json(); } catch (e) { return new Response("bad", { status: 400, headers: cors }); }
      const raw = await env.LB.get("signups");
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ name: (body.name || "").toString().slice(0, 40), username: (body.username || "").toString().slice(0, 40), email: (body.email || "").toString().slice(0, 80), optin: (body.optin || "").toString().slice(0, 12) });
      await env.LB.put("signups", JSON.stringify(arr));
      return J({ ok: true });
    }
    if (url.pathname === "/signups" && url.searchParams.get("key") === "hemenway80") {
      const raw = await env.LB.get("signups");
      return new Response(raw || "[]", { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ---- photo album ----
    if (url.pathname === "/photo" && req.method === "POST") {
      let body; try { body = await req.json(); } catch (e) { return new Response("bad", { status: 400, headers: cors }); }
      const img = (body.img || "").toString();
      if (!img.startsWith("data:image")) return new Response("no image", { status: 400, headers: cors });
      if (img.length > 8000000) return new Response("too big", { status: 413, headers: cors });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      await env.LB.put("photo:" + id, img);
      const raw = await env.LB.get("photoindex");
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ id, name: (body.name || "").toString().slice(0, 40), caption: (body.caption || "").toString().slice(0, 80) });
      await env.LB.put("photoindex", JSON.stringify(arr));
      return J({ ok: true, id });
    }
    if (url.pathname === "/photos") {
      const raw = await env.LB.get("photoindex");
      return new Response(raw || "[]", { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (url.pathname === "/photo" && req.method === "GET") {
      const id = url.searchParams.get("id");
      const dataUrl = await env.LB.get("photo:" + id);
      if (!dataUrl) return new Response("not found", { status: 404, headers: cors });
      const b64 = dataUrl.split(",")[1] || "";
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Response(bytes, { headers: { ...cors, "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" } });
    }

    return new Response("Hemenway leaderboard", { headers: cors });
  }
};
