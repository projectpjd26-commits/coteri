import { redirect } from "next/navigation";

type SearchParams = Promise<{ venue?: string }>;

export default async function VenueMetricsRedirect({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.venue) q.set("venue", params.venue);
  const query = q.toString();
  redirect(`/dashboard/venue/metrics${query ? `?${query}` : ""}`);
}
