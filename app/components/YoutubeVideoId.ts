'use client';

interface YoutubeVideoIdProps {
  url: string;
}

export function YoutubeVideoId({ url }: YoutubeVideoIdProps): string | undefined  {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match?.[1];
}