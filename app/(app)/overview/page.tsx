"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellRing, Cpu } from "lucide-react";
import AlertInbox from "@/components/AlertInbox";
import { EmptyState, ErrorState, LoadingRows, Page } from "@/components/ui";
import { DeviceStatus } from "@/components/ui/status";
import { useAlerts } from "@/lib/AlertsProvider";
import { localDateKey, needsReview } from "@/lib/alert-presentation";
import { useDeviceStatus } from "@/lib/useDeviceStatus";

const INBOX_LIMIT = 8;

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function SummaryItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li className="border-line sm:border-l sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <Link href={href} className="text-body-lg text-ink underline-offset-4 hover:underline">
        {children}
      </Link>
    </li>
  );
}

export default function OverviewPage() {
  const { alerts, loading, error, errorStatus, refresh } = useAlerts();
  const devices = useDeviceStatus();
  const [now] = useState(() => new Date());
  const todayKey = localDateKey(now);

  const waiting = useMemo(() => alerts.filter(needsReview), [alerts]);
  const highToday = alerts.filter(
    (alert) => alert.severity === "high" && localDateKey(new Date(alert.created_at)) === todayKey
  ).length;
  const deviceList = devices.devices ?? [];
  const online = deviceList.filter((device) => device.online).length;

  const date = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(now);

  return (
    <Page>
      <header className="mb-6">
        <p className="text-body text-muted">{date}</p>
        <h1 className="mt-1 text-display font-semibold text-ink">{greeting(now.getHours())}</h1>
        <ul className="mt-3 flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-4">
          <SummaryItem href="/alerts">
            <span className="num font-semibold">{loading ? "…" : waiting.length}</span>{" "}
            {waiting.length === 1 ? "alert needs" : "alerts need"} review
          </SummaryItem>
          <SummaryItem href="/alerts/all">
            <span className="num font-semibold">{loading ? "…" : highToday}</span> High{" "}
            {highToday === 1 ? "alert" : "alerts"} today
          </SummaryItem>
          {devices.devices && deviceList.length > 0 && (
            <SummaryItem href="#classroom-devices">
              <span className="num font-semibold">
                {online} of {deviceList.length}
              </span>{" "}
              classroom {deviceList.length === 1 ? "device" : "devices"} online
            </SummaryItem>
          )}
        </ul>
      </header>

      <section aria-labelledby="needs-review-title">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 id="needs-review-title" className="text-title font-semibold text-ink">
            Alerts that need review
          </h2>
          <Link href="/alerts/all" className="min-h-11 content-center text-body font-medium text-link underline-offset-4 hover:underline">
            See all alerts
          </Link>
        </div>

        {error && alerts.length === 0 ? (
          <ErrorState
            title={errorStatus === 403 ? "Your account can't view alerts" : "EchoSense can't load alerts right now"}
            onRetry={errorStatus === 403 ? undefined : () => void refresh()}
          >
            {errorStatus === 403
              ? "Ask your school administrator to check your account."
              : "Check the internet connection. Alerts load again by themselves once EchoSense is reachable."}
          </ErrorState>
        ) : loading ? (
          <div className="rounded-panel border border-line">
            <LoadingRows rows={3} label="Loading alerts" />
          </div>
        ) : waiting.length === 0 ? (
          <div className="rounded-panel border border-line">
            <EmptyState title="No alerts need review" icon={BellRing}>
              You&apos;re up to date. New alerts appear here within a few seconds, and High alerts also show a
              notice in the corner of the screen.
            </EmptyState>
          </div>
        ) : (
          <>
            <AlertInbox alerts={waiting.slice(0, INBOX_LIMIT)} mode="review" label="Alerts that need review" />
            {waiting.length > INBOX_LIMIT && (
              <p className="mt-3 text-body text-muted">
                Showing the newest {INBOX_LIMIT} of {waiting.length}.{" "}
                <Link href="/alerts" className="font-medium text-link underline underline-offset-4">
                  Review the rest
                </Link>
              </p>
            )}
          </>
        )}
      </section>

      <section id="classroom-devices" aria-labelledby="devices-title" className="mt-10 scroll-mt-20">
        <h2 id="devices-title" className="mb-3 text-title font-semibold text-ink">
          Classroom devices
        </h2>
        {devices.error && !devices.devices ? (
          <ErrorState title="Device status isn't available right now" onRetry={() => void devices.reload()}>
            Alerts still arrive while this is unavailable. Try again in a minute.
          </ErrorState>
        ) : !devices.devices ? (
          <div className="rounded-panel border border-line">
            <LoadingRows rows={1} label="Loading devices" />
          </div>
        ) : deviceList.length === 0 ? (
          <div className="rounded-panel border border-line">
            <EmptyState title="No classroom devices yet" icon={Cpu}>
              A school administrator adds devices from the Classrooms page. Alerts start once a device is set up in a
              classroom.
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-panel border border-line">
            {deviceList.map((device) => (
              <li key={device.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-body-lg font-medium text-ink">
                    {device.classroom_name ?? "Not in a classroom"}
                  </p>
                  <p className="truncate text-small text-muted">{device.display_name}</p>
                </div>
                <DeviceStatus lastSeenAt={device.last_seen_at} online={device.online} disabled={!device.is_active} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
