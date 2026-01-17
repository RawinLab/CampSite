'use client';

import { WishlistCard } from './WishlistCard';
import type { WishlistItemWithCampsite } from '@campsite/shared';

interface WishlistGridProps {
  items: WishlistItemWithCampsite[];
  selectedIds?: Set<string>;
  selectionMode?: boolean;
  onToggleSelection?: (id: string) => void;
  onRemove?: (campsiteId: string) => void;
}

export function WishlistGrid({
  items,
  selectedIds = new Set(),
  selectionMode = false,
  onToggleSelection,
  onRemove,
}: WishlistGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <WishlistCard
          key={item.id}
          item={item}
          isSelected={selectedIds.has(item.campsite_id)}
          selectionMode={selectionMode}
          onToggleSelection={onToggleSelection}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

export default WishlistGrid;
