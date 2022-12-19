import { Entity, Column, PrimaryColumn, BaseEntity } from 'typeorm';

@Entity('formulas')
export class TracksFormula extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column({ name: 'formula_name', type: 'varchar', nullable: false })
  formulaName: string;

  @Column({ name: 'description', type: 'varchar', nullable: true })
  description: string;

  @Column({ name: 'formula_array', type: 'json', nullable: false })
  formulaArray: object[];
}
