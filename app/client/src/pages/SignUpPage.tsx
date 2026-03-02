import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_AGE, MIN_AGE, type AuthUser, type RequestAuth } from "./authTypes";

type SignUpPageProps = {
  onSignup: (token: string, fallbackUser: Partial<AuthUser>) => void;
  requestAuth: RequestAuth;
};

function SignUpPage({ onSignup, requestAuth }: SignUpPageProps) {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const cleanedUsername = username.trim();
    const cleanedFirstName = firstName.trim();
    const cleanedLastName = lastName.trim();
    const parsedAge = Number(age);
    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (
      !Number.isInteger(parsedAge) ||
      parsedAge < MIN_AGE ||
      parsedAge > MAX_AGE
    ) {
      setErrorMessage(`Age must be between ${MIN_AGE} and ${MAX_AGE}.`);
      return;
    }

    setIsSubmitting(true);

    const signupResult = await requestAuth("/api/signup", {
      username: cleanedUsername,
      first_name: cleanedFirstName,
      last_name: cleanedLastName,
      age: parsedAge,
      email: normalizedEmail,
      password,
    });

    if (!signupResult.ok) {
      setIsSubmitting(false);
      setErrorMessage(signupResult.error ?? "Signup failed.");
      return;
    }

    const loginResult = await requestAuth("/api/login", {
      email: normalizedEmail,
      password,
    });

    setIsSubmitting(false);

    if (!loginResult.ok || !loginResult.token) {
      setErrorMessage(
        loginResult.error ?? "Account created, but auto-login failed.",
      );
      return;
    }

    onSignup(loginResult.token, {
      email: normalizedEmail,
      first_name: cleanedFirstName,
      last_name: cleanedLastName,
      name: `${cleanedFirstName} ${cleanedLastName}`.trim(),
      age: parsedAge,
    });
  }

  return (
    <section className="flex min-h-[calc(100vh-3rem)] items-center justify-center py-8">
      <Card className="w-full max-w-3xl border-border/70 bg-card/90 backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 uppercase tracking-[0.16em]">
            Finus
          </Badge>
          <CardTitle>Create account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set up your account in less than a minute.
          </p>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="rounded-lg border border-border/70 bg-background/40 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Profile
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="johnd"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-first-name">First name</Label>
                  <Input
                    id="signup-first-name"
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="John"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-last-name">Last name</Label>
                  <Input
                    id="signup-last-name"
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="signup-age">Age</Label>
                  <Input
                    id="signup-age"
                    type="number"
                    min={MIN_AGE}
                    max={MAX_AGE}
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    placeholder="21"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-background/40 p-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Account
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Sign up"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="ml-1 font-semibold text-primary transition-colors hover:text-primary/85"
          >
            Log in
          </Link>
        </CardFooter>
      </Card>
    </section>
  );
}

export default SignUpPage;
