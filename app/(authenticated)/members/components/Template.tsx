import { MemberCard } from "./MemberCard";
import { PageTitle } from "@/app/components/PageTitle";
import { MemberType } from "@/app/types";
import { Title } from "@mantine/core";
import { LEADERSHIP_POSITIONS_IDS } from "@/app/constants/positions";

interface MembersPageTemplateProps {
  members: MemberType[];
}

// UI表示専用のラベル。仕様書で固定されている見出し文字列のため、DBやpropsからは取得せずTemplate内に直接保持する
const LEADERSHIP_LABELS: Record<(typeof LEADERSHIP_POSITIONS_IDS)[number]["id"], string> = {
  8: "代表",
  9: "副代表",
  10: "シンラボ管理人",
};

const isLeadershipMember = (member: MemberType) =>
  member.position_tags.some(
    tag => tag.positions != null && LEADERSHIP_POSITIONS_IDS.some(p => p.id === tag.positions?.id)
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
          {LEADERSHIP_POSITIONS_IDS.map(({ id }) => {
            const positionMembers = members.filter(member =>
              member.position_tags.some(tag => tag.positions?.id === id)
            );

            return (
              <div key={id}>
                <Title order={3}>{LEADERSHIP_LABELS[id]}</Title>
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
