import { VideoWithCategoryType } from "@/app/types";
import { Button, Flex, Text, Divider } from "@mantine/core";
import { PageTitle } from "@/app/components/PageTitle";
import Link from "next/link";
import { Calendar } from "lucide-react";
import Youtube from "./Youtube";

interface VideoDetailPageProps {
  video: VideoWithCategoryType;
}

export function VideoDetailPageTemplate({ video }: VideoDetailPageProps) {
  return (
    <div className="p-4 overflow-x-hidden">
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
                <Text component="div">
                  {String(video.description)
                    .split("\n")
                    .map((item, index) => {
                      return (
                        <div key={"description_" + index}>
                          {
                            // 概要欄の各行がURL形式かを判定する
                            URL.canParse(item) ? (
                              // 関連資料のURLがある場合は資料を別タブで開く
                              <Link href={item} rel="noopener noreferrer" target="_blank">
                                {item}
                              </Link>
                            ) : (
                              // 資料のURL等がない場合はテキストをそのまま表示する
                              item
                            )
                          }
                          <br />
                          {/* 改行コードはHTMLの<br />を挿入する */}
                        </div>
                      );
                    })}
                </Text>
              </Flex>
            </div>
          </div>
        </Flex>
      </div>
    </div>
  );
}
