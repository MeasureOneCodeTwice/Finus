import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthUser, RequestAuth } from "./authTypes";

type LoginPageProps = {
  onLogin: (token: string, fallbackUser: Partial<AuthUser>) => void;
  requestAuth: RequestAuth;
};

function LoginPage({ onLogin, requestAuth }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const result = await requestAuth("/api/login", {
      email: normalizedEmail,
      password,
    });

    setIsSubmitting(false);

    if (!result.ok || !result.token) {
      setErrorMessage(result.error ?? "Login failed.");
      return;
    }

    onLogin(result.token, { email: normalizedEmail });
  }

  return (
    <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md border-border/70 bg-card/90 backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 uppercase tracking-[0.16em]">
            Finus
          </Badge>
          <CardTitle>Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground">
            Log in to continue managing your finances.
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                required
              />
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          New here?{" "}
          <Link
            to="/signup"
            className="ml-1 font-semibold text-primary transition-colors hover:text-primary/85"
          >
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}

export default LoginPage;
