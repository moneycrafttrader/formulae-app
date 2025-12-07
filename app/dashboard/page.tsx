"use client";

import { useSubscription } from "@/app/hooks/useSubscription";

export default function Dashboard() {
  const { subscription } = useSubscription();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {subscription ? (
        <div className="bg-green-900 p-4 rounded-lg">
          <p>Plan: {subscription.plan.toUpperCase()}</p>
          <p>Expires: {new Date(subscription.end_date).toDateString()}</p>
        </div>
      ) : (
        <div className="bg-red-900 p-4 rounded-lg">
          <p>No active subscription</p>
        </div>
      )}
    </div>
  );
}
