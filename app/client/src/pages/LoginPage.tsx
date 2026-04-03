import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthUser, RequestAuth } from "../types/authTypes";

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
    <section className="auth-layout">
      <Card className="auth-panel">
        <CardHeader className="space-y-0 p-0">
          <Badge variant="outline" className="auth-tag">
            Finus
          </Badge>
          <CardTitle className="auth-title">Bye bye</CardTitle>
          <CardDescription className="auth-copy text-base">
            Log in to continue managing your finances.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <form className="auth-form" onSubmit={handleSubmit}>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />

            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              required
            />

            {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

            <Button
              type="submit"
              className="auth-button h-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging In..." : "Log In"}
            </Button>
          </form>

          <p className="auth-switch">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export default LoginPage;
