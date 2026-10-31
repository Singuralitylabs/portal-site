import { formatVideoDuration, formatVideoUpdatedDate } from "../utils";

export function VideoUpdatedDate({ timestamp }: { timestamp: string }) {
  return <time dateTime={timestamp}>{formatVideoUpdatedDate(timestamp)}</time>;
}

export function VideoDuration({ seconds }: { seconds: number | null }) {
  return <span>{formatVideoDuration(seconds)}</span>;
}
