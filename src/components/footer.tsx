export function Footer() {
  return (
    <footer id="contact" className="border-t border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <p className="text-black/60 dark:text-white/60">© {new Date().getFullYear()} CB</p>
        <div className="flex items-center gap-4">
          <a href="mailto:hello@example.com" className="hover:underline">
            Email
          </a>
          <a href="#" className="hover:underline" aria-disabled>
            LinkedIn
          </a>
          <a href="#" className="hover:underline" aria-disabled>
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

