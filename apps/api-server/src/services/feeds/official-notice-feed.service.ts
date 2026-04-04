type FeedType = "curfew" | "festival";

type NoticeWindow = {
  zoneId: string;
  startsAt: string; // ISO timestamp
  endsAt: string;   // ISO timestamp
  official: boolean;
  source: string;
  message: string;
};

const CURFEW_WINDOWS: NoticeWindow[] = [
  {
    zoneId: "MUM_ANH_01",
    startsAt: "2026-08-20T10:00:00+05:30",
    endsAt: "2026-08-20T23:00:00+05:30",
    official: true,
    source: "State Gazette",
    message: "Section 144 order reported for Andheri zone",
  },
];

const FESTIVAL_WINDOWS: NoticeWindow[] = [
  {
    zoneId: "PNE_KSB_01",
    startsAt: "2026-09-07T18:00:00+05:30",
    endsAt: "2026-09-07T23:00:00+05:30",
    official: true,
    source: "Municipal Traffic Bulletin",
    message: "Ganesh procession route closure for Kasba Peth",
  },
  {
    zoneId: "MUM_BAN_01",
    startsAt: "2026-09-10T17:00:00+05:30",
    endsAt: "2026-09-10T22:00:00+05:30",
    official: true,
    source: "City Police Traffic Update",
    message: "Festival traffic diversion in Bandra",
  },
];

function isActiveWindow(window: NoticeWindow, at: Date): boolean {
  const start = new Date(window.startsAt).getTime();
  const end = new Date(window.endsAt).getTime();
  const ts = at.getTime();
  return ts >= start && ts <= end;
}

export function getOfficialNoticeFeed(type: FeedType, zoneId: string, at = new Date()) {
  const windows = type === "curfew" ? CURFEW_WINDOWS : FESTIVAL_WINDOWS;
  const matching = windows.find((w) => w.zoneId === zoneId && isActiveWindow(w, at));

  if (!matching) {
    return {
      active: false,
      official: false,
      zoneId,
      source: "No active notice",
      message: "No official disruption notice currently active for this zone",
      asOf: at.toISOString(),
    };
  }

  return {
    active: true,
    official: matching.official,
    zoneId,
    source: matching.source,
    message: matching.message,
    startsAt: matching.startsAt,
    endsAt: matching.endsAt,
    asOf: at.toISOString(),
  };
}
