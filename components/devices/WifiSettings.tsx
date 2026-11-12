"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Lock, Pencil, Plus, RefreshCw, Trash2, Wifi } from "lucide-react";

import ConfirmDialog from "@/components/multi-room/ConfirmDialog";
import { Button, Field, FormError, hintClass, inputClass } from "@/components/ui";
import {
  addWifiNetwork,
  connectWifiNetwork,
  getDeviceWifi,
  removeWifiNetwork,
  scanWifiNetworks,
  updateWifiNetwork,
} from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import type { EdgeDevice } from "@/lib/types";
import {
  buildAddPayload,
  buildUpdatePayload,
  canManageWifi,
  CONNECT_ROLLBACK_NOTE,
  isScanPending,
  isSavedNetwork,
  isSecuredNetwork,
  SCANNING_TEXT,
  MAX_WIFI_PRIORITY,
  SETUP_PORTAL_URL,
  signalBars,
  signalLabel,
  wifiResultText,
  wifiStatusLabel,
  type DeviceWifi,
  type WifiScanNetwork,
  type WifiNetwork,
} from "@/lib/wifi-settings";

const PENDING_POLL_MS = 10_000;

type Confirm = { kind: "remove" | "connect"; ssid: string };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Try again.";
}

function SignalBars({ signal }: { signal: number }) {
  const bars = signalBars(signal);
  return (
    <span className="inline-flex items-end gap-0.5" role="img" aria-label={`Signal ${signalLabel(signal)}`}>
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          aria-hidden="true"
          className={`w-1 rounded-sm ${bar <= bars ? "bg-ink" : "bg-line-strong"}`}
          style={{ height: `${bar * 3 + 2}px` }}
        />
      ))}
    </span>
  );
}

function NearbyNetworks({
  networks,
  saved,
  onPick,
}: {
  networks: WifiScanNetwork[];
  saved: DeviceWifi["networks"];
  onPick: (ssid: string) => void;
}) {
  if (networks.length === 0) {
    return <p className="mt-1 text-body text-muted">No networks found. Move closer or scan again, or add one by name.</p>;
  }
  return (
    <ul className="mt-2 divide-y divide-line" aria-label="Nearby networks">
      {networks.map((network) => {
        const secured = isSecuredNetwork(network.security);
        return (
          <li key={network.ssid}>
            <button
              type="button"
              onClick={() => onPick(network.ssid)}
              aria-label={`Use ${network.ssid}${secured ? ", password protected" : ", open"}`}
              className="flex min-h-11 w-full items-center gap-3 px-1 text-left text-body text-ink hover:bg-bg"
            >
              <SignalBars signal={network.signal} />
              <span className="min-w-0 flex-1 break-words">{network.ssid}</span>
              {isSavedNetwork(network, saved) && (
                <span className="rounded-tag border border-line-strong px-1.5 py-0.5 text-small text-muted">Saved</span>
              )}
              {secured ? (
                <Lock className="h-4 w-4 text-muted" aria-hidden="true" />
              ) : (
                <span className="text-small text-muted">Open</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function AddNetworkForm({
  deviceId,
  initialSsid = "",
  onDone,
  onCancel,
}: {
  deviceId: string;
  initialSsid?: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [ssid, setSsid] = useState(initialSsid);
  const [password, setPassword] = useState("");
  const [priority, setPriority] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = buildAddPayload({ ssid, password, priority });
    if (!result.ok) return setError(result.error);
    setPending(true);
    setError(null);
    try {
      await addWifiNetwork(deviceId, result.body);
      setPassword("");
      toast.success(`${ssid} saved. It applies when the box checks in.`);
      onDone();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 border-t border-line pt-3" aria-label="Add network">
      <Field id={`wifi-add-ssid-${deviceId}`} label="Network name">
        <input
          id={`wifi-add-ssid-${deviceId}`}
          className={inputClass}
          value={ssid}
          onChange={(e) => setSsid(e.target.value)}
          autoComplete="off"
          autoFocus={!initialSsid}
          required
        />
      </Field>
      <Field id={`wifi-add-password-${deviceId}`} label="Password" hint="Leave empty for an open network.">
        <input
          id={`wifi-add-password-${deviceId}`}
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <Field id={`wifi-add-priority-${deviceId}`} label="Priority" hint={`0 to ${MAX_WIFI_PRIORITY}; higher is tried first.`}>
        <input
          id={`wifi-add-priority-${deviceId}`}
          type="number"
          min={0}
          max={MAX_WIFI_PRIORITY}
          className={inputClass}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
      </Field>
      {error && <FormError>{error}</FormError>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" size="sm" pending={pending}>
          Save network
        </Button>
        <Button type="button" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditNetworkForm({
  deviceId,
  network,
  onDone,
  onCancel,
}: {
  deviceId: string;
  network: WifiNetwork;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [changePassword, setChangePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [priority, setPriority] = useState(String(network.priority));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const base = `wifi-edit-${deviceId}-${network.ssid}`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = buildUpdatePayload({ changePassword, password, priority }, network.priority);
    if (!result.ok) return setError(result.error);
    setPending(true);
    setError(null);
    try {
      await updateWifiNetwork(deviceId, network.ssid, result.body);
      setPassword("");
      toast.success(`${network.ssid} updated. It applies when the box checks in.`);
      onDone();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3" aria-label={`Edit ${network.ssid}`}>
      <label className="flex items-center gap-2 text-body text-ink">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={changePassword}
          onChange={(e) => {
            setChangePassword(e.target.checked);
            setPassword("");
          }}
        />
        Change password
      </label>
      {changePassword && (
        <Field id={`${base}-password`} label="New password" hint="Leave empty to make it an open network.">
          <input
            id={`${base}-password`}
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
      )}
      <Field id={`${base}-priority`} label="Priority" hint={`0 to ${MAX_WIFI_PRIORITY}; higher is tried first.`}>
        <input
          id={`${base}-priority`}
          type="number"
          min={0}
          max={MAX_WIFI_PRIORITY}
          className={inputClass}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        />
      </Field>
      {error && <FormError>{error}</FormError>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" size="sm" pending={pending}>
          Save changes
        </Button>
        <Button type="button" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function WifiSettings({ device, online }: { device: EdgeDevice; online: boolean }) {
  const user = useCurrentUser();
  const [wifi, setWifi] = useState<DeviceWifi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState("");
  const [scanStarting, setScanStarting] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  const load = useCallback(async () => {
    try {
      setWifi(await getDeviceWifi(device.id));
      setLoadError(null);
    } catch (err) {
      setLoadError(errorText(err));
    }
  }, [device.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasPending =
    scanStarting || (!!wifi && (wifi.pending_commands.length > 0 || wifi.networks.some((n) => n.last_status === "pending")));
  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => void load(), PENDING_POLL_MS);
    return () => window.clearInterval(timer);
  }, [hasPending, load]);

  const manage = canManageWifi(user, wifi);
  const isOnline = wifi?.current.online ?? online;
  const status = wifiStatusLabel(isOnline, wifi?.current.wifi_status ?? device.wifi_status);
  const ssid = wifi?.current.ssid ?? device.wifi_ssid;
  const scanning = scanStarting || isScanPending(wifi);

  async function startScan() {
    setScanStarting(true);
    try {
      await scanWifiNetworks(device.id);
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setScanStarting(false);
    }
  }

  function pickNetwork(name: string) {
    setPrefill(name);
    setEditing(null);
    setAdding(true);
  }

  async function runConfirm() {
    if (!confirm) return;
    setConfirmPending(true);
    try {
      if (confirm.kind === "remove") {
        await removeWifiNetwork(device.id, confirm.ssid);
        toast.success(`Removing ${confirm.ssid} when the box checks in.`);
      } else {
        await connectWifiNetwork(device.id, confirm.ssid);
        toast.success(`Switching to ${confirm.ssid} when the box checks in.`);
      }
      setConfirm(null);
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setConfirmPending(false);
    }
  }

  return (
    <section
      aria-labelledby={`wifi-settings-${device.id}`}
      className="mt-4 rounded-control border border-line bg-surface p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 id={`wifi-settings-${device.id}`} className="flex items-center gap-2 text-body font-semibold text-ink">
          <Wifi className="h-4 w-4" aria-hidden="true" />
          Wi-Fi
        </h3>
        {manage && (
          <div className="flex flex-wrap gap-2">
            {wifi?.remote_scan_supported && (
              <Button size="sm" icon={RefreshCw} pending={scanning} onClick={() => void startScan()}>
                Scan nearby Wi-Fi
              </Button>
            )}
            {!adding && (
              <Button size="sm" icon={Plus} onClick={() => pickNetwork("")}>
                Add network
              </Button>
            )}
          </div>
        )}
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-small text-muted">Status</dt>
          <dd className="text-body text-ink">{status}</dd>
        </div>
        <div>
          <dt className="text-small text-muted">Current network</dt>
          <dd className="break-words text-body text-ink">{ssid ?? "Not reported"}</dd>
        </div>
        <div>
          <dt className="text-small text-muted">Signal</dt>
          <dd className="text-body text-ink">{signalLabel(wifi?.current.signal)}</dd>
        </div>
      </dl>

      {loadError && (
        <div className="mt-3 space-y-2">
          <FormError>Couldn&apos;t load Wi-Fi details: {loadError}</FormError>
          <Button size="sm" onClick={() => void load()}>
            Try again
          </Button>
        </div>
      )}

      {manage && wifi?.remote_scan_supported && (scanning || wifi.last_scan) && (
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-body font-medium text-ink">Nearby networks</h4>
            {wifi.last_scan && (
              <p className={hintClass}>Scanned {formatWhen(wifi.last_scan.scanned_at)}</p>
            )}
          </div>
          {scanning && (
            <p role="status" className="mt-1 text-body text-muted">
              {SCANNING_TEXT}
              {!isOnline && ". The box is offline, so it scans when it checks in again."}
            </p>
          )}
          {wifi.last_scan && (
            <NearbyNetworks networks={wifi.last_scan.networks} saved={wifi.networks} onPick={pickNetwork} />
          )}
          <p className="mt-2 text-small text-muted">Hidden network? Use Add network and type its name.</p>
        </div>
      )}

      {manage && adding && (
        <AddNetworkForm
          key={prefill}
          deviceId={device.id}
          initialSsid={prefill}
          onCancel={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            void load();
          }}
        />
      )}

      {manage && wifi && (
        <div className="mt-3 border-t border-line pt-3">
          <h4 className="text-body font-medium text-ink">Saved networks</h4>
          {wifi.networks.length === 0 ? (
            <p className="mt-1 text-body text-muted">No saved networks yet. Add one so the box can join it.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {wifi.networks.map((network) => {
                const result = wifiResultText(network.last_status, network.last_error);
                return (
                  <li key={network.ssid} className="py-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-body font-medium text-ink">{network.ssid}</p>
                        <p className={hintClass}>
                          Priority <span className="num">{network.priority}</span>
                          {network.has_password ? " · Password saved" : " · Open network"}
                          {result ? ` · ${result}` : ""}
                        </p>
                      </div>
                      {editing !== network.ssid && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" icon={Pencil} onClick={() => setEditing(network.ssid)}>
                            Edit
                          </Button>
                          {network.ssid !== ssid && (
                            <Button size="sm" onClick={() => setConfirm({ kind: "connect", ssid: network.ssid })}>
                              Connect now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => setConfirm({ kind: "remove", ssid: network.ssid })}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                    {editing === network.ssid && (
                      <EditNetworkForm
                        deviceId={device.id}
                        network={network}
                        onCancel={() => setEditing(null)}
                        onDone={() => {
                          setEditing(null);
                          void load();
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!isOnline && (
            <p className="mt-2 text-small text-muted">This box is offline. Changes apply when it checks in again.</p>
          )}
        </div>
      )}

      {wifi && !manage && (
        <p className="mt-3 text-small text-muted">Only school admins can change Wi-Fi settings.</p>
      )}

      {!isOnline && (
        <div className="mt-3 space-y-2 border-t border-line pt-3 text-body text-muted">
          <p>To fix Wi-Fi on site while the box is offline:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Find the device&apos;s setup card.</li>
            <li>Join the listed EchoSense-Setup hotspot from your phone or computer.</li>
            <li>
              Open <span className="font-medium text-ink">{SETUP_PORTAL_URL}</span> and sign in with the
              administrator password from the setup card.
            </li>
          </ol>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === "remove" ? `Remove ${confirm.ssid}?` : `Connect to ${confirm.ssid} now?`}
          description={
            confirm.kind === "remove"
              ? "The box forgets this network and its saved password."
              : `The box switches to this network when it next checks in. ${CONNECT_ROLLBACK_NOTE}`
          }
          confirmLabel={confirm.kind === "remove" ? "Remove" : "Connect now"}
          tone={confirm.kind === "remove" ? "danger" : "primary"}
          pending={confirmPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void runConfirm()}
        />
      )}
    </section>
  );
}
