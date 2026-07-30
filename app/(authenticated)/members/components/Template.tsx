import { MemberCard } from "./MemberCard";
import { PageTitle } from "@/app/components/PageTitle";
import { MemberType, PositionType } from "@/app/types";
import { Title } from "@mantine/core";
import { LEADERSHIP_POSITIONS_IDS } from "@/app/constants/positions";

interface MembersPageTemplateProps {
  members: MemberType[];
  positions: PositionType[];
}

const isLeadershipMember = (member: MemberType) =>
  member.position_tags.some(
    tag => tag.positions != null && LEADERSHIP_POSITIONS_IDS.some(id => id === tag.positions?.id)
  );

export function MembersPageTemplate({ members, positions }: MembersPageTemplateProps) {
  // 日本語の名前順にソート
  const sortedMembers = members.sort((a, b) => a.display_name.localeCompare(b.display_name, "ja"));
  const generalMembers = sortedMembers.filter(member => !isLeadershipMember(member));

  return (
    <>
      <div className="sticky top-0 z-10 bg-white pb-4">
        <PageTitle>シンラボ会員一覧</PageTitle>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-16 px-4">
          {LEADERSHIP_POSITIONS_IDS.map(id => {
            const positionMembers = members.filter(member =>
              member.position_tags.some(tag => tag.positions?.id === id)
            );
            const label = positions.find(position => position.id === id)?.name ?? "";

            return (
              <div key={id}>
                <Title order={3}>{label}</Title>
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
