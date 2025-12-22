export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="relative">
        {/* Chasing tail ring */}
        <div className="w-20 h-20 rounded-full border-4 border-transparent animate-spin-chase"></div>
      </div>
    </div>
  );
}
