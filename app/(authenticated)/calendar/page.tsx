import React from "react";

// カレンダーページのコンポーネントを定義します
const CalendarPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">シンラボ カレンダー</h1>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <iframe
          src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FTokyo&title=%E3%82%B7%E3%83%B3%E3%83%A9%E3%83%9CMTG%E3%83%BB%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E3%82%AB%E3%83%AC%E3%83%B3%E3%83%80%E3%83%BC&showTabs=0&src=aHBiMjJyNWJzMjh0cjNmNzk3bDN1bDN0Z29AZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&src=cGI2MTlrZm4zMjNiam8yZmJ0YWxpcGQ1bHNAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&src=amEuamFwYW5lc2UjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%23b39ddb&color=%23ad1457&color=%230b8043"
          style={{ border: "none" }} // border: 0 も可。'none'の方がより明確です。
          width="800"
          height="600"
          title="シンラボ Google カレンダー"
        ></iframe>
      </div>
    </div>
  );
};

export default CalendarPage;
