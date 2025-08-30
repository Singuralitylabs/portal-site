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
      <PageTitle>メンバーリスト</PageTitle>

      {members.length === 0 ? (
        <Text ta="center" c="dimmed" mt="xl">
          メンバーが見つかりませんでした。
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="lg" mx="lg">
          {members.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
