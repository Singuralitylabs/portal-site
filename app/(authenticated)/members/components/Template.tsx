import { Container, SimpleGrid, Text } from "@mantine/core";
import { MemberCard } from "./MemberCard";
import { PageTitle } from "@/app/components/PageTitle";
import { MemberType } from "@/app/types";

interface MembersPageTemplateProps {
  members: MemberType[];
}

export function MembersPageTemplate({ members }: MembersPageTemplateProps) {
  // 日本語の名前順にソート
  const sortedMembers = members.sort((a, b) => a.display_name.localeCompare(b.display_name, "ja"));

  return (
    <Container size="xl" py="md">
      <PageTitle>シンラボ会員一覧</PageTitle>

      <Text my={16} size="lg" c="gray.9">
        {members.length > 0
          ? "シンギュラリティ・ラボの会員をご紹介します。"
          : "会員情報の取得に失敗しました。"}
      </Text>
      <div>
        {members.length > 0 && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="lg">
              {sortedMembers.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </SimpleGrid>
          </>
        )}
      </div>
    </Container>
  );
}
