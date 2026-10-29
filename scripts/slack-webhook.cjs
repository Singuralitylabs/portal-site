async function sendSlackNotification(webhookUrl, message) {
  if (!webhookUrl) {
    throw new Error(
      "SLACK_WEBHOOK_URL が設定されていません。GitHub Actions Secrets を確認してください。"
    );
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.status}`);
  }
}

module.exports = { sendSlackNotification };
