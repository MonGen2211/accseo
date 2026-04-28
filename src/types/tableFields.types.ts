import type { TableRowData } from "./tableRows.types";

export type TableField = {
  id: string;
  name: string;
  label: string;
  width?: number | string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  type?:
    | 'text'
    | 'status'
    | 'actions'
    | 'date'
    | 'link'
    | 'image'
    | 'avatar'
    | 'is_active'
    | 'switch'
    | 'custom'
    | 'percent'
    | 'money'
    | 'dateMonth'
    | 'hide';
  imageWidth?: number | string;
  imageHeight?: number | string;
  imageRadius?: number | string;
  switchDisabled?: boolean;
  sortable?: boolean;
  renderCell?: (row: TableRowData) => React.ReactNode;
  statusField?: string;
  sort?: boolean;
  ellipsis?: boolean;
  currency?: string;
  statusReadonly?: boolean;
  statusType?: string;
  inherit?: boolean;
  wrapText?: boolean;
};