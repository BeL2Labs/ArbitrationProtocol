import { CopyField } from '@/components/base/CopyField';
import { StatusLabel, StatusLabelColor } from '@/components/base/StatusLabel';
import { TableCell, TableRow } from '@/components/ui/table';
import { DApp, DAppStatus } from '@/services/dapp-registry/model/dapp';
import { formatAddress } from '@/utils/formatAddress';
import { FC, useCallback } from 'react';

export const DAppRow: FC<{
  dapp: DApp;
  index: number;
  fieldLabels: string[];
}> = ({ dapp, index, fieldLabels }) => {

  const formatValue = useCallback((key: string, value: any) => {
    if (key === 'address' || key === 'owner') {
      return <div className='flex flex-row items-center'>{formatAddress(value)} <CopyField value={value} /></div>
    }
    else if (key === 'status') {
      const colors: { [status in keyof typeof DAppStatus]: StatusLabelColor } = {
        None: 'none',
        Pending: "yellow",
        Active: "green",
        Terminated: "yellow",
        Suspended: "red",
      };
      return <StatusLabel title={value} color={colors[value]} />
    }
    return value;
  }, []);

  return <TableRow>
    {fieldLabels.map(field => (
      <TableCell key={field}>
        {formatValue(field, dapp[field as keyof typeof dapp])}
      </TableCell>
    ))}
    {/* Actions */}
    <TableCell>
    </TableCell>
  </TableRow>
}