import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const geistFont = readFile(path.join(process.cwd(), "src/app/fonts/Geist-SemiBold.ttf"));

export default async function OpenGraphImage() {
  const geist = await geistFont;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0b0d12",
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 60%), radial-gradient(circle at 70% -10%, rgba(71,149,132,0.22), transparent 60%), radial-gradient(circle at 40% 90%, rgba(120,126,241,0.18), transparent 60%)",
          color: "#f6f1e7",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.7 }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.05 }}>
            {siteConfig.title}
          </div>
          <div style={{ fontSize: 28, opacity: 0.8 }}>{siteConfig.description}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, opacity: 0.7 }}>
          <div>{siteConfig.url.replace("https://", "")}</div>
          <div>Portrait-led visual systems</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: geist,
          weight: 600,
          style: "normal",
        },
      ],
    }
  );
}
