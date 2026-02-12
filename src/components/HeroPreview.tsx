/** Product preview for the hero section — floating panel with live table. */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Light sweep — live infrastructure feel */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl" aria-hidden>
        <div className="absolute -left-full top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-sweep" />
      </div>
      {/* Floating Panel */}
      <div className="relative bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition duration-700 hover:scale-[1.01]">
        {/* Subtle Edge Glow */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-indigo-500/20 pointer-events-none" aria-hidden />

        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <span className="font-medium text-slate-200 tracking-wide">COTERI</span>
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            LIVE
          </span>
        </div>

        <div className="p-6 text-sm text-slate-300">
          <table className="w-full text-left">
            <thead className="text-slate-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="pb-3">Member</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="py-3">Alex Ramirez</td>
                <td className="py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-400/20 text-slate-200 border border-slate-400/40">
                    Tier 1
                  </span>
                </td>
                <td className="text-green-400">Active</td>
                <td>Today</td>
              </tr>
              <tr>
                <td className="py-3">Jordan Lee</td>
                <td className="py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-sky-500/20 text-sky-300 border border-sky-400/50">
                    Tier 2
                  </span>
                </td>
                <td className="text-green-400">Active</td>
                <td>Today</td>
              </tr>
              <tr>
                <td className="py-3">Sam Patel</td>
                <td className="py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                    Tier 3
                  </span>
                </td>
                <td className="text-green-400">Active</td>
                <td>Today</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Drop Shadow Depth Layer */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" aria-hidden />
    </div>
  );
}
