"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { PrintIcon } from "@/components/ui/icons";
import { formatClock, formatDate, formatSessionClock, weekdayName } from "@/lib/dates";
import { SITE } from "@/lib/site";
import "@/styles/print-slip.css";

export type Slip = {
  bookingRef: string;
  tokenLabel: string;
  slotTime: string | null;
  onDate: string;
  isOverflow: boolean;
  doctorName: string;
  departmentName?: string | null;
  roomNo?: string | null;
  sessionStart?: string | null;
  sessionEnd?: string | null;
  patientName: string;
  patientAge: number;
  patientSex: string;
  patientType?: string | null;
};

/**
 * The printable slip. Printing is what the patient actually leaves with, so
 * the print rules hide everything else on the page and lay this out on A5 in
 * black and white.
 */
export function AppointmentSlip({
  slip,
  autoFocusPrint = false,
  instructions,
}: {
  slip: Slip;
  autoFocusPrint?: boolean;
  /** From site_settings.slip_instructions. Omitted prints no instruction. */
  instructions?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  // The QR opens the check page with this reference filled in; the mobile
  // number is still needed to see the booking, so the code itself holds no
  // patient details.
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    const url = `${window.location.origin}/appointment/status?ref=${encodeURIComponent(slip.bookingRef)}`;
    QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(null));
  }, [slip.bookingRef]);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(slip.bookingRef);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="slip overflow-hidden rounded-lg border border-line">
      <div className="border-b border-line px-6 py-4 slip-rule">
        <p className="text-16 font-medium">{SITE.name}</p>
        <p className="eyebrow mt-1 text-ink">{SITE.institute}</p>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8">
        <div className="sm:border-r sm:border-line sm:pr-8 slip-rule">
          <p className="eyebrow text-ink">Token</p>
          <p className="tnum slip-token mt-2 text-32 tracking-tighter">
            {slip.tokenLabel}
          </p>
          {slip.isOverflow ? (
            <p className="mt-2 max-w-40 text-13">
              Overflow token. You will be seen after the numbered tokens.
            </p>
          ) : null}
        </div>

        <dl className="grid gap-3 text-14 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-13 text-muted">Booking reference</dt>
            <dd className="tnum mt-1 text-18">{slip.bookingRef}</dd>
          </div>
          <div>
            <dt className="text-13 text-muted">Date</dt>
            <dd className="tnum mt-1">
              {formatDate(slip.onDate)}, {weekdayName(slip.onDate)}
            </dd>
          </div>
          <div>
            <dt className="text-13 text-muted">Reporting time</dt>
            <dd className="tnum mt-1">
              {formatClock(slip.slotTime)}
              {slip.sessionStart && slip.sessionEnd
                ? ` (session ${formatSessionClock(slip.sessionStart, slip.sessionEnd)})`
                : ""}
            </dd>
          </div>
          <div>
            <dt className="text-13 text-muted">Doctor</dt>
            <dd className="mt-1">{slip.doctorName}</dd>
          </div>
          <div>
            <dt className="text-13 text-muted">Department</dt>
            <dd className="mt-1">{slip.departmentName ?? ""}</dd>
          </div>
          <div>
            <dt className="text-13 text-muted">Room</dt>
            {/* Never blank. A slip that names a doctor and a time but not a
                place leaves the patient standing in the lobby asking. Where
                the record has no room, the slip says where to start. */}
            <dd className="mt-1">
              {slip.roomNo?.trim() || "Report to the OPD counter, ground floor"}
            </dd>
          </div>
          <div>
            <dt className="text-13 text-muted">Patient</dt>
            <dd className="mt-1">
              {slip.patientName}, {slip.patientAge}, {slip.patientSex}
              {slip.patientType ? `, ${slip.patientType}` : ""}
            </dd>
          </div>
        </dl>
      </div>

      {/* Validity, then the QR code to check the booking. */}
      <div className="grid gap-5 border-t border-line px-6 py-5 slip-rule sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <p className="text-15 font-semibold text-ink">
            Valid only on {formatDate(slip.onDate)}, {weekdayName(slip.onDate)}
          </p>
          <p className="mt-1 text-13 text-body">
            This token cannot be used on any other day. Scan the code to check the
            booking; you will need the mobile number it was booked with.
          </p>
        </div>
        {qr ? (
          <div
            role="img"
            aria-label={`QR code to check booking ${slip.bookingRef}`}
            className="slip-qr h-28 w-28 shrink-0 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
        ) : null}
      </div>

      {/* Set in site settings, because it is hospital policy rather than
          anything this application knows. Empty means print nothing. */}
      {instructions ? (
        <div className="border-t border-line px-6 py-4 text-14 slip-rule">
          {instructions}
        </div>
      ) : null}

      <div data-print="hide" className="flex flex-wrap gap-3 px-6 pb-6 pt-2">
        <Button
          variant="primary"
          onClick={() => window.print()}
          autoFocus={autoFocusPrint}
        >
          <PrintIcon />
          Print slip
        </Button>
        <Button onClick={copyReference}>
          {copied ? "Reference copied" : "Copy reference"}
        </Button>
      </div>
    </div>
  );
}
