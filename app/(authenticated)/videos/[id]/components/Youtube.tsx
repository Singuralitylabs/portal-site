"use client";

import YouTube from "react-youtube";
import { getYouTubeVideoId } from "../../utils";

type YoutubeProps = {
  name: string;
  url: string;
};

function Youtube({ name, url }: YoutubeProps) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) {
    return <div className="flex items-center justify-center h-full">無効なYouTube URLです</div>;
  }

  return (
    <div>
      <YouTube
        videoId={videoId}
        title={name}
        opts={{
          width: "100%",
          height: "100%",
        }}
        className="absolute inset-0 w-full h-full"
        iframeClassName="w-full h-full"
      />
    </div>
  );
}

export default Youtube;
