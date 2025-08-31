import React, { useMemo } from 'react';
import { Person } from '../types';
import { TreeView } from './TreeView';

interface Props {
  people: Person[];
  onEdit: (p: Person) => void;
}

export const StammbaumView: React.FC<Props> = ({ people, onEdit }) => {
  const inconsistencies = useMemo(() => {
    return people.filter(p => {
      if (p.partnerId) {
        const partner = people.find(x => x.id === p.partnerId);
        return !partner || partner.partnerId !== p.id;
      }
      return false;
    });
  }, [people]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {inconsistencies.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded">
          <strong>Achtung:</strong> Inkonsistenzen im Partner-Link gefunden ({inconsistencies.length}).
          Manche Personen zeigen auf Partner, die nicht zurückverlinken.
        </div>
      )}

      <TreeView people={people} onEdit={onEdit} />
    </div>
  );
};
