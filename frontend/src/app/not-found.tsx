import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-7 h-7 text-[var(--text-muted)]" />
        </div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Page not found
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--jade)] text-[var(--bg-deep)] text-sm font-semibold hover:opacity-90 transition-all"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
