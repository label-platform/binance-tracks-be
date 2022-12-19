import { BaseEntity, BeforeInsert, BeforeUpdate, Column } from 'typeorm';
import { LocalDateTime } from '@js-joda/core';
import { LocalDateTimeTransformer } from '../transformers';

export abstract class BaseTimeEntity extends BaseEntity {
  @Column({
    name: 'created_at',
    type: 'datetime',
    transformer: new LocalDateTimeTransformer(),
    nullable: false,
    update: false,
  })
  createdAt: LocalDateTime;

  @Column({
    name: 'updated_at',
    type: 'datetime',
    transformer: new LocalDateTimeTransformer(),
    nullable: false,
  })
  updatedAt: LocalDateTime;

  @BeforeInsert()
  protected beforeInsert() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  @BeforeUpdate()
  protected beforeUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}
