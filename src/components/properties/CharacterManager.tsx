'use client';

import { useCallback } from 'react';
import { useProjectStore } from '@/stores/projectStore';

export default function CharacterManager() {
  const characters = useProjectStore((s) => s.characters);
  const addCharacter = useProjectStore((s) => s.addCharacter);
  const removeCharacter = useProjectStore((s) => s.removeCharacter);
  const updateCharacter = useProjectStore((s) => s.updateCharacter);

  const handleAdd = useCallback(() => {
    addCharacter('New Character');
  }, [addCharacter]);

  const charList = Object.values(characters);

  return (
    <div className="property-group">
      <label className="property-label">Characters</label>
      <div className="character-list">
        {charList.map((c) => (
          <div key={c.id} className="character-item">
            <input
              type="text"
              value={c.name}
              onChange={(e) => updateCharacter(c.id, { name: e.target.value })}
            />
            <button className="character-remove-btn" onClick={() => removeCharacter(c.id)}>
              x
            </button>
          </div>
        ))}
      </div>
      <button className="character-add-btn" onClick={handleAdd}>
        + Add Character
      </button>
    </div>
  );
}
