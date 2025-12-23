"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";

interface NavbarProps {
  userName: string;
}

export function Navbar({ userName }: NavbarProps) {
  return (
    <nav className="bg-black border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/dashboard">
            <Image
              src="/images/logo.png"
              alt="Nexus Growth Partners"
              width={400}
              height={70}
              className="w-[180px] sm:w-[240px] lg:w-[320px] h-auto"
              priority
            />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center px-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg">
              <span className="text-sm text-white/70">
                {userName}
              </span>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/70 bg-white/[0.05] border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
