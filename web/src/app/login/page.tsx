import {iniciarSesion, registrarse} from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{error?: string}>;
}) {
  const {error} = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-unfocused-border-color rounded-geist p-geist bg-background">
        <h1 className="text-xl font-semibold mb-1">Editor de video</h1>
        <p className="text-subtitle text-sm mb-6">
          Inicia sesión o crea una cuenta para subir tu primer reel.
        </p>

        {error && (
          <p className="text-geist-error text-sm mb-4 border border-geist-error/40 rounded-geist p-geist-half">
            {error}
          </p>
        )}

        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              name="email"
              required
              className="rounded-geist bg-background border border-unfocused-border-color p-geist-half text-sm outline-none focus:border-focused-border-color"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Contraseña
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="rounded-geist bg-background border border-unfocused-border-color p-geist-half text-sm outline-none focus:border-focused-border-color"
            />
          </label>

          <div className="flex gap-2 mt-2">
            <button
              formAction={iniciarSesion}
              className="flex-1 h-10 rounded-geist bg-accent text-background font-medium text-sm"
            >
              Iniciar sesión
            </button>
            <button
              formAction={registrarse}
              className="flex-1 h-10 rounded-geist border border-unfocused-border-color text-sm"
            >
              Crear cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
