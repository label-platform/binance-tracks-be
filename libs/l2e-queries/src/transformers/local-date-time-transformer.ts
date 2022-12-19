import { ValueTransformer } from "typeorm";
import { LocalDateTime } from "@js-joda/core";
import { DateTimeUtil } from "../utils/datetime-util";

export class LocalDateTimeTransformer implements ValueTransformer {
  // entity -> db로 넣을때
  to(entityValue: LocalDateTime): Date {
    return DateTimeUtil.toDate(entityValue);
  }
  // db -> entity로 가져올때
  from(databaseValue: Date): LocalDateTime {
    return DateTimeUtil.toLocalDateTime(databaseValue);
  }
}