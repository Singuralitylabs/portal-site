import { Container, SimpleGrid, Text } from "@mantine/core";
import { MemberCard } from "./MemberCard";
import { PageTitle } from "@/app/components/PageTitle";
import { MemberType } from "@/app/types";

interface MembersPageTemplateProps {
  members: MemberType[];
}

export function MembersPageTemplate({ members }: MembersPageTemplateProps) {
  return (
    <Container size="xl" py="md">
      <PageTitle>メンバー紹介</PageTitle>

      <Text my={16} size="lg" c="gray.9">
        {members.length > 0
          ? "シンギュラリティ・ラボのメンバーをご紹介します。"
          : "メンバーが見つかりませんでした。"}
      </Text>
      <div>
        {members.length > 0 && (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="lg">
              {members.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </SimpleGrid>
          </>
        )}
      </div>
    </Container>
  );
}
