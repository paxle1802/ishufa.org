/** Sinh nội dung file .ics (VEVENT) cho 1 lịch hẹn. */
export function buildIcs(params: {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}): string {
  // yyyymmddThhmmssZ (UTC).
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShufaBook//VI//",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(params.start)}`,
    `DTEND:${fmt(params.end)}`,
    `SUMMARY:${esc(params.title)}`,
    params.description ? `DESCRIPTION:${esc(params.description)}` : "",
    params.location ? `LOCATION:${esc(params.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
