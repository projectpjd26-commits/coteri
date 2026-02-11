"use client";

/**
 * Static mockup of the staff verification result screen for demo slides.
 */
export function VerifyResultMockup() {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-700 dark:bg-slate-800/80">
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Member Verification</h3>
      <p className="mt-2 text-slate-700 dark:text-slate-300">Venue: The Function SF</p>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Role: staff</p>
      <hr className="my-4 border-slate-200 dark:border-slate-600" />
      <p className="text-base font-semibold text-green-600 dark:text-green-400">VALID MEMBER</p>
      <p className="mt-1 text-sm font-normal text-slate-600 dark:text-slate-400">Tier: Founder</p>
      <p className="text-xs text-slate-500 dark:text-slate-500">Membership ID: ••••-••••-••••</p>
    </div>
  );
}
