import Link from "next/link";
import {AjustesForm} from "@/components/AjustesForm";

export default function AjustesPage() {
  return (
    <div className="max-w-screen-md m-auto px-4 py-10 flex flex-col gap-6">
      <Link href="/app" className="text-sm text-subtitle">
        ← Volver
      </Link>
      <h1 className="text-xl font-semibold">Ajustes</h1>
      <AjustesForm />
    </div>
  );
}
