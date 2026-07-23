/** 内容页顶栏:menu / BITEWISE / settings(图标暂未接功能) */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-between border-b-[3px] border-black bg-paper px-6">
      <span className="material-symbols-outlined cursor-pointer p-1 text-[28px] transition-colors duration-fast hover:bg-black hover:text-paper">
        menu
      </span>
      <span className="font-display text-headline-lg uppercase tracking-tight">
        BITEWISE
      </span>
      <span className="material-symbols-outlined cursor-pointer p-1 text-[28px] transition-colors duration-fast hover:bg-black hover:text-paper">
        settings
      </span>
    </header>
  );
}
