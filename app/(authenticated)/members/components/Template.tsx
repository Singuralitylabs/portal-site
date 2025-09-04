import { Container, SimpleGrid, Text } from "@mantine/core";
import { MemberCard } from "./MemberCard";
import { PageTitle } from "@/app/components/PageTitle";
import { MemberType } from "@/app/types";
import { USER_ROLE } from "@/app/constants/user";

interface MembersPageTemplateProps {
  members: MemberType[];
}

export function MembersPageTemplate({ members }: MembersPageTemplateProps) {
  const adminList = members.filter(member => member.role === USER_ROLE.ADMIN);
  const maintainerList = members.filter(member => member.role === USER_ROLE.MAINTAINER);
  const memberList = members.filter(member => member.role === USER_ROLE.MEMBER);

  return (
    <Container size="xl" py="md">
      <PageTitle>メンバー紹介</PageTitle>

      <Text my={16} size="lg" c="gray.9">
        {members.length > 0
          ? "シンギュラリティ・ラボのメンバーをご紹介します。"
          : "メンバーが見つかりませんでした。"}
      </Text>
      <div>
        {adminList.length > 0 && (
          <>
            <Text mt="xl" mb="md" size="xl" fw={600}>
              管理者
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="lg">
              {adminList.map(admin => (
                <MemberCard key={admin.id} member={admin} />
              ))}
            </SimpleGrid>
          </>
        )}
        {maintainerList.length > 0 && (
          <>
            <Text mt="xl" mb="md" size="xl" fw={600}>
              コンテンツ管理者
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="lg">
              {maintainerList.map(maintainer => (
                <MemberCard key={maintainer.id} member={maintainer} />
              ))}
            </SimpleGrid>
          </>
        )}
        {memberList.length > 0 && (
          <>
            <Text mt="xl" mb="md" size="xl" fw={600}>
              メンバー
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="lg">
              {memberList.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </SimpleGrid>
          </>
        )}
      </div>
    </Container>
  );
}
