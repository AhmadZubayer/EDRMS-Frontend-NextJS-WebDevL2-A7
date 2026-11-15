'use client';

import Pagination from '@mui/material/Pagination';

interface ListPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  loading?: boolean;
}

export default function ListPagination({
  page,
  totalPages,
  onChange,
  loading = false,
}: ListPaginationProps) {
  if (totalPages < 2) return null;

  return (
    <div className="flex justify-center py-4">
      <Pagination
        aria-label="Results pages"
        count={totalPages}
        page={Math.min(page, totalPages)}
        onChange={(_, next) => onChange(next)}
        disabled={loading}
        shape="rounded"
        showFirstButton
        showLastButton
        siblingCount={0}
        sx={{
          '& .MuiPaginationItem-root': { color: 'var(--foreground)' },
          '& .Mui-selected': { backgroundColor: 'var(--muted)' },
        }}
      />
    </div>
  );
}
