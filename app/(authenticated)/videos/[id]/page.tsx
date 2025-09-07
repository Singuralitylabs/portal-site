"use server";

import { fetchVideoById } from "@/app/services/api/videos-server";
import { VideoDetailPageTemplate } from "./components/Template";

export default async function VideoDetailPage({ params }: { params: Promise<{ id: number }> }) {
  const videoId: number = (await params).id;
  const { data, error } = await fetchVideoById(videoId);

  if (error || data === null) {
    return <p>データを取得できませんでした。</p>;
  }

  return <VideoDetailPageTemplate video={data} />;
}
