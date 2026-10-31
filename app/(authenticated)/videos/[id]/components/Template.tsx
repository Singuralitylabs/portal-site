import { VideoWithCategoryType } from "@/app/types";
import { PageTitle } from "@/app/components/PageTitle";
import { MarkdownText } from "@/app/components/MarkdownText";
import { Button, Flex, Text, Divider } from "@mantine/core";
import Youtube from "./Youtube";
import { Calendar } from "lucide-react";
import { VideoDuration, VideoUpdatedDate } from "../../components/VideoMetadata";

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
                    {video.assignee?.display_name ? (
                      <Flex w="100%" justify="flex-end">
                        <Text>責任者：{video.assignee.display_name}</Text>
                      </Flex>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </Flex>
            </div>
            <Flex w="100%" justify="space-between" align="center">
              <Flex align="center" gap="0.25rem">
                <Calendar style={{ width: "1rem", height: "1rem" }} />
                <Text component="div" fs="0.875rem" lh="1.25rem">
                  <VideoUpdatedDate timestamp={video.updated_at} />
                </Text>
              </Flex>
              {video.length ? (
                <Text>
                  ビデオの長さ <VideoDuration seconds={video.length} />
                </Text>
              ) : (
                ""
              )}
            </Flex>
          </div>
        </Flex>
      </div>
      <Divider color="#999" m="0 1rem" />
      <div>
        <Flex gap="0.5rem" justify="flex-start" align="flex-start" direction="column" p="1rem 1rem">
          <Text component="div" className="prose prose-sm max-w-none">
            <MarkdownText>{video.description}</MarkdownText>
          </Text>
        </Flex>
      </div>
    </>
  );
}
