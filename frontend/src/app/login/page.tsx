import LoginPage from "@/components/auth/login-page";

export default async function Login({ searchParams }: { searchParams: Promise<{ reauth?: string; status?: string }> }) {
  const params = await searchParams;
  return <LoginPage reauthenticate={params.reauth === "1"} signedOut={params.status === "signed-out"} />;
}
