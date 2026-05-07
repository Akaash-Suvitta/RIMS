export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: '#0B1929' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: '#112238',
          border: '1px solid rgba(56, 189, 248, 0.12)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #00C2A8)', color: '#0B1929' }}
          >
            RA
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'DM Serif Display, serif', color: '#E8F0F8' }}>
            RegAxis RIM
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#7A9BBD' }}>
            Regulatory Information Management
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
