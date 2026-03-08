import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

const LOGO_PATH =
  "C:/Users/askth/.cursor/projects/c-Users-askth-Jefes-Affiliates/assets/c__Users_askth_AppData_Roaming_Cursor_User_workspaceStorage_9e84d8a520bd5d0a755a5541a8edd21d_images_logo__yellow___1_-13c3d5ed-24c8-4817-803a-56ca45a821e5.png";

export async function GET() {
  try {
    const image = await readFile(LOGO_PATH);
    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 });
  }
}

