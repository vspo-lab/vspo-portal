"use client";

import { FooterPresenter } from "./presenter";

export const FooterContainer = () => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (link: string) => {
    // In a real app, these would navigate to actual pages
    // For now, we'll show an alert
    const messages: Record<string, string> = {
      "About VSPO Collection": "VSPO Collectionについての詳細ページを開きます",
      Features: "機能一覧ページを開きます",
      FAQ: "よくある質問ページを開きます",
      Contact: "お問い合わせフォームを開きます",
      "Terms of Service": "利用規約ページを開きます",
      "Privacy Policy": "プライバシーポリシーページを開きます",
      Guidelines: "コミュニティガイドラインページを開きます",
      Copyright: "著作権情報ページを開きます",
      Discord: "Discord サーバーに参加します",
      Twitter: "Twitter アカウントを開きます",
      YouTube: "YouTube チャンネルを開きます",
      GitHub: "GitHub リポジトリを開きます",
    };

    alert(`📱 ${link}\n\n${messages[link] || `${link}を開きます`}`);
  };

  return (
    <FooterPresenter currentYear={currentYear} onLinkClick={handleLinkClick} />
  );
};
