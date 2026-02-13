import { stmts } from "./db";


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
  });
}


function badRequest(message: string) {
  return json({ ok: false, error: message }, 400);
}


function getOptions() {
  return {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost.*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
    }
}

// ---- server ----
Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, getOptions())
    };

    if(url.pathname === '/api/auth/token' && req.method === "POST") {
      let body;
      try {
        body = await req.json();
        if(!body.email || !body.password) { throw new Error() }
      } catch { 
        return badRequest("Body must be JSON containing username and password.");
      }

      if(!validateEmail(body.email)) {
        return 
      }
      if(!validatePassword(body.password)) {

      }



    }

    // ---- SIGNUP ----
    if (req.method === "POST" && url.pathname === "/api/auth/signup") {
    
      const email = body.email.trim().toLowerCase();
      const password = body.password;

      if (!isValidEmail(email)) return badRequest("Please enter a valid email address.");
      if (password.length < 8) return badRequest("Password must be at least 8 characters.");

      const existing = stmts.findByEmail.get(email) as any;
      if (existing) return json({ ok: false, error: "Email already exists." }, 409);

      const passwordHash = await hashPassword(password);
      stmts.createUser.run(email, passwordHash);

      return json({ ok: true, message: "Account created." }, 201);
    }

    // ---- LOGIN ----
    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = (await req.json().catch(() => null)) as null | {
        email?: string;
        password?: string;
      };

      if (!body?.email || !body?.password) {
        return badRequest("Email and password are required.");
      }

      const email = body.email.trim().toLowerCase();
      const password = body.password;

      if (!isValidEmail(email)) return badRequest("Please enter a valid email address.");

      const user = stmts.findByEmail.get(email) as any;
      if (!user) return json({ ok: false, error: "Invalid email or password." }, 401);

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) return json({ ok: false, error: "Invalid email or password." }, 401);

      return json({
        ok: true,
        message: "Logged in!",
        user: { id: user.id, email: user.email },
      });
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, status: "up" });
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
});

console.log(`Auth service running on ${PORT}`);
