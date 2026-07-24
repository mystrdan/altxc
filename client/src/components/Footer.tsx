export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-xs text-[color:var(--color-text-faint)] sm:flex-row sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} ALTXC. Not a cryptocurrency exchange.</p>
        <p className="font-mono">Trades held. Trust verified. Peers connected.</p>
      </div>
    </footer>
  );
}
