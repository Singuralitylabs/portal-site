import { MemberCard } from "./MemberCard";
import { PageTitle } from "@/app/components/PageTitle";
import { MemberType } from "@/app/types";
import { Title } from "@mantine/core";
import { LEADERSHIP_POSITIONS } from "@/app/constants/positions";

interface MembersPageTemplateProps {
  members: MemberType[];
}

const isLeadershipMember = (member: MemberType) =>
  member.position_tags.some(
    tag => tag.positions != null && LEADERSHIP_POSITIONS.some(p => p.id === tag.positions?.id)
  );

// role昇順 → 名前の昇順（日本語）→ 作成日時昇順
const compareGeneralMembers = (a: MemberType, b: MemberType) => {
  const roleDiff = a.role.localeCompare(b.role);
  if (roleDiff !== 0) return roleDiff;

  const nameDiff = a.display_name.localeCompare(b.display_name, "ja");
  if (nameDiff !== 0) return nameDiff;

  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
};

export function MembersPageTemplate({ members }: MembersPageTemplateProps) {
  const generalMembers = members
    .filter(member => !isLeadershipMember(member))
    .sort(compareGeneralMembers);

  return (
    <>
      <div className="sticky top-0 z-10 bg-white pb-4">
        <PageTitle>シンラボ会員一覧</PageTitle>
      </div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-16 px-4">
          {LEADERSHIP_POSITIONS.map(position => {
            const positionMembers = members.filter(member =>
              member.position_tags.some(tag => tag.positions?.id === position.id)
            );

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
        {generalMembers.length > 0 && (
          <>
            <Title order={3} px="1rem" mb="1rem">
              メンバー
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8 px-4">
              {generalMembers.map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
