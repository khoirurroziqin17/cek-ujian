import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const basicAuth = req.headers.get("authorization");

    if (basicAuth) {
      const authValue = basicAuth.split(" ")[1];
      const [user, pwd] = atob(authValue).split(":");

      if (user === process.env.ADMIN_USER && pwd === process.env.ADMIN_PASS) {
        return NextResponse.next();
      }
    }

    return new NextResponse(
      "Akses Ditolak. Masukkan Username & Password Admin.",
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Admin Area"',
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
