"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectionStatusBadge } from "@/components/ConnectionStatusBadge";
import { LogoutButton } from "@/components/LogoutButton";

export function Navbar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-6 py-4 backdrop-blur-md">
      <Link href="/" className="text-sm font-bold uppercase tracking-widest neon-text-primary">
        Kerdion
      </Link>
      
      {/* Desktop Menu */}
      <div className="hidden items-center gap-6 text-sm font-medium text-[var(--text-secondary)] md:flex">
        <Link href="/" className="transition-colors hover:text-[var(--text-primary)]">
          Overview
        </Link>
        <Link href="/topology" className="transition-colors hover:text-[var(--text-primary)]">
          Topology
        </Link>
        <Link href="/about" className="transition-colors hover:text-[var(--text-primary)]">
          About
        </Link>
        <ConnectionStatusBadge trackLiveStatus={isAuthenticated} />
        {isAuthenticated && (
          <Link href="/account" className="transition-colors hover:text-[var(--text-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        )}
        {isAuthenticated && <LogoutButton />}
      </div>

      {/* Mobile Hamburger Icon */}
      <button 
        className="text-[var(--text-primary)] focus:outline-none md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full flex w-full flex-col gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-lg md:hidden">
          <Link href="/" onClick={() => setIsOpen(false)} className="font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            Overview
          </Link>
          <Link href="/topology" onClick={() => setIsOpen(false)} className="font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            Topology
          </Link>
          <Link href="/about" onClick={() => setIsOpen(false)} className="font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            About
          </Link>
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <ConnectionStatusBadge trackLiveStatus={isAuthenticated} />
          </div>
          {isAuthenticated && (
            <Link href="/account" onClick={() => setIsOpen(false)} className="font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
              Account
            </Link>
          )}
          {isAuthenticated && (
            <div className="pt-2">
              <LogoutButton />
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
