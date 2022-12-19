export class ColumnDecimalTransformer {
  to(data: number | string): number | string {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}
