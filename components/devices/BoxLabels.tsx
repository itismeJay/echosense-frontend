"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";
import AccessibleDialog from "@/components/AccessibleDialog";
import { Button, Note } from "@/components/ui";
import { API_URL } from "@/lib/config";
import { identityFileText } from "@/lib/device-setup";
import type { ProvisionedBox } from "@/lib/types";

/** One sticker: QR, device code, setup code and where to scan it. */
function BoxLabel({ box }: { box: ProvisionedBox }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(box.qr_payload, { errorCorrectionLevel: "M", margin: 1, width: 360 })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [box.qr_payload]);

  return (
    <figure className="box-label flex items-center gap-4 rounded-panel border-2 border-ink bg-white p-3 text-black">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a generated data URL, not an asset
        <img src={src} alt={`QR code for box ${box.device_code}`} width={140} height={140} className="h-[140px] w-[140px] shrink-0" />
      ) : (
        <div className="h-[140px] w-[140px] shrink-0 bg-surface" aria-hidden="true" />
      )}
      <figcaption className="min-w-0">
        <p className="text-small font-semibold">EchoSense box</p>
        <p className="font-mono text-title font-semibold">{box.device_code}</p>
        <p className="mt-1 text-small">Setup code</p>
        <p className="font-mono text-body-lg font-semibold tracking-wider">{box.claim_code}</p>
        <p className="mt-1 text-small">Scan in EchoSense → Classrooms → Add device</p>
      </figcaption>
    </figure>
  );
}

function downloadIdentity(box: ProvisionedBox) {
  const blob = new Blob([identityFileText(box, API_URL)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `identity-${box.device_code}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * New or reset boxes. Their setup codes exist only in this dialog: print the labels and
 * save each identity file now. Closing it forgets them (nothing is stored in the browser).
 */
export default function ProvisionedBoxesDialog({ boxes, onClose }: { boxes: ProvisionedBox[]; onClose: () => void }) {
  return (
    <AccessibleDialog
      title={boxes.length === 1 ? `Box ${boxes[0].device_code} is ready` : `${boxes.length} boxes are ready`}
      description="Print a label for each box and save its identity file now. The setup codes are shown only this once."
      onClose={onClose}
      size="large"
    >
      <div className="no-print">
        <Note>
          Copy each identity file onto its box as <span className="font-mono">data/identity.json</span> (owner-only). Or run{" "}
          <span className="font-mono">tools/provision_box.py</span> on the box, which does both steps.
        </Note>
      </div>
      <div className="print-labels mt-4 grid gap-3 sm:grid-cols-2">
        {boxes.map((box) => (
          <BoxLabel key={box.device_code} box={box} />
        ))}
      </div>
      <ul className="no-print mt-4 flex flex-wrap gap-2">
        {boxes.map((box) => (
          <li key={box.device_code}>
            <Button size="sm" icon={Download} onClick={() => downloadIdentity(box)}>
              Identity file for {box.device_code}
            </Button>
          </li>
        ))}
      </ul>
      <div className="no-print mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onClose}>Done</Button>
        <Button variant="primary" icon={Printer} onClick={() => window.print()}>
          Print labels
        </Button>
      </div>
    </AccessibleDialog>
  );
}
