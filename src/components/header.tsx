import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-medium tracking-tight">
          CB Portfolio
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link href="#gallery" className="hover:opacity-80">
            Gallery
          </Link>
          <Link href="#about" className="hover:opacity-80">
            About
          </Link>
          <a href="#contact" className="hover:opacity-80">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
