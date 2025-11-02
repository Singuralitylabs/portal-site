"use client";

import { ApplicationWithCategoryAndDeveloperType } from "@/app/types";
import { AppWindow } from "lucide-react";
import { Badge, Button, Card, Flex, Text } from "@mantine/core";

interface ApplicationCardProps {
  application: ApplicationWithCategoryAndDeveloperType;
  onDetailClick: (application: ApplicationWithCategoryAndDeveloperType) => void;
}

export function ApplicationCard({ application, onDetailClick }: ApplicationCardProps) {
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
        </Flex>
      </Card.Section>

      <div className="flex-1 p-4 overflow-hidden">
        <Text component="div" lineClamp={3} className="overflow-hidden mb-2">
          {application.short_description || application.description}
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
