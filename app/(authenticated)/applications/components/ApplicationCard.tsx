"use client";

import { ApplicationWithCategoryAndDeveloperType, SelectCategoryType } from "@/app/types";
import { AppWindow } from "lucide-react";
import { Badge, Button, Card, Flex, Text } from "@mantine/core";
import ContentMgrMenu from "../../components/ContentMgrMenu";
import { CONTENT_TYPE } from "@/app/constants/content";

interface ApplicationCardProps {
  application: ApplicationWithCategoryAndDeveloperType;
  isContentMgr: boolean;
  categories: SelectCategoryType[];
  userId: number;
  onDetailClick: (application: ApplicationWithCategoryAndDeveloperType) => void;
}

export function ApplicationCard({
  application,
  isContentMgr,
  categories,
  userId,
  onDetailClick,
}: ApplicationCardProps) {
  return (
    <Card
      component="div"
      shadow="sm"
      padding="0"
      radius="md"
      withBorder
      className="w-full aspect-[4/3] flex flex-col"
    >
      <Card.Section withBorder inheritPadding p="xs">
        <Flex gap="0.25rem" justify="space-between" align="center" direction="row">
          <Flex gap="0.25rem" align="center" direction="row">
            <AppWindow style={{ width: "1.25rem", height: "1.25rem" }} />
            <div className="font-semibold">{application.name}</div>
          </Flex>
          {isContentMgr && (
            <ContentMgrMenu<ApplicationWithCategoryAndDeveloperType>
              content={application}
              categories={categories}
              userId={userId}
              type={CONTENT_TYPE.APPLICATION}
            />
          )}
        </Flex>
      </Card.Section>

      <div className="flex-1 p-4 overflow-hidden">
        <Text component="div" lineClamp={2} className="overflow-hidden mb-2">
          {application.description}
        </Text>
        <div className="mt-2">
          {application.category && <Badge variant="light">{application.category.name}</Badge>}
        </div>
      </div>

      <div className="p-4 pt-0">
        <Button color="#000" fullWidth onClick={() => onDetailClick(application)}>
          詳細
        </Button>
      </div>
    </Card>
  );
}
