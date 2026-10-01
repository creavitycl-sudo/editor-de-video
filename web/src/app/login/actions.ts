"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export async function iniciarSesion(formData: FormData) {
  const supabase = await createClient();

  const {error} = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function registrarse(formData: FormData) {
  const supabase = await createClient();

  const {data, error} = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // Si el proyecto de Supabase pide confirmar el email, signUp no deja
  // sesión activa: redirigir a /app solo rebota a /login por el
  // middleware. Avisamos en vez de eso.
  if (!data.session) {
    redirect(
      `/login?error=${encodeURIComponent("Revisa tu email para confirmar la cuenta antes de iniciar sesión.")}`,
    );
  }

  revalidatePath("/", "layout");
  redirect("/app");
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
