import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="wordmark mb-2 text-center text-2xl text-emerald">Malaki</p>
        <h1 className="mb-8 text-center text-xl text-muted">Admin sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
