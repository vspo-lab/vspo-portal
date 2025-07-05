import { useRouter } from "next/router";
import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}
export const GoogleAd: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "80px",
        width: "100%",
      }}
    >
      <ins
        key={router.asPath}
        className="adsbygoogle"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minWidth: "100vw",
          maxHeight: "250px",
          margin: "16px",
        }}
        data-adtest={process.env.ENV === "development" ? "on" : "off"}
        data-ad-client={process.env.NEXT_PUBLIC_AD_CLIENT}
        data-ad-slot={process.env.NEXT_PUBLIC_AD_SLOT}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
};
