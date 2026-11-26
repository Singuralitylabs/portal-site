import { formatVideoDuration, formatVideoUpdatedDate, normalizeVideoTimestamp } from "../utils";

export function VideoRecordedDate({ date }: { date: string | null }) {
  return date ? <time dateTime={date}>{date}</time> : <span>未設定</span>;
}

export function VideoUpdatedDate({ timestamp }: { timestamp: string }) {
  return (
    <time dateTime={normalizeVideoTimestamp(timestamp)}>{formatVideoUpdatedDate(timestamp)}</time>
  );
}

export function VideoDuration({ seconds }: { seconds: number | null }) {
  return <span>{formatVideoDuration(seconds)}</span>;
}
