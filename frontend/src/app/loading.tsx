export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--jade)] border-t-transparent animate-spin" />
        <p
          className="text-sm text-[var(--text-muted)] font-medium"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Loading Asseta...
        </p>
      </div>
    </div>
  );
}
