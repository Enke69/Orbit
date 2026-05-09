export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="stars-bg" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
