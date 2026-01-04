import { VideoWithCategoryType } from "@/app/types";
import { Button, Flex, Text, Divider } from "@mantine/core";
import { Calendar } from "lucide-react";
import { PageTitle } from "@/app/components/PageTitle";
import Link from "next/link";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import Youtube from "./Youtube";

interface VideoDetailPageProps {
  video: VideoWithCategoryType;
}

export function VideoDetailPageTemplate({ video }: VideoDetailPageProps) {
  return (
    <>
      <PageTitle>{video.name}</PageTitle>
      <div className="mt-4">
        <Flex justify="center">
          <div className="max-w-[800px] w-full shadow-md rounded-b-md">
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              <Youtube name={video.name} url={video.url} />
            </div>
            <div>
              <Flex
                gap="0.5rem"
                justify="flex-start"
                align="flex-start"
                direction="column"
                p="1rem 1rem"
              >
                <div className="flex justify-between items-center w-full">
                  <Button
                    component="div"
                    radius="md"
                    size="compact-sm"
                    c="rgb(23,23,23)"
                    bg="gray.2"
                    fs="0.875rem"
                  >
                    {video.category?.name}
                  </Button>
                  <div>
                    {video.assignee ? (
                      <Flex w="100%" justify="flex-end">
                        <Text>担当：{video.assignee}</Text>
                      </Flex>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <Flex w="100%" justify="space-between" align="center">
                  <Flex align="center" gap="0.25rem">
                    <Calendar style={{ width: "1rem", height: "1rem" }} />
                    <Text component="div" fs="0.875rem" lh="1.25rem">
                      {new Date(video.updated_at)
                        .toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })
                        .replaceAll("/", "-")}
                    </Text>
                  </Flex>
                  {video.length ? (
                    <Text>
                      ビデオの長さ {Math.floor(Number(video.length) / 60)}:
                      {(Number(video.length) % 60).toString().padStart(2, "0")}
                    </Text>
                  ) : (
                    ""
                  )}
                </Flex>
              </Flex>
            </div>
            <Divider color="#999" m="0 1rem" />
            <div>
              <Flex
                gap="0.5rem"
                justify="flex-start"
                align="flex-start"
                direction="column"
                p="1rem 1rem"
              >
                <Text component="div">■概要</Text>
                <Text component="div" className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {String(video.description)}
                  </ReactMarkdown>
                </Text>
              </Flex>
            </div>
          </div>
        </Flex>
      </div>
    </>
  );
}
