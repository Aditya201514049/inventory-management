import { ReactNode, useState } from 'react';

export default function InventoryTabs({ tabs }: { tabs: { id: string; label: string; node: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <>
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`py-2 px-1 border-b-2 ${active === t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div>{tabs.find(t => t.id === active)?.node}</div>
    </>
  );
}