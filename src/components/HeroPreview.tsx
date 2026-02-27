/** Product preview for the hero section — floating panel with live table. */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      {/* Floating Panel */}
      <div className="relative bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Subtle Edge Glow */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-indigo-500/20 pointer-events-none" aria-hidden />

        <div className="px-6 py-5 border-b border-slate-700/80 flex justify-between items-center bg-slate-900/95">
          <span className="text-white font-semibold tracking-tight text-lg">LIVE DASHBOARD</span>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/25 text-green-300 border border-green-500/40 tracking-wide">
            LIVE
          </span>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/60">
                <th className="pb-4 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Member
                </th>
                <th className="pb-4 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Tier
                </th>
                <th className="pb-4 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Status
                </th>
                <th className="pb-4 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Reward
                </th>
                <th className="pb-4 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Points
                </th>
                <th className="pb-4 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Revenue
                </th>
                <th className="pb-4 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
                  Last Verified
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr>
                <td className="py-4 text-base font-medium text-slate-100 tracking-tight">Alex Ramirez</td>
                <td className="py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide bg-slate-400/20 text-slate-200 border border-slate-400/40">
                    Tier 1
                  </span>
                </td>
                <td className="py-4 text-emerald-400 font-medium text-sm">Active</td>
                <td className="py-4 text-amber-400 font-medium text-sm tabular-nums">Gold</td>
                <td className="py-4 text-slate-300 text-sm font-medium tabular-nums">2,840</td>
                <td className="py-4 text-emerald-400/90 text-sm font-semibold tabular-nums">$420</td>
                <td className="py-4 text-slate-400 text-sm font-medium tracking-tight">Today</td>
              </tr>
              <tr>
                <td className="py-4 text-base font-medium text-slate-100 tracking-tight">Jordan Lee</td>
                <td className="py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide bg-sky-500/20 text-sky-300 border border-sky-400/50">
                    Tier 2
                  </span>
                </td>
                <td className="py-4 text-emerald-400 font-medium text-sm">Active</td>
                <td className="py-4 text-sky-300 font-medium text-sm tabular-nums">Platinum</td>
                <td className="py-4 text-slate-300 text-sm font-medium tabular-nums">5,120</td>
                <td className="py-4 text-emerald-400/90 text-sm font-semibold tabular-nums">$890</td>
                <td className="py-4 text-slate-400 text-sm font-medium tracking-tight">Today</td>
              </tr>
              <tr>
                <td className="py-4 text-base font-medium text-slate-100 tracking-tight">Sam Patel</td>
                <td className="py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                    Tier 3
                  </span>
                </td>
                <td className="py-4 text-emerald-400 font-medium text-sm">Active</td>
                <td className="py-4 text-violet-300 font-medium text-sm tabular-nums">Diamond</td>
                <td className="py-4 text-slate-300 text-sm font-medium tabular-nums">8,900</td>
                <td className="py-4 text-emerald-400/90 text-sm font-semibold tabular-nums">$1,240</td>
                <td className="py-4 text-slate-400 text-sm font-medium tracking-tight">Today</td>
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
