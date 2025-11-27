import { PageTitle } from "@/app/components/PageTitle";
import { Text } from "@mantine/core";

export default function MembersPageLoading() {
  return (
    <>
      <PageTitle>シンラボ会員一覧</PageTitle>
      <Text my={16} size="lg" c="gray.9">
        シンギュラリティ・ラボの会員をご紹介します。
      </Text>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-8">
          {[...Array(12)].map((_, memberIndex) => (
            <div key={memberIndex} className="w-full">
              <div className="aspect-video bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
