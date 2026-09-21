import { MemberCard } from "./MemberCard";
import { PageTitle } from "@/app/components/PageTitle";
import { MemberType, PositionType } from "@/app/types";
import { Title } from "@mantine/core";

interface MembersPageTemplateProps {
  members: MemberType[];
  positions: PositionType[];
}

export function MembersPageTemplate({ members, positions }: MembersPageTemplateProps) {
  // 日本語の名前順にソート
  const sortedMembers = members.sort((a, b) => a.display_name.localeCompare(b.display_name, "ja"));

  // 役職者セクションに表示する役職を id 昇順で抽出（IDのハードコードに依存しない）
  const leadershipPositions = positions
    .filter(position => position.is_leadership && position.name.trim() !== "")
    .sort((a, b) => a.id - b.id);
  const leadershipPositionIds = new Set(leadershipPositions.map(position => position.id));

  // 役職者セクションでないメンバーを抽出
  const generalMembers = sortedMembers.filter(
    member =>
      !member.position_tags.some(
        tag => tag.positions != null && leadershipPositionIds.has(tag.positions.id)
      )
  );

  return (
    <>
      <div className="sticky top-0 z-10 bg-white pb-4">
        <PageTitle>シンラボ会員一覧</PageTitle>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-16 px-4">
          {leadershipPositions.map(position => {
            const positionMembers = sortedMembers.filter(member =>
              member.position_tags.some(tag => tag.positions?.id === position.id)
            );

            if (positionMembers.length === 0) {
              return null;
            }

            return (
              <div key={position.id}>
                <Title order={3}>{position.name}</Title>
                <div className="flex flex-col gap-4 mt-4">
                  {positionMembers.map(member => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <Title order={3} px="1rem" mb="1rem">
          メンバー
        </Title>
        {generalMembers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8 px-4">
            {generalMembers.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
