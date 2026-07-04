import { loginAction } from "@/app/auth/actions";
import { AuthForm } from "@/app/auth/auth-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/vocabulary");
  }

  return <AuthForm action={loginAction} mode="login" />;
}
